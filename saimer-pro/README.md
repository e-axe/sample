# S'aimerプロダクション｜確認用サイト

確認用URL: https://e-axe.github.io/sample/saimer-pro/

所属4名・全9ページの静的HTML/CSS/JavaScript。第一目的はキャスティングオファー獲得。2026-10-11のクライアント回答反映とレビュー後、2026-10-12に支給された4名の宣材写真を実装した。

現在はクライアント最終確認用。SAMPLE表示と全9ページの`noindex, nofollow`を維持する。正式な読みは「セメプロダクション」、本番URLは`https://saimer-pro.com/`（wwwなし）に確定。宣材メイン写真4枚とページ内拡大は反映済みで、複数写真の追加にも対応している。掲載メールはcontact@saimer-pro.comで開設準備中。本番公開にはメールボックス開設・送受信確認と公開環境の最終確認が必要。

制作判断と担当・素材待ちは [現在の制作ブリーフ](docs/production-brief-2026-10-11.md)、今回の情報構成・コード改善と検証範囲は [最新レビュー](docs/review-2026-10-12.md)、前段の改善・検証は [10月12日の反映記録](docs/ui-update-2026-10-12.md)、前回のレビューと検証は [レビュー記録](docs/review-2026-10-11.md) を参照。過去の保留判断・旧配色・旧写真の記録はGit履歴に保存されている。

## 構成

- `index.html`: 青空ヒーロー → TALENTS → ABOUT → SOCIAL → CONTACT
- `talents/index.html`: 所属4名の一覧
- `talents/<slug>/index.html`: 個別プロフィール・出演歴・対象者名付き出演相談・本人SNS
- `about/index.html`: 理念・事業・会社情報
- `contact/index.html`: メール窓口、相談種類・対象者選択、任意の相談文面
- `privacy/index.html`: クライアント最終確認待ちのプライバシー文面

CMS・ニュース・SNS埋め込み・送信フォーム・オーディションページは追加しない。

## 色・レイアウト

共通設定: `assets/css/style.css` の`:root`。トップ・下層の空画像とフェード: `assets/css/sky-images.css`。10月12日の配置・文字の調整は`assets/css/design-20261012.css`。

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

**4名の支給宣材をトップ・一覧・各プロフィールの合計12か所へ反映済み。** 元画像はローカルの`タレント宣材`で保管し、公開リポジトリへ原本を格納しない。写真台帳は`docs/portrait-assets.json`、更新記録は`docs/portrait-update-2026-10-12.md`を参照。

1. `tools/optimize-portraits.py <原本フォルダ>`で320・640・960px幅のWebP品質90／JPEG品質90を生成する。Pillowが必要。全原本がEXIF適用後の横幅960px以上であることを出力前に検証し、不足する場合はファイルを変更せず停止する。拡大は行わず、EXIFの向きを適用し、埋め込みICCがある場合はsRGBへ変換、公開用画像からEXIF/GPSを除く。
2. `picture`のWebPとJPEGフォールバック、双方の`srcset`と`sizes`を維持する。原寸比率はほぼ2:3。カードは従来の3:4、プロフィールは2:3で頭部と全体が見える構成。
3. `width`・`height`と本人名を含む`alt`を設定。メイン写真は即読み込み、カードは`loading="lazy"`を使用する。
4. 写真追加時は別の原本を使ってギャラリーを設ける。今回は各1枚なので、同一写真を重複掲載して枚数を補わない。追加写真は現在のメイン写真の反映を妨げない。
5. 旧`sample-portraits.webp`は未使用の従来素材。所属者の正式写真として流用せず、公開用パッケージには含めない。

## メール窓口の開設後

掲載先はユーザーが確定した`contact@saimer-pro.com`。現在はメールボックス作成前のため、アドレスと開設準備中を表示する。アドレスと相談文面のコピーは使えるが、メール起動は無効。コピー完了にも開設前である旨を表示する。

1. メールボックスを作成し、送信・受信を確認する。
2. `contact/index.html`の`data-contact-ready="false"`を`true`へ変更。
3. HTMLの`[data-mail-link]`にも一般相談の`mailto:contact@saimer-pro.com`を設定し、`aria-disabled`・`is-disabled`を外して文言を戻す。`[data-email-pending]`を非表示にする。JavaScript無効でもメール起動を使えるようにする。
4. ABOUT・PRIVACY・全9ページの案内と制作ブリーフから開設準備中を外す。更新したCSS・JSのバージョンを全ページで揃える。
5. 4名の相談導線、3種類の相談文面、対象者変更、アドレスコピーを確認。

メールアプリの起動・文面コピーは送信完了ではない。サイト自体にメール送信処理はない。

## 開発検証

`npm ci`後に`npm test`でページ参照・キャッシュ版・相談の17ケースを検査。`npm run test:portraits`はPillowがあるPython環境で画像の更新処理を検査する。実際のブラウザー確認は別途実施する。

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
