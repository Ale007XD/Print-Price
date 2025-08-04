// Этот файл: pdfExporter.js

// ВАЖНО! Не забудьте вставить сюда Base64 вашего шрифта.
const robotoFontBase64 = 'AAEAAAARAQAABAAQRFNJRwAAAAAAA...';

function generatePdf(calculatedItems, grandTotal) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  if (robotoFontBase64.length > 100) {
    doc.addFileToVFS('Roboto-Regular.ttf', robotoFontBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
  }

  const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);

  doc.setFontSize(18);
  doc.text('Расчёт стоимости заказа', 105, 20, { align: 'center' });

  let y = 35; // Начальная позиция по Y

  // Проходим по каждому элементу в заказе
  calculatedItems.forEach((item, index) => {
    if (y > 260) { // Если страница заканчивается, добавляем новую
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(14);
    doc.text(`Баннер #${index + 1}`, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`- Материал: ${item.details.materialName}`, 14, y);
    y += 6;
    doc.text(`- Размер: ${item.details.width} м x ${item.details.height} м, Количество: ${item.details.quantity} шт.`, 14, y);
    y += 6;
    doc.text(`- Стоимость позиции:`, 14, y);
    doc.text(formatCurrency(item.result.total), 200, y, { align: 'right' });
    y += 8;
    doc.setLineWidth(0.2);
    doc.line(14, y, 200, y); // Разделитель
    y += 8;
  });

  // Общая сумма
  y += 5;
  doc.setFontSize(16);
  doc.text('Общая стоимость заказа:', 14, y);
  doc.text(formatCurrency(grandTotal), 200, y, { align: 'right' });

  doc.save(`raschet_zakaza_${new Date().toISOString().slice(0, 10)}.pdf`);
}
