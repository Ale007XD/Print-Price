// Общая бизнес-логика расчёта стоимости баннеров.
// Переиспользуется публичной и админ-страницами.
// Внимание: цены и шаги берём из переданного объекта prices (динамически).
// Это позволяет подставлять разные прайсы (публичный/админский) без изменения этой логики.

function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

// Подсчёт количества люверсов по периметру с заданным шагом (например, 0.25м).
function calcGrommetsPerimeter(width, height, stepMeters) {
  if (stepMeters <= 0) return 0;
  const perimeter = 2 * (width + height);
  // Количество точек через каждый step с округлением вверх и контроль минимум 4 (по углам)
  const count = Math.max(4, Math.ceil(perimeter / stepMeters));
  return count;
}

// Стоимость макета по ступенчатой системе из прайса:
// - small: фикс до maxArea
// - medium: цена за м² до maxArea
// - large: цена за м² сверх
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

// Основная функция расчёта одной позиции
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

  // Базовая печать: цена за м² * площадь
  const basePrint = Math.ceil(areaTotal * material.price);

  // Люверсы
  let grommetsCost = 0;
  if (item.grommetOption === 'corners') {
    // фиксированная цена за 4 угловых люверса помноженная на кол-во изделий
    grommetsCost = (prices.grommets.corners?.price || 0) * qty;
  } else if (item.grommetOption === 'perimeter') {
    const step = prices.grommets.perimeter?.step || 0.25;
    const perPiece = prices.grommets.perimeter?.pricePerPiece || 0;
    const perBannerCount = calcGrommetsPerimeter(width, height, step);
    grommetsCost = perBannerCount * perPiece * qty;
  } else {
    grommetsCost = 0;
  }

  // Резка: цена за погонный метр периметра
  let cuttingCost = 0;
  if (item.needsCutting) {
    const perimeter = 2 * (width + height);
    cuttingCost = Math.ceil(perimeter * (prices.cutting?.pricePerMeter || 0) * qty);
  }

  // Макет
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
