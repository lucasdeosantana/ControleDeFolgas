
export const ESCALAS_TRABALHO = {
  ALT_A: "2x2x3x2x2x3_A",
  ALT_B: "2x2x3x2x2x3_B",
  DOM_QUI: "DOM-QUI"
};

export const ALT_A_WORK_IDX = new Set([0,1, 4,5,6, 9,10]);
export const ALT_B_WORK_IDX = new Set([2,3, 7,8, 11,12,13]);

export const clampMid = (d)=>{ const x=new Date(d); x.setHours(0,0,0,0); return x; };
export const fmtISO = (d) => d.toISOString().slice(0,10);
export const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
export const rangesOverlap=(aStart,aEnd,bStart,bEnd) => (aStart<=bEnd)&&(bStart<=aEnd);
export const WEEK_START = 1; // Monday

export function getWeeksOfYear(year){
  const jan1=clampMid(new Date(year,0,1));
  const dec31=clampMid(new Date(year,11,31));
  let firstMonday=clampMid(jan1);
  const day=firstMonday.getDay();
  const delta=(day===0)?1:(day>WEEK_START?(7-(day-WEEK_START)):(WEEK_START-day));
  firstMonday=addDays(firstMonday,delta);
  const weeks=[]; let start=firstMonday;
  while(start<=dec31){ const end=addDays(start,6); weeks.push({start:fmtISO(start), end:fmtISO(end)}); start=addDays(start,7); }
  return weeks;
}

export function cycleIndex(dateISO, anchorISO) {
  const anchor = clampMid(new Date(anchorISO));
  const d = clampMid(new Date(dateISO));
  const diffDays = Math.floor((d - anchor) / 86400000);
  const mod = ((diffDays % 14) + 14) % 14;
  return mod;
}

export function isScheduled(dateISO, escalaTrabalho, anchorISO) {
  const dow = new Date(dateISO).getDay();
  if (escalaTrabalho === ESCALAS_TRABALHO.DOM_QUI) return dow >= 0 && dow <= 4;
  const idx = cycleIndex(dateISO, anchorISO);
  if (escalaTrabalho === ESCALAS_TRABALHO.ALT_A) return ALT_A_WORK_IDX.has(idx);
  if (escalaTrabalho === ESCALAS_TRABALHO.ALT_B) return ALT_B_WORK_IDX.has(idx);
  return false;
}
