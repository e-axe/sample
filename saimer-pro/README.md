# S'aimerプロダクション｜確認用サイト

確認用URL: https://e-axe.github.io/sample/saimer-pro/

所属4名・全9ページの静的HTML/CSS/JavaScript。第一目的はキャスティングオファー獲得。2026-10-11のクライアント回答反映後、不具合・可読性・問い合わせ内容の整合性を改善した。

現在はクライアント最終確認用。SAMPLE表示と全9ページの`noindex, nofollow`を維持する。本番公開には正式写真・新問い合わせメール・公開環境等の確定が必要。

制作判断と担当・素材待ちは [現在の制作ブリーフ](docs/production-brief-2026-10-11.md)、今回のレビューと検証は [レビュー記録](docs/review-2026-10-11.md) を参照。過去の保留判断・旧配色・旧写真の記録はGit履歴に保存されている。

## 構成

- `index.html`: 青空ヒーロー → TALENTS → ABOUT → SOCIAL → CONTACT
- `talents/index.html`: 所属4名の一覧
- `talents/<slug>/index.html`: 個別プロフィール・出演歴・対象者名付き出演相談・本人SNS
- `about/index.html`: 理念・事業・会社情報
- `contact/index.html`: メール窓口、相談種類・対象者選択、任意の相談文面
- `privacy/index.html`: クライアント最終確認待ちのプライバシー文面

CMS・ニュース・SNS埋め込み・送信フォーム・オーディションページは追加しない。

## 色・レイアウト

共通設定: `assets/css/style.css` の`:root`。トップの空画像とフェード: `assets/css/sky-images.css`。

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
| ABOUT PC | `assets/images/about/sky-arch-20260906-pc.webp` | 1,672×941 |
| ABOUT SP | `assets/images/about/sky-arch-portrait-v2.webp` | 960×1,440 |

空・アーチはユーザー選定済み。旧空画像は以前の指示により保存。ヒーローの位置は`--hero-position-pc`、SPは`sky-images.css`内の`--hero-position-sp: 38% 50%`で調整する。

**現在は所属者の人物写真を使用していない。** トップ・一覧・個別の`.photo-placeholder`を実画像へ置き換える。旧`sample-portraits.webp`は未使用の従来素材で、所属者の正式写真として流用しない。

1. 原本を保管し、sRGBのWebP／JPEGを用意する。
2. `.talent-photo`内に`img`を配置し、`.photo-placeholder`と仮コピーを外す。`role="img"`・仮`aria-label`・`data-asset-status="pending"`も外す。
3. `src`、実寸の`width`・`height`、本人名を含む`alt`を設定。必要なら`--talent-position`で切り抜き位置を調整。
4. 3:4を基本に顔・頭部が欠けないことをPC/SPで確認。ギャラリーは既存の`.talent-gallery`内に`figure`を追加し、標準3〜4枚／最大6枚程度まで確認。
5. ファーストビューのメイン写真は遅延読み込みせず、ギャラリーに`loading="lazy" decoding="async"`を設定。

## 正式メール受領時

新メール未受領のため、現在はメール・アドレスコピーを無効化している。旧アドレスへ送信しない。

1. `contact/index.html`の`data-contact-email=""`へ承認済みの新メールを設定。
2. HTML側の`[data-mail-link]`にも一般相談の`mailto:`を設定し、`aria-disabled`・`is-disabled`を外す。アドレス表示に実メールを入れて`hidden`を外し、コピーの`disabled`を外す。`[data-email-pending]`を除去。JavaScript無効でもメールとアドレスが使えるようにする。
3. ABOUT・PRIVACYのメール準備中表示、全ページのサンプル案内、制作ブリーフを更新。
4. `?talent=<slug>`で4名の氏名が画面・件名・本文へ渡ることを確認。`?type=press`／`?type=other`で相談内容が一致することを確認。
5. 件名・本文は相談種類に応じてJSが生成する。メールアプリの起動は送信完了ではなく、サイト内に送信処理はない。

相談文面のコピーはメール未設定でも使える。任意項目の下書き補助であり、入力フォームではない。コピー失敗時は失敗を表示し、成功を装わない。

## SNS

本人SNS4リンクはアンケート回答から反映済み。個別の`Talent Social`とトップの事務所`SOCIAL`を区別する。髙島さんは回答「なし」。事務所4サービスは公開予定の非クリック表示で維持。

公式URL受領時は該当`.social-row`を`a`へ変更し、`target="_blank" rel="noopener noreferrer"`と識別可能な`aria-label`を設定。「公開予定」を外す。未開設のURLや`href="#"`は使わない。

| 素材 | 出典 |
| --- | --- |
| `assets/icons/x.svg` | X公式ブランドツールキットの黒版。 https://about.x.com/en/who-we-are/brand-toolkit |
| `assets/icons/instagram.svg` | Meta公式配布のInstagram Glyph Black。 https://www.meta.com/brand/resources/instagram/instagram-brand/ |
| `assets/icons/youtube.png` | YouTube公式配布のalmostblack digital。 https://brand.youtube/youtube-icon |
| `assets/icons/tiktok.svg` | Simple Icons（CC0）。 https://github.com/simple-icons/simple-icons/blob/develop/icons/tiktok.svg |

SNSロゴの形・比率を維持。YouTube PNGの透明余白を含む表示幅は40px。サイトの矢印は共通のSVG。

## 公開環境

GitHub Pagesは既存の`main`ブランチから静的配信。現在のcanonical・sitemapは確認用URLに合わせている。サブフォルダ内の`robots.txt`は検索除外の根拠にせず、全9ページのmetaで検索除外する。

本番移行時は正式URL・HTTPS・設置方法を確定し、正式なOGP画像とプロフィール写真を設定する。確認用のSAMPLE表示・noindexを見直す。本番用ファイルに未使用サンプル人物素材や制作用docs/toolsを混ぜない。

既存のローカル開発コマンドは`npm run dev -- --port 4173`（依存パッケージ不要、`tools/preview.mjs`）。今回の検証ではローカルブラウザサーバーを起動していない。
