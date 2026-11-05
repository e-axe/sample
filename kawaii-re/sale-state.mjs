// endsAt is the start of the day after the final performance, in Japan time.
export function getSaleState(now, saleAt, endsAt) {
  if (now >= Date.parse(endsAt)) return 'ended';
  return now >= Date.parse(saleAt) ? 'open' : 'upcoming';
}
