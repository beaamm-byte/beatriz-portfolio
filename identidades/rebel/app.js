const toggle = document.querySelector('.menu-toggle');
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
  let activeGestures = 0;
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') return;
    activeGestures += 1;
    document.body.classList.add('cursor-clicking');
    const mark = document.createElement('span');
    mark.className = 'cursor-gesture';
    mark.style.left = `${event.clientX}px`;
    mark.style.top = `${event.clientY}px`;
    mark.innerHTML = '<svg viewBox="0 0 48 44" aria-hidden="true"><g transform="translate(47 1) rotate(90) scale(.72)"><path d="M6 2 C14 4 28 7 34 13 C41 20 41 26 32 32 L21 37 L35 56 Q37 60 33 61 Q30 61 28 57 L17 39 L3 48 Q0 50 1 46 L13 27 Q17 21 19 23 Q21 25 18 29 L15 33 Q16 36 20 33 L29 27 Q34 24 31 20 Q27 15 20 12 L6 6 Q3 5 4 3 Q4 2 6 2 Z"/></g></svg>';
    document.body.append(mark);
    mark.addEventListener('animationend', (animationEvent) => {
      if (animationEvent.target !== mark) return;
      mark.remove();
      activeGestures -= 1;
      if (activeGestures === 0) document.body.classList.remove('cursor-clicking');
    });
  });
}
const mobileNav = document.querySelector('.mobile-nav');
if (toggle && mobileNav) {
  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    mobileNav.hidden = true;
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    mobileNav.hidden = !open;
  });
  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

const root = document.querySelector('[data-collection-root]');
if (root) {
  const collections = {
    rebel: {
      name: 'REBEL Collection', index: '[ 01 / REBEL COLLECTION ]', title: 'REBEL<br>COLLECTION',
      deck: 'Relieve urbano, rojo intenso y piezas que entran en escena contigo.',
      statement: 'Una textura que no pasa desapercibida.',
      story: 'El punto de partida es el pavimento podotáctil: un relieve cotidiano convertido en superficie, ritmo y actitud. Las editoriales muestran los primeros accesorios de la colección en la calle.',
      cover: 'assets/rebel-editorial-01.jpg', coverAlt: 'Mochila bandolera roja de REBEL Collection llevada por la ciudad',
      images: [
        ['assets/rebel-editorial-01.jpg', 'Mochila bandolera / editorial', 'Mochila bandolera roja cruzada en un look urbano nocturno'],
        ['assets/rebel-editorial-02.jpg', 'Riñonera / editorial', 'Riñonera roja con relieve en un look nocturno'],
        ['assets/rebel-editorial-03.jpg', 'Accesorios / editorial', 'Gorra y accesorio rojo con relieve en la calle']
      ], next: 'troquel', nextName: 'TROQUEL'
    },
    troquel: {
      name: 'TROQUEL Collection', index: '[ 02 / TROQUEL COLLECTION ]', title: 'TROQUEL<br>COLLECTION',
      deck: 'Recortes, sombras y estructura. La calle vista a través de sus vacíos.',
      statement: 'Lo que falta también dibuja la forma.',
      story: 'Una pieza metálica perforada dio origen a un lenguaje de recortes y aperturas. En negro, la colección deja que la luz revele la construcción de cada accesorio.',
      cover: 'assets/troquel-editorial-01.jpg', coverAlt: 'Totebag negro perforado de Troquel Collection llevado en la calle',
      images: [
        ['assets/troquel-editorial-01.jpg', 'Totebag / editorial', 'Totebag negro grande con panel perforado'],
        ['assets/troquel-editorial-02.jpg', 'Bolso / editorial', 'Bolso negro con detalle troquelado en escena nocturna'],
        ['assets/tc-porta-botellas-editorial.jpg', 'Portabotellas / editorial', 'Portabotellas negro perforado junto a una moto']
      ], next: 'rebel', nextName: 'REBEL'
    }
  };
  const requested = new URLSearchParams(location.search).get('line');
  const key = Object.hasOwn(collections, requested) ? requested : 'rebel';
  const data = collections[key];
  document.body.dataset.line = key;
  document.title = `${data.name} — REBEL`;
  document.getElementById('crumb-current').textContent = data.name.toUpperCase();
  document.getElementById('collection-index').textContent = data.index;
  document.getElementById('collection-title').innerHTML = data.title;
  document.getElementById('collection-deck').textContent = data.deck;
  document.getElementById('collection-statement').textContent = data.statement;
  document.getElementById('collection-story').textContent = data.story;
  const cover = document.getElementById('collection-cover');
  cover.src = data.cover;
  cover.alt = data.coverAlt;
  const grid = document.getElementById('lookbook-grid');
  for (const [src, label, alt] of data.images) {
    const figure = document.createElement('figure');
    figure.className = 'lookbook-item';
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    const caption = document.createElement('figcaption');
    caption.textContent = label;
    figure.append(img, caption);
    grid.append(figure);
  }
  document.getElementById('next-link').href = `coleccion.html?line=${data.next}`;
  document.getElementById('next-title').textContent = data.nextName;
}
