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
Secrets／VariablesはGitHubの設定画面で登録する。接続済みブラウザからの設定も可能。以後のサイト更新のたびには不要。

2026-10-20に接続テスト・本番URLとの照合・初回バックアップ・初期化を実施。公開先の相対パスは `.`。認証情報はRepository secretsに保存。

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
初期化・本番転送の前に、FTPSの `index.html` と本番HTTPSの内容を完全一致で照合する。不一致・読み取り失敗時は書き込まず停止する。公開先の全通常ファイルをZIPとSHA-256一覧に保存し、ZIP検証後にActions artifactへ90日間保管する。artifact保存の失敗時も書き込まず停止する。
選択フォルダへ `.saimer-deploy-root` という対象識別ファイルを設置。誤った公開先への転送を以後ブロックする。**このステップまで本番HTMLを転送しない**。

### 4. 最初の本番公開
同じActions画面で `mode: deploy` を選び、実行する。
本番テスト（`npm run test:all`、ブラウザ検証）→本番生成→FTPS転送を行う。
転送後は本番生成物の公開ファイル全件をHTTPS経由で取得し、バイト単位で照合する（`.htaccess`等の非公開ファイルを除く）。
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
- サイトのファイルは各転送前にバックアップする。Actions実行のArtifactsにある `saimer-production-backup-実行ID` を取得すると、`site.zip` と `sha256.json` が得られる。初回の既存77ファイルのバックアップは実行 `39381674534` に保存（90日間）。復元時は自動更新を停止し、内容・対象を確認後、このZIP内のファイルを同じ公開先へFTPSで戻す。今回の仕組みはサーバー全体・DB・メールのバックアップを含まない。
- ChatGPTとGitHubの連携自体が失効した場合は再接続が必要になる場合がある。これはFTPSの毎回のログインとは別。

## 公開の制御
- 手動実行もmainのみ。認証情報はFTPS接続ステップだけへ渡し、ビルド・テスト・外部セットアップ処理へ渡さない。
- 他案件だけのmain更新では検査済みS'aimerソースを公開できる。S'aimer本体または公開ワークフローが変更されていれば古い検査結果による公開を停止。
- 画像・フォント等をCSS/JSより先に転送し、HTML、最後にリダイレクト設定を反映する。全サイトの一括切り替えではなく、各ファイルは一時名への転送後リネームで反映する。

2026-10-20: 初回本番デプロイ（実行39381941086）でサイト検査・ブラウザ検査・バックアップ・FTPS転送・HTTPS全公開ファイル照合が成功。自動更新変数をtrueに設定。
