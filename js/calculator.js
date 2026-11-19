// Bonnetje - Rekenkern (100% hele centen, geen zwevende komma's)
// Licentie: MIT

/**
 * Zet een gebruikersinvoer (bijv. "12,50", "€ 12,50", "-2.50", "10") om naar hele centen.
 * Retourneert null bij ongeldige invoer of >2 decimalen (geen halve centen).
 */
export function parseEuroToCents(input) {
  if (typeof input === 'number' && Number.isInteger(input)) {
    return input;
  }
  if (input === null || input === undefined) return null;
  let str = String(input).trim();
  if (!str) return null;

  str = str.replace(/[€\s]/g, '');
  let negative = false;
  if (str.startsWith('-')) {
    negative = true;
    str = str.slice(1);
  } else if (str.startsWith('+')) {
    str = str.slice(1);
  }
  if (!str) return null;

  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  let intPart = str;
  let decPart = '';

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      intPart = str.slice(0, lastComma).replace(/\./g, '');
      decPart = str.slice(lastComma + 1);
    } else {
      intPart = str.slice(0, lastDot).replace(/,/g, '');
      decPart = str.slice(lastDot + 1);
    }
  } else if (lastComma !== -1) {
    const parts = str.split(',');
    if (parts.length > 2) return null;
    intPart = parts[0];
    decPart = parts[1];
  } else if (lastDot !== -1) {
    const parts = str.split('.');
    if (parts.length > 2) {
      intPart = parts.join('');
      decPart = '';
    } else if (parts[1].length <= 2) {
      intPart = parts[0];
      decPart = parts[1];
    } else if (parts[1].length === 3 && parts[0].length >= 1) {
      intPart = parts.join('');
      decPart = '';
    } else {
      return null;
    }
  }

  if (!/^\d+$/.test(intPart || '0') || (decPart && !/^\d+$/.test(decPart))) {
    return null;
  }
  if (decPart.length > 2) {
    return null;
  }

  const euros = parseInt(intPart || '0', 10);
  const cents = parseInt((decPart + '00').slice(0, 2), 10);
  const total = euros * 100 + cents;
  return negative ? -total : total;
}

/**
 * Toont hele centen altijd in Nederlandse notatie: € 12,50 of -€ 12,50.
 */
export function formatCentsNL(cents) {
  if (!Number.isInteger(cents)) {
    throw new TypeError(`formatCentsNL verwacht hele centen (integer), kreeg: ${cents}`);
  }
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const rem = abs % 100;
  const euroStr = euros.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centStr = rem.toString().padStart(2, '0');
  return `${negative ? '-' : ''}€ ${euroStr},${centStr}`;
}

/**
 * Verdeelt een bedrag in hele centen zo eerlijk mogelijk over deelnemers.
 * Resterende centen gaan 1 voor 1 naar de deelnemers vanaf de eerste.
 * Werkt ook exact voor negatieve bedragen (kortingen).
 */
export function splitCentsEqually(totalCents, participantIds) {
  if (!Number.isInteger(totalCents)) {
    throw new TypeError('totalCents moet een geheel getal in centen zijn.');
  }
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return {};
  }
  const n = participantIds.length;
  const sign = totalCents < 0 ? -1 : 1;
  const absTotal = Math.abs(totalCents);
  const base = Math.floor(absTotal / n);
  const remainder = absTotal % n;

  const shares = {};
  for (let i = 0; i < n; i++) {
    const extra = i < remainder ? 1 : 0;
    shares[participantIds[i]] = sign * (base + extra);
  }
  return shares;
}

/**
 * Verdeelt een bedrag in hele centen naar rato van gehele aantallen per deelnemer.
 * Restcenten gaan 1 voor 1 naar de eerste deelnemers in volgorde van participantOrder.
 * De som van alle delen is altijd exact gelijk aan totalCents.
 */
