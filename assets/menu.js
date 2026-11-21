(function () {
  'use strict';

  const menu = document.getElementById('menu-body');
  if (!menu) return;

  const toolbar = document.querySelector('.menu-tools');
  const tabs = document.getElementById('menu-tabs');
  const search = document.getElementById('menu-search');
  const clear = document.getElementById('menu-search-clear');
  const status = document.getElementById('menu-search-status');
  const filters = Array.from(toolbar?.querySelectorAll('[data-filter]') || []);
  const buffet = document.getElementById('menu-buffet-result');
  const empty = document.getElementById('menu-empty');
  const tabLinks = new Map(Array.from(tabs?.querySelectorAll('a[href^="#"]') || [], link => [link.hash, link]));
  let filter = 'alle';

  function words(value) {
    return value.toLowerCase().normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/ß/g, 'ss')
      .replace(/([aou])e/g, '$1')
      .match(/[\p{L}\p{N}]+/gu) || [];
  }

  const groups = Array.from(menu.querySelectorAll('.mgroup'), element => {
    const heading = element.querySelector('.mgroup__head');
    const list = element.querySelector('.mlist');
    const groupText = heading.textContent + ' ' + (element.querySelector('.mgroup__note')?.textContent || '');
    const groupCodes = words(heading.querySelector('sup')?.textContent || '');
    const dishes = Array.from(list.querySelectorAll('.dish'), dish => {
      const number = words(dish.querySelector('.dish__no')?.textContent || '')[0];
      const codes = new Set(groupCodes);
      dish.querySelectorAll('.badge--allerg').forEach(badge => {
        words(badge.textContent).forEach(code => codes.add(code));
      });
      return {
        dish,
        number,
        codes,
        text: words(groupText + ' ' + dish.textContent).join(' '),
        tags: new Set((dish.dataset.tags || '').split(' ')),
        wide: (dish.querySelector('.opts')?.children.length || 0) > 5
      };
    });
    return { element, list, dishes, tab: tabLinks.get('#' + element.id) };
  });

  const buffetText = words(buffet.querySelector('b').textContent).join(' ');

  function applyFilters() {
    const value = search?.value || '';
    const query = words(value);
    const number = query.length === 1 && /^(?:[a-z]+)?\d+$/.test(query[0]) ? query[0] : null;
    const codes = query.length === 1 && /^[a-z]$/.test(query[0]) ||
      /[,/;]/.test(value) && query.length > 1 && query.every(word => /^[a-z]$/.test(word) || /^(?:[1-9]|1[0-8])$/.test(word));
    const showBuffet = filter === 'sushi' || (
      filter === 'alle' && query.length > 0 && query.every(word => buffetText.includes(word))
    );
    let count = 0;

    for (const { element, list, dishes, tab } of groups) {
      let groupCount = 0;
      let wide = false;
      for (const item of dishes) {
        const matchesFilter = filter === 'alle' || item.tags.has(filter);
        const matchesQuery = number ? item.number === number : query.every(word =>
          codes ? item.codes.has(word) : item.text.includes(word));
        item.dish.hidden = !matchesFilter || !matchesQuery;
        if (item.dish.hidden) continue;
        groupCount++;
        wide ||= item.wide;
      }
      count += groupCount;
      element.hidden = groupCount === 0;
      list.classList.toggle('mlist--wide', wide);
      if (tab) tab.hidden = element.hidden;
    }

    buffet.hidden = !showBuffet;
    empty.hidden = count > 0 || showBuffet;
    const buffetTab = tabLinks.get('#buffet');
    if (buffetTab) buffetTab.hidden = !showBuffet && (query.length > 0 || filter !== 'alle');
    if (tabs) tabs.hidden = !Array.from(tabLinks.values()).some(link => !link.hidden);
    if (clear) clear.classList.toggle('is-on', value.length > 0);
    if (status) {
      if (filter === 'sushi') status.textContent = 'Sushi gibt es am Buffet.';
      else if (query.length || filter !== 'alle') {
        const total = count + Number(showBuffet);
        status.textContent = total ? `${total} Treffer` : 'Keine Treffer.';
      } else status.textContent = '';
    }
    updateActiveTab();
  }

  function selectFilter(next) {
    filter = next;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  }

  filters.forEach(button => button.addEventListener('click', () => {
    selectFilter(button.dataset.filter);
    applyFilters();
  }));
  search?.addEventListener('input', applyFilters);
  clear?.addEventListener('click', () => {
    if (!search) return;
    search.value = '';
    applyFilters();
    search.focus();
  });

  tabs?.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const limit = tabs.scrollWidth - tabs.clientWidth;
    if (event.deltaY < 0 ? tabs.scrollLeft <= 0 : tabs.scrollLeft >= limit - 1) return;

    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? tabs.clientWidth : 1;
    tabs.scrollBy({ left: event.deltaY * unit, behavior: 'instant' });
  }, { passive: false });

  function restoreTarget(hash) {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    if (!target || !menu.contains(target) || !target.closest('[hidden]')) return;

    if (search) search.value = '';
    selectFilter('alle');
    applyFilters();
    return target;
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = restoreTarget(link.hash);
    if (target && window.location.hash === link.hash) target.scrollIntoView();
  });

  window.addEventListener('hashchange', () => restoreTarget(window.location.hash)?.scrollIntoView());
  menu.addEventListener('error', event => {
    const photo = event.target;
    if (!photo.matches('.dish__thumb img[src^="assets/menu/"]')) return;
    photo.alt = '';
    photo.src = 'assets/asia37-logo.webp';
  }, true);

  let activeTab;
  let frame;
  function updateActiveTab() {
    if (!toolbar || !tabs || tabs.hidden) return;
    const edge = toolbar.getBoundingClientRect().bottom + 24;
    let nextTab;
    for (const group of groups) {
      if (group.element.hidden) continue;
      if (group.element.getBoundingClientRect().top > edge) break;
      nextTab = group.tab;
    }
    if (nextTab === activeTab) return;
    activeTab?.classList.remove('is-active');
    activeTab?.removeAttribute('aria-current');
    activeTab = nextTab;
    if (!activeTab) return;
    activeTab.classList.add('is-active');
    activeTab.setAttribute('aria-current', 'location');
    const tabBox = activeTab.getBoundingClientRect();
    const rail = tabs.getBoundingClientRect();
    if (tabBox.left < rail.left || tabBox.right > rail.right) {
      tabs.scrollLeft += tabBox.left - rail.left + (tabBox.width - rail.width) / 2;
    }
  }

  function scheduleTabUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      updateActiveTab();
    });
  }

  function initializeOrders() {
    const requests = window.ASIA37_REQUESTS;
    if (!requests) return;

    for (const { dishes } of groups) {
      for (const { dish } of dishes) {
        const shared = document.getElementById(dish.dataset.pricedBy || '');
        const prices = Array.from(dish.querySelectorAll('.opts [data-price]'));
        const price = (shared || dish).querySelector('.dish__price[data-price]');
        if (!prices.length && !price) continue;

        const name = dish.querySelector('.dish__label').textContent;
        const number = dish.querySelector('.dish__no')?.textContent;
        const sharedName = shared?.querySelector('.dish__label').textContent;
        const label = [number, sharedName ? `${sharedName} – ${name}` : name].filter(Boolean).join(' ');
        const size = dish.querySelector('[data-size]')?.textContent;
        const controls = document.createElement('div');
        controls.className = 'dish__order';
        const button = document.createElement('button');
        button.className = 'btn btn--ghost btn--sm';
        button.type = 'button';
        button.dataset.add = dish.id;
        button.setAttribute('aria-label', `${label} hinzufügen`);
        button.textContent = '+ Hinzufügen';

        let select;
        if (prices.length) {
          select = document.createElement('select');
          select.setAttribute('aria-label', `Variante für ${label}`);
          select.add(new Option('Variante wählen', ''));
          prices.forEach((choice, index) => {
            const name = choice.closest('li').querySelector('.option__label').textContent;
            select.add(new Option(`${name} · ${choice.textContent}`, String(index)));
          });
          select.addEventListener('change', () => select.setCustomValidity(''));
          controls.append(select);
        }

        button.addEventListener('click', () => {
          if (select && select.value === '') {
            select.setCustomValidity('Bitte wählen Sie eine Variante.');
            select.reportValidity();
            select.focus();
            return;
          }
          const selected = select ? prices[Number(select.value)] : price;
          const variant = select ? selected.closest('li').querySelector('.option__label').textContent : size;
          requests.add({
            key: select ? `${dish.id}:${select.value}` : dish.id,
            label: variant ? `${label} – ${variant}` : label,
            price: Number(selected.dataset.price)
          });
        });

        controls.append(button);
        dish.querySelector('.dish__main').append(controls);
      }
    }
  }

  if (toolbar) {
    toolbar.hidden = false;
    toolbar.querySelectorAll('.search, .filters').forEach(control => { control.hidden = false; });
  }
  if (window.ASIA37_REQUESTS) initializeOrders();
  else document.addEventListener('DOMContentLoaded', initializeOrders, { once: true });

  window.addEventListener('scroll', scheduleTabUpdate, { passive: true });
  window.addEventListener('resize', scheduleTabUpdate);
  applyFilters();
})();
