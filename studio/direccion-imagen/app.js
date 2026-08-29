const STORAGE_KEY='bm_image_direction_kit_v2';
const defaults={
  name:'Lumen Studio',
  sector:'Diseño de interiores',
  audience:'Personas que valoran la calma, la materia y una estética honesta.',
  promise:'Aquí cada decisión visual tiene intención y deja espacio a lo esencial.',
  perception:['Serena','Precisa','Cálida'],
  effect:'Confianza',
  customEffect:'',
  palette:['#F3EFE7','#D9CBB8','#A36D4F','#4A5147','#191B19'],
  paletteMode:'auto',
  paletteIteration:0,
  typography:{style:'editorial',display:'Cormorant Garamond',body:'DM Sans',customName:'',customData:''},
  imageStyles:['Editorial','Sensorial','Conceptual'],
  direction:'Luz natural lateral, materiales honestos y composiciones con aire; cada escena debe sentirse serena, táctil y vivida.',
  elements:'luz natural, materia, detalle, espacio negativo',
  avoid:'artificial, recargada, excesivamente perfecta o genérica',
  axes:{expression:34,distance:42,finish:30,time:24},
  references:[],
  rules:{
    shots:['Plano general','Detalle'],
    framing:['Con aire','Asimétrico'],
    light:['Natural difusa','Lateral'],
    setting:['Contextual','Orgánico'],
    presence:['Espontánea'],
    rhythm:['Contemplativo']
  },
  delegate:false,
  summaryIndex:0,
  step:0
};
let state=structuredClone(defaults);

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const inputs={
  name:$('#brand-name'),sector:$('#brand-sector'),audience:$('#brand-audience'),promise:$('#brand-promise'),
  direction:$('#brand-message'),elements:$('#brand-keywords'),avoid:$('#brand-avoid'),customEffect:$('#custom-effect')
};
const axisInputs={expression:$('#axis-expression'),distance:$('#axis-distance'),finish:$('#axis-finish'),time:$('#axis-time')};
const hints=[
  'La imagen empieza por una percepción clara.',
  'Una atmósfera coherente hace reconocible una dirección.',
  'La cámara también necesita un criterio antes de mirar.',
  'Las referencias sirven para explicar decisiones, no para copiar imágenes.',
  'Una regla útil mantiene coherencia sin volver rígida la creatividad.',
  'El PDF reúne validación, producción y sistematización.'
];
const ruleLabels={shots:'Tipos de plano',framing:'Encuadre y composición',light:'Tratamiento de la luz',setting:'Fondo y contexto',presence:'Presencia humana',rhythm:'Ritmo de la serie'};
const referenceTags=['Luz','Encuadre','Color','Atmósfera','Estilismo','Textura'];
const typographyNames={neutral:'Neutro',editorial:'Editorial',classic:'Clásico',bold:'Gamberro',custom:'Personalizada'};
const paletteModeNames={auto:'Automática',warm:'Cálida',cool:'Fría',earth:'Tierra',neutral:'Neutra',vibrant:'Vibrante',pastel:'Pastel',dark:'Oscura'};
const paletteModeDescriptions={
  warm:'rojos, arenas y matices solares que transmiten cercanía',
  cool:'azules y verdes contenidos para una imagen limpia y precisa',
  earth:'tonos minerales, vegetales y materiales de carácter orgánico',
  neutral:'una base sobria y atemporal con contraste controlado',
  vibrant:'color más saturado y contrastes con energía visual',
  pastel:'color luminoso, suave y de contraste delicado',
  dark:'una base profunda y sofisticada con acentos de luz'
};
const paletteKeywords={
  earth:['materia','madera','tierra','natural','organico','artesanal','piedra','vegetal','textura','rural'],
  vibrant:['audaz','experimental','energia','vibrante','pop','joven','dinamico','divertido','intenso','atrevido'],
  cool:['tecnolog','agua','hielo','clinico','frio','azul','precision','futuro','digital','cientifico'],
  warm:['calid','sol','fuego','cercan','gastronom','humano','acogedor','hogar','emocion','mediterraneo'],
  pastel:['suave','delicad','calma','seren','infantil','tierno','sutil','ligero','bienestar'],
  dark:['nocturn','misterio','lujo','dramatic','profundo','oscuro','exclusiv','cine'],
  neutral:['sobri','minimal','precis','elegante','atemporal','esencial','limpio','serio','arquitect']
};