export function splitCentsByQuantities(totalCents, assignedQuantities, participantOrder = null) {
  if (!Number.isInteger(totalCents)) {
    throw new TypeError('totalCents moet een geheel getal in centen zijn.');
  }
  const entries = (participantOrder || Object.keys(assignedQuantities || {}))
    .map((id) => [id, assignedQuantities?.[id] || 0])
    .filter(([, q]) => Number.isInteger(q) && q > 0);

  if (entries.length === 0) return {};

  const totalQty = entries.reduce((s, [, q]) => s + q, 0);
  const sign = totalCents < 0 ? -1 : 1;
  const absTotal = Math.abs(totalCents);

  const shares = {};
  let allocated = 0;
  for (const [id, q] of entries) {
    const base = Math.floor((absTotal * q) / totalQty);
    shares[id] = base;
    allocated += base;
  }

  let remainder = absTotal - allocated;
  for (let i = 0; i < entries.length && remainder > 0; i++) {
    shares[entries[i][0]] += 1;
    remainder -= 1;
  }

  for (const [id] of entries) {
    shares[id] = sign * shares[id];
  }
  return shares;
}

/**
 * Controleert of aantal * stukprijs exact overeenkomt met regeltotaal.
 * Corrigeert nooit stilletjes; geeft een vlag terug ter controle.
 */
export function validateLineItem(item) {
  const qty = Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 1;
  const unitPriceCents = Number.isInteger(item.unitPriceCents) ? item.unitPriceCents : null;
  const lineTotalCents = Number.isInteger(item.lineTotalCents) ? item.lineTotalCents : null;

  if (lineTotalCents === null) {
    return { valid: false, mismatch: true, reason: 'missing_total' };
  }
  if (unitPriceCents === null) {
    return { valid: false, mismatch: true, reason: 'missing_unit_price' };
  }
  const expected = qty * unitPriceCents;
  const mismatch = expected !== lineTotalCents;
  return {
    valid: !mismatch,
    mismatch,
    expectedCents: expected,
    diffCents: lineTotalCents - expected,
    reason: mismatch ? 'qty_times_unit_mismatch' : null
  };
}

/**
 * Herkent of een bonregel een BTW/IVA/VAT-overzichtsregel is, een mogelijke extra heffing,
 * een korting of een gewone consumptieregel.
 * Retourneert: { kind: 'item' | 'discount' | 'discount_uncertain' | 'vat_summary' | 'surcharge_uncertain', reason, normalizedCents }
 */
export function classifyReceiptLine(description, lineTotalCents) {
  const text = String(description || '').toLowerCase().trim();

  // BTW / IVA / VAT herkenning — ook zonder spatie zoals "IVA10%" of "BTW9%"
  const hasVatKeyword =
    /(?:^|\b)(btw|b\.t\.w\.|iva|i\.v\.a\.|vat)(?=\b|\d|%)/.test(text) ||
    /\b(base\s*imponible|cuota\s*iva|tipo\s*iva|tax\s*summary|net\s*amount|netto)\b/.test(text);

  // Expliciete aanduiding van "inbegrepen" (NL/ES/EN)
  const hasIncludedHint = /\b(incl\.?|included|incluido|incluida|inbegrepen|base\s*imponible|cuota\s*iva|tipo\s*iva|tax\s*summary)\b/.test(text);

  // Expliciete aanduiding van "extra / exclusief / toeslag" (NL/ES/EN)
  const hasExtraHint = /\b(extra|excl\.?|excluded|excluido|not\s*included|niet\s*inbegrepen|plus)\b/.test(text);

  // Werkelijke extra heffingen of twijfelgevallen
  const hasSurchargeKeyword =
    /\b(service\s*charge|servicio|cubierto|couvert|toeslag|toeristenbelasting|tourist\s*tax|supplement|suplemento|terraza)\b/.test(text);

  // 1. Extra heffing of BTW met 'extra'/'excl' -> nooit stil uitsluiten, vraag bevestiging
  if (hasSurchargeKeyword || (hasVatKeyword && hasExtraHint)) {
    return {
      kind: 'surcharge_uncertain',
      reason: hasVatKeyword && hasExtraHint ? 'vat_marked_extra_or_excl' : 'possible_extra_charge',
      normalizedCents: lineTotalCents
    };
  }

  // 2. Duidelijk inbegrepen BTW/IVA/VAT-overzicht -> niet meetellen
  if (hasVatKeyword && (hasIncludedHint || /\d+\s*%/.test(text))) {
    return {
      kind: 'vat_summary',
      reason: 'vat_overview_line',
      normalizedCents: lineTotalCents
    };
  }

  // 3. Alleen BTW-trefwoord zonder percentage/incl -> twijfelgeval
  if (hasVatKeyword) {
    return {
      kind: 'surcharge_uncertain',
      reason: 'vat_ambiguous',
      normalizedCents: lineTotalCents
    };
  }

  // 4. Kortingen: ondubbelzinnig negatief maken, zonder dubbel omkeren
  const strongDiscount = /\b(korting|descuento|dto\.?|discount|rabatt)\b/.test(text);
  const weakDiscount = /\b(actie|promo|promocion|promoción|coupon|voucher)\b/.test(text);

  if (Number.isInteger(lineTotalCents) && lineTotalCents < 0) {
    return { kind: 'discount', reason: 'negative_amount', normalizedCents: lineTotalCents };
  }
  if (strongDiscount) {
    const negCents = Number.isInteger(lineTotalCents) ? -Math.abs(lineTotalCents) : lineTotalCents;
    return { kind: 'discount', reason: 'discount_keyword', normalizedCents: negCents };
  }
  if (weakDiscount) {
    return { kind: 'discount_uncertain', reason: 'ambiguous_discount_keyword', normalizedCents: lineTotalCents };
  }

  return { kind: 'item', reason: 'regular_item', normalizedCents: lineTotalCents };
}

