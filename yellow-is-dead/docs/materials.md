# 素材対応表

確認日：2026-10-09。正式公演情報の掲載順と固定IDを照合済み。

| ID | 正式氏名 | 元写真 | 配信ファイル（受領予定名） | 焦点 |
| --- | --- | --- | --- | --- |
| cast-01 | 櫻井圭登 | 未受領 | yellow-is-dead-cast-01.jpg | 受領後確認 |
| cast-02 | 春斗 | 未受領 | yellow-is-dead-cast-02.jpg | 受領後確認 |
| cast-03 | 中島礼貴 | 未受領 | yellow-is-dead-cast-03.jpg | 受領後確認 |
| cast-04 | きたつとむ | 未受領 | yellow-is-dead-cast-04.jpg | 受領後確認 |
| cast-05 | 岡本和樹 | 未受領 | yellow-is-dead-cast-05.jpg | 受領後確認 |
| cast-06 | 依光希空 | 未受領 | yellow-is-dead-cast-06.jpg | 受領後確認 |
| cast-07 | 城崎桃華 | 未受領 | yellow-is-dead-cast-07.jpg | 受領後確認 |
| cast-08 | 澤田奏音 | 未受領 | yellow-is-dead-cast-08.jpg | 受領後確認 |
| cast-09 | 倉橋伶奈 | 未受領 | yellow-is-dead-cast-09.jpg | 受領後確認 |
| cast-10 | 高田舟 | 未受領 | yellow-is-dead-cast-10.jpg | 受領後確認 |
| cast-11 | 加藤光大 | 未受領 | yellow-is-dead-cast-11.jpg | 受領後確認 |
| cast-12 | 樹くるみ | 未受領 | yellow-is-dead-cast-12.jpg | 受領後確認 |
| cast-13 | 大橋篤 | 未受領 | yellow-is-dead-cast-13.jpg | 受領後確認 |

| cast-14 | 神志那結衣 | 未受領 | yellow-is-dead-cast-14.jpg | 受領後確認 |
| cast-15 | 間島和奏 | 未受領 | yellow-is-dead-cast-15.jpg | 受領後確認 |
| cast-16 | 内龍星 | 未受領 | yellow-is-dead-cast-16.jpg | 受領後確認 |
| cast-17 | 七瀬つむぎ | 未受領 | yellow-is-dead-cast-17.jpg | 受領後確認 |
| cast-18 | 熊沢世莉奈 | 未受領 | yellow-is-dead-cast-18.jpg | 受領後確認 |

固定IDは初版から維持。掲載順はperformance.jsonのCASTグループで管理し、上表のID順と分離。cast-09は正字訂正のみで同じ人物への対応を維持。

## 採用素材

- 公式ロゴ：yellow-is-dead_logo_B.png（Drive ID 1jnQKnVyIfqTzZnSQP84rzIMc4NrfYr4l、2026-09-28版）。形・配色・比率を保持して640/800/1200px幅の透過WebPへ縮小（可逆圧縮）。
- HERO背景：公式フライヤーyellow-is-dead_omoteA4.jpg（2026-10-05版）とクリーン設定画を参照。文字なしLP用の生成画像。生成条件はimage-generation.md。
- STORY床：yellow-is-dead_SNS_4.jpg（Drive ID 1SdDswSMdZMCJShZjzUFDaKE297kiFxB6、2026-10-01版）。床の血痕を残す切り出し＋WebP化。装飾用途、空alt。
- HERO alt：白い洗濯機の中に残された、血の付いたイエローのマスク。非公開プロットの情報は含めない。
- CASTは提供写真のみ受領後掲載。隣接氏名を読上げるため、写真のaltは空、焦点位置は人物ごとに確認。

## フォント

- Noto Sans JP：Google Fonts公式リポジトリ ofl/notosansjp/NotoSansJP[wght].ttf。必要字形をサブセット化、内部名YID Gothic。
- Anton：Google Fonts公式リポジトリ ofl/anton/Anton-Regular.ttf。ASCIIをサブセット化、内部名YID Condensed。
- ライセンスはfonts内のOFL.txt。正字と400/800のウェイトを確認。新規文言の字形追加時は再出力して検証する。

## 2026-10-10 追加フライヤー

| 元ファイル | 用途 | 配信ファイル | 処理 |
| --- | --- | --- | --- |
| yellow-is-dead_omoteA4.jpg（2894×4093px、7,707,905 bytes） | FLYER表面 | yellow-is-dead-flyer-front-480/960/1600.webp | sRGB変換、比率維持の縮小、WebP可逆圧縮 |
| yellow-is-dead_uraA4.jpg（3386×4750px、10,518,649 bytes） | FLYER裏面 | yellow-is-dead-flyer-back-480/960/1600.webp | 比率維持の縮小、WebP可逆圧縮 |

2026-10-10にユーザーがプロジェクトへ提供した正式素材を使用。絵柄・文字・全体を保持し、切り出し・描き直しなし。画像の微小な比率差は元画像に由来するため、高さを固定して揃えずそのまま表示。表裏のaltは公演名・公式フライヤー・面を説明。印刷用原画像は配信物に含めない。詳細な寸法・容量・縮小後画素一致は flyer-assets-20261010.json に記録。