function normalizeText(value=''){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function paletteSourceText(){return normalizeText([state.sector,state.promise,state.direction,state.elements,...state.perception,...state.imageStyles].join(' '))}
function inferPaletteMode(){
  const source=paletteSourceText();
  const results=Object.entries(paletteKeywords).map(([mode,words])=>{
    const matches=words.filter(word=>source.includes(word));
    return {mode,matches,score:matches.length};
  }).sort((a,b)=>b.score-a.score);
  const winner=results[0]?.score?results[0]:{mode:'neutral',matches:[]};
  return winner;
}
function hashString(value){let hash=2166136261;for(let index=0;index<value.length;index++){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619)}return hash>>>0}
function seededRandom(seed){return function(){seed+=0x6D2B79F5;let value=seed;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return ((value^value>>>14)>>>0)/4294967296}}
function hslToHex(hue,saturation,lightness){
  hue=((hue%360)+360)%360;saturation=Math.max(0,Math.min(100,saturation))/100;lightness=Math.max(0,Math.min(100,lightness))/100;
  const chroma=(1-Math.abs(2*lightness-1))*saturation,x=chroma*(1-Math.abs((hue/60)%2-1)),match=lightness-chroma/2;
  let red=0,green=0,blue=0;
  if(hue<60)[red,green,blue]=[chroma,x,0];else if(hue<120)[red,green,blue]=[x,chroma,0];else if(hue<180)[red,green,blue]=[0,chroma,x];else if(hue<240)[red,green,blue]=[0,x,chroma];else if(hue<300)[red,green,blue]=[x,0,chroma];else [red,green,blue]=[chroma,0,x];
  return `#${[red,green,blue].map(channel=>Math.round((channel+match)*255).toString(16).padStart(2,'0')).join('').toUpperCase()}`;
}
function createPalette(selectedMode=state.paletteMode,iteration=state.paletteIteration){
  const resolvedMode=selectedMode==='auto'?inferPaletteMode().mode:selectedMode;
  const seed=hashString(`${paletteSourceText()}|${resolvedMode}|${iteration}|${Object.values(state.axes).join('|')}`),random=seededRandom(seed);
  const hueRanges={warm:[8,42],cool:[185,235],earth:[24,78],neutral:[20,220],vibrant:[0,360],pastel:[0,360],dark:[195,345]};
  const [minHue,maxHue]=hueRanges[resolvedMode],baseHue=minHue+random()*(maxHue-minHue);
  const templates={
    warm:[[8,24,96],[18,35,82],[-4,57,57],[155,24,32],[178,16,12]],
    cool:[[0,22,96],[12,29,83],[-4,45,57],[-24,35,32],[-10,26,12]],
    earth:[[0,21,95],[14,29,81],[-10,43,56],[62,23,31],[82,16,12]],
    neutral:[[0,7,96],[8,10,83],[-8,12,63],[22,11,35],[0,8,12]],
    vibrant:[[0,40,96],[42,72,71],[0,80,53],[180,56,34],[210,36,12]],
    pastel:[[0,33,97],[38,44,87],[0,55,77],[190,25,45],[205,18,16]],
    dark:[[0,21,11],[17,30,22],[0,46,38],[158,51,59],[182,29,87]]
  };
  const expressionAdjust=(state.axes.expression-50)*0.13,finishAdjust=(state.axes.finish-50)*0.035;
  return templates[resolvedMode].map(([offset,saturation,lightness],index)=>{
    const hueJitter=(random()-.5)*(index===0?8:15),saturationJitter=(random()-.5)*8,lightnessJitter=(random()-.5)*5;
    const adjustedSaturation=saturation+saturationJitter+expressionAdjust*(index>1?1:.35);
    const adjustedLightness=lightness+lightnessJitter+(index===1?finishAdjust:-finishAdjust*.25);
    return hslToHex(baseHue+offset+hueJitter,adjustedSaturation,adjustedLightness);
  });
}
function applyPaletteVariation(){
  const previous=state.palette.join(',');let next=state.palette;
  for(let attempt=0;attempt<4&&next.join(',')===previous;attempt++){state.paletteIteration+=1;next=createPalette()}
  state.palette=next;
}
function renderPaletteContext(){
  const element=$('#palette-context');if(!element)return;
  if(state.paletteMode==='auto'){
    const inferred=inferPaletteMode(),evidence=inferred.matches.slice(0,3).join(', ');
    element.textContent=`Lectura automática: ${paletteModeNames[inferred.mode]}. ${evidence?`Detectada por “${evidence}”.`:'Una base equilibrada al no encontrar todavía claves dominantes.'}`;
  }else element.textContent=`Modo ${paletteModeNames[state.paletteMode]}: ${paletteModeDescriptions[state.paletteMode]}.`;
}