/**
 * Bepaalt of een regel actief meetelt in de afrekening.
 */
export function isLineActive(item) {
  if (!item) return false;
  if (item.excluded || item.isVatSummary) return false;
  if (item.lineType === 'vat_summary' || item.lineType === 'ignored') return false;
  return true;
}

/**
 * Vergelijkt de som van actieve regels (excl. BTW-overzichtsregels) met het bontotaal.
 * Vereist een expliciet ingevuld/herkend bontotaal en blokkeert bij onzekere of onbevestigde regels.
 */
export function validateReceiptTotal(items, receiptTotalCents, extras = {}) {
  const activeItems = (items || []).filter(isLineActive);
  const itemsSumCents = activeItems.reduce(
    (sum, it) => sum + (Number.isInteger(it.lineTotalCents) ? it.lineTotalCents : 0),
    0
  );

  // Punt N1 (v11): fooi en erbovenop-getelde btw staan niet in de gerechtregels maar horen wel
  // bij het bontotaal. Neem ze mee zodat "som gerechten + fooi/btw == bontotaal" afrondbaar is.
  const receiptTipCents = Number.isInteger(extras.tipCents) ? extras.tipCents : 0;
  const vatAddedCents = Number.isInteger(extras.vatAddedCents) ? extras.vatAddedCents : 0;
  const explainedExtrasCents = receiptTipCents + vatAddedCents;

  const hasReceiptTotal = Number.isInteger(receiptTotalCents);
  const expectedSumCents = itemsSumCents + explainedExtrasCents;
  const diffCents = hasReceiptTotal ? receiptTotalCents - expectedSumCents : 0;

  const mismatchItems = activeItems.filter((it) => validateLineItem(it).mismatch);
  const uncertainVatItems = (items || []).filter((it) => !it.excluded && it.needsVatDecision);
  const lowConfidenceItems = activeItems.filter((it) => Boolean(it.lowConfidence));
  const priceConfirmItems = activeItems.filter((it) => Boolean(it.needsPriceConfirmation));
  const discountConfirmItems = activeItems.filter((it) => Boolean(it.needsDiscountConfirmation));

  // Zonder bontotaal mag er NOOIT definitief afgerond worden
  const matches = hasReceiptTotal && diffCents === 0;
  const canProceed =
    activeItems.length > 0 &&
    hasReceiptTotal &&
    matches &&
    mismatchItems.length === 0 &&
    uncertainVatItems.length === 0 &&
    lowConfidenceItems.length === 0 &&
    priceConfirmItems.length === 0 &&
    discountConfirmItems.length === 0;

  return {
    itemsSumCents,
    receiptTipCents,
    vatAddedCents,
    expectedSumCents,
    receiptTotalCents: hasReceiptTotal ? receiptTotalCents : null,
    missingReceiptTotal: !hasReceiptTotal,
    diffCents,
    matches,
    mismatchItemIds: mismatchItems.map((i) => i.id),
    uncertainVatItemIds: uncertainVatItems.map((i) => i.id),
    lowConfidenceItemIds: lowConfidenceItems.map((i) => i.id),
    priceConfirmItemIds: priceConfirmItems.map((i) => i.id),
    discountConfirmItemIds: discountConfirmItems.map((i) => i.id),
    canProceed
  };
}

