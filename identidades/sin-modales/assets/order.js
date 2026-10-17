(() => {
  const base = '/identidades/sin-modales/';
  const menuUrl = `${base}carta/`;
  const orderUrl = `${base}pedido/`;
  const storageKey = 'sin-modales-static-cart-v1';
  const points = ['POCO HECHA', 'PUNTO MENOS', 'AL PUNTO', 'PUNTO MÁS', 'MUY HECHA'];
  const products = {
    'la-clasica': { name: 'LA CLÁSICA', price: 950, image: '/assets/img/identidades/sin-modales/menu/la-clasica.webp', beef: true },
    'la-bruta': { name: 'LA BRUTA', price: 1250, image: '/assets/img/identidades/sin-modales/web/hamburguesa.webp', beef: true },
    'la-verde': { name: 'LA VERDE', price: 1150, image: '/assets/img/identidades/sin-modales/menu/la-verde.webp', beef: true },
    'la-exigente': { name: 'LA EXIGENTE', price: 1150, image: '/assets/img/identidades/sin-modales/menu/la-exigente.webp', beef: true },
    'patatas-crujientes': { name: 'PATATAS CRUJIENTES', price: 350, image: '/assets/img/identidades/sin-modales/menu/patatas-crujientes.webp', beef: false },
    'aros-de-cebolla': { name: 'AROS DE CEBOLLA', price: 450, image: '/assets/img/identidades/sin-modales/menu/aros-de-cebolla.webp', beef: false },
    'tiras-de-pollo': { name: 'TIRAS DE POLLO', price: 500, image: '/assets/img/identidades/sin-modales/menu/tiras-de-pollo.webp', beef: false },
  };
  const money = cents => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  const productUrl = slug => `${menuUrl}${slug}/`;
  let cart = readCart();
  let chosenPoint = 'AL PUNTO';
  let chosenQuantity = 1;
  let customizing = null;
  let toastTimer;

  function readCart() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(saved)) return [];
      return saved.filter(item => item && Object.hasOwn(products, item.slug) &&
        (item.point === null || (products[item.slug].beef && points.includes(item.point))) &&
        Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99
      ).map(item => ({ slug: item.slug, point: item.point, quantity: item.quantity }));
    } catch { return []; }
  }

  function saveCart() {
    sessionStorage.setItem(storageKey, JSON.stringify(cart));
    document.querySelectorAll('.cart-trigger span').forEach(span => { span.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0)); });
  }

  function addItem(slug, point, quantity) {
    const current = cart.find(item => item.slug === slug && item.point === point);
    if (current) current.quantity = Math.min(99, current.quantity + quantity);
    else cart.push({ slug, point, quantity });
    saveCart();
    dialog.close();
    showToast(`${quantity} × ${products[slug].name}`);
  }

  function showToast(label) {
    clearTimeout(toastTimer);
    document.querySelector('.cart-added')?.remove();
    const toast = document.createElement('div');
    toast.className = 'cart-added';
    toast.setAttribute('role', 'status');
    const copy = document.createElement('div');
    copy.innerHTML = '<span>AÑADIDO AL CARRITO</span>';
    const name = document.createElement('strong');
    name.textContent = label;
    copy.append(name);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'VER CARRITO';
    button.addEventListener('click', openCart);
    toast.append(copy, button);
    document.body.append(toast);
    toastTimer = setTimeout(() => toast.remove(), 4500);
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'order-dialog';
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.body.append(dialog);

  function panelHead(label) {
    return `<div class="order-panel-head"><span>${label}</span><button type="button" data-close aria-label="Cerrar">CERRAR</button></div>`;
  }

  function openCustomizer(slug) {
    customizing = slug;
    chosenPoint = 'AL PUNTO';
    chosenQuantity = 1;
    const product = products[slug];
    dialog.innerHTML = `<div class="order-panel">${panelHead('HAZLA TUYA / 01')}
      <p class="order-eyebrow">ANTES DE HINCARLE EL DIENTE</p><h2>${product.name}<span>.</span></h2>
      <div class="order-customizer"><div class="order-cook-photo"><img src="/assets/img/identidades/sin-modales/web/puntos-coccion.webp" alt="Cinco cortes de hamburguesa con distintos puntos de cocción"></div>
      <div><p class="order-prompt">¿CÓMO QUIERES LA CARNE?</p><fieldset class="cooking-choices"><legend class="sr-only">Punto de cocción</legend>
      ${points.map((point, index) => `<label class="${point === chosenPoint ? 'selected' : ''}"><input type="radio" name="cooking-point" value="${point}" ${point === chosenPoint ? 'checked' : ''}><span>${String(index + 1).padStart(2, '0')}</span><strong>${point}</strong></label>`).join('')}
      </fieldset></div></div><div class="order-actions"><div class="order-quantity"><button type="button" data-custom-qty="-1" aria-label="Quitar una unidad">−</button><span>1</span><button type="button" data-custom-qty="1" aria-label="Añadir una unidad">+</button></div><button type="button" class="order-primary" data-confirm-add>AÑADIR · ${money(product.price)}</button></div></div>`;
    dialog.showModal();
  }

  function openCart() {
    clearTimeout(toastTimer);
    document.querySelector('.cart-added')?.remove();
    customizing = null;
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + products[item.slug].price * item.quantity, 0);
    dialog.innerHTML = `<div class="order-panel cart-panel">${panelHead(`TU PEDIDO / ${String(count).padStart(2, '0')}`)}<h2>EL CARRITO<span>.</span></h2>
      ${cart.length ? `<ul class="cart-items">${cart.map((item, index) => {
        const product = products[item.slug];
        return `<li><a class="cart-item-photo" href="${productUrl(item.slug)}" aria-label="Ver ficha de ${product.name}"><img src="${product.image}" alt=""></a>
        <div class="cart-item-info"><a href="${productUrl(item.slug)}" aria-label="Ver ficha de ${product.name}"><strong>${product.name}</strong></a>${item.point ? `<span>${item.point}</span>` : ''}<small>${money(product.price)}</small></div>
        <div class="cart-item-actions"><div class="cart-item-controls"><button type="button" data-line="${index}" data-change="-1" aria-label="Quitar una unidad de ${product.name}">−</button><span>${item.quantity}</span><button type="button" data-line="${index}" data-change="1" aria-label="Añadir una unidad de ${product.name}">+</button></div>
        <button type="button" class="cart-item-remove" data-line="${index}" data-remove aria-label="Eliminar ${product.name} del carrito" title="Eliminar producto"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v6m4-6v6"/></svg></button></div></li>`;
      }).join('')}</ul><div class="cart-total"><span>TOTAL</span><strong>${money(total)}</strong></div><a href="${orderUrl}" class="order-primary">CONTINUAR PEDIDO</a>` : '<p class="cart-empty">Todavía no has elegido tu vicio.</p>'}</div>`;
    if (!dialog.open) dialog.showModal();
  }

  dialog.addEventListener('change', event => {
    if (event.target.matches('input[name="cooking-point"]')) {
      chosenPoint = event.target.value;
      dialog.querySelectorAll('.cooking-choices label').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked));
    }
  });
  dialog.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.hasAttribute('data-close')) { dialog.close(); return; }
    if (target.hasAttribute('data-custom-qty')) {
      chosenQuantity = Math.max(1, Math.min(99, chosenQuantity + Number(target.dataset.customQty)));
      dialog.querySelector('.order-quantity span').textContent = String(chosenQuantity);
      dialog.querySelector('[data-confirm-add]').textContent = `AÑADIR · ${money(products[customizing].price * chosenQuantity)}`;
      return;
    }
    if (target.hasAttribute('data-confirm-add')) { addItem(customizing, chosenPoint, chosenQuantity); return; }
    const index = Number(target.dataset.line);
    if (!Number.isInteger(index) || !cart[index]) return;
    if (target.hasAttribute('data-remove')) cart.splice(index, 1);
    else if (target.hasAttribute('data-change')) {
      cart[index].quantity += Number(target.dataset.change);
      if (cart[index].quantity <= 0) cart.splice(index, 1);
      else cart[index].quantity = Math.min(99, cart[index].quantity);
    }
    saveCart();
    openCart();
  });

  function installMenuControls() {
    const header = document.querySelector('.live-menu-header');
    if (header) {
      const back = header.querySelector('.live-menu-back');
      const actions = document.createElement('div');
      actions.className = 'menu-header-actions';
      if (back) actions.append(back);
      const trigger = document.createElement('button');
      trigger.className = 'cart-trigger';
      trigger.type = 'button';
      trigger.innerHTML = `CARRITO <span>${cart.reduce((sum, item) => sum + item.quantity, 0)}</span>`;
      trigger.addEventListener('click', openCart);
      actions.append(trigger);
      header.append(actions);
    }
    document.querySelector('.doneness-guide')?.remove();
    document.querySelectorAll('.menu-product-grid li').forEach(li => {
      const slug = li.querySelector('.menu-product-card')?.getAttribute('href')?.split('/').filter(Boolean).at(-1);
      if (!products[slug]) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'add-to-cart menu-product-add';
      button.textContent = 'AÑADIR AL CARRITO';
      button.addEventListener('click', () => products[slug].beef ? openCustomizer(slug) : addItem(slug, null, 1));
      li.append(button);
    });
    const detail = document.querySelector('.product-detail-info');
    if (detail) {
      const slug = location.pathname.split('/').filter(Boolean).at(-1);
      if (products[slug]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'add-to-cart product-detail-add';
        button.textContent = 'AÑADIR AL CARRITO';
        button.addEventListener('click', () => products[slug].beef ? openCustomizer(slug) : addItem(slug, null, 1));
        detail.querySelector('.product-detail-return')?.before(button);
      }
    }
  }

  function renderCheckout() {
    const root = document.querySelector('#checkout-root');
    if (!root) return;
    const total = cart.reduce((sum, item) => sum + products[item.slug].price * item.quantity, 0);
    root.innerHTML = `<div class="checkout-wrap"><div class="checkout-heading"><span>03 / TU PEDIDO</span><h1>YA CASI<br><em>ESTÁ.</em></h1><p>Elige cómo te llega el antojo. Esta es una demostración: no hay cobro ni envío real.</p></div>
      ${cart.length ? `<form class="checkout-grid" id="demo-order"><div class="checkout-options"><fieldset class="delivery-choices"><legend>¿CÓMO LO QUIERES?</legend>
      <label class="selected"><input type="radio" name="method" value="pickup" checked><strong>RECOGIDA EN LOCAL</strong><span>Pasas a por él cuando esté listo.</span></label>
      <label><input type="radio" name="method" value="delivery"><strong>A DOMICILIO</strong><span>El antojo va hacia ti.</span></label></fieldset>
      <div class="checkout-fields"><h2>TUS DATOS</h2><label>Nombre<input name="name" autocomplete="name" required placeholder="Cómo te llamamos"></label><label>Teléfono<input name="phone" autocomplete="tel" type="tel" required placeholder="Para avisarte"></label>
      <div class="delivery-fields" hidden><label>Dirección<input name="address" autocomplete="street-address" placeholder="Calle y número"></label><label>Código postal<input name="postal-code" autocomplete="postal-code" inputmode="numeric" placeholder="Código postal"></label></div>
      <label>¿Algo que debamos saber?<textarea name="notes" rows="3" placeholder="Opcional"></textarea></label></div></div>
      <aside class="checkout-summary"><h2>LO QUE TE LLEVAS</h2><ul>${cart.map(item => `<li><div><strong>${item.quantity} × ${products[item.slug].name}</strong>${item.point ? `<span>${item.point}</span>` : ''}</div><b>${money(products[item.slug].price * item.quantity)}</b></li>`).join('')}</ul><div class="checkout-total"><span>SUBTOTAL</span><strong>${money(total)}</strong></div><p>La entrega y el pago no están activos en esta demostración.</p><button class="order-primary" type="submit">SIMULAR PEDIDO · SIN COBRO</button></aside></form>` : `<div class="checkout-empty"><p>Tu carrito está vacío. Eso tiene arreglo.</p><a href="${menuUrl}" class="order-primary">VER LA CARTA</a></div>`}</div>`;
    const form = root.querySelector('#demo-order');
    if (!form) return;
    form.addEventListener('change', event => {
      if (event.target.name !== 'method') return;
      form.querySelectorAll('.delivery-choices label').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked));
      const delivery = event.target.value === 'delivery';
      form.querySelector('.delivery-fields').hidden = !delivery;
      form.querySelectorAll('.delivery-fields input').forEach(input => { input.required = delivery; });
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!cart.length) return;
      const method = form.querySelector('input[name="method"]:checked').value;
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      const code = `SM-${Math.floor(10000 + Math.random() * 90000)}`;
      cart = [];
      saveCart();
      root.innerHTML = `<section class="checkout-confirmation"><p class="checkout-overline">PEDIDO DE DEMOSTRACIÓN / ${code}</p><h1>BUEN<br><em>ANTOJO.</em></h1><p>Así se vería la confirmación de un pedido ${method === 'pickup' ? 'para recoger en el local' : 'con entrega a domicilio'}. No se ha cobrado ni enviado a cocina.</p><div class="checkout-confirmation-summary"><strong>${count} PRODUCTOS</strong><strong>${money(total)}</strong></div><a href="${menuUrl}" class="order-primary">VOLVER A LA CARTA</a></section>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.querySelector('.header-cta')?.setAttribute('href', menuUrl);
  installMenuControls();
  renderCheckout();
  saveCart();
})();
