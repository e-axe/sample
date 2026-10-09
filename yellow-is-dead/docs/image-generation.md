# LP用背景の生成記録

2026-10-09。内蔵 imagegen を使用。公式フライヤーとクリーン設定画を参照し、文字なしの白い洗濯機背景を生成。原生成画像1536×1024px。造形と構図を目視確認して配信用WebPへ変換。

採用ファイル：`assets/yellow-is-dead-hero-1536.webp` / `yellow-is-dead-hero-1920.webp` / `yellow-is-dead-hero-mobile-640.webp` / `yellow-is-dead-hero-mobile-800.webp`。スマホ版は右側の洗濯機を切り出したもの。原生成画像は配信物に含めない。

## 最終プロンプト

Use case: precise-object-edit / compositing. Asset type: photorealistic theater landing-page HERO background, landscape 1536x1024. Input 1 is the official flyer showing the exact approved bloodstained yellow helmet inside a round washing machine, input 2 is the clean helmet geometry reference. Create a standalone photograph, no webpage or UI. Remove ALL typography, titles, dates, signage and ALL caution tape from the flyer. Preserve the actual helmet identity, yellow color, two small triangular black vents near upper sides, pointed silver-bordered amber vertical forehead ornament, curved wide black visor edged in silver, silver trapezoid mouth/chin, rounded oval dome, existing blood and scuff details, convincing proportions. Retain the photoreal metallic washer round opening with blood drops. New wide composition: round washer door and helmet fully visible and large occupying RIGHT 52% of landscape, centered around x=77% y=48%, washer diameter about 76% image height. LEFT 45% is empty softly weathered WHITE tile wall, very low texture contrast suitable for separate logo and HTML text. Camera frontal slight natural perspective, cool daylight, white ceramic tiles with fine gray grout, subtle wet WHITE tile floor at bottom with small blood spatters mainly under washer. Palette neutral white/gray, vivid yellow helmet and dark red blood. No people, no face, no arms, no additional objects. No text, no logo, no tape, no captions, no frames. Make a coherent high quality photograph suitable for wide desktop image and crop of right washer for mobile. The reference helmet design is mandatory, do not reinvent the visor, ornament, mouth or add spikes.

## 2026-10-09 公式情報更新時の配信調整

新規CAST・販売案内の字形追加に伴う初期フォント増量を補うため、スマホHEROを同じ原生成画像の右側（540,0〜1536,1024）から再出力。構図と800×822 / 640×658pxを維持し、WebP quality 60 / method 6に調整。800px版83,682 bytes、640px版57,430 bytes。旧版と比較し、マスクの輪郭・装飾・血痕を目視確認。PC画像は初版のまま。

## 2026-10-09 UIレビュー後の採用確認

途中で生成したコインランドリー全景案はユーザーの指示により不採用。本記録の既存採用ファイル4点へ復帰し、直前の公開版とバイト単位で一致することをGit blob SHAで確認。PC/スマホの配置も復帰。新規案は公開リポジトリ・納品ZIPに含めない。スマホHEROのsrcsetに一致するレスポンシブpreloadを追加し、初期表示を優先する。
