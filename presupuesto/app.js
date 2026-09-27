const ACCESS_DIGEST = 'ececa91451c1a6a872e9811f43a64a5a686501ecc3e9d9f432271725f6a852d6';
let accessAttempts = 0;
let accessLockedUntil = 0;
async function digestAccess(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
const PRICES = {
  pieces: {
    image: { label: 'imagen dirigida con IA', unit: 240 },
    video: { label: 'clip generativo de 5–10 s', unit: 220 },
    ugc: { label: 'vídeo UGC-style de 15–30 s', unit: 220 },
    product: { label: 'pack e-commerce de 9 vistas', unit: 980 }
  },
  videoDuration: {
    micro: { label: 'clip generativo de 5–10 s', unit: 220 },
    short: { label: 'vídeo generativo de 15 s', unit: 380 },
    medium: { label: 'vídeo generativo de 30 s', unit: 650 },
    minute: { label: 'vídeo generativo de 60 s', unit: 1000 }
  },
  pieceLevel: { essential: 1, directed: 1.25, signature: 1.55 },
  pieceSupport: { direct: 1, development: 1.12, supported: 1.22, intensive: 1.4 },
  pieceDeadline: { standard: 1, fast: 1.22, urgent: 1.42 },
  projects: {
    campaign: { label: 'Campaña visual con IA', min: 1800, max: 3400 },
    system: { label: 'Sistema de contenido', min: 1500, max: 3000 },
    ugcCampaign: { label: 'Campaña UGC-style', min: 1400, max: 2900 },
    tool: { label: 'Herramienta a medida para tu equipo', min: 2800, max: 6500 },
    automation: { label: 'Automatización del flujo de dirección de IA', min: 2400, max: 5200 }
  },
  projectScope: { compact: 1, standard: 1.3, ambitious: 1.75 },
  projectTiming: { normal: 1, priority: 1.18, urgent: 1.38 },
  training: {
    intro: { label: 'Iniciación online de 90 minutos', min: 150, max: 180 },
    half: { label: 'Media jornada de formación', min: 750, max: 980 },
    full: { label: 'Jornada completa de formación', min: 1200, max: 1550 },
    program: { label: 'Programa de 4 sesiones', min: 1900, max: 3200 }
  },
  people: { small: 1, medium: 1.12, large: 1.3, enterprise: 1.55 },
  mode: { online: 1, presential: 1, hybrid: 1.08 }
};

const LABELS = {
  pieceLevel: { essential: 'dirección esencial', directed: 'dirección visual completa', signature: 'dirección de firma' },
  support: { direct: 'entrega directa · 1 ronda', development: 'desarrollo · 2 rondas', supported: 'acompañamiento · 3 rondas', intensive: 'iteración intensiva · hasta 5 rondas' },
  deadline: { standard: 'plazo estándar', fast: 'entrega prioritaria en 72 h', urgent: 'entrega urgente en 48 h' },
  projectScope: { compact: 'alcance compacto', standard: 'alcance completo', ambitious: 'alcance expandido' },
  projectTiming: { normal: 'timing planificado', priority: 'timing prioritario', urgent: 'fecha cerrada y urgente' },
  topics: { image: 'Dirección de imagen con IA', prompting: 'Prompting para imagen y vídeo', tools: 'Creación de herramientas', custom: 'Programa a medida' },
  people: { small: '1–5 asistentes', medium: '6–10 asistentes', large: '11–20 asistentes', enterprise: 'más de 20 asistentes' },
  mode: { online: 'online', presential: 'presencial', hybrid: 'híbrida' }
};

const TRAINING_DESCRIPTIONS = {
  intro: 'La iniciación es una sesión básica y práctica: qué puede hacer la IA, cómo escribir un prompt sencillo y creación guiada de una imagen principal. No incluye sistemas avanzados, consistencia entre series ni metodología de dirección.',
  half: 'La media jornada combina fundamentos y práctica: estructura de prompts, decisiones visuales, referencias y un ejercicio guiado aplicado a una necesidad concreta. Incluye revisión conjunta de los resultados.',
  full: 'La jornada completa permite recorrer el proceso con profundidad: concepto, lenguaje visual, prompting, iteración, selección y acabado. El equipo desarrolla un caso práctico y termina con criterios que puede aplicar después.',
  program: 'El programa se distribuye en cuatro sesiones: diagnóstico, construcción del sistema, aplicación acompañada y revisión. Permite trabajar sobre proyectos reales y ajustar el método a la forma de trabajar del equipo.'
};

const TRAINING_PRICES = {
  image: { intro: { label: 'Iniciación de imagen · 90 min', min: 150, max: 180 }, half: { label: 'Dirección de imagen · media jornada', min: 750, max: 980 }, full: { label: 'Dirección de imagen · jornada completa', min: 1200, max: 1550 }, program: { label: 'Dirección de imagen · programa', min: 1900, max: 3200 } },
  prompting: { intro: { label: 'Bases de prompting · 90 min', min: 180, max: 220 }, half: { label: 'Prompting aplicado · media jornada', min: 850, max: 1100 }, full: { label: 'Prompting aplicado · jornada completa', min: 1350, max: 1750 }, program: { label: 'Prompting aplicado · programa', min: 2200, max: 3500 } },
  tools: { half: { label: 'Herramientas con IA · media jornada', min: 1100, max: 1450 }, full: { label: 'Herramientas con IA · jornada completa', min: 1800, max: 2400 }, program: { label: 'Herramientas con IA · programa', min: 3000, max: 4600 } },
  custom: { half: { label: 'Formación a medida · media jornada', min: 1200, max: 1600 }, full: { label: 'Formación a medida · jornada completa', min: 2000, max: 2800 }, program: { label: 'Formación a medida · programa', min: 3400, max: 5200 } }
};

const state = {
  route: 'pieces',
  quantities: { image: 1, video: 1, ugc: 1, product: 1 },
  videoDuration: 'micro',
  pieceLevel: 'essential',
  projectType: 'campaign',
  projectScope: 'compact',
  trainingTopic: 'image',
  trainingFormat: 'intro',
  estimate: { min: 0, max: 0 }
};

// En la versión publicada, el acceso se sustituirá por autenticación real.
// Si se añade el número, usar formato internacional sin + ni espacios: 346XXXXXXXX.
const WHATSAPP_NUMBER = '34692906658';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const euro = value => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(Math.round(value / 10) * 10);
const selection = (name, fallback) => $(`[data-choice="${name}"] .is-selected`)?.dataset.value || fallback;

function enhanceSelect(select) {
  if (select.classList.contains('enhanced-select')) return;
  select.classList.add('enhanced-select');
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div');
  menu.className = 'custom-select-menu';
  menu.setAttribute('role', 'listbox');

  [...select.options].forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'custom-select-option';
    button.dataset.value = option.value;
    button.textContent = option.textContent;
    button.setAttribute('role', 'option');
    button.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncCustomSelect(select);
      wrapper.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    });
    menu.appendChild(button);
  });

  trigger.addEventListener('click', () => {
    const open = !wrapper.classList.contains('is-open');
    $$('.custom-select.is-open').forEach(item => {
      item.classList.remove('is-open');
      item.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
    });
    wrapper.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
  });
  wrapper.append(trigger, menu);
  select.insertAdjacentElement('afterend', wrapper);
  select._customSelect = { wrapper, trigger, menu };
  syncCustomSelect(select);
}