function initials(name){return (name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('')||'BM').toUpperCase()}
function contrast(hex){const value=parseInt(hex.slice(1),16),r=value>>16,g=value>>8&255,b=value&255;return (r*299+g*587+b*114)/1000>145?'#171714':'#fff'}
function setText(selector,value,fallback='—'){const element=$(selector);if(element)element.textContent=String(value||'').trim()||fallback}
function splitName(name){const words=(name.trim()||'Tu Proyecto').split(/\s+/).map(escapeHTML);return words.length>1?`${words.slice(0,-1).join(' ')}<br>${words.at(-1)}`:words[0]}
function clean(value=''){return value.trim().replace(/[.]+$/,'')}
function lowerList(items=[]){return items.map(item=>item.toLowerCase())}
function axisWord(key,value){
  const labels={expression:['Sobria','Equilibrada','Expresiva'],distance:['Cercana','Relacional','Aspiracional'],finish:['Orgánica','Cuidada','Pulida'],time:['Atemporal','Actual','Tendencia']};
  return labels[key][value<38?0:value>62?2:1];
}
function axisSummary(){return Object.entries(state.axes).map(([key,value])=>axisWord(key,value))}
function effectValue(){return state.effect==='Otro'?(clean(state.customEffect)||'Otro'):state.effect}
function escapeHTML(value=''){return String(value).replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]))}
function displayFont(){return state.typography.customData?'BM Project Custom':state.typography.display}
function formatReportName(name){const words=(String(name).trim()||'Tu Proyecto').split(/\s+/).map(escapeHTML);return words.length>1?`${words.slice(0,-1).join(' ')}<br>${words.at(-1)}`:words[0]}
function selectedRuleCount(){return Object.values(state.rules).reduce((total,items)=>total+items.length,0)}
function renderAxisReading(){
  const words=axisSummary();
  setText('#axis-reading',`Lectura actual: ${words.join(' · ')}. Estos ejes regulan expresividad, distancia, acabado y vigencia; quedarán documentados en el PDF.`);
}
function renderReferences(){
  const grid=$('#reference-grid'),empty=$('#reference-empty');if(!grid||!empty)return;
  empty.hidden=state.references.length>0;
  grid.innerHTML=state.references.map((reference,index)=>`
    <article class="reference-card" data-reference="${index}">
      <div class="reference-image"><img src="${reference.dataUrl}" alt="Referencia ${index+1}"><button class="reference-remove" type="button" aria-label="Eliminar referencia">×</button></div>
      <div class="reference-body"><span>REFERENCIA ${String(index+1).padStart(2,'0')}</span>
        <div class="reference-tags">${referenceTags.map(tag=>`<button type="button" class="${reference.tags?.includes(tag)?'selected':''}" data-tag="${tag}">${tag}</button>`).join('')}</div>
        <textarea class="reference-note" maxlength="150" placeholder="¿Qué te interesa de esta imagen?">${escapeHTML(reference.note||'')}</textarea>
      </div>
    </article>`).join('');
  $$('.reference-card').forEach(card=>{
    const index=Number(card.dataset.reference);
    card.querySelector('.reference-remove').addEventListener('click',()=>{state.references.splice(index,1);markDirty();renderReferences();renderPreview();toast('Referencia eliminada')});
    card.querySelectorAll('[data-tag]').forEach(button=>button.addEventListener('click',()=>{
      const tags=state.references[index].tags||[],tag=button.dataset.tag;
      state.references[index].tags=tags.includes(tag)?tags.filter(item=>item!==tag):[...tags,tag];markDirty();renderReferences();renderPreview();
    }));
    card.querySelector('.reference-note').addEventListener('input',event=>{state.references[index].note=event.target.value;markDirty();renderPrintReport()});
  });
}
function renderRules(){
  const groups=$('.rule-groups');groups.classList.toggle('delegated',state.delegate);groups.setAttribute('aria-disabled',String(state.delegate));
  $$('.rule-group').forEach(group=>group.querySelectorAll('[data-value]').forEach(button=>{button.classList.toggle('selected',state.rules[group.dataset.rule].includes(button.dataset.value));button.disabled=state.delegate}));
  const delegate=$('#delegate-direction');delegate.classList.toggle('selected',state.delegate);delegate.setAttribute('aria-pressed',String(state.delegate));
}
function reportFooter(page){return `<footer class="report-footer"><span>Herramienta creada por Beatriz Morón · Dirección Creativa &amp; Estrategia de Imagen</span><span>www.beatrizmoron.com · ${page}/4</span></footer>`}
function renderPrintReport(){
  const report=$('#print-report'),background=state.palette[0],ink=contrast(background)==='#fff'?'#FFFFFF':state.palette[4],axes=[
    ['expression','Sobria','Expresiva',state.axes.expression],['distance','Cercana','Aspiracional',state.axes.distance],['finish','Orgánica','Pulida',state.axes.finish],['time','Atemporal','Tendencia',state.axes.time]
  ];
  const references=state.references.length?`<div class="report-reference-grid">${state.references.map((reference,index)=>`<article class="report-reference"><img src="${reference.dataUrl}" alt=""><h3>REFERENCIA ${String(index+1).padStart(2,'0')}</h3><p class="report-reference-tags">${escapeHTML((reference.tags||[]).join(' · ')||'Referencia visual')}</p><p>${escapeHTML(reference.note||'Sin comentario añadido.')}</p></article>`).join('')}</div>`:'<div class="report-empty">No se han añadido imágenes. Esta sección queda abierta para incorporar referencias comentadas antes de producir.</div>';
  const rules=Object.entries(ruleLabels).map(([key,label])=>`<div class="report-rule ${state.delegate?'delegated':''}"><span>${escapeHTML(label)}</span><strong>${state.delegate?'A definir por dirección creativa':escapeHTML(state.rules[key].join(' · ')||'Por definir')}</strong></div>`).join('');
  const typeName=state.typography.customData?`Personalizada · ${state.typography.customName}`:(typographyNames[state.typography.style]||'Editorial');
  report.innerHTML=`
    <article class="report-page report-cover" style="--report-bg:${background};--report-ink:${ink};--report-display:'${escapeHTML(displayFont())}',serif">
      <div class="report-top"><div class="report-monogram">${escapeHTML(initials(state.name))}</div><span class="report-sector">${escapeHTML(state.sector)}</span></div>
      <div class="report-cover-main"><p class="report-kicker">EFECTO / ${escapeHTML(effectValue().toUpperCase())}</p><h1>${formatReportName(state.name)}</h1><p class="report-promise">${escapeHTML(state.promise)}</p></div>
      <div class="report-colors">${state.palette.map(color=>`<span style="--color:${color}"><small>${color}</small></span>`).join('')}</div>
      <div class="report-cover-meta"><div><span>Percepción</span><strong>${escapeHTML(state.perception.join(' / '))}</strong></div><div><span>Lenguaje</span><strong>${escapeHTML(state.imageStyles.join(' / '))}</strong></div></div>
      <p class="report-cover-direction">${escapeHTML(state.direction)}</p>${reportFooter(1)}
    </article>
    <article class="report-page"><div class="report-header"><b>01 — Validación</b><span>Kit de Dirección de Imagen</span></div><h2 class="report-title">Intención y<br>territorio visual.</h2><p class="report-intro">Las decisiones iniciales definen qué debe hacer sentir la imagen y cómo trasladarlo a color, tipografía, fotografía y composición.</p>
      <div class="report-grid"><div class="report-block"><span class="report-label">Público</span><h3>Quién debe reconocerse</h3><p>${escapeHTML(state.audience)}</p></div><div class="report-block"><span class="report-label">Efecto</span><h3>${escapeHTML(effectValue())}</h3><p>${escapeHTML(state.perception.join(' · '))}</p></div><div class="report-block"><span class="report-label">Dirección fotográfica</span><h3>Lenguaje</h3><p>${escapeHTML(state.direction)}</p></div><div class="report-block"><span class="report-label">Elementos</span><h3>Deben aparecer</h3><p>${escapeHTML(state.elements)}</p></div><div class="report-block"><span class="report-label">Límites</span><h3>Debe evitarse</h3><p>${escapeHTML(state.avoid)}</p></div><div class="report-block"><span class="report-label">Tipografía</span><h3>${escapeHTML(typeName)}</h3><p>${escapeHTML(displayFont())} + ${escapeHTML(state.typography.body)}</p></div><div class="report-block full"><span class="report-label">Ejes de imagen</span><h3>Tensión visual seleccionada</h3>${axes.map(([key,left,right,value])=>`<div class="report-axis"><div class="report-axis-head"><span>${left}</span><b>${axisWord(key,value)} · ${value}/100</b><span>${right}</span></div><div class="report-axis-track"><i style="--value:${value}%"></i></div></div>`).join('')}</div></div>${reportFooter(2)}</article>
    <article class="report-page"><div class="report-header"><b>02 — Producción</b><span>Referencias comentadas</span></div><h2 class="report-title">Lo que debe aportar<br>cada referencia.</h2><p class="report-intro">Las imágenes funcionan como indicaciones de luz, encuadre, color, atmósfera, estilismo o textura; no como modelos para copiar.</p>${references}${reportFooter(3)}</article>
    <article class="report-page"><div class="report-header"><b>03 — Sistematización</b><span>Reglas de imagen</span></div><h2 class="report-title">Coherencia para<br>seguir produciendo.</h2><p class="report-intro">Estas reglas convierten la dirección en decisiones repetibles sin eliminar el criterio creativo de cada producción.</p><div class="report-rules">${rules}</div><div class="report-delegate"><strong>${state.delegate?'Decisión técnica delegada en dirección creativa':'Decisiones técnicas definidas por el proyecto'}</strong><p>${state.delegate?'La intención está validada y su traducción a shot list, luz, encuadre y producción queda en manos de dirección creativa.':'Las selecciones funcionan como punto de partida y pueden revisarse junto a dirección creativa antes de producir.'}</p></div>${reportFooter(4)}</article>`;
}
function directionSummaries(){
  const perception=lowerList(state.perception),styles=lowerList(state.imageStyles),elements=state.elements.split(',').map(clean).filter(Boolean);
  const p1=perception[0]||'coherente',p2=perception[1]||'propia',s1=styles[0]||'editorial',s2=styles[1]||'sensorial';
  const e1=elements[0]||'la luz',e2=elements[1]||'la materia';
  return [
    `Una imagen ${p1} y ${p2}, construida desde ${e1} y ${e2}.`,
    `${effectValue()} a través de un lenguaje ${s1} y ${s2}.`,
    `Una dirección ${axisWord('expression',state.axes.expression).toLowerCase()}, ${axisWord('finish',state.axes.finish).toLowerCase()} y visualmente ${p1}.`,
    `${clean(state.sector)||'El proyecto'}, visto desde el detalle, la intención y una atmósfera propia.`
  ];
}

