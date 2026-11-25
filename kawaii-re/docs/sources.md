# 正式情報・素材台帳

確認日：2026-11-05（JST）

| 資料 | 用途 | 取扱い |
| --- | --- | --- |
| `KAWAII_LP参考イメージ.png` | 採用デザイン | 作業フォルダ `design/approved-mock.png` に保存。丸写真・ライブ訴求がある修正版 |
| [公式ブログ・全キャスト出演日程発表](https://ameblo.jp/may-holic/entry-12983587226.html) | 全36名、9回の出演回、販売先、注意事項 | 11/5時点の情報。古い告知より優先 |
| [公式Driveフォルダ](https://drive.google.com/drive/folders/1MBEAz7ZeHY9FtrrQdApD32zvaPdH-IY1) | ロゴ、更新チラシ、役別出演表 | 参照元。共有設定は変更しない |
| [再修正裏面チラシ・11/5](https://drive.google.com/file/d/1_etwldEI438Moe_KRWeYEHSMvObCi0eR/view) | 最新料金・特典・あらすじ | 原本は作業フォルダ `source-materials/flyer-back-20261105.jpg` |
| [舞台かわぱ出演日程表修正](https://drive.google.com/file/d/1V6-yV8ilRfBa_-xjmCaN9gwzX5XqLs7v/view) | 役名と各日の配役 | `source-materials/cast-schedule-20261105.jpg`。公式ブログの出演回と照合 |
| `Asset/logo_02_KAWAII.png` | 公式ロゴ | 支給PNGからWebPを作成。縦横比・色・透明を保持 |
| `キャスト画像_オリジナル/` | 35名分の正式宣材（吉武千颯のみ未提供） | 支給ファイル名と公式の名前を照合。人物の加工はせず、Web用サイズ・丸型表示のみ |

ローカル素材の原本位置：`C:/Users/axe/Pictures/LPサイト/2026-11-12_KAWAII偶像パラドキシカル-再演_LP/`。

表記注意：原本ファイル名の「ナカザワミナ」は公式表示「中澤ミナ」、「広瀬ゆうき」と「水湊美緒」も公式表記に統一。ファイル名の表記ゆれを勝手な改名判断の根拠にしない。人物画像は対応を台帳で保持する。

公式ブログには特典付A席の細則が一部省略されるが、最新裏面の「非売品2L版ブロマイド1枚（種類はS席特典と同じ）」を掲載する。開場時刻とアフターイベント詳細は未掲載のため補わない。

背景は採用モックの世界観を再現したサイト専用の生成イラスト。公式舞台写真とは扱わない。ロゴ・キャスト写真は生成していない。生成方法とプロンプトは[生成記録](image-generation.md) を参照。

## 2026-11-06の更新

- 素材フォルダは11/12表記へ移動されていることを確認。原本ファイルは変更していない。
- キャストの表示順は公式ブログの「出演者」欄を順に平坦化し、独自の先頭6名を廃止した。
- キャスト画像の固定番号と支給原本の対応は [画像番号対応表](cast-image-map.md)。`content.json` の `imageNumber` が正本。
- ヒーロー以外は生成画像を反復せず、CSSによる抽象装飾に変更。画像生成の追加実行はしていない。
- 劇場は [CBGKシブゲキ!!公式案内](https://www.cbgk.jp/about/index.html) の名称・住所も参照。公式Xはユーザー指定URLを使用。

## 2026-11-06 追加修正

- 最新のチャット指示を優先し、下層の抽象装飾案を撤回。STORY用のマイク・台本の専用画像を生成し、劇場・FAQ下部の以前の舞台画像を復元。画像は舞台写真として扱わない。
- キャストはチャットに再掲された19行と5ブロックを `billingGroups` に転記。佐々木琴子、神役3名、八木ましろから深川瑠華、石原美沙紀から星野美夢、岡本芽子以降の区切りを保持。正式な氏名・役名・出演回・固定画像番号は変更していない。
- 延松舞佳の25番のみ原本から再トリミング。切り出し可能な縦方向の余剰部分を30%下へ移動し、顔の中心を丸枠の中心へ近づけた。支給原本は変更していない。
- 新しい画像の生成方法・プロンプトは [生成記録](image-generation.md) に追記。


## 2026-11-06 最新の追加素材

- メイホリック公式ロゴ：プロジェクト添付 `メイホリックロゴ.png`（この作業の入力 `05-png`、714×593px RGBA）。透明余白を除去して360×221pxに縮小、色・形状・縦横比を保って可逆WebP化。公開先 `assets/mayholic-logo.webp`。公式作品ロゴと役割を区別する。
- STORY：ユーザーの新規画像作成指示で `assets/story-theatre.webp`（1152×768px）を新規生成。マイク画像とCSSだけのぼかし案は現行では使用しない。生成記録は `image-generation.md`、斜めの配置はCSSで実装。


## 日本語Webフォントの配信素材

- 公式Google FontsリポジトリのNoto Serif JP / Noto Sans JPの可変TTFを原本とする。原本URL・ハッシュは `assets/fonts/manifest.json`。
- 固定の原本・ライセンスURLを取得し、FontToolsとBrotliでローカル処理。本文・ソースの外部送信は行わない。
- 同梱の `kawaii-serif-jp-OFL.txt` / `kawaii-sans-jp-OFL.txt` にSIL Open Font License 1.1を保持。閲覧者は当サイトのWOFF2だけを読む。


## ヘッダー・背景への使用方法の訂正と吉武千颯宣材の受領

作品ロゴの追加先はヘッダー左へ訂正。フッターはメイホリックのロゴへ復元。STORY画像は同じ承認済みWebPを本文背景に使い、配置・マスク・ぼかしをCSSで指定。
また、未提供だった吉武千颯（固定06番）の正式宣材 `吉武千颯 (1).jpeg` を公式Driveから受領し、他のキャストと同様に丸枠・480×480 WebP（`assets/cast/kawaii-re-cast-06.webp`、`position: north`）へ変換して反映し、仮SVGを削除した。全36名分の正式宣材が揃った状態。

## 2026-11-20 本チラシの受領

| 面 | クライアント支給原本 | サンプルLPの配信画像 |
| --- | --- | --- |
| 表面 | [かわぱ_表面チラシ.png](https://drive.google.com/file/d/1urK7nHpivXkzmIVmccKHd92-ClUXzcmJ/view)（4095 × 2894 px） | `assets/flyer-front-preview.webp`、`assets/flyer-front.webp` |
| 裏面 | [かわぱ再演_裏面チラシ.jpg](https://drive.google.com/file/d/1RIa3R7ZIQ-06UPp322MphiD0uEeVBHGF/view)（3999 × 2851 px） | `assets/flyer-back-preview.webp`、`assets/flyer-back.webp` |

原本は受領時の形式で保存。配信用WebPはトリミングせず、表示用は幅960px、拡大用は幅3000px。衣装ビジュアル版を受領したら、裏面の2ファイルを更新し、`template.html` の画像寸法を確認してHTMLを再生成する。

## 2026-11-21 本衣装公式ビジュアル

- [公式ビジュアル原本35枚](https://drive.google.com/drive/folders/1BuskB8SseqstTmdBgsqB3Zscm6X7xQ1H) を使用。西尾桃子さん（固定34番）は従来の宣材を掲載。
- 公式原本から、顔と衣装の上半身が丸枠に収まるようにトリミングし、480px四方のWebPへ変換。原本と固定画像番号の対応は [画像番号対応表](cast-image-map.md)。再生成時は支給原本を `--source` で指定したフォルダの `キャスト画像_オリジナル/` にそろえる。阿部寿世さんの原本名はDrive上では拡張子がなく、ダウンロードZIP内では `.jpg` が付く。

## 2026-11-25 顔アップ採用・西尾桃子さんの公式ビジュアル

- クライアントがサンプルの顔アップを承認。全36名の丸枠に本衣装の公式ビジュアルを掲載。
- 西尾桃子さん（固定34番）は「解禁OK」の確認済み原本『《確認済》西尾様.jpeg』から480px四方のWebPを作成。
- 衣装ビジュアル版のフライヤーは支給待ち。


## 2026-11-25 アフターイベント画像

Drive「パラドキシカル原本ファイル」の [kawaii-re-event.jpg](https://drive.google.com/file/d/1boLoxTy9mzqhJRt-zxi4dnYeHLC5KpbQ/view)（875×1227px、283149 bytes）を `assets/after-event.jpg` に原寸・無加工で掲載。公演日程・チケットの直後に配置し、メニューと購入注意事項から誘導。既存の拡大ビューアを共用。12/16夜・12/20夜は開催なしと画像どおり案内。確認用GitHub Pagesを更新対象とする。
