// 公開リポジトリ用の表示例。未解禁の公演データや宣材はここに入れない。
export const venue = 'サンプル劇場';
export const sales = { status: 'pending' };

export const sessions = [
  { id: 'session-01', date: '2027-02-24', time: '19:00' },
  { id: 'session-02', date: '2027-02-25', time: '19:00' },
  { id: 'session-03', date: '2027-02-26', time: '14:00' },
  { id: 'session-04', date: '2027-02-26', time: '19:00' },
  { id: 'session-05', date: '2027-02-27', time: '13:00' },
  { id: 'session-06', date: '2027-02-27', time: '18:00' },
  { id: 'session-07', date: '2027-02-28', time: '12:30' },
  { id: 'session-08', date: '2027-02-28', time: '16:30' },
];

export const characters = [
  { name: '城崎華恋', note: '理想の自分を求める大学生', image: 'karen.webp', actor: 'ACTOR A', reading: [
    { id: 'reading-a', name: '出演者 A', sessions: ['session-01', 'session-04', 'session-07'] },
    { id: 'reading-b', name: '出演者 B', sessions: ['session-02', 'session-05', 'session-08'] },
    { id: 'reading-c', name: '出演者 C', sessions: ['session-03', 'session-06'] },
  ] },
  { name: '登場人物 B', note: 'ダブルキャストの表示例', image: 'cast-sample.webp', actor: 'ACTOR B', reading: [
    { id: 'reading-d', name: '出演者 D', sessions: ['session-01', 'session-03', 'session-05', 'session-07'] },
    { id: 'reading-e', name: '出演者 E', sessions: ['session-02', 'session-04', 'session-06', 'session-08'] },
  ] },
  { name: '登場人物 C', note: 'シングルキャストの表示例', actor: 'ACTOR C', reading: [
    { id: 'reading-f', name: '出演者 F', sessions: sessions.map(({ id }) => id) },
  ] },
];

export const ensemble = [
  '出演者 G', '出演者 H', '出演者 I', '出演者 J',
  '出演者 K', '出演者 L', '出演者 M', '出演者 N',
];

export const fares = [
  { name: 'A席', price: 8900, highlight: '全席指定', details: [
    '座席指定の基本券種です。',
  ] },
  { name: '特典付A席', price: 9900, highlight: '選べるキャスト特典', details: [
    '応援キャストの2L版ブロマイド1枚。絵柄は公演回によって異なります。',
    'アンサンブルを選択した場合は、選択キャストのシングルショットチェキが付きます。',
  ] },
  { name: 'S席', price: 12900, highlight: '前方席＋キャスト特典', details: [
    '前方列の座席を保証。',
    '特別ライセンスPASSと、応援キャストの2L版ブロマイド1枚。絵柄は公演回によって異なります。',
    'アンサンブルを選択した場合は、選択キャストのシングルショットチェキが付きます。',
  ] },
  { name: 'VIP', price: 36000, highlight: '最前中央席＋開演前舞台ツアー', details: [
    '最前中央席。席数に限りがあります。',
    '特別ライセンスPASS、2L版ブロマイド1枚、公演パンフレット。',
    '購入した公演回の開演前舞台ツアーに参加できます。',
  ] },
];
