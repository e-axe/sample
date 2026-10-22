# S'aimerプロダクション｜確認用サイト

確認用URL: https://e-axe.github.io/sample/saimer-pro/

所属4名・全9ページの静的HTML/CSS/JavaScript。第一目的はキャスティングオファー獲得。2026-10-11のクライアント回答反映とレビュー後、2026-10-12に支給された4名の宣材写真を実装した。

現在はクライアント最終確認用。SAMPLE表示と全9ページの`noindex, nofollow`を維持する。正式な読みは「セメプロダクション」、本番URLは`https://saimer-pro.com/`（wwwなし）に確定。宣材メイン写真4枚とページ内拡大は反映済みで、複数写真の追加にも対応している。2026-10-14にcontact@saimer-pro.comのメールボックス作成を管理画面で確認し、メール起動を有効化した。2026-10-15にSSL反映・Gmailとの実際の往復送受信を確認済み。プライバシー本文も同日にユーザーから最終承認の報告を受領。最新記録は[公開前調整](docs/release-2026-10-14.md)。

制作判断と担当・素材待ちは [現在の制作ブリーフ](docs/production-brief-2026-10-11.md)、今回の情報構成・コード改善と検証範囲は [最新レビュー](docs/review-2026-10-12.md)、前段の改善・検証は [10月12日の反映記録](docs/ui-update-2026-10-12.md)、前回のレビューと検証は [レビュー記録](docs/review-2026-10-11.md) を参照。過去の保留判断・旧配色・旧写真の記録はGit履歴に保存されている。

## 構成

- `index.html`: 青空ヒーロー → TALENTS → ABOUT → SOCIAL → CONTACT
- `talents/index.html`: 所属4名の一覧
- `talents/<slug>/index.html`: 個別プロフィール・出演歴・対象者名付き出演相談・本人SNS
- `about/index.html`: 理念・事業・会社情報
- `contact/index.html`: メール窓口、相談種類・対象者選択、任意の相談文面
- `privacy/index.html`: 2026-10-15に最終承認を確認したプライバシー文面

CMS・ニュース・SNS埋め込み・送信フォーム・オーディションページは追加しない。

## 色・レイアウト

共通設定: `assets/css/style.css` の`:root`。トップ・下層の空画像とフェード: `assets/css/sky-images.css`。10月12日の配置・文字の調整は`assets/css/design-20261012.css`。編集用の3ファイルは`npm run build:assets`で`assets/css/site.css`にまとめ、全ページで1本だけ読み込む。生成CSSは直接編集せず、ソースと一緒にコミットする。`npm test`は生成物の不一致も検出する。

| 変数 | 値 | 用途 |
| --- | --- | --- |
| `--color-bg` | `#F5FAFE` | 基本背景 |
| `--color-surface` | `#E6F3FB` | 補助面 |
| `--color-heading` | `#3883C8` | 大見出し。参照モックの青を保持 |
| `--color-text` / `--color-muted` | `#206DA2` | 本文・補助文字・小さな見出し・ナビ |
| `--color-accent` | `#008BCB` | 枠・装飾 |
| `--color-accent-hover` | `#17659D` | ホバー・操作部品の境界 |
| `--color-line` | `#C6DEED` | 装飾罫線 |
| `--color-cta-bg` | `#006FA6` | 塗りボタン |
| `--color-white` / `--color-cta-text` | `#FFFFFF` | 白い面・ボタン文字 |
| `--color-focus` | `#3883C8` | キーボードフォーカス |

最大幅1,240px。左右余白PC40／タブレット24／スマートフォン20px。セクション上下余白PC72／スマートフォン40px。4名はPC4列、1,200px未満2列、480px未満1列。6名へ追加する場合は`.talent-grid.is-six`でPC3列×2段にできる。

Google FontsはHTMLのstylesheetリンクから読み込む。既存のCormorant Garamond、Noto Serif JP、Noto Sans JPと`display=swap`を維持。CSSの`@import`による追加の読み込み段階を除いた。

## 画像差し替え

