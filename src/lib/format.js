// Formatering av namn, tider och datum

import { DAY_MS, WEEKDAY, MONTHS } from "../data/constants.js";

export const first = (name) => name.split(" ")[0];

export function relDate(iso) {
  const d = new Date(iso);
  const t = `kl. ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const a = new Date(d); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  const diff = Math.round((b - a) / DAY_MS);
  if (diff === 0) return `Idag ${t}`;
  if (diff === 1) return `Igår ${t}`;
  if (diff < 7) return `${WEEKDAY[d.getDay()]} ${t}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function startOfWeek(date) {
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export const times = (n) => `${n} ${n === 1 ? "gång" : "gånger"}`;

export const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
