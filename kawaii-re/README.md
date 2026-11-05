# KAWAII偶像パラドキシカル 再演 / LP

クライアント確認用見本：[サイトを開く](https://e-axe.github.io/sample/kawaii-re/)

制作の基準：[制作ブリーフ](docs/production-brief.md)、[正式情報・素材台帳](docs/sources.md)。

## 編集・確認

Node.js 22以上。追加パッケージは不要。

```text
node tools/build.mjs
node tools/check.mjs
```

`content.json` の情報と `template.html` を編集し、上記を実行して `index.html` に反映。GitHub Pagesは生成済みHTMLと画像をそのまま配信する。CSSは `styles.css`、動作は `app.js`。

`index.html` を直接編集しない。更新後はPCとスマホで表示と検索導線を確認する。写真は `assets/cast/`。支給原本に手を加えず、配信用ファイルを更新する。

発売前は2026/11/12 22:00 JSTを案内し、発売時刻に販売リンクを有効化。現在の残席・販売終了状態はカンフェティで確認する。本見本には自前の予約・決済機能はない。

未提供素材：吉武千颯さんの宣材写真1点。仮画像と「写真準備中」を明示。他35名は支給写真。

検索インデックスは無効。本番運用する際は、本番URL・OGP・検索方針を確認して変更する。
