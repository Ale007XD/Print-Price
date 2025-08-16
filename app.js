const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
  setup() {
    const prices = ref({
      materials: [],
      grommets: { none: { name: 'Без', price: 0 }, corners: { name: '4 по углам', price: 0 }, perimeter: { name: 'По периметру', pricePerPiece: 0, step: 0.25 } },
      layout: null
    });
    const orderItems = ref([]);

    const form = reactive({
      materialId: '',
      width: null,
      height: null,
      quantity: null,
      grommetOption: 'none',
      layoutOption: 'none'
    });

    const showTextExport = ref(false);
    const markdownText = ref('');

    // Загрузка публичного прайса (как в исходном проекте, из prices.json)
    (async function loadPublicPrices() {
      try {
        const r = await fetch('./prices.json', { cache: 'no-store' });
        if (r.ok) {
          prices.value = await r.json();
          if (prices.value?.materials?.length && !form.materialId) {
            form.materialId = prices.value.materials[0].id;
          }
        }
      } catch (e) {
        console.error('Не удалось загрузить прайс:', e);
      }
    })();

    const calculatedItems = computed(() => {
      if (!prices.value || orderItems.value.length === 0) return [];
      return orderItems.value.map(item => {
        // Публичная версия использует calculateTotalCost (с макетом, без реза)
        const result = calculateTotalCost(item, prices.value);
        const opts = [];
        if (item.grommetOption === 'corners') {
          opts.push(`Люверсы - ${prices.value.grommets.corners?.name || '4 по углам'}`);
        } else if (item.grommetOption === 'perimeter') {
          opts.push(`Люверсы - ${prices.value.grommets.perimeter?.name || 'По периметру'}`);
        } else {
          opts.push('Люверсы - Без');
        }
        opts.push(`Макет - ${item.layoutOption === 'create' ? 'Разработка' : 'Свой'}`);

        const details = {
          ...item,
          materialName: prices.value.materials.find(m => m.id === item.materialId)?.name || 'Неизвестно',
          optionsString: opts.join(', ')
        };
        return { id: item.id, details, result };
      });
    });

    const grandTotal = computed(() =>
      calculatedItems.value.reduce((t, it) => t + it.result.total, 0)
    );

    function addItem() {
      const width = Number(form.width);
      const height = Number(form.height);
      const quantity = Number(form.quantity);
      if (!form.materialId) {
        alert('Выберите материал.');
        return;
      }
      if (!Number.isFinite(width) || width <= 0) {
        alert('Введите корректную ширину (м).');
        return;
      }
      if (!Number.isFinite(height) || height <= 0) {
        alert('Введите корректную высоту (м).');
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        alert('Введите корректное количество (шт).');
        return;
      }
      orderItems.value.push({
        materialId: form.materialId,
        width, height, quantity,
        grommetOption: form.grommetOption,
        layoutOption: form.layoutOption,
        id: Date.now() + Math.random()
      });
    }

    function removeItem(id) {
      orderItems.value = orderItems.value.filter(i => i.id !== id);
    }

    function formatCurrency(value) {
      if (typeof value !== 'number') return '';
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
    }

    function showExport() {
      markdownText.value = generateMarkdown(calculatedItems.value, grandTotal.value, formatCurrency);
      showTextExport.value = true;
    }

    function exportTxt() {
      if (grandTotal.value <= 0) return;
      const txtText = generateMarkdown(calculatedItems.value, grandTotal.value, formatCurrency);
      const BOM = '\uFEFF';
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth()+1).padStart(2, '0');
      const totalSum = Math.round(grandTotal.value);
      const filename = `raschet_zakaza_${year}-${month}_${totalSum}rub.txt`;
      const blob = new Blob([BOM + txtText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function copyResultMarkdown() {
      const text = markdownText.value || '';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => alert('Скопировано!')).catch(() => fallback());
      } else fallback();
      function fallback() {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        alert('Скопировано!');
      }
    }

    return {
      prices, form, orderItems, calculatedItems, grandTotal,
      addItem, removeItem, formatCurrency, showTextExport, showExport, exportTxt, markdownText, copyResultMarkdown
    };
  }
}).mount('#app');
