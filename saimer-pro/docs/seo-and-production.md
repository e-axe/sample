# SEO・AIO・OGPと本番移行

2026-10-12のユーザー確定事項：読みは「セメプロダクション」、正式URLは **https://saimer-pro.com/**（wwwなし）。掲載メールはcontact@saimer-pro.comで、開設準備中の状態を維持する。

## 実装内容

- 読みをトップ見出し・事務所紹介・会社概要・所属表記・全ページのフッターに表示。
- 全9ページに固有のtitle・description、canonical、OGP、X向け大きな画像カードを静的HTMLで出力。重要な内容はJavaScriptなしでも読める。
- Organization・WebSite・ページ種別・BreadcrumbListをJSON-LDで出力。所属一覧はItemList、プロフィールはProfilePage・Personで名前、かな、英字表記、掲載済みの基本情報、写真、所属、本人SNSを明示。
- 事務所の未公開SNS・未確認の肩書き・架空の実績は追加しない。開設準備中のメールを有効な構造化連絡先として登録しない。
- OGPは青空と青い文字の1200×630 JPEG。画像URL、MIME、幅、高さ、代替説明を設定。各ページのタイトルと説明もOGPへ同期する。
- メタタグと構造化データは共通生成処理を使い、環境間のURL・設定の食い違いを防ぐ。人物情報は掲載済みHTMLから取得し、写真の追加も反映する。

## 確認用と本番用

| 項目 | GitHub確認用 | 本番用の生成データ |
| --- | --- | --- |
| 検索設定 | 全9ページにnoindex, nofollow | 全9ページにindex, follow, max-image-preview:large |
| 正規URL・OGP・JSON-LD | GitHubの確認用URL | https://saimer-pro.com/ |
| sitemap.xml | URLを列挙しない | 正規URL9件とプロフィール画像 |
| robots.txt | サブフォルダの参考ファイル。検索除外はHTMLのmetaで行う | ドメイン直下で検索クロールを許可。OAI-SearchBotも許可 |
| SAMPLE表示 | 維持 | 削除 |
| 配布内容 | 編集用ソース・検証資料を含む | HTMLと参照される資産、robots・sitemap・.htaccessのみ |

## 再生成と検証

作業フォルダで依存関係を導入後に実行する。

```text
npm ci
npm run seo:preview
npm test
npm run test:gallery
npm run test:seo
npm run build:production
```

本番用の出力先は `dist/production/`。既存のファイルがある場合は上書きせず停止する。別の空の出力先を指定する場合：

```text
node tools/build-production.cjs --out 出力先の空フォルダ
```

正式なドメインを変更する場合は `site.config.json` のproductionBaseUrlを更新し、再生成・検証する。HTTPSの独自ドメインのルートだけを本番URLとして受け付ける。確認用のソースをそのまま本番へコピーせず、生成したデータを使う。

## 本番設置時の作業

1. 正式ドメインのDNSとサーバーの設置先を確認し、apex（saimer-pro.com）とwww両方のSSLを有効にする。
2. 本番用データを正式ドメインの公開ルートへ置く。ソースのdocs・tools・node_modules、未使用サンプル人物画像、写真原本を置かない。
3. 付属.htaccessはApache用。HTTPからHTTPS、wwwからwwwなし、index.htmlからディレクトリURLへ301で統一する。既存設定がある場合はその内容を確認して統合し、上書きしない。実サーバーでのApache動作はまだ未検証。
4. 9ページ・OGP画像・robots.txt・sitemap.xmlがHTTP 200で返ること、HTTPSの正規URLへ301で1回で統一されることを確認する。CDNやサーバーのX-Robots-Tagにnoindexが残っていないこと、GooglebotやOAI-SearchBotが認証画面や403に阻まれないことも確認する。
5. メールボックス開設・送受信を確認し、README記載の手順でメール起動を有効化する。今回の生成では自動で有効化しない。
6. Google Search Consoleで正式ドメインを所有権確認し、サイトマップを送信する。URL検査とリッチリザルトテストで公開ページを確認する。SNS側の共有キャッシュ更新も確認する。
7. 公開後は指名検索「S'aimerプロダクション」「セメプロダクション」と各タレント名の表示・検索流入・問い合わせを確認する。

本番サーバーの設定、DNS、Search Consoleへの登録、SNSサービスによる実際の共有表示は、本番設置後の確認作業として残る。今回のメタタグ検証はHTML・画像・構造化データの自動確認であり、検索結果やAI回答への掲載の保証ではない。

## AIOの方針と参照した公式資料

事務所と所属者の関係、名前の読み、会社情報、出演依頼の導線を、実際に見えるテキストと一致した構造化データで示す。独自のAI専用ファイルや未確認のFAQを増やさず、クロール可能な静的HTML・正規URL・画像・内部リンクを整える。

- [Google：AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) — GoogleのAI検索では基本的なSEOが土台。特別なAI用ファイルや専用スキーマは必要とされていない。
- [Google：Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) — 組織名、別名、所在地などの識別情報。
- [Google：Site names](https://developers.google.com/search/docs/appearance/site-names) — WebSiteのname・alternateName。本番はドメインのルートで使用。
- [OpenAI：Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots) — ChatGPT検索用のOAI-SearchBotと学習用GPTBotは別の設定。付属設定は検索へのアクセスを妨げず、既存の学習用ポリシーを別途変更するものではない。
- [Open Graph protocol](https://ogp.me/) — 画像URL、画像の構造化属性、タイトル、説明、URL。