function renderPaletteEditor(){
  const wrap=$('#editable-palette');wrap.innerHTML='';
  state.palette.forEach((color,index)=>{
    const label=document.createElement('label');label.className='color-control';
    label.innerHTML=`<input type="color" value="${color}" aria-label="Color ${index+1}"><code>${color}</code>`;
    label.querySelector('input').addEventListener('input',event=>{
      state.palette[index]=event.target.value.toUpperCase();
      label.querySelector('code').textContent=state.palette[index];markDirty();renderPreview();
    });
    wrap.append(label);
  });
}

function renderPreview(){
  const sheet=$('#brand-sheet'),background=state.palette[0],ink=contrast(background)==='#fff'?'#fff':state.palette[4];
  sheet.style.background=background;sheet.style.color=ink;sheet.style.setProperty('--sheet-display',`'${displayFont()}', serif`);sheet.style.setProperty('--sheet-body',`'${state.typography.body}', sans-serif`);
  setText('#preview-monogram',initials(state.name));setText('#preview-sector',state.sector);
  $('#preview-name').innerHTML=splitName(state.name);
  setText('#preview-promise',state.promise);setText('#preview-archetype',`EFECTO / ${effectValue().toUpperCase()}`);
  setText('#preview-personality',state.perception.join(' / '));setText('#preview-voice',state.imageStyles.join(' / '));setText('#preview-message',state.direction);
  setText('#preview-display-font',`ATMÓSFERA / ${axisWord('distance',state.axes.distance)}`);
  setText('#preview-body-font',`ACABADO / ${axisWord('finish',state.axes.finish)}`);
  $('#preview-palette').innerHTML=state.palette.map(color=>`<span style="--color:${color}"><small>${color}</small></span>`).join('');
  setText('#summary-name',state.name);setText('#summary-territory',state.perception.join(' · '));setText('#summary-voice',state.imageStyles.join(' · '));setText('#summary-archetype',effectValue());
  setText('#summary-axes',axisSummary().join(' · '));setText('#summary-typography',state.typography.customData?`Personalizada · ${state.typography.customName}`:(typographyNames[state.typography.style]||'Editorial'));
  setText('#summary-palette-mode',paletteModeNames[state.paletteMode]);setText('#summary-references',state.references.length?`${state.references.length} ${state.references.length===1?'imagen comentada':'imágenes comentadas'}`:'Sin imágenes añadidas');
  setText('#summary-rules',state.delegate?'Delegadas en dirección creativa':(selectedRuleCount()?`${selectedRuleCount()} decisiones seleccionadas`:'Pendientes de definir'));setText('#summary-delegate',state.delegate?'En manos de dirección creativa':'Definida por el proyecto');
  setText('#production-status',state.references.length?`${state.references.length} ${state.references.length===1?'referencia preparada':'referencias preparadas'}`:'Referencias pendientes');setText('#system-status',state.delegate?'Criterio técnico delegado':`${selectedRuleCount()} reglas preparadas`);
  const summaries=directionSummaries();setText('#voice-example',`“${summaries[state.summaryIndex%summaries.length]}”`);
  renderPrintReport();
}

