# サイト用背景

方式：組み込み Image Gen / 採用モックを参照した舞台イラスト生成。公式ロゴとキャストには未使用。

採用背景：`sample/kawaii-re/assets/stage.webp`。元画像はCodex生成画像から配信用に軽量化。

## 最終プロンプト

Use case: stylized-concept. Create ONE standalone website background artwork, landscape 1536x1024. Reference image is the APPROVED website mock: reproduce very faithfully ONLY its right-hand hero theatrical world, not its webpage. A luminous pastel pink and cyan jeweled theatre stage, ascending central glowing pink stairs with tiny hearts, gilded heart balustrade, hanging small crystal hearts and stars on golden chains, pink silk swags, ornate rose-gold birdcage on the RIGHT edge, large crystalline pastel peonies and faceted gems in right foreground, blue-violet sky and soft white clouds behind. Airy bright polished fantasy illustration matching reference precisely, intricate but elegant, no human performers. Preserve the mock's pale pink/lavender/cyan colors and luminous atmosphere. Full-bleed art to all edges, no white diagonal cutout (CSS will add that). NO text, no letters, no logo, no UI, no website screenshot, no split panel, no borders. This is decorative imaginative artwork for a live x reading theatre production, not a photo of its real stage.

## STORY用の専用画像（2026-11-06 追加修正）

方式：組み込み Image Gen。抽象画像から、マイク・台本がはっきり分かる画像への変更依頼に対応。

採用画像：`assets/story-microphone.webp`（768×1152px）。生成PNGをWebPへ軽量化。ロゴ・キャスト写真・舞台の実写素材は生成していない。スマホは画像中央下寄りを横長に表示する。

最終プロンプト：

Use case: stylized-concept. Asset type: ONE portrait editorial illustration for the STORY section of a Japanese idol live-performance x reading theatre landing page, 1024x1536. Primary request: concrete, recognizable objects, NOT abstract prisms or gradients. An elegant silver handheld vocal microphone resting diagonally beside an open, unlettered theatrical script on a small pearly dressing-room table; a thin pink satin ribbon across the script, a few small pink flowers, and a single clear heart-shaped pendant. Background: a softly focused pink velvet theatre curtain with a subtle cyan stage light from the side. Polished luminous fantasy editorial illustration, delicate rose pink, pearly white, pale lilac and small cyan highlights, tactile detailed microphone grille, paper and satin. Beautiful intimate still life that clearly conveys singing and reading, refined rather than childish; bright but with enough local contrast for objects to read. Composition: full-bleed standalone artwork with the microphone and open script prominent in the central 70%, balanced vertical arrangement; intentional airy margins, camera slightly above table, no people. NO letters, NO text, NO logos, NO UI or web page, NO watermark, NO floating geometric shapes, NO abstract collage, NO giant crystal stairs. This is imaginative website artwork, not an actual production photo. Output only this single artwork.


## STORY・新規画像への差し替え（2026-11-06 最新）

ユーザーから、マイクのような直接的な画像やCSSだけのぼかし案をやめて、新規画像を生成・挿入する指示を受領。以前の斜め表示を維持する。

方式：組み込み画像生成。新規の劇場イメージを1536×1024pxで生成し、1152×768px・品質82のWebPへ配信変換。公開用の最終画像は `assets/story-theatre.webp`（115,404 bytes）。実際の舞台写真ではない。人物・ロゴ・文字は生成していない。画像そのものにぼかしフィルターを重ねず、CSSの斜めクリップで表示する。旧 `story-microphone.webp` は現行配信から削除（Git履歴には残る）。

最終プロンプト：

Use case: stylized-concept. Asset type: one finished background illustration for the middle STORY section of a sophisticated Japanese idol theatre LIVE x Reading website. Generate a NEW standalone LANDSCAPE artwork, 1536x1024, no web UI. Art direction: a beautiful, luminous, dreamy theatrical garden in pearl white, blush pink, soft lilac and touches of electric cyan, matching a fantasy stage with hanging crystal hearts, tiny star pendants and flowers. A fresh composition, NOT a microphone or book still-life: view from the shaded side of a theatre into a glowing dream stage, layers of translucent pink silk and softly silhouetted theatrical wings, delicate rose-gold hanging chains with a FEW faceted heart crystals catching the light, lush pale pink peonies and scattered translucent petals only along the near lower edge, a small luminous staircase receding into mist. Cinematic depth of field: detailed petals and crystals in the foreground, soft distant stage lights, purposeful deep mauve shadows in the wings, airy pearlescent light across the middle. Refined Japanese fantasy illustration, elegant and magical, not a cheap plastic 3D render, not a flat abstract gradient, not an overloaded collage. Beautiful material and light, soft dimensional detail, generous visual breathing room. Composition must remain attractive when clipped into a wide diagonal-sided panel in CSS; central 70 percent is the focal image; edges are expendable. Full bleed image, no literal diagonal stripes baked into it because website CSS will add those. No people, no faces, no performers, no microphones, no script or open books, no product display, no text, no letters, no typography, no logo, no watermark, no borders, no UI. Output just the single artwork.
