// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

package com.alibaba.opencodereview.idea.services

import com.alibaba.opencodereview.idea.model.CliResult
import com.alibaba.opencodereview.idea.model.CliRunOptions
import com.alibaba.opencodereview.idea.model.EnvCheckResult
import com.alibaba.opencodereview.idea.model.EnvToolStatus
import com.alibaba.opencodereview.idea.model.HostStrings
import com.alibaba.opencodereview.idea.model.LogLevel
import com.alibaba.opencodereview.idea.model.LogLine
import com.alibaba.opencodereview.idea.model.currentIdeLocale
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.util.concurrency.AppExecutorUtil
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/** Thrown when the CLI exits non-zero. The message has already been refined by [extractCliError] and is safe to show to users. */
class CliException(message: String) : RuntimeException(message)

/**
 * Every subprocess goes through [ShellEnv]: the environment comes from the login shell, and command names are
 * resolved to absolute paths by `resolveBin`. A bare command name plus the inherited environment cannot run in a
 * GUI-launched IDEA. All methods here are blocking; callers must run them on a background thread.
 */
class CliService(private val cliPath: String = "ocr") {

    private companion object {
        const val ENV_CACHE_TTL_MS = 5 * 60 * 1000L
        const val PROBE_TIMEOUT_MS = 10_000L
        const val FORCE_KILL_DELAY_MS = 3_000L
        const val INSTALL_SH = "https://raw.githubusercontent.com/CHE3MZ/kaid/main/install.sh"
        const val INSTALL_PS1 = "https://raw.githubusercontent.com/CHE3MZ/kaid/main/install.ps1"
    }

    /** Installation has a separate lifecycle from review and configuration commands. */
    private val installProcess = AtomicReference<Process?>(null)

    @Volatile
    private var envCache: Pair<EnvCheckResult, Long>? = null

    fun invalidateEnvironmentCache() {
        envCache = null
    }

    fun getCachedEnvironment(): EnvCheckResult? {
        val (env, at) = envCache ?: return null
        if (System.currentTimeMillis() - at > ENV_CACHE_TTL_MS) {
            envCache = null
            return null
        }
        return env
    }

    fun isAvailable(): Boolean = checkEnvironment().ocr.ok

    /** Probes the ocr CLI; the install script is self-contained and does not need a JavaScript runtime. */
    fun checkEnvironment(force: Boolean = false): EnvCheckResult {
        if (!force) getCachedEnvironment()?.let { return it }
        val ocr = probeCommand(cliPath)
        val env = EnvCheckResult(ocr)
        envCache = env to System.currentTimeMillis()
        return env
    }

    private fun probeCommand(bin: String): EnvToolStatus = runCatching {
        // The arguments are fixed (--version), so shell wrapping is safe (on Windows a CLI shim may be a .cmd file, which cannot run without a shell).
        val process = ProcessBuilder(ShellEnv.forShell(listOf(ShellEnv.resolveBin(bin), "--version")))
            .withShellEnv()
            .redirectErrorStream(true)
            .start()
        process.outputStream.close()
        // stdout must be read on a separate thread. readText() on this thread would block until the process exits
        // (or the pipe fills up), so waitFor(PROBE_TIMEOUT_MS) would never run -- a stuck probe would hang the
        // whole environment check permanently. Same pattern as ShellEnv.capture.
        val out = StringBuilder()
        val reader = Thread({
            runCatching { process.inputStream.bufferedReader().forEachLine { synchronized(out) { out.appendLine(it) } } }
        }, "ocr-probe-$bin").apply { isDaemon = true; start() }
        if (!process.waitFor(PROBE_TIMEOUT_MS, TimeUnit.MILLISECONDS)) {
            // On Windows the probe runs wrapped in cmd.exe; killing only the shell would leave a stuck CLI process behind, so a tree force-kill is required.
            destroyTreeForcibly(process)
            // After the force-kill the stdout pipe closes and the reader will EOF out shortly; the short join keeps daemon threads from piling up across repeated environment checks.
            reader.join(500)
            // Closing the streams matches the cleanup in runRaw/install, keeping fds from accumulating until GC under frequent environment checks.
            process.closeStreamsQuietly()
            return EnvToolStatus()
        }
        // Bounded wait for the reader to finish: a --version probe ends in milliseconds, and in the extreme case
        // (a child inheriting the stdout pipe never EOFs) the 2s cap keeps the main thread from hanging forever.
        // Reads and writes of out are both synchronized, so even with a timed-out reader still writing, reading out
        // avoids cross-thread torn reads of the StringBuilder.
        reader.join(2_000)
        // Close the streams (the timeout branch already closed them and returned; this covers the normal-exit and
        // non-zero-exit paths), keeping fds from accumulating until GC under frequent environment checks.
        process.closeStreamsQuietly()
        if (process.exitValue() != 0) return EnvToolStatus()
        val version = synchronized(out) { out.lineSequence().firstOrNull()?.trim()?.takeIf(String::isNotEmpty) }
        EnvToolStatus(ok = true, version = version)
    }.getOrElse { EnvToolStatus() }

