// ВАЖНО: Старая переменная robotoFontBase64 больше не нужна.

async function generatePdf(calculatedItems, grandTotal) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // --- НАЧАЛО БЛОКА ЗАГРУЗКИ ШРИФТА ---
  // Мы будем загружать шрифт из сети, это надежнее, чем вставлять огромную строку.
  // Шрифт загрузится один раз, а потом будет кешироваться сервис-воркером.
  try {
    // Попытка загрузить шрифт из файла. Если не получится, он не будет встроен.
    // Это компромисс для работы оффлайн. Для онлайн-работы шрифт будет.
    // Для полной оффлайн-поддержки необходимо, чтобы этот URL был в кеше sw.js
    const fontUrl = 'https://raw.githack.com/MrRio/jsPDF/master/test/reference/Amiri-Regular.ttf';
    const response = await fetch(fontUrl);
    if (!response.ok) throw new Error('Network response was not ok.');
    
    const font = await response.arrayBuffer();
    const fontBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(font)));

    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');

  } catch (error) {
      console.error("Не удалось загрузить и встроить шрифт. Кириллица может не отображаться.", error);
      // Если загрузка не удалась, продолжаем без кастомного шрифта.
      // На некоторых системах PDF-ридеры могут подставить свой шрифт.
  }
  // --- КОНЕЦ БЛОКА ЗАГРУЗКИ ШРИФТА ---

  const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);

  doc.setFontSize(18);
  doc.text('Расчёт стоимости заказа', 105, 20, { align: 'center' });

  let y = 35;

  calculatedItems.forEach((item, index) => {
    if (y > 250) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Баннер #${index + 1}`, 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const itemDetails = [
        `Материал: ${item.details.materialName}`,
        `Размер: ${item.details.width} м x ${item.details.height} м (${item.details.quantity} шт.)`,
        `Опции: ${item.details.optionsString}`
    ];
    
    const splitText = doc.splitTextToSize(itemDetails, 180);
    doc.text(splitText, 14, y);
    y += (splitText.length * 5);
    
    y += 4;
    doc.setFont(undefined, 'bold');
    doc.text(`Стоимость этой позиции:`, 14, y);
    doc.text(formatCurrency(item.result.total), 200, y, { align: 'right' });
    y += 8;
    
    if (index < calculatedItems.length - 1) {
        doc.setLineWidth(0.2);
        doc.line(14, y, 200, y);
        y += 8;
    }
  });

  y += 5;
  doc.setLineWidth(0.5);
  doc.line(14, y, 200, y);
  y += 10;
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Общая стоимость заказа:', 14, y);
  doc.text(formatCurrency(grandTotal), 200, y, { align: 'right' });

  doc.save(`raschet_zakaza_${new Date().toISOString().slice(0, 10)}.pdf`);
}
