// Экспортер текстового расчёта для отправки клиенту/в переписку.
// Для админки мы можем использовать тот же формат.
function generateMarkdown(calculatedItems, grandTotal, formatCurrency) {
  const lines = [];
  lines.push('Расчёт заказа:');
  lines.push('---------------------------');
  calculatedItems.forEach((item, idx) => {
    lines.push(`Позиция #${idx + 1}`);
    lines.push(`Материал: ${item.details.materialName}`);
    lines.push(`Размер: ${item.details.width} м x ${item.details.height} м (${item.details.quantity} шт.)`);
    lines.push(`Опции: ${item.details.optionsString}`);
    lines.push(`Стоимость позиции: ${formatCurrency(item.result.total)}`);
    lines.push('');
  });
  lines.push('---------------------------');
  lines.push(`Итоговая стоимость: ${formatCurrency(grandTotal)}`);
  return lines.join('\n');
}
