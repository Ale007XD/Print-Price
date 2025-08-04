// Этот файл: app.js
const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
  setup() {
    // --- ДАННЫЕ ---
    const prices = ref(null);
    const orderItems = ref([]);
    const copyButton = ref(null); // Ссылка на кнопку для обратной связи

    const form = reactive({
      materialId: '',
      width: 1,
      height: 2,
      quantity: 1,
      grommetOption: 'none',
      needsCutting: true,
      layoutOption: 'none',
    });

    // --- ЛОГИКА И МЕТОДЫ (ОБЪЯВЛЕНЫ ТОЛЬКО ОДИН РАЗ) ---

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
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
    };

    const copyMarkdown = () => {
      if (grandTotal.value <= 0) return;
      const markdownText = generateMarkdown(calculatedItems.value, grandTotal.value, formatCurrency);
      const textArea = document.getElementById('markdown-output');
      
      textArea.value = markdownText;
      textArea.select();
      textArea.setSelectionRange(0, 99999); // Для мобильных устройств

      try {
        document.execCommand('copy');
        if (copyButton.value) {
            const originalText = copyButton.value.textContent;
            copyButton.value.textContent = 'Скопировано!';
            copyButton.value.style.backgroundColor = '#27ae60';
            setTimeout(() => {
                copyButton.value.textContent = originalText;
                copyButton.value.style.backgroundColor = '#42b883';
            }, 2000);
        }
      } catch (err) {
        console.error('Не удалось скопировать текст: ', err);
        alert('Не удалось скопировать текст.');
      }
    };
    
    // Возвращаем все необходимые данные и функции в шаблон
    return {
      prices,
      form,
      orderItems,
      calculatedItems,
      grandTotal,
      copyButton,
      addItem,
      removeItem,
      formatCurrency,
      copyMarkdown,
    };
  }
}).mount('#app');

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker зарегистрирован успешно.', reg))
      .catch(err => console.error('Ошибка регистрации Service Worker: ', err));
  });
}
