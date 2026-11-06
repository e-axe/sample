# KAWAII偶像パラドキシカル 再演 / LP

クライアント確認用見本：[サイトを開く](https://e-axe.github.io/sample/kawaii-re/)

制作の基準：[制作ブリーフ](docs/production-brief.md)、[正式情報・素材台帳](docs/sources.md)、[最新の修正・検証記録](docs/revision-20261106.md)。

新しいチャットへの引き継ぎ：[指示文](docs/new-chat-prompt.md)。
差し替え時の参照：[キャストと画像番号の対応表](docs/cast-image-map.md)。

## 編集・確認

Node.js 22以上。追加パッケージは不要。

```text
node tools/build.mjs
node tools/check.mjs
```

`content.json` の情報と `template.html` を編集し、上記を実行して `index.html` に反映。GitHub Pagesは生成済みHTMLと画像をそのまま配信する。CSSは `styles.css`、動作は `app.js`。

`index.html` を直接編集しない。更新後はPCとスマホで表示と検索導線を確認する。写真は `assets/cast/kawaii-re-cast-01.webp` 形式の固定番号。支給原本に手を加えず、配信用ファイルを更新する。`content.json` の `imageNumber` は表示順を変更しても維持する。

画像を原本から再生成する場合のみSharpを使用する。`node tools/prepare-cast.mjs --source <素材フォルダ>` を実行。Sharpを別の既存ライブラリ群から使う環境は `--module-root <node_modulesの絶対パス>` を指定できる。通常のビルド・閲覧には画像処理ライブラリは不要。

発売前は2026/11/12 22:00 JSTを案内し、発売時刻に販売リンクを有効化。販売期間は残席を断定せずカンフェティでの確認を案内。最終公演日の翌日2026/12/21 00:00 JSTから公演終了表示。本見本には自前の予約・決済機能はない。

文字の大きさ・基本の太さは `type-tokens.css` で調整する。キャストとあらすじは常時表示。キャストの行・まとまりは `content.json` の `billingGroups` で保持する。画像の固定番号は表示順と独立。STORYは新規生成した劇場イメージを斜めに表示、劇場・FAQ下部は従来の舞台画像。地図は遅延埋め込み、公式X・ブログへのリンクも掲載している。

未提供素材：吉武千颯さんの宣材写真1点。仮画像と「写真準備中」を明示。他35名は支給写真。

検索インデックスは無効。本番運用する際は、本番URL・OGP・検索方針を確認して変更する。

最新のUI/UX修正・確認範囲：[ux-review-20261106.md](docs/ux-review-20261106.md)。ヘッダー追従、キャストの同ブロック内横並び、条件の個別解除、公式制作ロゴを反映。

## 日本語Webフォント

スマホでも明朝・ゴシックを表示するため、`assets/fonts/` の必要文字だけを含むWOFF2を自サイトから配信。SIL OFL 1.1ライセンスを同梱。閲覧時にGoogle Fontsへ接続しない。

本文や動的文言が変わった場合は、HTML生成後にビルド環境へ `fonttools[woff]` を用意し、`python tools/prepare-fonts.py --cache <原本キャッシュフォルダ>`、続けて `node tools/check.mjs` を実行する。原本は公式Google Fontsリポジトリから取得し、文字のサブセット化はローカルで実施する。通常の閲覧にはPythonやライブラリは不要。

ヘッダー左は控えめな作品公式ロゴと、作品タイトル＋「再演」の2行テキスト。ロゴ幅はPC110px・タブレット100px・スマホ64px。以前の制作名表示に戻す場合は、`template.html` の `data-brand-style="logo"` を `text` にしてビルドする。フッターは変更前のメイホリックのロゴ＋著作権表示。

STORY画像は文章の背景へ統合。PCは右側の画像を見せ、左側にフェード・ぼかし・白いベールを重ねて可読性を確保する。スマホでは下寄せの背景として使用。原本の生成画像を変更せず、CSSで配置する。
