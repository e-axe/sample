// 配役確定後は reading と actorRole を登録する。sessions は下記の固定IDで参照する。
export const characters = [
  { name: '城崎華恋', note: 'プリンセスに憧れる大学生' },
  { name: '小園ゆめか' },
  { name: '成田ゆき' },
  { name: '川田希美' },
  { name: '霧谷あさひ' },
  { name: '蒼井沙良' },
  { name: '新川未央' },
  { name: '田上梨乃' },
  { name: '森野真礼' },
  { name: '葛城久代' },
  { name: '佐竹夜酔' },
  { name: '小暮愛' },
  { name: '下坂咲子' },
  { name: '郡花奏' },
  { name: '但馬小夏' },
  { name: '太田梨香子' },
  { name: '吉澤隆司', note: '「アイディール・セミナー」創始者' },
];

export const idealRoles = [
  'プレミアム・プリンセス', 'マジカル・ドリーム', 'オリーブ・ローザ', 'セバス・チュン',
  'パーフェクト・ティーチング', 'プレイブ・ガール', 'パワー・ディレクション', 'スティール・ボディ',
  'てんや鶴姫', 'お京の卵殻', 'ランドリー・スコッチ', 'グロップ・グライダー',
  'ポッピングツアー', 'バーニング・スプーン', 'フレミング・ビバレッジ',
];

// ACTORとENSEMBLEは [名前, 所属, assets内の写真ファイル名]。所属・写真は省略可。
// ENSEMBLEの個別出演回が確定したら、4番目にセッションIDの配列を登録する。
// READINGの写真は各 reading メンバーの image に登録する。
export const actors = [
  ['石原美沙紀', 'おとな小学生'], ['山岸理子'], ['神志那結衣'], ['篠原望'],
  ['石井萌々果'], ['小山内花凜'], ['三田美吹'], ['城崎桃華'], ['古仲可奈'],
  ['村星りじゅ'], ['結城りな'], ['花塚廉太郎', 'おとな小学生'], ['大橋篤'], ['高田舟'], ['加藤光大'],
];

export const ensemble = [
  ['橋爪亮磨'], ['吉岡臣'], ['鈴木南'], ['泉田佑大'], ['桃原華恋'], ['森山真衣'], ['溝渕智都'],
];

export const sessions = [
  { id: 'session-01', date: '2027-01-27', time: '18:30' },
  { id: 'session-02', date: '2027-01-28', time: '18:30' },
  { id: 'session-03', date: '2027-01-29', time: '13:30' },
  { id: 'session-04', date: '2027-01-29', time: '18:30' },
  { id: 'session-05', date: '2027-01-30', time: '13:30' },
  { id: 'session-06', date: '2027-01-30', time: '18:30' },
  { id: 'session-07', date: '2027-01-31', time: '12:00' },
  { id: 'session-08', date: '2027-01-31', time: '16:30' },
];

export const sales = { status: 'pending', url: 'https://www.confetti-web.com/@/otonapro-74' };

const photo = '非売品キャスト別2L版ブロマイド1枚。公演回ごとに絵柄が異なり、各キャストの出演回数分をご用意します。';
const ensemblePhoto = 'ENSEMBLEを応援キャストに選んだ場合は、選択キャストのシングルショットチェキ（全8種）となります。';

export const fares = [
  { name: 'A席', price: 8800, highlights: ['指定席'], details: ['全席指定。'] },
  { name: '特典付A席', price: 9800, highlights: ['2L版ブロマイド1枚'], details: [
    photo, 'ブロマイドの種類はS席特典と同じです。', ensemblePhoto,
  ] },
  { name: 'S席', price: 12500, highlights: ['前方列保証', '特別ライセンスPASS', '2L版ブロマイド1枚'], details: [
    '前方列保証。', '「アイディール・セミナー」特別ライセンスPASS。', photo, ensemblePhoto,
  ] },
  { name: 'VIP', price: 37777, fullName: 'スペシャルセッションアイディールプラクティックVIPシート', highlights: ['最前中央席・各回8席限定', '開演前舞台ツアー・集合写真撮影'], details: [
    '最前中央席。各公演8席限定。',
    '「アイディール・セミナー」特別ライセンスPASS。',
    photo + ' ブロマイドの種類はS席特典と同じです。',
    '公演パンフレット。',
    '開演前舞台ツアー。',
    '美容整体VIENESSギフトカード。',
  ] },
];
