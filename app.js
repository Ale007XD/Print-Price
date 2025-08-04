// Этот файл: app.js

const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
  setup() {
    // Данные
    const prices = ref(null);
    const form = reactive({
      materialId: '',
      width: 1,
      height: 2,
      quantity: 1,
      grommetOption: 'none',
      needsCutting: true,
      layoutOption: 'none',
    });

    // Загрузка цен при старте
    onMounted(async () => {
      try {
        const response = await fetch('prices.json');
        prices.value = await response.json();
        // Устанавливаем значение по умолчанию после загрузки цен
        if (prices.value && prices.value.materials.length > 0) {
          form.materialId = prices.value.materials[0].id;
        }
      } catch (error) {
        console.error("Не удалось загрузить файл с ценами:", error);
        alert("Ошибка загрузки цен. Функционал может быть ограничен.");
      }
    });

    // Реактивный расчёт
    const calculation = computed(() => {
      if (!prices.value) {
        return { total: 0, breakdown: {} };
      }
      return calculateTotalCost(form, prices.value);
    });

    // Методы
    const formatCurrency = (value) => {
      if (typeof value !== 'number') return '';
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
    };

    const exportToPDF = () => {
      if (calculation.value.total > 0) {
        generatePdf(form, calculation.value, prices.value);
      }
    };

    // Возвращаем все, что нужно в шаблоне
    return {
      form,
      prices,
      calculation,
      formatCurrency,
      exportToPDF,
    };
  }
}).mount('#app');

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/banner-calculator/sw.js') // Укажите путь с учетом имени репозитория
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}