| 対象 | 現在使用中の素材 | 寸法 |
| --- | --- | --- |
| ヒーローPC | `assets/images/hero/sky-vivid-20260906-pc.webp` | 1,672×941 |
| ヒーローSP | `assets/images/hero/sky-vivid-20260906-sp.webp` | 960×540 |
| ABOUT・下層 PC | `assets/images/about/sky-light-20261012-1600.webp` | 1,600×900 |
| ABOUT・下層 SP | `assets/images/about/sky-light-20261012-800.webp` | 800×450 |

ヒーローの青空は維持。ABOUTのアーチは2026-10-12の承認により空と光へ差し替え済み。背景の生成方法・プロンプトは`docs/background-20261012.md`。旧空画像は以前の指示により保存。ヒーローの位置は`--hero-position-pc`、SPは`sky-images.css`内の`--hero-position-sp: 38% 50%`で調整する。

2026-10-22更新：一覧は石原 月斗さんの現行写真を基準に再調整。髙島 大幹さんは支給の`9250.jpg`へ差し替え済み（トップ・一覧・詳細・拡大）。最新の構図・画像名は`docs/portrait-framing-20261022.md`と同名JSONを参照。旧生成ツールの座標・ファイル名は過去の写真用なので、そのまま再実行しない。

**4名の支給宣材をトップ・一覧・各プロフィールの合計12か所へ反映済み。** 元画像はローカルの`タレント宣材`で保管し、公開リポジトリへ原本を格納しない。写真台帳は`docs/portrait-assets.json`、更新記録は`docs/portrait-update-2026-10-12.md`を参照。

1. `tools/optimize-portraits.py <原本フォルダ>`で320・640・960px幅のWebP品質90／JPEG品質90を生成する。Pillowが必要。全原本がEXIF適用後の横幅960px以上であることを出力前に検証し、不足する場合はファイルを変更せず停止する。拡大は行わず、EXIFの向きを適用し、埋め込みICCがある場合はsRGBへ変換、公開用画像からEXIF/GPSを除く。
2. `picture`のWebPとJPEGフォールバック、双方の`srcset`と`sizes`を維持する。原寸比率はほぼ2:3。カードは従来の3:4、プロフィールは2:3で頭部と全体が見える構成。
3. `width`・`height`と本人名を含む`alt`を設定。メイン写真は即読み込み、カードは`loading="lazy"`を使用する。
4. 写真追加時は別の原本を使ってギャラリーを設ける。今回は各1枚なので、同一写真を重複掲載して枚数を補わない。追加写真は現在のメイン写真の反映を妨げない。
5. 旧`sample-portraits.webp`は未使用の従来素材。所属者の正式写真として流用せず、公開用パッケージには含めない。

相談文面・メールコピーの処理は`assets/js/contact.js`に分離し、CONTACTだけで読み込む。共通の`main.js`はメニュー・フォント・表示処理を担当する。

## メール窓口

contact@saimer-pro.com（容量2GB）を作成済み。CONTACTのdata-contact-readyはtrue、静的HTMLのmailtoとアドレスコピーを有効化。全ページ・会社概要・プライバシーから開設準備中を除去した。構造化データにもメールを同期する。

メールアプリの起動・文面コピーは送信完了ではない。サイト自体にメール送信処理はない。2026-10-15 02:37〜02:38 JSTにGmailとの往復送受信を確認済み。両方の受信トレイへの到着とSPF・DKIM・DMARC PASSを確認した。

## 開発検証

CSS編集後は`npm run build:assets`を実行。`npm ci`後に`npm test`でページ参照・キャッシュ版・相談の17ケースを検査。`npm run test:portraits`はPillowがあるPython環境で画像の更新処理を検査する。実際のブラウザー確認は別途実施する。

## SNS

本人SNS4リンクはアンケート回答から反映済み。個別の`Talent Social`とトップの事務所`SOCIAL`を区別する。英語見出しには日本語の補助説明を添える。髙島さんは回答「なし」。事務所4サービスは公開予定の非クリック表示で維持。

