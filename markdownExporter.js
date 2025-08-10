// Экспорт расчёта в текст — публичный шаблон как в примере пользователя.
// Ожидает:
// - calculatedItems: [{ details:{ materialName,width,height,quantity,optionsString }, result:{ total } }, ...]
// - grandTotal: number
// - formatCurrency: (n:number)=>string
function generateMarkdown(calculatedItems, grandTotal, formatCurrency) {
  const lines = [];
  // Заголовок
  lines.push('﻿# Расчёт стоимости заказа');
  lines.push('');

  // Позиции
  calculatedItems.forEach((item, idx) => {
    lines.push(`## Баннер #${idx + 1}`);
    lines.push(`- Материал: ${item.details.materialName}`);
    lines.push(`- Размер: ${item.details.width} м x ${item.details.height} м (${item.details.quantity} шт.)`);
    lines.push(`- Опции: ${item.details.optionsString}`);
    lines.push('');
    lines.push(`Стоимость этой позиции: ${formatCurrency(item.result.total)}`);
    lines.push('');
  });

  // Итог
  lines.push(`ВСЕГО К ОПЛАТЕ: ${formatCurrency(grandTotal)}`);
  lines.push('');
  lines.push('---');

  // Контакты (подпись)
  lines.push('Алексей, 8-914-00-22-777 (WA, TG)');
  lines.push('WhatsApp: https://wa.me/79140022777');
  lines.push('Telegram: https://t.me/+79140022777');
  lines.push('');
  lines.push('Сайт: http://BannerBot.ru');
  lines.push('Бот для заказа макета: [@BannerPrintBot](https://t.me/BannerPrintBot)');
  return lines.join('\n');
}
