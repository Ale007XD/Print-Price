// Общая бизнес-логика расчёта (публичная версия с учётом макета).
function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function calcGrommetsPerimeter(width, height, stepMeters) {
  if (stepMeters <= 0) return 0;
  const perimeter = 2 * (width + height);
  return Math.max(4, Math.ceil(perimeter / stepMeters));
}

function calcLayoutCost(area, layoutRules, layoutOption) {
  if (layoutOption !== 'create') return 0;
  if (!layoutRules) return 0;

  const small = layoutRules.small;
  const medium = layoutRules.medium;
  const large = layoutRules.large;

  if (small && area <= small.maxArea) {
    return small.price;
  }
  if (medium && area <= medium.maxArea) {
    return Math.ceil(area * medium.pricePerSqM);
  }
  if (large) {
    return Math.ceil(area * large.pricePerSqM);
  }
  return 0;
}

// item: { materialId, width, height, quantity, grommetOption, needsCutting, layoutOption }
// prices: { materials[], grommets{}, cutting{}, layout{} }
function calculateTotalCost(item, prices) {
  const material = prices.materials.find(m => m.id === item.materialId);
  if (!material) throw new Error('Материал не найден в прайсе');

  const width = Number(item.width);
  const height = Number(item.height);
  const qty = Number(item.quantity);
  const areaSingle = round2(width * height);
  const areaTotal = round2(areaSingle * qty);

  const basePrint = Math.ceil(areaTotal * material.price);

  let grommetsCost = 0;
  if (item.grommetOption === 'corners') {
    grommetsCost = (prices.grommets.corners?.price || 0) * qty;
  } else if (item.grommetOption === 'perimeter') {
    const step = prices.grommets.perimeter?.step || 0.25;
    const perPiece = prices.grommets.perimeter?.pricePerPiece || 0;
    const perBannerCount = calcGrommetsPerimeter(width, height, step);
    grommetsCost = perBannerCount * perPiece * qty;
  }

  let cuttingCost = 0;
  if (item.needsCutting) {
    const perimeter = 2 * (width + height);
    cuttingCost = Math.ceil(perimeter * (prices.cutting?.pricePerMeter || 0) * qty);
  }

  const layoutCost = calcLayoutCost(areaSingle, prices.layout, item.layoutOption) * qty;

  const total = basePrint + grommetsCost + cuttingCost + layoutCost;

  return {
    basePrint,
    grommetsCost,
    cuttingCost,
    layoutCost,
    total,
    areaSingle,
    areaTotal
  };
}
