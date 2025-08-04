// Этот файл: calculation.js

function calculateTotalCost(details, prices) {
  if (!details || !prices || details.width <= 0 || details.height <= 0 || details.quantity <= 0) {
    return { total: 0, breakdown: {} };
  }

  const area = details.width * details.height;
  const perimeter = (details.width + details.height) * 2;
  const breakdown = {};

  // 1. Стоимость материала
  const material = prices.materials.find(m => m.id === details.materialId);
  if (!material) return { total: 0, breakdown: {} }; // Безопасный выход
  const materialCost = area * material.price;
  breakdown.material = { name: material.name, cost: materialCost };

  let totalForOne = materialCost;

  // 2. Стоимость люверсов
  if (details.grommetOption === 'corners') {
    breakdown.grommets = { name: prices.grommets.corners.name, cost: prices.grommets.corners.price };
    totalForOne += prices.grommets.corners.price;
  } else if (details.grommetOption === 'perimeter') {
    const grommetCount = Math.ceil(perimeter / prices.grommets.perimeter.step);
    const grommetCost = grommetCount * prices.grommets.perimeter.pricePerPiece;
    breakdown.grommets = { name: `${prices.grommets.perimeter.name} (${grommetCount} шт.)`, cost: grommetCost };
    totalForOne += grommetCost;
  }

  // 3. Стоимость резки
  if (details.needsCutting) {
    const cuttingCost = perimeter * prices.cutting.pricePerMeter;
    breakdown.cutting = { cost: cuttingCost };
    totalForOne += cuttingCost;
  }

  breakdown.totalForOne = totalForOne;

  let finalTotal = totalForOne * details.quantity;
  
  // 4. Стоимость макета
  if (details.layoutOption === 'create') {
    let layoutCost = 0;
    let layoutName = '';
    if (area <= prices.layout.small.maxArea) {
      layoutCost = prices.layout.small.price;
      layoutName = prices.layout.small.name;
    } else if (area <= prices.layout.medium.maxArea) {
      layoutCost = area * prices.layout.medium.pricePerSqM;
      layoutName = `${prices.layout.medium.name} (${area.toFixed(2)} м²)`;
    } else {
      layoutCost = area * prices.layout.large.pricePerSqM;
      layoutName = `${prices.layout.large.name} (${area.toFixed(2)} м²)`;
    }
    finalTotal += layoutCost;
    breakdown.layout = { name: layoutName, cost: layoutCost };
  }
  
  breakdown.finalTotal = finalTotal;

  return { total: finalTotal, breakdown };
}
