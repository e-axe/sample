# 素材対応表

確認日：2026-10-10。受領時の氏名付きファイルと既存固定IDを照合。固定IDと掲載順は別管理。

| ID | 正式表示名 | 受領元ファイル | 元寸法 | WebP配信幅 | 焦点 |
| --- | --- | --- | --- | --- | --- |
| cast-01 | 櫻井圭登 | yellow-is-dead-cast-01.jpg | 1600×2000 | 320/640/960px | 50% 50% |
| cast-02 | 春斗 | yellow-is-dead-cast-02.jpg | 380×475 | 320/380px | 50% 50% |
| cast-03 | 中島礼貴 | yellow-is-dead-cast-03.jpg | 1600×2000 | 320/640/960px | 50% 50% |
| cast-04 | きたつとむ | yellow-is-dead-cast-04.jpg | 474×593 | 320/474px | 50% 50% |
| cast-05 | 岡本和樹 | yellow-is-dead-cast-05.jpg | 640×800 | 320/640px | 50% 50% |
| cast-06 | 依光希空 | yellow-is-dead-cast-06.jpg | 397×496 | 320/397px | 50% 50% |
| cast-07 | 城崎桃華 | yellow-is-dead-cast-07.jpg | 1302×1628 | 320/640/960px | 50% 50% |
| cast-08 | 澤田奏音 | yellow-is-dead-cast-08.jpg | 768×960 | 320/640/768px | 50% 50% |
| cast-09 | 倉橋伶奈 | yellow-is-dead-cast-09.jpg | 1600×2000 | 320/640/960px | 50% 50% |
| cast-10 | 高田舟 | yellow-is-dead-cast-10.jpg | 1000×1250 | 320/640/960px | 50% 50% |
| cast-11 | 加藤光大 | yellow-is-dead-cast-11.jpg | 602×752 | 320/602px | 50% 50% |
| cast-12 | 樹くるみ | yellow-is-dead-cast-12.jpg | 1600×2000 | 320/640/960px | 50% 50% |
| cast-13 | 大橋篤 | yellow-is-dead-cast-13.jpg | 419×524 | 320/419px | 50% 50% |
| cast-14 | 神志那結衣 | yellow-is-dead-cast-14.jpg | 749×936 | 320/640/749px | 50% 50% |
| cast-15 | 間島和奏 | yellow-is-dead-cast-15.jpg | 978×1223 | 320/640/960px | 50% 50% |
| cast-16 | 内龍星 | yellow-is-dead-cast-16.jpg | 1508×1885 | 320/640/960px | 50% 50% |
| cast-17 | 七瀬つむぎ | yellow-is-dead-cast-17.jpg | 1600×2000 | 320/640/960px | 50% 50% |
| cast-18 | 熊沢世莉奈 | yellow-is-dead-cast-18.jpg | 1402×1752 | 320/640/960px | 50% 50% |

提供元：ユーザーのキャスト画像フォルダー。2026-10-10にLP掲載・軽量化を明示依頼。元写真はそのフォルダーで保持し、GitHubとZIPにはWeb配信用派生画像だけを格納。全体構図を維持し、生成補完・拡大・トリミングはしない。写真枠は4:5、丸め誤差のみobject-fit:coverで吸収。隣接する氏名との二重読上げを避けてaltは空。

ファイル名は `yellow-is-dead-cast-ID-幅.webp`、JPEG代替も同じ規則。元画像SHA-256、寸法、容量、全配信ファイルは `cast-assets-20261010.json` に記録。WebP品質90、EXIF方向適用、RGB/sRGB、位置情報等のメタデータ除去。幅320/640/960pxを上限として元幅以下だけ出力。標準幅はmin(640,元幅)。

手元の同期資料は2026-10-01版、GitHub既存公開データの正本反映記録は2026-10-10版。今回は画像のみ反映し、既存氏名・掲載順・グループ・出演回・販売情報等の一致を変更前JSONとの比較で確認。公演情報の全面再照合は未実施。

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
