// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

const messages: Record<string, string> = {
    // ── IdleView ──
    'view.idle.configFirst': 'Configure model first',
    'view.idle.reviewing': 'Reviewing…',
    'view.idle.selectBranch': 'Select comparison branch',
    'view.idle.selectCommit': 'Select a commit',
    'view.idle.noFiles': 'No files to review',
    'view.idle.reviewAll': 'Review all changes',
    'view.idle.workspace': 'Workspace',
    'view.idle.branch': 'Branch Compare',
    'view.idle.commit': 'Single Commit',
    'view.idle.baseRef': 'Base ref',
    'view.idle.targetRef': 'Target ref',
    'view.idle.chooseBranch': 'Choose branch',
    'view.idle.commitHistory': 'Commit history',
    'view.idle.customPrompt': 'Custom review prompt (optional)',
    'view.idle.manageCustom': 'Manage custom providers',
    'view.idle.modelConfig': 'Model config',

    // ── RunningView ──
    'view.running.reviewLog': 'Review log',
    'view.running.cancel': 'Cancel',

    // ── DoneView ──
    'view.done.comments': 'comments',
    'view.done.files': 'files',
    'view.done.processLog': 'Process log',

    // ── EmptyView ──
    'view.empty.noIssues': 'No issues found · Passed',
    'view.empty.processLog': 'Process log',

    // ── CancelledView ──
    'view.cancelled.title': 'Review cancelled',

    // ── FailedView ──
    'view.failed.title': 'Review failed.',
    'view.failed.checkConfig': 'Please check model configuration and retry.',
    'view.failed.checkApiKey': 'Please check API key and network connection.',
    'view.failed.retry': 'Retry',

    // ── ConfigView ──
    'view.config.title': 'Model Configuration',
    'view.config.desc': 'Connect an LLM provider to start code review',
    'view.config.close': 'Close',
    'view.config.step1': 'Environment Setup',
    'view.config.step2': 'Provider Config',
    'view.config.checking': 'kaid checking…',
    'view.config.notInstalled': 'kaid not installed',
    'view.config.official': 'Official Provider',
    'view.config.custom': 'Custom Provider',
    'view.config.currentUse': 'Currently using',
    'view.config.notConfigured': 'No provider configured',
    'view.config.officialLabel': 'Official',
    'view.config.customLabel': 'Custom',
    'view.config.legacyLabel': 'Legacy',
    'view.config.model': 'Model',
    'view.config.customModel': 'Enter custom model…',
    'view.config.apiKey': 'API Key',
    'view.config.apiKeyEnvHint': 'Also available via env var',
    'view.config.apiKeySaved': 'Saved (leave blank to keep)',
    'view.config.testing': 'Testing connection…',
    'view.config.testOk': '✓ Connected',
    'view.config.testFail': '✗ Connection failed',
    'view.config.previous': 'Previous',
    'view.config.testFailDetail': '✗ Connection failed: {message}',
    'view.config.test': 'Test Connection',
    'view.config.save': 'Save',
    'view.config.continueProvider': 'Continue to Provider Config',
    'view.config.providerName': 'Provider Name',
    'view.config.protocol': 'Protocol',
    'view.config.baseUrl': 'Base URL',
    'view.config.modelList': 'Model list',
    'view.config.modelListPlaceholder': 'Comma-separated, e.g. model-a, model-b',
    'view.config.authHeader': 'Auth Header',
    'view.config.authHeaderHint': 'Optional x-api-key or authorization for Anthropic protocol',
    'view.config.authHeaderDefault': 'Default (Authorization)',
    'view.config.backToList': '← Back to list',
    'view.config.optional': '(optional)',
    'view.config.kaidVersionTooltip': 'kaid CLI Version',

    // ── EnvSetupGuide ──
    'view.env.installing': 'Installing kaid CLI…',
    'view.env.checking': 'Checking, please wait…',
    'view.env.ready': 'Environment is ready. Continue to Provider Config.',
    'view.env.stepLead': 'Complete each step in order. Move to the next after each passes.',
    'view.env.kaidHint': 'Install kaid globally in your terminal, or click "One-Click Install" below.',
    'view.env.oneClickInstall': 'One-Click Install',
    'view.env.redetect': 'Re-detect',
    'view.env.checkingStatus': 'Checking',
    'view.env.readyStatus': 'Ready',
    'view.env.notReady': 'Not ready',
    'view.env.pass': 'Pass',
    'view.env.fail': 'Fail',
    'view.env.waitPrev': 'Waiting for previous',
    'view.env.copy': 'Copy',
    'view.env.copiedToast': 'Copied ✓',

    // ── CustomProviderManager ──
    'cmp.custom.title': 'Custom Providers',
    'cmp.custom.desc': 'Manage self-hosted LLM gateways and compatible endpoints. Switch the active review model.',
    'cmp.custom.add': 'Add',
    'cmp.custom.empty': 'No custom providers',
    'cmp.custom.addFirst': 'Add custom provider',
    'cmp.custom.currentUse': 'Currently using',
    'cmp.custom.model': 'Model',
    'cmp.custom.edit': 'Edit',
    'cmp.custom.setCurrent': 'Set as current',
    'cmp.custom.delete': 'Delete',

    // ── FileList ──
    'cmp.fileList.pending': 'Pending files',
    'cmp.fileList.noChanges': 'No changed files',
    'cmp.fileList.viewDiff': 'Click to view diff',

    // ── LogViewer ──
    'cmp.log.waiting': 'Waiting for output',

    // ── CommentCard ──
    'cmp.comment.view': 'View',
    'cmp.comment.discard': 'Discard',

    // ── PasswordInput ──
    'cmp.password.hideSecret': 'Hide secret',
    'cmp.password.showSecret': 'Show secret',

    // ── Select ──
    'cmp.select.placeholder': 'Select',

    // ── Extension ──
    'ext.commentController': 'kaid',
    'ext.configPanelTitle': 'Model Configuration',
    'ext.config.legacyDisplayName': 'Legacy LLM Endpoint',
    'ext.comment.threadLabel': 'Code Review',
    'ext.comment.pending': '⏳ [Pending]',
    'ext.comment.noSuggestion': '_💡 No code suggestion, please handle manually_',
    'ext.comment.applyFailedStale': 'Apply failed: code location is stale, please refresh and retry.',
    'ext.comment.applyFailedLocked': 'Apply failed: cannot modify file, check if it is read-only or locked.',
    'ext.comment.statusApplied': '✅ [Applied]',
    'ext.comment.statusDiscarded': '✅ [Discarded]',
    'ext.comment.statusFalsePositive': '✅ [False Positive]',
    'ext.comment.jumpFailed': 'Cannot locate ',
    'ext.comment.jumpNotAFile': ': is not an openable file.',
    'ext.comment.jumpLineUnresolved': 'Cannot jump to {path}: line number could not be resolved.',
    'ext.comment.jumpFileMissing': 'Cannot jump to {path}: file not found in the review snapshot.',
    'ext.comment.applyWorkspaceOnly': 'Apply is only available in Workspace review mode.',
    'ext.deleteProviderConfirm': 'Delete custom provider "{name}"?',
    'ext.deleteProviderConfirmBtn': 'Delete',
    'ext.git.justNow': 'just now',
    'ext.git.hoursAgo': '{h} hours ago',
    'ext.git.hourAgo': '1 hour ago',
    'ext.git.yesterday': 'yesterday',
    'ext.git.daysAgo': '{d} days ago',
    'ext.git.workspaceVsHead': 'Workspace ↔ HEAD',
    'ext.cli.installOk': '✓ Install complete',
    'ext.cli.installFail': '✗ Install failed (exit ',
};

export function t(key: string): string {
  return messages[key] ?? key;
}