function showStep(step){
  const totalSteps=$$('.panel').length;
  state.step=Math.max(0,Math.min(totalSteps-1,step));
  $$('.panel').forEach((panel,index)=>panel.classList.toggle('active',index===state.step));
  $$('.step').forEach((button,index)=>button.classList.toggle('active',index===state.step));
  $('#progress-label').textContent=`Paso ${state.step+1} de ${totalSteps}`;$('#progress-bar').style.width=`${((state.step+1)/totalSteps)*100}%`;
  $('#prev-step').style.visibility=state.step?'visible':'hidden';$('#next-step').textContent=state.step===totalSteps-1?'Volver al inicio ↺':'Continuar →';$('#step-hint').textContent=hints[state.step];
  $('.workspace').scrollTo?.({top:0,behavior:'smooth'});
}
function navigateToStep(step){
  showStep(step);
  if(window.matchMedia('(max-width:800px)').matches)requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,$('.workspace').offsetTop-105),behavior:'smooth'}));
}

function syncControls(){
  Object.entries(inputs).forEach(([key,input])=>input.value=state[key]);
  Object.entries(axisInputs).forEach(([key,input])=>{input.value=state.axes[key];input.style.setProperty('--axis',`${state.axes[key]}%`)});
  $$('#personality-chips .chip').forEach(button=>button.classList.toggle('selected',state.perception.includes(button.dataset.value)));
  $$('#archetypes button').forEach(button=>button.classList.toggle('selected',state.effect===button.dataset.value));
  $('#custom-effect-field').hidden=state.effect!=='Otro';
  $$('#voice-options button').forEach(button=>button.classList.toggle('selected',state.imageStyles.includes(button.dataset.value)));
  $$('#typography-options button').forEach(button=>button.classList.toggle('selected',!state.typography.customData&&state.typography.style===button.dataset.style));
  $$('#palette-modes .chip').forEach(button=>button.classList.toggle('selected',state.paletteMode===button.dataset.mode));
  $$('#palette-presets button').forEach(button=>button.classList.toggle('selected',button.dataset.palette.toUpperCase()===state.palette.join(',').toUpperCase()));
  setText('#custom-font-state',state.typography.customData?`${state.typography.customName} · tipografía personalizada activa`:'WOFF, WOFF2, TTF u OTF · se utilizará en la ficha y el PDF');
  renderPaletteContext();renderPaletteEditor();renderAxisReading();renderReferences();renderRules();renderPreview();showStep(state.step);
}

