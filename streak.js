const p = n => String(n).padStart(2, '0');
export const dayKey = d => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
export const counts = day => !!day && (day.reviews >= 10 || (!!day.cleared && day.reviews >= 1));
const back = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
const monday = d => back(d, (d.getDay() + 6) % 7);

export function streak(days, today) {
  const first = Object.keys(days).filter(k => counts(days[k])).sort()[0];
  if (!first) return 0;
  let n = 0, restWeek = null;
  for (let i = 0; dayKey(back(today, i)) >= first; i++) {
    const d = back(today, i), k = dayKey(d);
    if (counts(days[k])) { n++; continue; }
    if (i === 0) continue; // today not done yet: neither adds nor breaks
    const w = dayKey(monday(d));
    if (restWeek === w) break; // second miss in this week
    restWeek = w;
  }
  return n;
}

export const weekReviews = (days, today) => {
  let n = 0;
  for (let d = monday(today); dayKey(d) <= dayKey(today); d = back(d, -1)) n += days[dayKey(d)]?.reviews || 0;
  return n;
};
