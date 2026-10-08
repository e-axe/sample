# 朗読劇『硝子の星の子どもたち』｜納品・公開手順

## 公開先
- 本番URL：`https://garasunohoshi.otonapro.com/`
- GitHub確認用：`https://e-axe.github.io/sample/glass-star-children/`（`noindex,nofollow`を維持）
- 正本：`e-axe/sample` リポジトリの `glass-star-children/`

## 現状
- 採用済み横長画像 `image/glass-star-ogp.jpg`（1200×630px）をOGP画像に指定済み（本番URLからの絶対URL）
- canonical、OGP、X向けカード、全8回のEvent構造化データを設定済み
- **キャスト32名の本番写真を反映済み**。支給画像01〜32を掲載順に対応させ、仮画像注記を削除済み
- 確認用 `index.html` の robots は **noindex,nofollow**。公開準備前に解除しない

## 本番用ZIPの作り方（写真差し替え後）
1. `image/glass-star-cast-01.jpg` ～ `glass-star-cast-32.jpg` を各出演者に対応させて配置。
2. `index.html` の出演者別 `photo` を実ファイルに切り替え、PC・スマホで全員の写真を確認する。
3. Python 3.9以上で `python tools/prepare_release.py` （Windowsは `py tools/prepare_release.py` でも可）。
4. `glass-star-children-release.zip` ができる。キャスト未反映の場合は**失敗して公開用ファイルを作らない**。
5. ZIP内の `index.html` / `image/` / `fonts/` / `robots.txt` / `sitemap.xml` を**本番ドメインのドキュメントルート直下**へ配置する。

## プレビューと本番の違い
| | GitHub確認用 | 本番用ZIP |
|---|---|---|
| robotsメタ | `noindex,nofollow` | `index,follow,max-image-preview:large` |
| キャスト案内 | 出演回を確認する案内を表示 | 削除 |
| canonical | 本番ドメイン | 本番ドメイン |
| OGP画像 | 本番ドメインの横長OGP画像 | 本番ドメインの横長OGP画像 |
| robots.txt / sitemap.xml | 生成しない | 生成する |

**注意：** GitHubの確認用 `index.html` をそのまま本番へ設置すると `noindex` が残り、検索結果に掲載されません。必ず本番用ZIPを使用してください。

## サーバー設置後のチェック
- `https://garasunohoshi.otonapro.com/` がHTTPSで正常表示される（証明書・リダイレクトも確認）。
- `index.html` のrobotsメタが `index,follow,max-image-preview:large` になり、サーバーの `X-Robots-Tag: noindex`、robots.txtのDisallow、Basic認証などでブロックされない。
- `https://garasunohoshi.otonapro.com/robots.txt` と `/sitemap.xml` が200で取得できる。
- `https://garasunohoshi.otonapro.com/image/glass-star-ogp.jpg` が一般公開され、SNSクローラーから取得できる。OGP画像は1200×630px。Xカードは `summary_large_image`。
- 全8公演、出演者ごとの表示、チケット導線、公式リンク、フライヤーの拡大、スマホメニューが正常動作する。
- サーバーへのアップロード後にGoogle Search Consoleで所有権確認、サイトマップ登録、URL検査を実施。登録・掲載には時間がかかり、検索順位は保証されない。

## 設置技術
HTML・CSS・JavaScriptの静的構成であり、Node.jsやReactのビルド工程は不要。別途、サーバーのHTTPSと静的ファイル公開設定が必要。
