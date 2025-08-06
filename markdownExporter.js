function generateMarkdown(calculatedItems, grandTotal, formatCurrency) {
  let markdown = `# Расчёт стоимости заказа\n\n`;

  calculatedItems.forEach((item, index) => {
    markdown += `## Баннер #${index + 1}\n`;
    markdown += `- Материал: ${item.details.materialName}\n`;
    markdown += `- Размер: ${item.details.width} м x ${item.details.height} м (${item.details.quantity} шт.)\n`;
    markdown += `- Опции: ${item.details.optionsString}\n\n`;
    markdown += `Стоимость этой позиции: ${formatCurrency(item.result.total)}\n\n`;
    if (index < calculatedItems.length - 1) {
      markdown += `--------------------------\n\n`;
    }
  });

  markdown += `ВСЕГО К ОПЛАТЕ: ${formatCurrency(grandTotal)}\n\n`;
  markdown += `---\n`;
  markdown += `Алексей, 8-914-00-22-777 (WA, TG)\n\n`;
  markdown += `Сайт: https://ale007xd.github.io/Print-Price/\n`;
  markdown += `Бот для заказа макета: @BannerPrintBot\n`;

  return markdown;
}