/**
 * Voert de volledige afrekening uit in hele centen.
 * Ondersteunt zowel gelijk delen (assignedTo) als aantallen per persoon (assignedQuantities).
 */
export function calculateSettlement(state) {
  const items = state.items || [];
  const participants = state.participants || [];
  const participantIds = participants.map((p) => p.id);
  const participantSet = new Set(participantIds);

  const activeItems = items.filter(isLineActive);
  // Punt N1 (v11): fooi en erbovenop-getelde btw van de bon zelf (bijv. Amerikaanse sales tax)
  const receiptTipCents = Number.isInteger(state.receiptTipCents) ? state.receiptTipCents : 0;
  const vatAddedCents = Number.isInteger(state.receiptVatAddedCents) ? state.receiptVatAddedCents : 0;
  const totalCheck = validateReceiptTotal(items, state.receiptTotalCents, {
    tipCents: receiptTipCents,
    vatAddedCents
  });

  const subtotals = {};
  const itemCounts = {};
  for (const p of participants) {
    subtotals[p.id] = 0;
    itemCounts[p.id] = 0;
  }

  const unassignedItems = [];
  const quantityMismatchItems = [];
  const itemBreakdowns = {};

  for (const item of activeItems) {
    const qty = Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 1;
    const rawQtyMap = item.assignedQuantities && typeof item.assignedQuantities === 'object'
      ? item.assignedQuantities
      : null;

    // Filter alleen bestaande deelnemers met > 0 aantal
    const validQtyMap = {};
    let assignedQtySum = 0;
    if (rawQtyMap) {
      for (const pid of participantIds) {
        const q = rawQtyMap[pid];
        if (Number.isInteger(q) && q > 0) {
          validQtyMap[pid] = q;
          assignedQtySum += q;
        }
      }
    }

    if (assignedQtySum > 0) {
      // Aantal-toewijzing per persoon is actief op deze regel
      if (assignedQtySum !== qty) {
        quantityMismatchItems.push({
          item,
          expectedQty: qty,
          assignedQty: assignedQtySum,
          remainingQty: qty - assignedQtySum
        });
        itemBreakdowns[item.id] = {};
        continue;
      }
      const shares = splitCentsByQuantities(item.lineTotalCents, validQtyMap, participantIds);
      itemBreakdowns[item.id] = shares;
      for (const [pid, shareCents] of Object.entries(shares)) {
        subtotals[pid] += shareCents;
        itemCounts[pid] += validQtyMap[pid];
      }
      continue;
    }

    // Anders: gelijk delen via assignedTo
    const validAssignees = (item.assignedTo || []).filter((id) => participantSet.has(id));
    if (validAssignees.length === 0) {
      unassignedItems.push(item);
      itemBreakdowns[item.id] = {};
      continue;
    }
    const shares = splitCentsEqually(item.lineTotalCents, validAssignees);
    itemBreakdowns[item.id] = shares;
    for (const [pid, shareCents] of Object.entries(shares)) {
      subtotals[pid] += shareCents;
      itemCounts[pid] += 1;
    }
  }

  const billTotalCents = totalCheck.itemsSumCents;
  const assignedSumCents = Object.values(subtotals).reduce((a, b) => a + b, 0);

  // Punt N1 (v11): verdeel de bon-fooi en erbovenop-getelde btw pro rata over de deelnemers
  // (naar rato van hun subtotaal; wie niets had betaalt geen aandeel). Zo is ook een Amerikaanse
  // bon met tax of een NL-bon met fooiregel exact afrondbaar.
  const receiptExtras = {};
  for (const p of participants) receiptExtras[p.id] = 0;
  const extrasToSplit = receiptTipCents + vatAddedCents;
  if (extrasToSplit > 0) {
    const weights = {};
    let weightSum = 0;
    for (const p of participants) {
      const w = Math.max(0, subtotals[p.id]);
      weights[p.id] = w;
      weightSum += w;
    }
    const eligible = weightSum > 0 ? participantIds.filter((id) => weights[id] > 0) : participantIds;
    const qtyMap = {};
    for (const id of eligible) qtyMap[id] = weightSum > 0 ? weights[id] : 1;
    const shares = splitCentsByQuantities(extrasToSplit, qtyMap, participantIds);
    for (const [pid, share] of Object.entries(shares)) {
      receiptExtras[pid] = share;
    }
  }

  // 2. Fooi berekenen (nooit stapelen: exact 1 modus actief)
  const tipMode = state.tipMode || 'none';
  const tips = {};
  for (const p of participants) tips[p.id] = 0;

  let totalTipCents = 0;
  let tipError = null;
  let tipDistributionNote = '';

  if (tipMode === 'per_person') {
    const map = state.tipPerPersonCents || {};
    for (const p of participants) {
      const raw = map[p.id] ?? 0;
      if (!Number.isInteger(raw) || raw < 0) {
        tipError = 'negative_tip';
        tips[p.id] = 0;
      } else {
        tips[p.id] = raw;
        totalTipCents += raw;
      }
    }
    tipDistributionNote = 'per_person';
  } else if (tipMode === 'target_total') {
    const target = state.targetTotalCents;
    if (target !== null && target !== undefined) {
      if (!Number.isInteger(target)) {
        tipError = 'invalid_target';
      } else if (target < billTotalCents) {
        tipError = 'target_below_bill';
      } else {
        totalTipCents = target - billTotalCents;
        const eligibleIds = state.includeZeroConsumersInSharedTip
          ? participantIds
          : participantIds.filter((id) => itemCounts[id] > 0 || subtotals[id] !== 0);

        if (eligibleIds.length > 0 && totalTipCents > 0) {
          const tipShares = splitCentsEqually(totalTipCents, eligibleIds);
          for (const [pid, share] of Object.entries(tipShares)) {
            tips[pid] = share;
          }
          tipDistributionNote = state.includeZeroConsumersInSharedTip
            ? 'shared_all_participants'
            : 'shared_active_participants';
        } else if (totalTipCents === 0) {
          tipDistributionNote = 'zero_tip';
        }
      }
    }
  }

  // 3. Per persoon eindbedrag en contant wisselgeld
  const perPerson = participants.map((p) => {
    const subtotalCents = subtotals[p.id];
    const tipCents = tips[p.id];
    const receiptExtraCents = receiptExtras[p.id] || 0;
    const totalCents = subtotalCents + tipCents + receiptExtraCents;
    const paidCashCents = Number.isInteger(p.paidCashCents) ? p.paidCashCents : null;
    const changeCents = paidCashCents !== null ? paidCashCents - totalCents : null;
    return {
      id: p.id,
      name: p.name,
      itemCount: itemCounts[p.id],
      subtotalCents,
      tipCents,
      receiptExtraCents,
      totalCents,
      paidCashCents,
      changeCents,
      settled: Boolean(p.settled)
    };
  });

  const grandTotalCents = perPerson.reduce((sum, p) => sum + p.totalCents, 0);
  const expectedGrandTotalCents = assignedSumCents + totalTipCents + extrasToSplit;
  const invariantExact =
    unassignedItems.length === 0 &&
    quantityMismatchItems.length === 0 &&
    !tipError &&
    totalCheck.matches &&
    grandTotalCents === billTotalCents + totalTipCents + extrasToSplit;

  return {
    billTotalCents,
    assignedSumCents,
    totalTipCents,
    receiptTipCents,
    vatAddedCents,
    grandTotalCents,
    expectedGrandTotalCents,
    tipMode,
    tipError,
    tipDistributionNote,
    unassignedItems,
    quantityMismatchItems,
    totalCheck,
    itemBreakdowns,
    perPerson,
    invariantExact,
    canFinalize:
      totalCheck.canProceed &&
      unassignedItems.length === 0 &&
      quantityMismatchItems.length === 0 &&
      !tipError &&
      participants.length > 0 &&
      invariantExact
  };
}

/**
 * Bouwt de korte deeltekst van de uitslag voor de deelknop (punt 6, v8):
 * "Jan € 14,50 · Els € 22,00 · totaal € 36,50". Zonder namen of bedragen verzinnen:
 * alleen wat in de afrekening staat. `totalWord` komt uit de taalstrings ('totaal'/'total').
 */
export function buildSettlementShareText(result, totalWord = 'totaal') {
  if (!result || !Array.isArray(result.perPerson) || result.perPerson.length === 0) return '';
  const parts = result.perPerson.map((p) => `${p.name} ${formatCentsNL(p.totalCents)}`);
  parts.push(`${totalWord} ${formatCentsNL(result.grandTotalCents)}`);
  return parts.join(' \u00b7 ');
}
