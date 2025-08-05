const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
  setup() {
    const prices = ref(null);
    const orderItems = ref([]);

    const form = reactive({
      materialId: '',
      width: 1,
      height: 2,
      quantity: 1,
      grommetOption: 'none',
      needsCutting: true, // переменная осталась!
      layoutOption: 'none',
    });

    onMounted(async () => {
      try {
        const response = await fetch('./prices.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        prices.value = await response.json();
        if (prices.value?.materials.length > 0) {
          form.materialId = prices.value.materials[0].id;
        }
      } catch (error) {
        console.error("Не удалось загрузить файл с ценами:", error);
        alert("Критическая ошибка: не удалось загрузить прайс-лист.");
      }
    });

    const calculatedItems = computed(() => {
      if (!prices.value || orderItems.value.length === 0) return [];
      return orderItems.value.map(item => {
        const result = calculateTotalCost(item, prices.value);
        const options = [];
        if (item.grommetOption === 'corners') {
            options.push(`Люверсы - ${prices.value.grommets.corners.name}`);
        } else if (item.grommetOption === 'perimeter') {
            options.push(`Люверсы - ${prices.value.grommets.perimeter.name}`);
        } else {
            options.push('Люверсы - Без');
        }
        // Опция резки — остаётся в коде (вывод), логика работает!
        options.push(`Резка - ${item.needsCutting ? 'Да' : 'Нет'}`);
        options.push(`Макет - ${item.layoutOption === 'create' ? 'Разработка' : 'Свой'}`);
        const details = {
          ...item,
          materialName: prices.value.materials.find(m => m.id === item.materialId)?.name || 'Неизвестно',
          optionsString: options.join(', ')
        };
        return { id: item.id, details, result };
      });
    });

    const grandTotal = computed(() => {
      return calculatedItems.value.reduce((total, item) => total + item.result.total, 0);
    });

    const addItem = () => {
      if (form.width <= 0 || form.height <= 0 || form.quantity <= 0) {
        alert("Пожалуйста, введите корректные размеры и количество.");
        return;
      }
      orderItems.value.push({ ...form, id: Date.now() });
    };

    const removeItem = (id) => {
      orderItems.value = orderItems.value.filter(item => item.id !== id);
    };

    const formatCurrency = (value) => {
      if (typeof value !== 'number') return '';
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
    };

    const exportTxt = () => {
      if (grandTotal.value <= 0) return;
      const txtText = generateMarkdown(calculatedItems.value, grandTotal.value, formatCurrency);

      // Формируем имя файла: raschet_zakaza_2025-08_2112rub.txt
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth()+1).padStart(2, '0');
      const totalSum = Math.round(grandTotal.value);
      const filename = `raschet_zakaza_${year}-${month}_${totalSum}rub.txt`;

      const blob = new Blob([txtText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return {
      prices,
      form,
      orderItems,
      calculatedItems,
      grandTotal,
      addItem,
      removeItem,
      formatCurrency,
      exportTxt,
    };
  }
}).mount('#app');

// Регистрация service worker для оффлайн-режима
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker зарегистрирован успешно.', reg))
      .catch(err => console.error('Ошибка регистрации Service Worker: ', err));
  });
}