function markDirty(){const element=$('#save-state');element.textContent='Cambios sin guardar';element.style.color='var(--red)'}
function toast(message){const element=$('#toast');element.textContent=message;element.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>element.classList.remove('show'),1800)}
function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));const element=$('#save-state');element.textContent='Guardado en este navegador';element.style.color='';toast('Dirección de imagen guardada')}
  catch{toast('No hay espacio suficiente para guardar todas las imágenes')}
}
function readAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}
async function compressReference(file){
  const source=await readAsDataURL(file),image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=source});
  const maxSide=1100,scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',.76);
}
function setReferenceProgress(current,total,complete=false){
  const progress=$('#reference-upload-progress'),percent=total?Math.round(current/total*100):0;
  progress.hidden=false;progress.setAttribute('aria-valuenow',String(percent));
  $('#upload-progress-bar').style.width=`${percent}%`;setText('#upload-progress-value',`${percent}%`);
  setText('#upload-progress-label',complete?'Imágenes preparadas':`Preparando imagen ${Math.min(current+1,total)} de ${total}…`);
}
async function activateCustomFont(data){
  if(!data||!window.FontFace)return false;
  try{const face=new FontFace('BM Project Custom',`url(${data})`);await face.load();document.fonts.add(face);return true}catch{toast('No se ha podido cargar esa tipografía');return false}
}
function multiChoice(selector,key,max=3){
  $$(selector).forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.value,current=state[key];
    if(current.includes(value))state[key]=current.filter(item=>item!==value);
    else if(current.length<max)state[key]=[...current,value];
    else return toast(`Puedes elegir hasta ${max}`);
    markDirty();syncControls();
  }));
}

