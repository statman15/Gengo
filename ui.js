export const $ = (s, el = document) => el.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// One bottom sheet, reused by every screen.
export function sheet(html) {
  const d = $('#sheet');
  $('#sheetBody').innerHTML = html;
  $('#sheetBody').onclick = $('#sheetBody').onchange = null; // drop the last sheet's handlers
  if (!d.open) d.showModal();
  d.scrollTop = 0;
  return $('#sheetBody');
}
