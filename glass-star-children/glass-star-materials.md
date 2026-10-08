# 『硝子の星の子どもたち』素材ファイル名

共通接頭辞は `glass-star-`。配置先は `image/`。
キャスト番号は初期掲載順に対応する固定番号とし、掲載順が変わっても付け直さない。
ファイル名は半角英小文字・数字・ハイフンに統一する。

## キャスト写真（支給用）

推奨仕様：横1,200 × 縦1,500px、横：縦＝4：5、JPEG、sRGB。
現時点では個別の写真は未登録で、全員が `image/glass-star-avatar-placeholder.svg` を使用。
写真受領後に `index.html` の各キャストに `photo: 'image/以下のファイル名'` を設定する。

| 出演者 | 所属・区分 | 支給用ファイル名 |
|---|---|---|
| 絵森彩 | — | `glass-star-cast-01.jpg` |
| 秋本帆華 | — | `glass-star-cast-02.jpg` |
| 雪月心愛 | — | `glass-star-cast-03.jpg` |
| 相良茉優 | — | `glass-star-cast-04.jpg` |
| 安齋由香里 | — | `glass-star-cast-05.jpg` |
| 小山内花凜 | — | `glass-star-cast-06.jpg` |
| 朝陽花菜 | — | `glass-star-cast-07.jpg` |
| 篠原望 | — | `glass-star-cast-08.jpg` |
| 山岸理子 | — | `glass-star-cast-09.jpg` |
| 藤井彩加 | — | `glass-star-cast-10.jpg` |
| 駒形友梨 | — | `glass-star-cast-11.jpg` |
| 南早紀 | — | `glass-star-cast-12.jpg` |
| 渡部優衣 | — | `glass-star-cast-13.jpg` |
| 内山悠里菜 | — | `glass-star-cast-14.jpg` |
| 吉武千颯 | — | `glass-star-cast-15.jpg` |
| 鈴木杏奈 | — | `glass-star-cast-16.jpg` |
| 薬師寺李有 | — | `glass-star-cast-17.jpg` |
| 中川梨花 | — | `glass-star-cast-18.jpg` |
| アオハルラムネ | 点染テンセイ少女。 | `glass-star-cast-19.jpg` |
| 阿部寿世 | — | `glass-star-cast-20.jpg` |
| 門林有羽 | SUPER☆GiRLS | `glass-star-cast-21.jpg` |
| 花谷麻妃 | — | `glass-star-cast-22.jpg` |
| 麗シュウ | 点染テンセイ少女。 | `glass-star-cast-23.jpg` |
| 日暮刹那 | 点染テンセイ少女。 | `glass-star-cast-24.jpg` |
| 中野あいみ | — | `glass-star-cast-25.jpg` |
| 大澤萌々 | — | `glass-star-cast-26.jpg` |
| 愛ノ彩笑 | — | `glass-star-cast-27.jpg` |
| 田中咲帆 | — | `glass-star-cast-28.jpg` |
| ゾマやかじゃない! | — | `glass-star-cast-29.jpg` |
| 辻史人 | — | `glass-star-cast-30.jpg` |
| 石原美沙紀 | おとな小学生 | `glass-star-cast-31.jpg` |
| 花塚廉太郎 | おとな小学生 | `glass-star-cast-32.jpg` |

## 登録済み画像

| 用途 | ファイル名 |
|---|---|
| キャスト共通仮画像 | `glass-star-avatar-placeholder.svg` |
| Wキャスト出演日程表 | `glass-star-cast-schedule.jpg` |
| フライヤー表 | `glass-star-flyer-front.jpg` |
| フライヤー裏 | `glass-star-flyer-back.jpg` |
| ヒーロー背景 | `glass-star-hero.webp` |
| 公演日程背景 | `glass-star-schedule.webp` |
| あらすじ背景 | `glass-star-story.webp` |
| SNS共有用画像 | `glass-star-ogp.jpg` |

## 追加素材の命名

| 用途 | 支給用ファイル名（未登録） |
|---|---|

| ロゴの編集元データ | `glass-star-logo.ai` |
| 公式メインビジュアル（文字入り） | `glass-star-main-visual.jpg` |
| 公式メインビジュアル（文字なし） | `glass-star-main-visual-clean.jpg` |
| フライヤー表・裏のPDF | `glass-star-flyer.pdf` |

| 公演情報テキスト | `glass-star-performance-info.txt` |
| 外部リンク一覧 | `glass-star-links.txt` |
| キャスト画像対応表 | `glass-star-cast-list.csv` |

上記のJPEGをPNGで支給する場合は、実際の形式に合わせて拡張子も変更する。
`index.html` や第三者配布のフォント・ライセンスファイルは標準名を維持する。

## 公式素材（2026-10-08受領）

支給元：Google Driveフォルダ `1qwwLiUNrRTbY1PrP_SFWxU4EJyv4y6J4`。公式支給データを使用し、生成画像への置換・意匠の変更は行わない。原寸データはDriveに保持し、LPにはsRGBのWeb用データを配置。

|用途|Driveの旧名称|統一名称／LP仕様|
|---|---|---|
|フライヤー表|1.jpg|glass-star-flyer-front.jpg／1283×1800px、JPEG（拡大用）|
|フライヤー裏|硝子_裏面.jpg|glass-star-flyer-back.jpg／1283×1800px、JPEG（拡大用）|
|公式ロゴ|硝子の星の子供達ロゴ.png|glass-star-logo.png／1200×546px、透過PNG|

フライヤーの一覧表示は `glass-star-flyer-front-preview.webp` と `glass-star-flyer-back-preview.webp`（855×1200px）を遅延読み込み。拡大操作時のみ1800pxのJPEGを読み込む。ロゴは透明余白をトリミングし、縦横比と透過を保持。

## 公開URLとSNS共有画像（2026-10-08確定）

- 本番URL／canonical：`https://garasunohoshi.otonapro.com/`
- 確認用GitHub Pages：`noindex,nofollow`を維持。
- OGP・X共有画像：採用済みの「左に公式フライヤー、右に作品情報」の横長画像 `image/glass-star-ogp.jpg`（1200×630px、JPEG）を使用。
- OGPとXの画像URLを統一。Xカードは `summary_large_image`。元の採用PNGから縮小・JPEG化。
- 本番用のインデックス許可・robots.txt・sitemap.xmlは`tools/prepare_release.py`で生成。手順は`README-DELIVERY.md`。
- キャスト写真が全員分反映されるまで、本番ZIPを生成しない。
