const PRODUCTS = [
  {id:'mochila-bandolera',name:'Mochila bandolera',line:'rebel',type:'Bolsos',tag:'Relieve que se mueve contigo.',description:'Una silueta cruzada y compacta. El relieve rojo convierte una pieza cotidiana en una declaración visible desde lejos.',images:['mochila-bandolera-frontal.webp','mochila-bandolera-detalle.webp','mochila-bandolera-modelo.webp','mochila-bandolera-modelo-hombre.webp']},
  {id:'rinonera-dot',name:'Riñonera DOT',line:'rebel',type:'Bolsos',tag:'Todo cerca. Nada discreto.',description:'La curva de la riñonera recoge el motivo de puntos y lo lleva a la calle en rojo brillante y negro.',images:['rinonera-dot-frontal.webp','rinonera-dot-detalle.webp','rinonera-dot-modelo.webp','rinonera-dot-modelo-hombre-piel-natural.webp']},
  {id:'cartera-rebel',name:'Cartera REBEL',line:'rebel',type:'Pequeños accesorios',tag:'El detalle también hace ruido.',description:'Una pieza pequeña con el mismo relieve rotundo de la colección. Rojo, puntos y contraste negro.',images:['cartera-rebel-frontal.webp','cartera-rebel-detalle.webp','cartera-rebel-modelo.webp','cartera-rebel-modelo-hombre-cuero.webp']},
  {id:'gorra',name:'Gorra',line:'rebel',type:'Complementos',tag:'Una visera con carácter.',description:'Cuerpo negro y visera roja con relieve. La textura sale del pavimento y llega hasta el último detalle del look.',images:['gorra-frontal.webp','gorra-detalle.webp','gorra-modelo.webp','gorra-modelo-hombre.webp']},
  {id:'totebag-irregular',name:'Totebag irregular',line:'troquel',type:'Bolsos',tag:'El vacío también dibuja.',description:'Dos superficies se encuentran en una silueta amplia: una lisa y otra abierta en recortes irregulares.',images:['totebag-irregular-frontal.webp','totebag-irregular-detalle.webp','totebag-irregular-modelo.webp','totebag-irregular-modelo-mujer-hombro-asas-cortas.webp']},
  {id:'bolso-troquelado',name:'Bolso troquelado',line:'troquel',type:'Bolsos',tag:'La sombra cambia la forma.',description:'El recorte triangular recorre la solapa de un bolso compacto y deja que la luz complete el diseño.',images:['bolso-troquelado-frontal.webp','bolso-troquelado-detalle.webp','bolso-troquelado-modelo.webp','bolso-troquelado-modelo-hombre-caoba.webp']},
  {id:'portabotellas',name:'Portabotellas',line:'troquel',type:'Complementos',tag:'Hasta lo práctico tiene actitud.',description:'Una estructura cilíndrica de recortes irregulares: la forma más pequeña de llevar Troquel a todas partes.',images:['portabotellas-frontal-v2.webp','portabotellas-detalle.webp']},
  {id:'bota-troquel',name:'Bota Troquel',line:'troquel',type:'Calzado',tag:'El recorte también pisa en invierno.',description:'Una bota negra de caña corta, con recortes triangulares sobre una base cerrada y una suela contundente. Una propuesta de invierno para Troquel.',images:['bota-troquel-frontal-cremallera-interior.webp','bota-troquel-detalle-interior-cremallera.webp','bota-troquel-modelo-mujer-contrapicado-punto-gris.webp','bota-troquel-modelo-hombre-agachado.webp']}
];
const asset = (value) => value.startsWith('../') ? `assets/${value.slice(3)}` : `assets/producto/${value}`;
const productUrl = (p) => `producto.html?id=${encodeURIComponent(p.id)}`;
const card = (p) => `<a class="shop-card" href="${productUrl(p)}"><span class="shop-card-image"><img src="${asset(p.images[0])}" alt="${p.name}, vista de estudio" loading="lazy" width="900" height="900"></span><span class="shop-card-meta"><span>${p.line==='rebel'?'REBEL':'TROQUEL'} COLLECTION / ${p.type}</span><span aria-hidden="true"><svg class="ui-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 19 19 5M8 5h11v11"/></svg></span></span><strong>${p.name}</strong><small>${p.tag}</small></a>`;

