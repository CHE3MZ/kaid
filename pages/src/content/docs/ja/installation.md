---
title: インストール
sidebar:
  order: 4
---

`ocr` CLI をインストールするには、サポートされた 4 つの方法があります。

## インストールスクリプト（curl | sh）

GitHub Release バイナリのダウンロード（検証付き）をラップした便利なインストーラーです——CI のベース
イメージやヘッドレス環境に適しています。

```bash
curl -fsSL https://raw.githubusercontent.com/CHE3MZ/kaid/master/install.sh | sh
```

3 つの環境変数を認識します。

| 変数 | デフォルト値 | 用途 |
|---|---|---|
| `OCR_INSTALL_DIR` | `/usr/local/bin` | `ocr` バイナリを配置する場所。 |
| `OCR_VERSION` | 最新 release | 特定の release tag に固定します（例：`v1.2.3`）。 |
| `OCR_GITHUB_MIRROR` | （未設定） | GitHub ミラードメイン経由でリリースバイナリとそのチェックサムをダウンロードします（例：`gh-proxy.com`）。 |

このスクリプトは `darwin` と `linux` の `amd64` / `arm64` をサポートします。

#### GitHub ミラーを使用する

一部の地域では GitHub へのネットワークアクセスが遅いため、`OCR_GITHUB_MIRROR` にミラードメインを設定すると、リリースバイナリとそのチェックサムをミラー経由でダウンロードできます：

```bash
export OCR_GITHUB_MIRROR='YOUR_MIRROR_DOMAIN'
```

値はスキームや末尾スラッシュを含まないベアドメインである必要があります（`https://gh-proxy.com/` ではなく `gh-proxy.com`）。これは*パスプレフィックス*ミラーとして使用されます。バイナリは
`https://<ミラー>/github.com/CHE3MZ/kaid/releases/download/<バージョン>/…`
から取得されます。ドメイン置換型ミラー（例：`github.com` を `hub.example.org` に書き換えるもの）はこの形式に一致しません——パスプレフィックス型のミラーを使用してください。

ミラーはリリースバイナリとその `sha256sum.txt` チェックサムの両方をカバーします。バージョン解決（`OCR_VERSION` が未設定の場合）は引き続きミラーではなく GitHub API を直接呼び出します。バージョン解決を完全にスキップするには、バージョンを固定してください：

```bash
export OCR_VERSION='v1.2.3'
```

