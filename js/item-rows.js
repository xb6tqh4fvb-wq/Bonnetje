// Bonnetje v17 - pure helpers voor de compacte bonregel (één rij per regel:
// naam, aantal, regeltotaal; tik = uitklappen; kruisje = verwijderen met
// ongedaan-maken-balk). DOM-vrij, zodat de Node-tests ze direct controleren.

/** Is een regel uitgeklapt? Onzekere/foutieve regels staan standaard open. */
export function isItemExpanded(itemId, { needsReview = false, expandedIds, collapsedIds } = {}) {
  if (collapsedIds && collapsedIds.has(itemId)) return false;
  if (expandedIds && expandedIds.has(itemId)) return true;
  return Boolean(needsReview);
}

/** Klapt een regel in of uit. Geeft de nieuwe toestand (true = open) terug. */
export function toggleItemExpanded(itemId, { needsReview = false, expandedIds, collapsedIds } = {}) {
  const open = isItemExpanded(itemId, { needsReview, expandedIds, collapsedIds });
  if (open) {
    if (expandedIds) expandedIds.delete(itemId);
    if (needsReview && collapsedIds) collapsedIds.add(itemId);
  } else {
    if (collapsedIds) collapsedIds.delete(itemId);
    if (!needsReview && expandedIds) expandedIds.add(itemId);
  }
  return !open;
}

/**
 * Verwijdert de regel op idx zonder de invoer te muteren.
 * Geeft { items, deleted } terug; deleted = { item, idx } of null bij een ongeldige idx.
 */
export function deleteItemAt(items, idx) {
  if (!Array.isArray(items) || idx < 0 || idx >= items.length) return { items, deleted: null };
  const deleted = { item: items[idx], idx };
  return { items: items.slice(0, idx).concat(items.slice(idx + 1)), deleted };
}

/** Zet een met deleteItemAt verwijderde regel terug op (ongeveer) de oude plek. */
export function restoreDeletedItem(items, deleted) {
  if (!deleted || !deleted.item) return items;
  const idx = Math.min(Math.max(deleted.idx, 0), items.length);
  const copy = items.slice();
  copy.splice(idx, 0, deleted.item);
  return copy;
}

/**
 * Prijs per stuk is afgeleid, geen eigen invoer meer in de compacte rij:
 * regeltotaal gedeeld door het aantal, afgerond op centen. null als er geen
 * regeltotaal is. De rekenkern gebruikt lineTotalCents en qty zoals voorheen.
 */
export function computedUnitPriceCents(item) {
  if (!Number.isInteger(item?.lineTotalCents)) return null;
  const qty = Number.isInteger(item?.qty) && item.qty > 0 ? item.qty : 1;
  return Math.round(item.lineTotalCents / qty);
}

/** Model voor de compacte rij: naam, aantal en regeltotaal (plus twijfelvlag). */
export function compactRowModel(item, needsReview = false) {
  const qty = Number.isInteger(item?.qty) && item.qty > 0 ? item.qty : 1;
  return {
    name: item?.geminiTranslation || item?.description || '',
    qty,
    lineTotalCents: Number.isInteger(item?.lineTotalCents) ? item.lineTotalCents : null,
    unitPriceCents: computedUnitPriceCents(item),
    needsReview: Boolean(needsReview)
  };
}