const collectionGrid = document.getElementById('collection-shop-grid');
if (collectionGrid) {
  const requested = new URLSearchParams(location.search).get('line');
  const line = requested === 'troquel' ? 'troquel' : 'rebel';
  collectionGrid.innerHTML = PRODUCTS.filter(p=>p.line===line).map(card).join('');
  document.getElementById('collection-shop-link').href = `tienda.html?line=${line}`;
  document.getElementById('collection-shop-header').href = `tienda.html?line=${line}`;
}

const shop = document.querySelector('[data-shop]');
if (shop) {
  let line = new URLSearchParams(location.search).get('line') || 'todas';
  let type = 'Todos';
  const grid = document.getElementById('shop-grid');
  const count = document.getElementById('shop-count');
  const lineButtons = [...document.querySelectorAll('[data-line-filter]')];
  const typeButtons = [...document.querySelectorAll('[data-type-filter]')];
  function render() {
    const visible = PRODUCTS.filter(p => (line==='todas'||p.line===line) && (type==='Todos'||p.type===type));
    grid.innerHTML = visible.map(card).join('');
    count.textContent = `${visible.length} ${visible.length===1?'PIEZA':'PIEZAS'}`;
    lineButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lineFilter===line)));
    typeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.typeFilter===type)));
  }
  lineButtons.forEach(b=>b.addEventListener('click',()=>{line=b.dataset.lineFilter;history.replaceState(null,'',line==='todas'?'tienda.html':`?line=${line}`);render()}));
  typeButtons.forEach(b=>b.addEventListener('click',()=>{type=b.dataset.typeFilter;render()}));
  if (!['todas','rebel','troquel'].includes(line)) line='todas';
  render();
}

const detail = document.querySelector('[data-product]');
if (detail) {
  const requestedId = new URLSearchParams(location.search).get('id');
  const id = requestedId === 'sandalias-troquel' ? 'bota-troquel' : requestedId;
  if (requestedId === 'sandalias-troquel') history.replaceState(null, '', 'producto.html?id=bota-troquel');
  const p = PRODUCTS.find(item=>item.id===id) || PRODUCTS[0];
  document.title = `${p.name} — REBEL`;
  document.getElementById('product-crumb').textContent = p.name.toUpperCase();
  document.getElementById('product-line').textContent = `${p.line==='rebel'?'REBEL':'TROQUEL'} COLLECTION / ${p.type}`;
  document.getElementById('product-name').textContent = p.name;
  document.getElementById('product-tag').textContent = p.tag;
  document.getElementById('product-description').textContent = p.description;
  document.getElementById('product-back').href = `tienda.html?line=${p.line}`;
  document.getElementById('product-collection').href = `coleccion.html?line=${p.line}`;
  document.getElementById('product-stage-label').textContent = `${p.line==='rebel'?'REBEL':'TROQUEL'} / ESTUDIO DE PRODUCTO`;
  const hero = document.getElementById('product-main');
  const views = document.getElementById('product-views');
  const labelFor = (src,i) => src.includes('detalle') ? 'Detalle' : src.includes('modelo-mujer-hombro') ? 'Al hombro' : src.includes('modelo-mujer-sudadera') ? 'Look REBEL' : src.includes('modelo-hombre-caoba') ? 'Look caoba' : src.includes('modelo-hombre-variante') ? 'Otra mirada' : src.includes('modelo') ? `Editorial ${String(p.images.slice(0,i+1).filter(x=>x.includes('modelo')).length).padStart(2,'0')}` : 'Vista frontal';
  p.images.forEach((src,i)=>{
    const button=document.createElement('button');button.type='button';button.className='product-thumb';button.setAttribute('aria-label',`${labelFor(src,i)} de ${p.name}`);
    button.innerHTML=`<img src="${asset(src)}" alt="" loading="${i?'lazy':'eager'}"><span>${labelFor(src,i)}</span>`;
    button.addEventListener('click',()=>{hero.src=asset(src);hero.alt=`${p.name}: ${labelFor(src,i).toLowerCase()}`;views.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===button)))});
    views.append(button);
  });
  views.firstElementChild?.click();
  document.getElementById('related-grid').innerHTML=PRODUCTS.filter(item=>item.line===p.line&&item.id!==p.id).slice(0,3).map(card).join('');
}
