// Этот файл: app.js
const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
  setup() {
    const prices = ref(null);
    const orderItems = ref([]);
    const copyButton = ref(null); // Ссылка на кнопку для смены текста
    
    const form = reactive({ /* ... без изменений ... */ });
    
    onMounted(async () => { /* ... без изменений ... */ });

    const calculatedItems = computed(() => { /* ... без изменений ... */ });
    const grandTotal = computed(() => { /* ... без изменений ... */ });
    const addItem = () => { /* ... без изменений ... */ };
    const removeItem = () => { /* ... без изменений ... */ };
    const formatCurrency = (value) => { /* ... без изменений ... */ };
    
    // --- НОВАЯ ФУНКЦИЯ КОПИРОВАНИЯ ---
    const copyMarkdown = () => {
      if (grandTotal.value <= 0) return;

      const markdownText = generateMarkdown(calculatedItems.value, grandTotal.value, formatCurrency);
      const textArea = document.getElementById('markdown-output');
      
      textArea.value = markdownText;
      textArea.select();

      try {
        document.execCommand('copy');
        
        // Обратная связь для пользователя
        if (copyButton.value) {
            const originalText = copyButton.value.textContent;
            copyButton.value.textContent = 'Скопировано!';
            copyButton.value.style.backgroundColor = '#27ae60'; // Зеленый цвет успеха
            setTimeout(() => {
                copyButton.value.textContent = originalText;
                copyButton.value.style.backgroundColor = '#42b883';
            }, 2000);
        }

      } catch (err) {
        console.error('Не удалось скопировать текст: ', err);
        alert('Не удалось скопировать текст. Пожалуйста, сделайте это вручную.');
      }
    };
    
    // Пересобираем setup() с учетом всех функций, которые не менялись
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
            if (item.grommetOption === 'corners') options.push(`Люверсы - ${prices.value.grommets.corners.name}`);
            else if (item.grommetOption === 'perimeter') options.push(`Люверсы - ${prices.value.grommets.perimeter.name}`);
            else options.push('Люверсы - Без');
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

    const grandTotal = computed(() => calculatedItems.value.reduce((total, item) => total + item.result.total, 0));
    const addItem = () => {
        if (form.width <= 0 || form.height <= 0 || form.quantity <= 0) {
            alert("Пожалуйста, введите корректные размеры и количество.");
            return;
        }
        orderItems.value.push({ ...form, id: Date.now() });
    };
    const removeItem = (id) => { orderItems.value = orderItems.value.filter(item => item.id !== id); };

    return {
      prices, form, orderItems, calculatedItems, grandTotal,
      addItem, removeItem, formatCurrency, copyMarkdown,
      copyButton // Возвращаем ссылку на кнопку
    };
  }
}).mount('#app');

// Service Worker остается без изменений
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker зарегистрирован успешно.', reg))
      .catch(err => console.error('Ошибка регистрации Service Worker: ', err));
  });
}
