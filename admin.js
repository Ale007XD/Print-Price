// Админ-страница: без "макета" и без "реза". Поля ширины/высоты без предустановленных значений.
const { createApp, ref, reactive, computed } = Vue;

createApp({
  setup() {
    const authorized = ref(false);
    const authLoading = ref(false);
    const authError = ref('');
    const loginInput = ref('');
    const passwordInput = ref('');
    const prices = ref(null);
    const orderItems = ref([]);

    const form = reactive({
      materialId: '',
      width: null,
      height: null,
      quantity: null,
      grommetOption: 'none'
    });

    const showTextExport = ref(false);
    const markdownText = ref('');

    async function doAuth() {
      authError.value = '';
      if (!loginInput.value || !passwordInput.value) {
        authError.value = 'Введите логин и пароль';
        return;
      }
      authLoading.value = true;
      try {
        const [saltBuf, lockBuf] = await Promise.all([
          fetch('./admin-lock.salt', { cache: 'no-store' }).then(r => {
            if (!r.ok) throw new Error('salt fetch failed'); return r.arrayBuffer();
          }),
          fetch('./admin-lock.json.enc', { cache: 'no-store' }).then(r => {
            if (!r.ok) throw new Error('lock fetch failed'); return r.arrayBuffer();
          })
        ]);
        const salt = new Uint8Array(saltBuf);

        const key = await deriveKeyFromCredentials(loginInput.value, passwordInput.value, salt);

        const okPlain = await decryptAesGcm(lockBuf, key);
        const okJson = JSON.parse(new TextDecoder().decode(okPlain));
        if (!okJson?.ok) throw new Error('bad lock');

        const encPrices = await fetch('./admin-prices.json.enc', { cache: 'no-store' }).then(r => {
          if (!r.ok) throw new Error('prices enc fetch failed'); return r.arrayBuffer();
        });
        const pricesPlain = await decryptAesGcm(encPrices, key);
        prices.value = JSON.parse(new TextDecoder().decode(pricesPlain));

        if (!prices.value?.materials?.length) throw new Error('empty materials');
        form.materialId = prices.value.materials[0].id;
        authorized.value = true;

        passwordInput.value = '';
      } catch (e) {
        console.error(e);
        authError.value = 'Неверные логин или пароль';
        authorized.value = false;
      } finally {
        authLoading.value = false;
      }
    }

    function logout() {
      authorized.value = false;
      prices.value = null;
      orderItems.value = [];
      loginInput.value = '';
      passwordInput.value = '';
      showTextExport.value = false;
      markdownText.value = '';
      // сбрасываем форму
      form.materialId = '';
      form.width = null;
      form.height = null;
      form.quantity = null;
      form.grommetOption = 'none';
    }

    const calculatedItems = computed(() => {
      if (!prices.value || orderItems.value.length === 0) return [];
      return orderItems.value.map(item => {
        const result = calculateTotalCostAdmin(item, prices.value);
        const options = [];
        if (item.grommetOption === 'corners') {
          options.push(`Люверсы - ${prices.value.grommets.corners?.name || '4 по углам'}`);
        } else if (item.grommetOption === 'perimeter') {
          options.push(`Люверсы - ${prices.value.grommets.perimeter?.name || 'По периметру'}`);
        } else {
          options.push('Люверсы - Без');
        }

        const details = {
          ...item,
          materialName: prices.value.materials.find(m => m.id === item.materialId)?.name || 'Неизвестно',
          optionsString: options.join(', ')
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

    function exportTxt() {
      if (grandTotal.value <= 0) return;
      const txtText = generateMarkdown(calculatedItems.value, grandTotal.value, formatCurrency);
      const BOM = '\uFEFF';
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth()+1).padStart(2, '0');
      const totalSum = Math.round(grandTotal.value);
      const filename = `admin_raschet_${year}-${month}_${totalSum}rub.txt`;
      const blob = new Blob([BOM + txtText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function showExport() {
      markdownText.value = generateMarkdown(calculatedItems.value, grandTotal.value, formatCurrency);
      showTextExport.value = true;
    }

    function copyResultMarkdown() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(markdownText.value)
          .then(() => alert('Текст скопирован в буфер обмена!'))
          .catch(() => fallbackCopy());
      } else {
        fallbackCopy();
      }
      function fallbackCopy() {
        const ta = document.createElement('textarea');
        ta.value = markdownText.value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('Текст скопирован в буфер обмена!');
      }
    }

    return {
      authorized, authLoading, authError, loginInput, passwordInput,
      doAuth, logout,
      prices, form, orderItems, calculatedItems, grandTotal,
      addItem, removeItem, formatCurrency, exportTxt, showExport, showTextExport, markdownText, copyResultMarkdown
    };
  }
}).mount('#app');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker зарегистрирован (admin).', reg))
      .catch(err => console.error('SW error (admin): ', err));
  });
}
