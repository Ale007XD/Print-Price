// Расчёт для админки без "макета" и без "реза".
function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function calcGrommetsPerimeter(width, height, stepMeters) {
  if (stepMeters <= 0) return 0;
  const perimeter = 2 * (width + height);
  return Math.max(4, Math.ceil(perimeter / stepMeters));
}

// item: { materialId, width, height, quantity, grommetOption }
// prices: { materials[], grommets:{corners:{price}, perimeter:{pricePerPiece, step}} }
function calculateTotalCostAdmin(item, prices) {
  const material = prices.materials.find(m => m.id === item.materialId);
  if (!material) throw new Error('Материал не найден в прайсе');

  const width = Number(item.width);
  const height = Number(item.height);
  const qty = Number(item.quantity);
  if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(qty) || width <= 0 || height <= 0 || qty <= 0) {
    throw new Error('Некорректные размеры или количество');
  }

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

  const total = basePrint + grommetsCost;

  return {
    basePrint,
    grommetsCost,
    total,
    areaSingle,
    areaTotal
  };
}
