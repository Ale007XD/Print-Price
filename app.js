// Этот файл: app.js
const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
  setup() {
    // --- ДАННЫЕ ---
    const prices = ref(null);
    const orderItems = ref([]);
    
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
    onMounted(async () => {
      try {
        const response = await fetch('./prices.json'); // Используем относительный путь
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        prices.value = await response.json();
        
        if (prices.value?.materials.length > 0) {
          form.materialId = prices.value.materials[0].id;
        }
      } catch (error) {
        console.error("Не удалось загрузить файл с ценами:", error);
        alert("Критическая ошибка: не удалось загрузить прайс-лист. Пожалуйста, проверьте консоль (F12) и убедитесь, что файл prices.json существует в репозитории.");
      }
    });

    const calculatedItems = computed(() => {
      if (!prices.value || orderItems.value.length === 0) return [];
      
      return orderItems.value.map(item => {
        const result = calculateTotalCost(item, prices.value);
        const details = {
          ...item,
          materialName: prices.value.materials.find(m => m.id === item.materialId)?.name || 'Неизвестно',
          grommetName: item.grommetOption === 'none' ? 'Без люверсов' : (prices.value.grommets[item.grommetOption]?.name || '')
        };
        return {
          id: item.id,
          details,
          result
        };
      });
    });

    const grandTotal = computed(() => {
      return calculatedItems.value.reduce((total, item) => total + item.result.total, 0);
    });

    // --- МЕТОДЫ ---
    const addItem = () => {
      if (form.width <= 0 || form.height <= 0 || form.quantity <= 0) {
        alert("Пожалуйста, введите корректные размеры и количество.");
        return;
      }
      
      const newItem = {
        ...form,
        id: Date.now()
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
        generatePdf(calculatedItems.value, grandTotal.value);
      }
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
      exportToPDF,
    };
  }
}).mount('#app');

// Регистрация Service Worker (ИСПРАВЛЕННЫЙ ПУТЬ)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js') // <-- ИЗМЕНЕНО: относительный путь
      .then(reg => console.log('Service Worker зарегистрирован успешно.', reg))
      .catch(err => console.error('Ошибка регистрации Service Worker: ', err));
  });
}
