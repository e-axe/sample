# S'aimerプロダクション｜GitHub Actions → XServer FTPS 本番公開

対象：`e-axe/sample` 内の `saimer-pro/` だけ。本番URL：<https://saimer-pro.com/>。
他案件のフォルダは転送しない。プレビューサイトのHTMLを直接本番に上書きしない。

## 何が自動化されるか
- `.github/workflows/saimer-checks.yml` が `main` のS'aimer変更を検査（PC・スマホ・WebKit等）。
- **検査成功後**、`SAIMER_FTPS_AUTO_DEPLOY=true` の場合だけ `saimer-deploy.yml` が本番用ファイルをビルドし、FTPSでアップロード。
- JavaScript・CSS・HTMLと画像のうち、`npm run build:production` が選んだファイルのみを配信。生成物の外側は転送しない。
- マニフェストで変更有無を判定。過去に管理したファイルも含め削除処理は行わない。古い不要ファイルを消す場合は別途監査する。
- シークレットをワークフロー・コード・公開ログに直書きしない。TLS証明書検証あり、FTPS明示的TLS、データ転送も暗号化、PASV、ポート21。

## 初回だけ手動で必要な設定
現在のChatGPT GitHub連携ではリポジトリのSecrets／Variablesを書き込めない。
**設定画面を開いてユーザー自身が一度登録する**。以後のサイト更新のたびには不要。

リポジトリ：<https://github.com/e-axe/sample/settings/secrets/actions>

**Repository secrets**（New repository secret）
- `SAIMER_FTPS_HOST` = FTPSホスト名（共有済み）
- `SAIMER_FTPS_USER` = FTPS専用ユーザー名（共有済み）
- `SAIMER_FTPS_PASSWORD` = FTPS専用パスワード（共有済みの認証情報をそのままGitHubの画面で登録。コードに書かない）

まずこの3件だけ保存する。認証失敗時は、XServer側で当該FTPユーザーの利用可能範囲とパスワードを確認する。

### 1. 読み取り専用の接続確認
<https://github.com/e-axe/sample/actions/workflows/saimer-deploy.yml>
`Run workflow` → `mode: probe` → 実行。
ログに候補 `.`、`public_html`、`saimer-pro.com/public_html` が存在するか、その場所に `index.html` 等があるかだけ表示。サーバーパスの全件一覧や秘密情報は表示しない。

**候補のうち本当に `saimer-pro.com` の公開フォルダに対応するものを確認する**。FTPサブアカウントの初期フォルダや権限によって `.` がそのまま公開ルートであることもある。判断不能な場合は当てずっぽうで進めない。必要ならXServer管理画面でFTPアカウントの設定ディレクトリを一度確認する。

### 2. 公開フォルダを指定
<https://github.com/e-axe/sample/settings/variables/actions>
`New repository variable` に以下を登録：
- `SAIMER_FTPS_REMOTE_DIR` = probeで確認した公開フォルダへの**相対パス**（例：`.` または `public_html`）。絶対パスと `..` は禁止。

### 3. 対象フォルダを一度だけ承認
同じActions画面で `mode: initialize` を選び、confirmationに **`saimer-pro.com`** と入力して実行する。
選択先にWordPressの `index.php` や他サイトの `index.html` がある場合は中断する。
選択フォルダへ `.saimer-deploy-root` という対象識別ファイルを設置。誤った公開先への転送を以後ブロックする。**このステップまで本番HTMLを転送しない**。

### 4. 最初の本番公開
同じActions画面で `mode: deploy` を選び、実行する。
本番テスト（`npm run test:all`、ブラウザ検証）→本番生成→FTPS転送を行う。
表示確認では少なくともトップ・タレント詳細・CONTACT、SSL・リダイレクト・OGP・公開不要のSAMPLE不在をチェックする。
**公開先の確認と初回リリースが成功するまでは自動公開を有効にしない。**

### 5. 初回成功後、自動デプロイ有効化
<https://github.com/e-axe/sample/settings/variables/actions>
Repository variableをもう1つ作成：
- `SAIMER_FTPS_AUTO_DEPLOY` = `true`

以降、`main` の `saimer-pro/**` が更新され、既存の `Saimer site checks` が成功すると、自動的に公開する。ログインやパスワード再入力は通常不要。
`false` に変更または削除すれば自動公開を止められる。手動 `mode: deploy` は引き続き可能。

## セキュリティ・運用上の注意
- GitHubリポジトリは公開。**パスワード・管理画面情報・接続ログの全文をコミット／Issue／PRへ貼らない**。
- FTPS専用ユーザーには当該サイト公開フォルダだけの権限を与える。エックスサーバー管理アカウント・メールとパスワードを共有している場合は分離・変更を推奨。
- Secretsを更新したいときはGitHub画面で値を上書き。XServer管理画面は新しいFTPアカウント発行・権限変更・パスワード変更・DNS/SSL/メール設定等の場合にのみ使用。
- `probe` はサーバーへ書き込まない。`initialize` は識別ファイルのみ作成。`deploy` のみ公開データを更新する。
- マニフェストの内容と実ファイルがずれた場合、同じサイズの改変を検出できない可能性がある。侵入検査用の仕組みではない。必要に応じ手動でサーバーを監査する。
- FTPサーバーによるリネーム上書き制限などで転送に失敗したときは、自動的に既存ファイルを削除せず停止する。
- サーバー全体バックアップ／復元機能とは別の仕組みであり、初回本番配置前にXServer側のバックアップも確認する。
- ChatGPTとGitHubの連携自体が失効した場合は再接続が必要になる場合がある。これはFTPSの毎回のログインとは別。