Object.entries(inputs).forEach(([key,input])=>input.addEventListener('input',()=>{state[key]=input.value;markDirty();renderPreview();if(state.paletteMode==='auto')renderPaletteContext()}));
Object.entries(axisInputs).forEach(([key,input])=>input.addEventListener('input',()=>{state.axes[key]=Number(input.value);input.style.setProperty('--axis',`${state.axes[key]}%`);markDirty();renderAxisReading();renderPreview()}));
multiChoice('#personality-chips .chip','perception');multiChoice('#voice-options button','imageStyles');
$$('#archetypes button').forEach(button=>button.addEventListener('click',()=>{state.effect=button.dataset.value;markDirty();syncControls()}));
$$('#palette-presets button').forEach(button=>button.addEventListener('click',()=>{state.palette=button.dataset.palette.split(',');markDirty();syncControls()}));
$$('#typography-options button').forEach(button=>button.addEventListener('click',()=>{
  state.typography={style:button.dataset.style,display:button.dataset.display,body:button.dataset.body,customName:'',customData:''};markDirty();syncControls();toast(`Estilo ${typographyNames[button.dataset.style].toLowerCase()} seleccionado`);
}));
$$('#palette-modes .chip').forEach(button=>button.addEventListener('click',()=>{
  state.paletteMode=button.dataset.mode;applyPaletteVariation();markDirty();syncControls();toast(`Nueva paleta ${paletteModeNames[state.paletteMode].toLowerCase()}`);
}));
$$('.step').forEach(button=>button.addEventListener('click',()=>navigateToStep(Number(button.dataset.step))));
$('#prev-step').addEventListener('click',()=>navigateToStep(state.step-1));
$('#next-step').addEventListener('click',()=>navigateToStep(state.step===$$('.panel').length-1?0:state.step+1));
$('#new-phrase').addEventListener('click',()=>{state.summaryIndex=(state.summaryIndex+1)%directionSummaries().length;markDirty();renderPreview()});
$('#shuffle-palette').addEventListener('click',()=>{applyPaletteVariation();markDirty();syncControls();toast('Nueva variación de color')});
$$('.rule-group').forEach(group=>group.querySelectorAll('[data-value]').forEach(button=>button.addEventListener('click',()=>{
  const key=group.dataset.rule,current=state.rules[key],value=button.dataset.value,max=['presence','rhythm'].includes(key)?2:3;
  if(current.includes(value))state.rules[key]=current.filter(item=>item!==value);else if(current.length<max)state.rules[key]=[...current,value];else return toast(`Puedes elegir hasta ${max}`);
  markDirty();renderRules();renderPreview();
})));
$('#delegate-direction').addEventListener('click',()=>{state.delegate=!state.delegate;markDirty();renderRules();renderPreview();toast(state.delegate?'Dirección técnica delegada':'Dirección técnica definida por el proyecto')});
$('#reference-files').addEventListener('change',async event=>{
  const input=event.currentTarget,available=6-state.references.length,files=[...input.files].slice(0,available);if(!available){input.value='';return toast('Puedes añadir hasta 6 referencias')}if(!files.length)return;
  const zone=$('#reference-upload-zone'),progress=$('#reference-upload-progress');input.disabled=true;zone.classList.add('loading');setReferenceProgress(0,files.length);await new Promise(resolve=>requestAnimationFrame(resolve));
  let added=0;
  try{
    for(let index=0;index<files.length;index++){
      setReferenceProgress(index,files.length);await new Promise(resolve=>requestAnimationFrame(resolve));
      try{const dataUrl=await compressReference(files[index]);state.references.push({name:files[index].name,dataUrl,tags:[],note:''});added+=1}catch{toast('Una de las imágenes no se ha podido preparar')}
      setReferenceProgress(index+1,files.length,index===files.length-1);
    }
    if(added){markDirty();renderReferences();renderPreview();toast(`${added} ${added===1?'referencia añadida':'referencias añadidas'}`)}
    await new Promise(resolve=>setTimeout(resolve,450));
  }finally{input.value='';input.disabled=false;zone.classList.remove('loading');progress.hidden=true}
});
$('#custom-font-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;if(file.size>2500000){event.target.value='';return toast('La tipografía debe pesar menos de 2,5 MB')}
  try{const customData=await readAsDataURL(file),loaded=await activateCustomFont(customData);if(!loaded){event.target.value='';return}state.typography={style:'custom',display:'BM Project Custom',body:'DM Sans',customName:file.name,customData};markDirty();syncControls();toast('Tipografía personalizada aplicada')}catch{toast('No se pudo cargar esa tipografía')}
  event.target.value='';
});
function pdfFilename(){return `${(state.name||'proyecto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'proyecto'}-direccion-imagen.pdf`}
async function printDirection(){
  if(!window.html2canvas||!window.jspdf?.jsPDF){toast('No se ha cargado el generador. Recarga la página.');return}
  const buttons=[$('#export-btn'),$('#print-board')];buttons.forEach(button=>button.disabled=true);renderPrintReport();toast('Preparando PDF · página 1 de 4');
  try{
    await document.fonts?.ready;
    await Promise.all($$('#print-report img').map(image=>image.complete?Promise.resolve():image.decode?.().catch(()=>{})||Promise.resolve()));
    const pages=$$('#print-report .report-page'),pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true}),scale=window.innerWidth<=800?1.35:1.7;
    for(let index=0;index<pages.length;index++){
      toast(`Preparando PDF · página ${index+1} de ${pages.length}`);
      const canvas=await window.html2canvas(pages[index],{scale,useCORS:true,backgroundColor:null,logging:false,imageTimeout:0,windowWidth:794,windowHeight:1123,onclone:documentClone=>{
        const report=documentClone.querySelector('#print-report');report.style.display='block';report.style.width='210mm';report.style.position='absolute';report.style.left='0';report.style.top='0';
      }});
      if(index)pdf.addPage('a4','portrait');pdf.addImage(canvas.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297,undefined,'FAST');canvas.width=1;canvas.height=1;
    }
    pdf.save(pdfFilename());toast('PDF descargado');
  }catch(error){console.error(error);toast('No se ha podido generar el PDF. Recarga e inténtalo de nuevo.')}
  finally{buttons.forEach(button=>button.disabled=false)}
}
window.addEventListener('beforeprint',renderPrintReport);
$('#save-btn').addEventListener('click',save);$('#export-btn').addEventListener('click',printDirection);$('#print-board').addEventListener('click',printDirection);

const resetDialog=$('#reset-dialog');
$('#reset-btn').addEventListener('click',()=>resetDialog.showModal());$('#cancel-reset').addEventListener('click',()=>resetDialog.close());
$('#confirm-reset').addEventListener('click',()=>{state=structuredClone(defaults);localStorage.removeItem(STORAGE_KEY);syncControls();markDirty();resetDialog.close();toast('Kit reiniciado')});
resetDialog.addEventListener('click',event=>{const box=resetDialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)resetDialog.close()});

try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved)state={...defaults,...saved,axes:{...defaults.axes,...saved.axes},rules:{...defaults.rules,...saved.rules},typography:{...defaults.typography,...saved.typography}}}catch{}
if(state.typography.customData)activateCustomFont(state.typography.customData).then(renderPreview);
syncControls();
