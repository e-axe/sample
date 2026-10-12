# タレント写真の追加方法

現在の4名は各1枚です。プロフィールの写真を押すとページ内で拡大し、閉じると元の位置・操作箇所へ戻ります。1枚の場合、前後ボタン・枚数表示は出しません。

写真が2枚以上ある場合は前後ボタン、枚数表示、左右キー、左右スワイプが有効になります。閉じるボタン、Escキー、背景部分で閉じられます。JavaScriptや標準dialog機能が使えない場合は、写真リンクとして動作します。

## 写真を追加する

1. 許諾済みの追加写真を `assets/images/talents/` に配置します。元の写真は保持し、拡大用には十分な大きさの画像を使ってください。画像を引き伸ばして解像度を増やさないでください。
2. 該当プロフィールの `main[data-photo-gallery]` 内に、次の構造で追加写真を置きます。メイン写真が1枚目、以降はHTML内の順番で表示されます。
3. `href` を拡大用写真、`src` を一覧表示用写真にします。`alt`、キャプション、`width`、`height`を実際の写真に合わせます。WebPを使う場合は既存のメイン写真同様に `picture` とJPEG代替を組み合わせられます。

```html
<section class="section ruled-section" aria-labelledby="photos-title">
  <div class="container">
    <h2 class="section-title" id="photos-title">Photos</h2>
    <div class="talent-gallery">
      <a class="portrait-trigger" href="../../assets/images/talents/実際の追加画像.jpg"
         data-gallery-item data-gallery-caption="氏名の宣材写真 2"
         aria-label="氏名の宣材写真 2を拡大する">
        <img src="../../assets/images/talents/実際の追加画像.jpg"
             alt="氏名の宣材写真 2" width="実際の幅" height="実際の高さ"
             loading="lazy" decoding="async">
      </a>
    </div>
  </div>
</section>
```

切り替え操作や枚数の設定を手作業で増やす必要はありません。別人の写真を同じプロフィールに置かないよう、追加時は対応するタレントと写真の公開許諾を確認してください。HTMLの初回読み込み時に写真一覧を取得するため、追加したらページを再読み込みして確認します。

## 確認

`npm test` と `npm run test:gallery` を実行し、ブラウザーで写真の切り替え・閉じる・元の位置への復帰を確認します。現物がない複数写真はテスト用データで動作確認し、公開ページには現在の1枚のみを掲載しています。
