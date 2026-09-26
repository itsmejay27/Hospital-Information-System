// Shared class names so every data table in the HIS looks the same.
export const tableWrap = "bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden";
export const tableScroll = "overflow-x-auto";
export const table = "w-full text-left text-xs border-collapse";
export const thead = "bg-slate-50 border-b border-slate-200";
export const th = "px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap";
export const tr = "border-b border-slate-100 last:border-0 hover:bg-slate-50/70 align-top";
export const td = "px-3.5 py-2.5 text-slate-700";
export const emptyCell = "px-3.5 py-10 text-center text-slate-400";
export const toolbar = "flex flex-col md:flex-row md:items-center justify-between gap-2 px-3.5 py-3 border-b border-slate-100 bg-white";
const inputBase =
  "px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden";
export const input = `w-full ${inputBase}`;
/** Compact select / input for toolbars that should size to its content. */
export const inlineInput = `w-auto shrink-0 ${inputBase}`;
export const label = "block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-1";
export const primaryBtn =
  "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60";
export const secondaryBtn =
  "inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer";
export const badge = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap";