function syncCustomSelect(select) {
  const custom = select._customSelect;
  if (!custom) return;
  custom.trigger.textContent = select.options[select.selectedIndex]?.textContent || '';
  custom.wrapper.classList.toggle('is-disabled', select.disabled);
  custom.menu.querySelectorAll('.custom-select-option').forEach(button => {
    const selected = button.dataset.value === select.value;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}

document.addEventListener('click', event => {
  if (event.target.closest('.custom-select')) return;
  $$('.custom-select.is-open').forEach(item => {
    item.classList.remove('is-open');
    item.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  $$('.custom-select.is-open').forEach(item => {
    item.classList.remove('is-open');
    item.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
  });
});

function setRoute(route) {
  state.route = route;
  $$('.route-tab').forEach(tab => {
    const active = tab.dataset.route === route;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  $$('.route-panel').forEach(panel => {
    const active = panel.dataset.panel === route;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
  updateEstimate();
}

function syncTrainingFormats() {
  const allowed = state.trainingTopic === 'image' || state.trainingTopic === 'prompting' ? ['intro', 'half', 'full', 'program'] : ['half', 'full', 'program'];
  const buttons = [...document.querySelectorAll('[data-choice=training-format] button')];
  if (!allowed.includes(state.trainingFormat)) state.trainingFormat = allowed[0];
  buttons.forEach(button => { button.hidden = false; button.disabled = !allowed.includes(button.dataset.value); button.setAttribute('aria-disabled', String(button.disabled)); button.classList.toggle('is-selected', button.dataset.value === state.trainingFormat); });
  const copy = {
    image: { intro: ['Primera imagen', '90 min · fundamentos y una imagen guiada'], half: ['Dirección visual', '4 h · teoría, práctica y criterio'], full: ['Sistema visual', '7 h · inmersión completa'], program: ['Acompañamiento', '4 sesiones · aplicación y revisión'] },
    prompting: { intro: ['Bases de prompting', '90 min · estructura y primeras pruebas'], half: ['Prompting aplicado', '4 h · decisiones, consistencia y control'], full: ['Prompting avanzado', '7 h · método completo de iteración'], program: ['Sistema de prompting', '4 sesiones · acompañamiento'] },
    tools: { half: ['Diseño de herramientas', '4 h · arquitectura y flujo de trabajo'], full: ['Herramientas en profundidad', '7 h · construcción y pruebas'], program: ['Sistema de herramientas', '4 sesiones · implementación acompañada'] },
    custom: { half: ['Formación a medida', '4 h · foco concreto'], full: ['Inmersión a medida', '7 h · desarrollo completo'], program: ['Programa a medida', '4 sesiones · recorrido personalizado'] }
  }[state.trainingTopic];
  buttons.forEach(button => { const item = copy[button.dataset.value]; if (item) { button.querySelector('strong').textContent = item[0]; button.querySelector('small').textContent = item[1]; } });
  document.querySelector('#training-format-description').textContent = TRAINING_DESCRIPTIONS[state.trainingFormat];
  const intro = state.trainingFormat === 'intro';
  document.querySelector('#training-mode').disabled = intro;
  if (intro) document.querySelector('#training-mode').value = 'online';
  syncCustomSelect(document.querySelector('#training-mode'));
  document.querySelector('#training-location-wrap').hidden = intro || document.querySelector('#training-mode').value === 'online';
  if (intro) document.querySelector('#training-location').value = '';
}

function choose(container, button) {
  container.querySelectorAll('button[data-value]').forEach(item => item.classList.remove('is-selected'));
  button.classList.add('is-selected');
  const type = container.dataset.choice;
  if (type === 'piece-level') state.pieceLevel = button.dataset.value;
  if (type === 'project-type') state.projectType = button.dataset.value;
  if (type === 'project-scope') state.projectScope = button.dataset.value;
  if (type === 'training-topic') { state.trainingTopic = button.dataset.value; syncTrainingFormats(); }
  if (type === 'training-format') {
    state.trainingFormat = button.dataset.value;
    $('#training-format-description').textContent = TRAINING_DESCRIPTIONS[state.trainingFormat];
    const intro = state.trainingFormat === 'intro';
    $('#training-mode').disabled = intro;
    if (intro) $('#training-mode').value = 'online';
    syncCustomSelect($('#training-mode'));
    $('#training-location-wrap').hidden = intro || $('#training-mode').value === 'online';
    if (intro) $('#training-location').value = '';
  }
  updateEstimate();
}

function selectedPieces() {
  return $$('input[name="piece-service"]:checked').map(input => {
    const pricing = input.value === 'video' ? PRICES.videoDuration[state.videoDuration] : PRICES.pieces[input.value];
    return { key: input.value, qty: state.quantities[input.value], ...pricing };
  });
}

function piecesEstimate() {
  const pieces = selectedPieces();
  const subtotal = pieces.reduce((sum, item) => sum + item.unit * item.qty, 0);
  const level = PRICES.pieceLevel[state.pieceLevel];
  const supportKey = $('#piece-support').value;
  const deadlineKey = $('#piece-deadline').value;
  const total = subtotal * level * PRICES.pieceSupport[supportKey] * PRICES.pieceDeadline[deadlineKey];
  const min = total;
  const max = total * 1.15;
  return {
    min, max,
    caption: pieces.length ? `Para ${pieces.map(item => `${item.qty} × ${item.label}`).join(', ')}.` : 'Selecciona al menos un tipo de pieza.',
    lines: [
      ['Dirección', LABELS.pieceLevel[state.pieceLevel]],
      ['Ajustes', LABELS.support[supportKey]],
      ['Entrega', LABELS.deadline[deadlineKey]]
    ]
  };
}

function projectEstimate() {
  const item = PRICES.projects[state.projectType];
  const timingKey = $('#project-timing').value;
  const integration = $('#project-integration').checked;
  const multiplier = PRICES.projectScope[state.projectScope] * PRICES.projectTiming[timingKey];
  const integrationCost = integration ? (state.projectType === 'tool' || state.projectType === 'automation' ? 950 : 450) : 0;
  return {
    min: item.min * multiplier + integrationCost,
    max: item.max * multiplier + integrationCost * 1.6,
    caption: `${item.label}, ${LABELS.projectScope[state.projectScope]}.`,
    lines: [
      ['Proyecto', item.label],
      ['Alcance', LABELS.projectScope[state.projectScope]],
      ['Timing', LABELS.projectTiming[timingKey]],
      ['Integraciones', integration ? 'sí, por definir' : 'no indicadas']
    ]
  };
}

function trainingEstimate() {
  const format = TRAINING_PRICES[state.trainingTopic][state.trainingFormat];
  const peopleKey = $('#training-people').value;
  const modeKey = $('#training-mode').value;
  const multiplier = PRICES.people[peopleKey] * PRICES.mode[modeKey];
  const location = $('#training-location').value.trim();
  const modeLabel = modeKey === 'online' ? LABELS.mode[modeKey] : `${LABELS.mode[modeKey]}${location ? ` · ${location}` : ' · ubicación por definir'}`;
  return {
    min: format.min * multiplier,
    max: format.max * multiplier,
    caption: `${LABELS.topics[state.trainingTopic]} · ${format.label.toLowerCase()}.`,
    lines: [
      ['Contenido', LABELS.topics[state.trainingTopic]],
      ['Formato', format.label],
      ['Grupo', LABELS.people[peopleKey]],
      ['Modalidad', modeLabel],
      ...(modeKey === 'online' ? [] : [['Desplazamiento', 'se calcula según ubicación']])
    ]
  };
}

function updateEstimate() {
  const estimate = state.route === 'pieces' ? piecesEstimate() : state.route === 'project' ? projectEstimate() : trainingEstimate();
  state.estimate = estimate;
  const routeLabel = { pieces: 'PIEZAS', project: 'PROYECTO', training: 'FORMACIÓN' }[state.route];
  $('#estimate-route').textContent = routeLabel;
  $('#estimate-min').textContent = euro(estimate.min);
  $('#estimate-max').textContent = euro(estimate.max);
  $('#estimate-caption').textContent = estimate.caption;
  $('#estimate-lines').innerHTML = estimate.lines.map(([key, value]) => `<div class="estimate-line"><span>${key}</span><span>${value}</span></div>`).join('');
  $('#prepare-brief').disabled = state.route === 'pieces' && !selectedPieces().length;
}

function buildBrief() {
  const range = `${euro(state.estimate.min)}–${euro(state.estimate.max)} € + IVA`;
  let lines = ['Hola Beatriz,', '', 'He preparado esta consulta desde tu calculadora de servicios con IA.'];
  if (state.route === 'pieces') {
    const pieces = selectedPieces();
    lines.push('', 'TIPO: Piezas sueltas', `NECESITO: ${pieces.map(item => `${item.qty} × ${item.label}`).join(', ')}`, `DIRECCIÓN: ${LABELS.pieceLevel[state.pieceLevel]}`, `ACOMPAÑAMIENTO: ${LABELS.support[$('#piece-support').value]}`, `PLAZO: ${LABELS.deadline[$('#piece-deadline').value]}`);
  } else if (state.route === 'project') {
    const goal = $('#project-goal').value.trim();
    const details = $('#project-details').value.trim();
    lines.push('', 'TIPO: Proyecto completo', `PROYECTO: ${PRICES.projects[state.projectType].label}`, `ALCANCE: ${LABELS.projectScope[state.projectScope]}`, `TIMING: ${LABELS.projectTiming[$('#project-timing').value]}`, `INTEGRACIONES: ${$('#project-integration').checked ? 'Sí, por definir' : 'No indicadas'}`);
    if (goal) lines.push(`OBJETIVO: ${goal}`);
    if (details) lines.push(`CONDICIONES: ${details}`);
  } else {
    const mode = $('#training-mode').value;
    const location = $('#training-location').value.trim();
    lines.push('', 'TIPO: Formación', `CONTENIDO: ${LABELS.topics[state.trainingTopic]}`, `FORMATO: ${TRAINING_PRICES[state.trainingTopic][state.trainingFormat].label}`, `ASISTENTES: ${LABELS.people[$('#training-people').value]}`, `MODALIDAD: ${LABELS.mode[mode]}${mode !== 'online' ? ` · ${location || 'ubicación por definir'}` : ''}`);
  }
  lines.push('', `HORQUILLA ORIENTATIVA: ${range}`, '', 'Me gustaría recibir una propuesta definitiva con el alcance, los entregables, los plazos y las condiciones del proyecto.');
  return lines.join('\n');
}

$$('.route-tab').forEach(tab => tab.addEventListener('click', () => setRoute(tab.dataset.route)));
$$('[data-choice]').forEach(container => container.addEventListener('click', event => {
  const button = event.target.closest('button[data-value]');
  if (button) choose(container, button);
}));
$$('input[name="piece-service"]').forEach(input => input.addEventListener('change', updateEstimate));
$$('[data-duration]').forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  state.videoDuration = button.dataset.duration;
  $$('[data-duration]').forEach(item => item.classList.toggle('is-selected', item === button));
  updateEstimate();
}));
$$('[data-qty]').forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  const card = button.closest('.service-card');
  const input = card.querySelector('input');
  if (!input.checked) input.checked = true;
  const direction = button.dataset.qty === 'plus' ? 1 : -1;
  state.quantities[input.value] = Math.min(20, Math.max(1, state.quantities[input.value] + direction));
  card.querySelector('output').textContent = state.quantities[input.value];
  updateEstimate();
}));
$$('select, #project-integration').forEach(control => control.addEventListener('change', updateEstimate));
$('#training-mode').addEventListener('change', () => {
  const needsLocation = $('#training-mode').value !== 'online';
  $('#training-location-wrap').hidden = !needsLocation;
  if (!needsLocation) $('#training-location').value = '';
  updateEstimate();
});
$('#training-location').addEventListener('input', updateEstimate);

$('#prepare-brief').addEventListener('click', () => {
  const text = buildBrief();
  $('#brief-text').textContent = text;
  $('#result-price').textContent = `${euro(state.estimate.min)}–${euro(state.estimate.max)} €`;
  $('#whatsapp-brief').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  $('#resultado').hidden = false;
  $('#resultado').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});

$('#access-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (Date.now() < accessLockedUntil) return;
  const user = $('#access-user').value.trim().toLowerCase();
  const password = $('#access-password').value;
  if (await digestAccess(user + ':' + password) === ACCESS_DIGEST) {
    document.body.classList.remove('is-locked');
    $('#access-gate').hidden = true;
    sessionStorage.setItem('budgetPreviewAccess', '1');
    scrollTo(0, 0);
    return;
  }
  $('#access-error').textContent = 'Los datos de acceso no son correctos.';
});

if (sessionStorage.getItem('budgetPreviewAccess') === '1') {
  document.body.classList.remove('is-locked');
  $('#access-gate').hidden = true;
}

$('#copy-brief').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#brief-text').textContent);
    $('#copy-status').textContent = 'Resumen copiado. Ya puedes pegarlo en tu mensaje.';
  } catch {
    $('#copy-status').textContent = 'Selecciona el texto y cópialo manualmente.';
  }
});

const progress = $('.scroll-progress');
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}, { passive: true });

if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const dot = $('.cursor-dot');
  const ring = $('.cursor-ring');
  let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener('pointermove', event => { x = event.clientX; y = event.clientY; dot.style.left = `${x}px`; dot.style.top = `${y}px`; });
  const follow = () => { rx += (x - rx) * .13; ry += (y - ry) * .13; ring.style.left = `${rx}px`; ring.style.top = `${ry}px`; requestAnimationFrame(follow); };
  follow();
}

$('#training-mode').value = 'online';
$('#training-mode').disabled = true;
$$('select').forEach(enhanceSelect);
syncTrainingFormats();
updateEstimate();
