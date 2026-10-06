// Pure geometry/data helpers. Positions illustrate a proportion, never real cases.
export function markerCount(percent, total) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100 || !Number.isInteger(total) || total < 1 || total > 10000) throw new RangeError('Invalid illustrated proportion');
  return Math.round(percent * total / 100);
}
export function markerField(total) {
  if (!Number.isInteger(total) || total < 1 || total > 10000) throw new RangeError('Invalid marker total');
  // Fixed schematic cell blocks: no positions correspond to actual case records.
  const columns = Math.ceil(Math.sqrt(total * 1.6));
  const rows = Math.ceil(total / columns);
  return Array.from({length: total}, (_, index) => ({
    x: (index % columns - (columns - 1) / 2) * 4.3,
    z: (Math.floor(index / columns) - (rows - 1) / 2) * 5.3,
    index,
  }));
}
export function highlightOrder(total) {
  const indices = Array.from({length: total}, (_, i) => i);
  let seed = 704;
  for (let i = total - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}
