// Этот файл: app.js
const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
  setup() {
    // --- ДАННЫЕ ---
    const prices = ref(null); // Цены, загружаемые из JSON
    const orderItems = ref([]); // Массив со всеми баннерами в заказе
    
    // Форма для создания *нового* баннера
    const form = reactive({
      materialId: '',
      width: 1,
      height: 2,
      quantity: 1,
      grommetOption: 'none',
      needsCutting: true,
      layoutOption: 'none',
    });
    
    // --- ЛОГИКА ---
    // Загрузка цен при старте
    onMounted(async () => {
      try {
        const response = await fetch('prices.json');
        prices.value = await response.json();
        // Устанавливаем значение по умолчанию для формы
        if (prices.value?.materials.length > 0) {
          form.materialId = prices.value.materials[0].id;
        }
      } catch (error) {
        console.error("Не удалось загрузить файл с ценами:", error);
        alert("Ошибка загрузки цен. Функционал может быть ограничен.");
      }
    });

    // Вычисляемое свойство, которое рассчитывает стоимость для каждого элемента в заказе
    const calculatedItems = computed(() => {
      if (!prices.value || orderItems.value.length === 0) return [];
      
      return orderItems.value.map(item => {
        const result = calculateTotalCost(item, prices.value);
        // Добавляем текстовые описания для удобного отображения
        const details = {
          ...item,
          materialName: prices.value.materials.find(m => m.id === item.materialId)?.name || 'Неизвестно',
          grommetName: prices.value.grommets[item.grommetOption]?.name || 'Без люверсов'
        };
        return {
          id: item.id,
          details,
          result
        };
      });
    });

    // Вычисляемое свойство для общей суммы заказа
    const grandTotal = computed(() => {
      return calculatedItems.value.reduce((total, item) => total + item.result.total, 0);
    });

    // --- МЕТОДЫ ---
    const addItem = () => {
      // Простая валидация
      if (form.width <= 0 || form.height <= 0 || form.quantity <= 0) {
        alert("Пожалуйста, введите корректные размеры и количество.");
        return;
      }
      
      const newItem = {
        ...form,
        id: Date.now() // Уникальный ID для каждого элемента
      };
      orderItems.value.push(newItem);
    };

    const removeItem = (id) => {
      orderItems.value = orderItems.value.filter(item => item.id !== id);
    };

    const formatCurrency = (value) => {
      if (typeof value !== 'number') return '';
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
    };

    const exportToPDF = () => {
      if (grandTotal.value > 0) {
        // Передаём рассчитанные элементы и общую сумму
        generatePdf(calculatedItems.value, grandTotal.value);
      }
    };
    
    // Возвращаем все, что нужно в шаблоне
    return {
      prices,
      form,
      orderItems,
      calculatedItems,
      grandTotal,
      addItem,
      removeItem,
      formatCurrency,
      exportToPDF,
    };
  }
}).mount('#app');

// Регистрация Service Worker (остается без изменений)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/banner-calculator/sw.js')
      .then(reg => console.log('SW registered.', reg))
      .catch(err => console.error('SW registration failed: ', err));
  });
}
