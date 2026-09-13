// Normaliserar foton till en lista - stödjer både gamla enstaka foton (sträng) och nya listor.

export function photoList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}
