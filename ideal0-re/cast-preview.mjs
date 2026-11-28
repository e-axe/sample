import { characters, idealRoles, sessions } from './show-data.mjs';

const allSessions = sessions.map(({ id }) => id);
const alternatingSessions = [
  allSessions.filter((_, index) => index % 2 === 0),
  allSessions.filter((_, index) => index % 2 === 1),
];
const staggeredSessions = [
  allSessions.filter((_, index) => index % 3 === 0),
  allSessions.filter((_, index) => index % 3 === 1),
  allSessions.filter((_, index) => index % 3 === 2),
];
const tripleRoles = new Set(['霧谷あさひ', '小暮愛']);
const pad = (number) => String(number).padStart(2, '0');
let readingNumber = 0;
let portraitIndex = 0;
const nextPortrait = () => `cast-preview-${pad(portraitIndex++ % 16 + 1)}.webp`;

// 城崎華恋／プレミアム・プリンセスは初演の資料で確認済み。
// 全体は配役確認用の仮配置。正式データは show-data.mjs に登録する。
export const castPreview = characters.map((role, index) => {
  const appearances = index === 0 ? [allSessions]
    : tripleRoles.has(role.name) ? staggeredSessions : alternatingSessions;
  const reading = appearances.map((ids) => {
    const number = pad(++readingNumber);
    return {
      id: `reading-preview-${number}`,
      name: `仮キャスト ${number}`,
      image: nextPortrait(),
      sessions: ids,
    };
  });
  return {
    ...role,
    reading,
    actorRole: {
      name: idealRoles[index] ?? '役名確認中',
      performer: `仮アクター ${pad(index + 1)}`,
      image: nextPortrait(),
    },
  };
});