    /** Installs the ocr CLI via the release install script, echoing logs line by line, and reports success by exit code. */
    fun install(onLog: (LogLine) -> Unit): Boolean {
        val isWindows = System.getProperty("os.name").orEmpty().startsWith("Windows", ignoreCase = true)
        val command = if (isWindows) {
            listOf("powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "irm $INSTALL_PS1 | iex")
        } else {
            listOf("sh", "-c", "curl -fsSL $INSTALL_SH | sh")
        }
        onLog(LogLine("$ ${command.joinToString(" ")}"))
        return runCatching {
            // Fixed arguments only; shell wrapping lets cmd.exe find powershell on Windows.
            // Finalize the previous install (if any) before starting a new one.
            installProcess.getAndSet(null)?.let(::killStaleInstall)
            val process = ProcessBuilder(ShellEnv.forShell(listOf(ShellEnv.resolveBin(command.first())) + command.drop(1)))
                .withShellEnv()
                .redirectErrorStream(true)
                .start()
            // Register only in the installation slot; review handles are independent.
            // Should normally be null since it was just cleared; concurrent installs are rare, but finalize one the same way if it happens.
            installProcess.getAndSet(process)?.let(::killStaleInstall)
            try {
                process.outputStream.close()
                // Installer output may overwrite lines with \r; normalize to \n here before emitting line by line.
                process.inputStream.bufferedReader().forEachLine { raw ->
                    raw.replace('\r', '\n').lineSequence().forEach { line ->
                        if (line.isNotBlank()) onLog(LogLine(line))
                    }
                }
                val exit = process.waitFor()
                if (exit == 0) {
                    onLog(LogLine(HostStrings.t(currentIdeLocale(), "ext.cli.installOk")))
                    invalidateEnvironmentCache()
                    // The freshly installed global bin may not be on the cached PATH; the shell environment must re-resolve once.
                    ShellEnv.invalidate()
                } else {
                    onLog(
                        LogLine(
                            HostStrings.t(currentIdeLocale(), "ext.cli.installFail", "code" to exit.toString()),
                            LogLevel.ERROR,
                        ),
                    )
                }
                exit == 0
            } finally {
                // Mirrors runRaw: on exception paths (forEachLine throwing IOException and the like) the process may
                // still be alive, so tree force-kill + stream close act as the safety net.
                // No isAlive guard: a tree force-kill is harmless on a dead process (enumeration returns empty,
                // destroyForcibly is a no-op), and an isAlive check would itself open a race window -- enumerating
                // early is strictly better.
                destroyTreeForcibly(process)
                process.closeStreamsQuietly()
                installProcess.compareAndSet(process, null)
            }
        }.getOrElse {
            onLog(LogLine(it.message ?: it.javaClass.simpleName, LogLevel.ERROR))
            false
        }
    }

    /**
     * Runs arbitrary CLI arguments: stderr is streamed back line by line, the full stdout is returned at the end,
     * and a non-zero exit throws CliException.
     * Deliberately not forShell -- args contain user input, and shell wrapping would enlarge the injection surface.
     */
    fun runRaw(
        args: List<String>,
        cwd: File,
        onLog: (LogLine) -> Unit,
        envExtra: Map<String, String> = emptyMap(),
        cancellation: CliCancellation? = null,
    ): String {
        cancellation?.checkCancelled()
        val process = ProcessBuilder(listOf(ShellEnv.resolveBin(cliPath)) + args)
            .directory(cwd)
            .withShellEnv(*envExtra.toList().toTypedArray())
            .start()
        val stderr = StringBuilder()
        var stderrThread: Thread? = null
        var registered = false
        try {
            // The session owns this process. Other commands never replace or terminate it.
            cancellation?.attach { cancelProcess(process) }
            registered = cancellation != null
            stderrThread = Thread({
                runCatching {
                    process.errorStream.bufferedReader().forEachLine { line ->
                        synchronized(stderr) { stderr.appendLine(line) }
                        parseLogLine(line)?.let(onLog)
                    }
                }
            }, "ocr-cli-stderr").apply { isDaemon = true; start() }
            process.outputStream.close() // inside the try: if close throws IOException, the finally still cleans up the registered process so nothing leaks unmanaged.
            val stdout = process.inputStream.bufferedReader().readText()
            val exit = process.waitFor()
            stderrThread.join(2_000)
            if (exit != 0) {
                val text = synchronized(stderr) { stderr.toString() }
                throw CliException(extractCliError(text).ifBlank { "CLI exited with code $exit" })
            }
            return stdout
        } finally {
            try {
                destroyTreeForcibly(process)
                stderrThread?.join(2_000)
            } finally {
                process.closeStreamsQuietly()
                if (registered) cancellation?.detach()
            }
        }
    }

    fun review(
        opts: CliRunOptions,
        cwd: File,
        onLog: (LogLine) -> Unit,
        cancellation: CliCancellation,
    ): CliResult = parseCliResult(runRaw(buildReviewArgs(opts), cwd, onLog, cancellation = cancellation))

    /**
     * Runs `ocr llm test`. When [home] is passed, it runs in an isolated environment so that
     * "testing connectivity" cannot damage the user's real ~/.opencodereview/config.json.
     */
    fun testConnection(home: File? = null): Pair<Boolean, String?> {
        val envExtra = buildMap {
            home?.let {
                put("HOME", it.absolutePath)
                put("USERPROFILE", it.absolutePath)
            }
        }
        val cwd = File(System.getProperty("user.dir"))
        return runCatching {
            runRaw(listOf("llm", "test"), cwd, {}, envExtra)
            true to null
        }.getOrElse { false to (it.message ?: it.javaClass.simpleName) }
    }

    /** Capture the exact process tree now; delayed cleanup must never target another invocation. */
    private fun cancelProcess(process: Process) {
        if (!process.isAlive) return
        val descendants = destroyGracefully(process)
        AppExecutorUtil.getAppScheduledExecutorService().schedule(
            {
                runCatching {
                    destroyTreeForcibly(process, descendants)
                    // Streams are normally closed by runRaw's finally; this idempotent fallback is safe to double-close.
                    process.closeStreamsQuietly()
                }.onFailure { thisLogger().warn("[ocr] Failed to force-terminate the process tree", it) }
            },
            FORCE_KILL_DELAY_MS,
            TimeUnit.MILLISECONDS,
        )
    }

    /**
     * Process-tree termination. destroy()/destroyForcibly() only affect direct children; grandchildren (the install
     * script spawns downloaders and extractors) are reparented to the system root process
     * once the parent dies, after which descendants() can no longer see them.
     * So the graceful phase snapshots the descendants first and signals only the parent (the installer
     * forwards termination to its children for their own cleanup; repeated signals may interrupt that cleanup);
     * the force-kill phase relies on the snapshot plus one fresh enumeration to also catch grandchildren spawned
     * after the snapshot.
     * The returned snapshot handles stay valid after grandchildren are reparented and are the only reliable basis
     * for hunting them down in the force-kill phase.
     */
    private fun destroyGracefully(process: Process): List<ProcessHandle> {
        // When enumeration fails (an extreme platform problem), fall back to an empty snapshot: better to miss some
        // kills in the force-kill phase than to let the caller's stream-close cleanup be skipped by an exception.
        val descendants = runCatching { process.toHandle().descendants().toList() }.getOrDefault(emptyList())
        process.destroy()
        return descendants
    }

    /**
     * Force-kills the whole tree. The order matters: the fresh enumeration must happen before killing the parent
     * (once the parent dies its descendants are reparented to the system root process and descendants() can no
     * longer see them); the parent is killed before the descendants so a supervisor-like parent (the install
     * script and the like) cannot spawn new children after its descendants die but before it dies itself. One handle's
     * force-kill failing does not block the rest.
     * Snapshot-less calls are best-effort: if the process happens to exit the instant before enumeration, its
     * descendants were already reparented along with the parent's death and are invisible.
     * Cancellation passes a snapshot so descendants remain reachable after their parent exits.
     */
    private fun destroyTreeForcibly(process: Process, snapshot: List<ProcessHandle> = emptyList()) {
        // A fresh-enumeration failure does not block the rest: the snapshot + parent force-kill must still run, and this method must never throw outward.
        val live = runCatching { process.toHandle().descendants().toList() }.getOrDefault(emptyList())
        val tree = (snapshot + live).distinctBy(ProcessHandle::pid)
        runCatching { process.destroyForcibly() }
        tree.forEach { runCatching { it.destroyForcibly() } }
    }

    /** Closes the process's three streams, swallowing only the IOException declared by close() and never runtime signals such as InterruptedException. */
    private fun Process.closeStreamsQuietly() {
        try { inputStream.close() } catch (_: IOException) {}
        try { outputStream.close() } catch (_: IOException) {}
        try { errorStream.close() } catch (_: IOException) {}
    }

    /** Give the previous installation time to exit, then clean up its tree and streams. */
    private fun killStaleInstall(stale: Process) {
        try {
            if (stale.isAlive) {
                thisLogger().warn("[ocr] The previous CLI install was still running and has been terminated")
                val descendants = destroyGracefully(stale)
                if (!stale.waitFor(FORCE_KILL_DELAY_MS, TimeUnit.MILLISECONDS)) {
                    thisLogger().warn("[ocr] The previous CLI install did not exit within ${FORCE_KILL_DELAY_MS}ms; force-terminating")
                }
                // Installer descendants (curl, powershell, extraction tools, ...) do not die with the parent, so a tree-level cleanup is required.
                destroyTreeForcibly(stale, descendants)
            }
        } finally {
            // Stream close must be in finally: even on exception paths such as an interrupted waitFor, the stale process's fds must not leak.
            stale.closeStreamsQuietly()
        }
    }

    private fun ProcessBuilder.withShellEnv(vararg extra: Pair<String, String>): ProcessBuilder = apply {
        environment().apply {
            clear()
            putAll(ShellEnv.env())
            extra.forEach { (key, value) -> put(key, value) }
        }
    }
}
