(function () {
  'use strict';

  const cart = [];
  const maxQuantity = 99;
  const euros = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const berlinTime = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  const orderForm = document.getElementById('order-form');
  const reservationForm = document.getElementById('reservation-form');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count');
  const cartStatus = document.getElementById('cart-status');
  const cartShortcut = document.getElementById('cart-shortcut');
  const cartShortcutSummary = document.getElementById('cart-shortcut-summary');
  const orderButton = orderForm.querySelector('button[type="submit"]');
  let orderFormVisible = false;

  function berlinNow() {
    const parts = Object.fromEntries(berlinTime.formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  function total() {
    return cart.reduce((sum, row) => sum + row.price * row.quantity, 0);
  }

  function clearDraft(form) {
    form.querySelector('.request-result').hidden = true;
    form.querySelector('[data-request-summary]').textContent = '';
  }

  function render() {
    const scrollTop = cartItems.scrollTop;
    cartItems.replaceChildren();
    if (!cart.length) cartItems.textContent = 'Noch keine Gerichte ausgewählt.';

    cart.forEach(row => {
      const line = document.createElement('div');
      line.className = 'cart-row';
      const name = document.createElement('span');
      name.textContent = row.label;
      const controls = document.createElement('div');
      controls.className = 'cart-row__controls';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('data-quantity', 'decrease');
      minus.setAttribute('aria-label', `${row.label}: Menge verringern / entfernen`);
      minus.addEventListener('click', () => changeQuantity(row, -1));
      const quantity = document.createElement('span');
      quantity.textContent = row.quantity;
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.disabled = row.quantity >= maxQuantity;
      plus.setAttribute('data-quantity', 'increase');
      plus.setAttribute('aria-label', `${row.label}: Menge erhöhen`);
      plus.addEventListener('click', () => changeQuantity(row, 1));
      const price = document.createElement('strong');
      price.textContent = euros.format(row.price * row.quantity / 100);
      controls.append(minus, quantity, plus, price);
      line.append(name, controls);
      cartItems.append(line);
    });

    cartItems.scrollTop = scrollTop;
    const count = cart.reduce((sum, row) => sum + row.quantity, 0);
    const formattedTotal = euros.format(total() / 100);
    cartTotal.textContent = formattedTotal;
    cartCount.textContent = `(${count})`;
    cartShortcutSummary.textContent = `${count} ${count === 1 ? 'Gericht' : 'Gerichte'} · ${formattedTotal}`;
    cartShortcut.hidden = !count || orderFormVisible;
    document.body.classList.toggle('has-cart', count > 0);
    orderButton.disabled = !count;
    clearDraft(orderForm);
  }

  function changeQuantity(row, change) {
    const index = cart.indexOf(row);
    row.quantity += change;
    if (!row.quantity) cart.splice(index, 1);
    render();

    const line = cartItems.children[Math.min(index, cart.length - 1)];
    const selector = change > 0 ? '[data-quantity="increase"]:not(:disabled)' : '[data-quantity="decrease"]';
    const nextControl = line?.querySelector(selector) || line?.querySelector('[data-quantity="decrease"]');
    (nextControl || cartItems).focus({ preventScroll: true });
    cartStatus.textContent = row.quantity ? `${row.label}: ${row.quantity} ausgewählt.` : `${row.label} entfernt.`;
  }

  function add(item) {
    if (!item || !item.key || !item.label || !Number.isSafeInteger(item.price) || item.price <= 0) return;
    const { key, label, price } = item;
    const existing = cart.find(row => row.key === key);
    if (existing && existing.quantity >= maxQuantity) {
      cartStatus.textContent = `Maximal ${maxQuantity} Portionen je Gericht und Variante.`;
      return;
    }
    if (existing) existing.quantity++;
    else cart.push({ key, label, price, quantity: 1 });
    render();
    cartStatus.textContent = `${label} hinzugefügt.`;
  }

  function summary(form, details) {
    const date = details.date.split('-').reverse().join('.');
    const lines = [
      `Name: ${details.name.trim()}`,
      `Telefon: ${details.phone.trim()}`,
      `${date}, ${details.time} Uhr (Wiesmoor)`
    ];
    if (form === orderForm) {
      lines.push('');
      cart.forEach(row => lines.push(`${row.quantity} × ${row.label} = ${euros.format(row.price * row.quantity / 100)}`));
      lines.push(`Gesamt: ${euros.format(total() / 100)}`);
    } else {
      lines.push(`Personen: ${details.guests}`);
    }
    if (details.notes.trim()) lines.push('', `Hinweise: ${details.notes.trim()}`);
    return lines.join('\n');
  }

  [orderForm, reservationForm].forEach(form => {
    const error = form.querySelector('.request-error');
    const result = form.querySelector('.request-result');
    form.elements.date.min = berlinNow().slice(0, 10);
    form.addEventListener('input', () => {
      error.textContent = '';
      clearDraft(form);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      error.textContent = '';
      clearDraft(form);
      const details = Object.fromEntries(new FormData(form));
      if (!details.name.trim() || !details.phone.trim()) {
        error.textContent = 'Bitte geben Sie Ihren Namen und Ihre Telefonnummer ein.';
        return;
      }
      if (`${details.date}T${details.time}` <= berlinNow()) {
        error.textContent = 'Bitte wählen Sie einen Termin in der Zukunft (Ortszeit Wiesmoor).';
        return;
      }
      if (form === orderForm && !cart.length) {
        error.textContent = 'Bitte wählen Sie zuerst ein Gericht aus.';
        return;
      }
      form.querySelector('[data-request-summary]').textContent = summary(form, details);
      result.hidden = false;
      form.querySelector('[data-request-status]').focus();
    });
    form.hidden = false;
    form.inert = false;
  });

  if ('IntersectionObserver' in window) {
    const formObserver = new IntersectionObserver(([entry]) => {
      orderFormVisible = entry.isIntersecting;
      cartShortcut.hidden = !cart.length || orderFormVisible;
    }, { rootMargin: '-80px 0px -80px 0px' });
    formObserver.observe(orderForm);
  }

  render();
  window.ASIA37_REQUESTS = { add };
})();