公式URL受領時は該当`.social-row`を`a`へ変更し、`target="_blank" rel="noopener noreferrer"`と識別可能な`aria-label`を設定。「公開予定」を外す。未開設のURLや`href="#"`は使わない。

| 素材 | 出典 |
| --- | --- |
| `assets/icons/x.svg` | X公式ブランドツールキットの黒版。 https://about.x.com/en/who-we-are/brand-toolkit |
| `assets/icons/instagram.svg` | Meta公式配布のInstagram Glyph Black。 https://www.meta.com/brand/resources/instagram/instagram-brand/ |
| `assets/icons/youtube.png` | YouTube公式配布のalmostblack digital。 https://brand.youtube/youtube-icon |
| `assets/icons/tiktok.svg` | Simple Icons（CC0）。 https://github.com/simple-icons/simple-icons/blob/develop/icons/tiktok.svg |

SNSロゴの形・比率を維持。YouTube PNGの透明余白を含む表示幅は40px。サイトの矢印は共通のSVG。

## 公開環境

GitHub Pagesは既存の`main`ブランチから静的配信。canonical・OGP・JSON-LDは確認用URLに合わせ、全9ページのmetaで検索除外する。確認用sitemapはURLを列挙しない。サブフォルダ内の`robots.txt`は検索除外の根拠にしない。

本番用は`npm run build:production`で別フォルダへ生成する。正式URL、検索許可、サイトマップ、画像URL、構造化データ、SAMPLE表示の除去を一括で切り替え、参照される公開用の資産のみを出力する。確認用ソースをそのまま本番へコピーしない。SEO・AIO・OGP、再生成・検証、サーバー公開時の手順は[docs/seo-and-production.md](docs/seo-and-production.md)にまとめた。OGP画像の生成記録と最終プロンプトは[docs/ogp-20261012.md](docs/ogp-20261012.md)。

既存のローカル開発コマンドは`npm run dev -- --port 4173`（依存パッケージ不要、`tools/preview.mjs`）。プレビューはWindowsのパスに対応し、`127.0.0.1`でのみ起動する。JPEGも正しいMIMEで配信する。

## 本番生成前の確認記録

site.config.jsonのreleaseReadinessにメール往復確認・プライバシー最終承認を記録する。プライバシー本文の各policy-sectionの正規化したテキストのSHA-256を承認対象と照合し、承認後に本文が変更された場合は再確認する。記録欠落・未確認・本文不一致の場合は出力前に本番生成を停止する。検証は`npm run test:release`。詳細は[PR #6対応](docs/pr6-review-fix-2026-10-15.md)。

## 自動検査（2026-10-20）

`npm run test:all`で参照・問い合わせ・メニュー・写真・SEO・本番生成・画像更新を検査する。既存の確認記録を上書きしたい場合のみ、該当スクリプトに`--write-report`を渡す。

`npx playwright install --with-deps chromium webkit`の後、`npm run test:browser`で全9ページを320・375・390・430・768・1024・1440pxとWebKitのスマホ縦横表示で検査する。写真開閉とスクロール復帰、メニューのフォーカス、対象タレントの引き継ぎ、200%文字拡大、JavaScript無効時も対象。Google Fontsの外部接続を検査中だけ隔離し、システムフォントへのフォールバックを使う。外部SNSの到達可否・実機iPhone・メール送信完了はこの検査の対象外。

`.github/workflows/saimer-checks.yml`はこのサイトの変更を含むPRとmain更新時、および手動実行時に両方の検査を走らせる。失敗時だけスクリーンショット・トレースを7日保存。検査結果や一時ファイルはソースへ出力しない。検査は本番サーバーへの公開を行わない。

## 本番サイト自動更新（GitHub Actions → FTPS）

GitHubの本番転送は対象フォルダの初期確認・手動承認を経て有効にする。通常更新ではエックスサーバー管理画面への再ログインは不要。FTPSの安全な初期設定、Secrets、接続テスト、本番転送・自動化の手順は [FTPSデプロイ運用手順](docs/deploy-ftps.md) を参照。現時点では認証情報のGitHub Secretsへの設定と本番の接続テストは未確認であり、自動公開が動作したという意味ではない。