> **セキュリティ上の注意：** ミラーは第三者のサービスであるため、`OCR_GITHUB_MIRROR` を設定するとバイナリとその `sha256sum.txt` の両方がミラーからダウンロードされます。つまり、悪意のあるミラーは改ざんされたバイナリと一致するチェックサムを同時に配布できます。そのため、ミラーモードでは完全性の保証はありません。ミラーを信頼できない場合は、[releases ページ](https://github.com/CHE3MZ/kaid/releases) のアップストリームの `sha256sum.txt` と照合して検証してください。

Windows（PowerShell 3.1+）では、代わりに PowerShell インストーラーを使用してください：

```powershell
irm https://raw.githubusercontent.com/CHE3MZ/kaid/master/install.ps1 | iex
```

同じ `OCR_INSTALL_DIR`、`OCR_VERSION`、`OCR_GITHUB_MIRROR` を認識します
（`$env:OCR_INSTALL_DIR` / `$env:OCR_VERSION` /
`$env:OCR_GITHUB_MIRROR` で設定）。デフォルトのインストール先は
`%LOCALAPPDATA%\Programs\ocr` です。

## GitHub Release バイナリ

直接ダウンロードしたい場合は、
[releases ページ](https://github.com/CHE3MZ/kaid/releases) から
静的バイナリを取得できます。

```bash
# macOS (Apple Silicon)
curl -Lo ocr https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-darwin-arm64
chmod +x ocr && sudo mv ocr /usr/local/bin/ocr

# macOS (Intel)
curl -Lo ocr https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-darwin-amd64
chmod +x ocr && sudo mv ocr /usr/local/bin/ocr

# Linux x86_64
curl -Lo ocr https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-linux-amd64
chmod +x ocr && sudo mv ocr /usr/local/bin/ocr

# Linux ARM64
curl -Lo ocr https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-linux-arm64
chmod +x ocr && sudo mv ocr /usr/local/bin/ocr

# Windows (AMD64)
curl -Lo ocr.exe https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-windows-amd64.exe

# Windows (ARM64)
curl -Lo ocr.exe https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-windows-arm64.exe
```

各 release では、バイナリの隣に `sha256sum.txt` も公開されており、完全性を検証できます。

```bash
curl -LO https://github.com/CHE3MZ/kaid/releases/latest/download/sha256sum.txt
shasum -a 256 -c sha256sum.txt --ignore-missing
```

## go install でインストール

Go 1.26.10 以降が必要です：

```bash
go install github.com/CHE3MZ/kaid/cmd/opencodereview@latest
```

このコマンドは `opencodereview` を `$(go env GOPATH)/bin`（通常は
`~/go/bin`）にインストールします。CLI 名は `ocr` なので、名前を変更するか
リンクを作成してください：

```bash
mv "$(go env GOPATH)/bin/opencodereview" "$(go env GOPATH)/bin/ocr"
```

Windows の場合：

```powershell
Rename-Item "$(go env GOPATH)\bin\opencodereview.exe" ocr.exe
```

`go install` はモジュールのソースから直接ビルドし、リリース用の ldflags を
適用しないため、`ocr version` はリリースタグではなく `dev` を表示することが
あります。

## ソースからビルドする

OCR 自体を変更する場合、またはプリコンパイル済みバイナリのないプラットフォームで実行する場合にのみ、この方法が必要です。

#### 前提条件

- [Go ≥ 1.26.10](https://go.dev/dl/)
- [Git](https://git-scm.com/)
- [Make](https://www.gnu.org/software/make/)

#### ビルド

```bash
git clone https://github.com/CHE3MZ/kaid.git
cd kaid
make build              # dist/opencodereview を生成（Windows では dist/opencodereview.exe）
sudo cp dist/opencodereview /usr/local/bin/ocr
```

#### 他のプラットフォーム向けにビルドする

```bash
make build-linux-amd64
make build-linux-arm64
make build-darwin-amd64
make build-darwin-arm64
make build-windows-amd64   # Windows (x86_64)
make build-windows-arm64   # Windows (ARM64)
make build-all          # 6 つすべてを一括ビルド
make sha256sum          # sha256sum.txt も生成
```

`make dist` は `clean → build-all → sha256sum` を実行し、バイナリの隣に
`VERSION` ファイルを書き込みます——ローカルで release ビルドを再現するのに便利です。
公式 release は CI の GoReleaser でビルドされます。

#### テストの実行

```bash
make test               # LC_ALL=C go test -v -race -count=1 ./...
```

## インストールの検証

バイナリがどこから来たものであっても：

```bash
ocr version             # バージョン + git commit + ビルド日時を出力
ocr --help              # トップレベルの使い方
ocr review --help       # review コマンドの完全な引数リスト
```

"command not found" エラーが出る場合は、インストール先が `$PATH` 上にあることを確認してください。

```bash
which ocr
echo $PATH
```

## シェル補完を有効にする（任意）

`ocr` は bash、zsh、fish、PowerShell の Tab 補完に対応しています。

```bash
# bash
source <(ocr completion bash)

# zsh
ocr completion zsh > "${fpath[1]}/_ocr"
```

fish、PowerShell、および永続化の詳しい設定方法は [CLI リファレンス](./cli-reference.md#ocr-completion) を参照してください。


## OCR が状態を保存する場所

| パス | 保存内容 |
|---|---|
| `~/.opencodereview/config.json` | LLM エンドポイント、言語、テレメトリ設定（`ocr config set` で管理）。 |
| `~/.opencodereview/rule.json` | オプションのグローバルレビュールール。 |
| `~/.opencodereview/sessions/<encoded-repo-path>/<session-id>.jsonl` | レビューセッションごとのストリーミング JSONL トランスクリプト。`ocr viewer` で使用します。 |
| `<repo>/.opencodereview/rule.json` | オプションのプロジェクトレベルのレビュールール——安全にコミットできます。 |

OCR は `~/.opencodereview/` の外に書き込むことは決してありません（install script が一時的にバイナリをダウンロードする場合を除く）。
このディレクトリを削除すれば、クリーンなアンインストールが完了します。

## 関連項目

- [クイックスタート](../quickstart/)——LLM を設定して初回のレビューを完了します。
- [設定](../configuration/)——OCR が受け入れる各環境変数と config key。
- [AGENTS.md](https://github.com/CHE3MZ/kaid/blob/master/AGENTS.md)——ソースからビルドし、テストを実行して開発に参加します。
