function openCompare(){
  autoSave();
  compareReturnScreen=document.getElementById('editor-screen')?.classList.contains('active')?'editor-screen':'home-screen';
  showScreen('compare-screen');
  renderCompareTool();
}

function openHomeFromCompare(){
  if(compareReturnScreen==='editor-screen'){
    showScreen('editor-screen');
    renderZenStrip();
  } else {
    renderHome();
    showScreen('home-screen');
  }
}

function clearComparator(){
  compareSlots=[null,null,null,null];
  comparePendingSlot=null;
  comparePaletteOverride=null;
  comparePickColorIndex=null;
  document.body.classList.remove('compare-pick-mode');
  renderCompareTool();
}

function pickCompareFile(idx){
  comparePendingSlot=idx;
  const inp=document.getElementById('compare-file-input');
  if(inp){inp.value='';inp.click();}
}

function handleCompareFiles(e){
  const files=[...(e.target.files||[])].filter(f=>f.type.startsWith('image/'));
  if(!files.length)return;
  let start=Number.isInteger(comparePendingSlot)?comparePendingSlot:compareSlots.findIndex(s=>!s);
  if(start<0)start=0;
  files.forEach((file,offset)=>{
    const slot=(start+offset)%4;
    loadCompareFileToSlot(slot,file);
  });
  comparePendingSlot=null;
}

function loadCompareFileToSlot(index,file){
  if(index<0||index>3)return;
  const reader=new FileReader();
  const name=file.name||`Reference ${index+1}`;
  compareSlots[index]={name,src:'',analysis:null,loading:true};
  renderCompareTool();
  reader.onload=ev=>{
    const originalSrc=ev.target.result;
    compressImageDataUrl(originalSrc,1200,.86).then(src=>{
      compareSlots[index]={name,src,analysis:null,loading:true};
      comparePaletteOverride=null;
      renderCompareTool();
      analyzeCompareImage(originalSrc).then(analysis=>{
        compareSlots[index]={name,src,analysis:{...analysis,src},loading:false};
        renderCompareTool();
      });
    });
  };
  reader.readAsDataURL(file);
}

function compressImageDataUrl(src,maxSide=1200,quality=.78){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const scale=Math.min(1,maxSide/Math.max(img.width,img.height));
      const c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(img.width*scale));
      c.height=Math.max(1,Math.round(img.height*scale));
      const ctx=c.getContext('2d');
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.fillStyle='#ffffff';
      ctx.fillRect(0,0,c.width,c.height);
      ctx.drawImage(img,0,0,c.width,c.height);
      try{resolve(c.toDataURL('image/jpeg',quality));}
      catch(e){resolve(src);}
    };
    img.onerror=()=>resolve(src);
    img.src=src;
  });
}

function removeCompareSlot(index){
  compareSlots[index]=null;
  comparePaletteOverride=null;
  renderCompareTool();
}

function renderCompareTool(){
  const grid=document.getElementById('compare-grid');
  const common=document.getElementById('compare-common');
  const findings=document.getElementById('compare-findings');
  const overlap=document.getElementById('compare-overlap');
  if(!grid||!common||!findings||!overlap)return;

  if(compareSlots.length<4)compareSlots=[...compareSlots,...Array(4-compareSlots.length).fill(null)];
  compareSlots=compareSlots.slice(0,4);

  grid.innerHTML='';
  const loaded=compareSlots.map((slot,idx)=>slot?{...slot,idx}:null).filter(Boolean);

  for(let i=0;i<4;i++){
    const slot=compareSlots[i];
    const card=document.createElement('div');
    card.className='ref-slot';
    card.innerHTML=`
      <div class="ref-slot-head">
        <div class="ref-slot-name">${slot?.name?escHtml(slot.name):'Reference '+(i+1)}</div>
        <div class="ref-slot-actions">
          <button class="ref-mini-btn" title="Cargar imagen" data-act="load"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>
          <button class="ref-mini-btn" title="Clear slot" data-act="clear"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
        </div>
      </div>
      <div class="ref-drop" data-drop="${i}">
        ${slot?.loading?'<div class="ref-placeholder"><div style="font-size:20px;font-weight:800;color:var(--txt2)">Cargando...</div><div>Analizando imagen</div></div>':slot?.src?`<img class="ref-preview" src="${slot.src}" alt="">`:`<div class="ref-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><div>Suelta o carga una referencia</div><div style="font-size:10px;color:var(--txt3)">Solo imágenes</div></div>`}
      </div>
      <div class="ref-meta">
        <div class="ref-palette" data-palette="${i}"></div>
        <div class="ref-stats" data-stats="${i}"></div>
      </div>`;

    card.querySelector('[data-act="load"]').onclick=()=>pickCompareFile(i);
    card.querySelector('[data-act="clear"]').onclick=()=>removeCompareSlot(i);
    const drop=card.querySelector('[data-drop]');
    drop.onclick=e=>{
      if(comparePickColorIndex!=null&&slot?.src){
        const img=e.target.closest('img.ref-preview');
        if(!img)return;
        const col=sampleCompareImageColor(img,e);
        if(col){
          setComparePaletteColor(comparePickColorIndex,col);
          toast('Color updated: '+col);
        }
        comparePickColorIndex=null;
        document.body.classList.remove('compare-pick-mode');
        return;
      }
      pickCompareFile(i);
    };
    drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag');});
    drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
    drop.addEventListener('drop',e=>{
      e.preventDefault();drop.classList.remove('drag');
      const file=[...(e.dataTransfer?.files||[])].find(f=>f.type.startsWith('image/'));
      if(file)loadCompareFileToSlot(i,file);
    });

    const pal=card.querySelector(`[data-palette="${i}"]`);
    const stat=card.querySelector(`[data-stats="${i}"]`);
    if(slot?.analysis){
      renderMiniPalette(pal,slot.analysis.palette);
      stat.innerHTML=`
        <div class="ref-stat"><div class="ref-stat-lbl">Tono</div><div class="ref-stat-val">${slot.analysis.tone}</div></div>
        <div class="ref-stat"><div class="ref-stat-lbl">Mood</div><div class="ref-stat-val">${slot.analysis.mood}</div></div>
        <div class="ref-stat"><div class="ref-stat-lbl">Contraste</div><div class="ref-stat-val">${slot.analysis.contrast}</div></div>`;
    } else {
      pal.innerHTML='';
      stat.innerHTML='';
    }
    grid.appendChild(card);
  }

  const active=loaded.filter(x=>x.analysis);
  const summary=buildCompareSummary(active.map(x=>x.analysis));
  const displayPalette=getComparePalette(summary);
  const convertBtn=document.getElementById('compare-convert-btn');
  if(convertBtn){
    convertBtn.disabled=compareConverting||active.length===0||active.some(x=>x.loading);
    convertBtn.style.opacity=convertBtn.disabled?'.55':'';
  }
  common.innerHTML=summary.chips.map(t=>`<span class="compare-chip">${escHtml(t)}</span>`).join('')||'<div class="compare-empty">Carga al menos dos imágenes para comparar</div>';
  findings.innerHTML=summary.lines.map(t=>`<div class="compare-finding">${escHtml(t)}</div>`).join('')||'<div class="compare-empty">Todavía no hay comparación</div>';
  renderCompareSharedPalette(overlap,displayPalette);
}

function renderMiniPalette(container,palette=[]){
  if(!container)return;
  container.innerHTML=palette.slice(0,5).map(col=>`<div class="ref-swatch" title="${col}" style="background:${col};" onclick="navigator.clipboard?.writeText('${col}').catch(()=>{});toast('Copiado ${col}')"></div>`).join('');
}

function getComparePalette(summary){
  const base=(summary?.overlap||[]).slice(0,8);
  if(comparePaletteOverride&&comparePaletteOverride.length)return comparePaletteOverride.slice(0,8);
  return base;
}

function setComparePaletteColor(index,color){
  if(!/^#[0-9a-f]{6}$/i.test(color||''))return;
  const current=getComparePalette(buildCompareSummary((compareSlots||[]).filter(s=>s?.analysis).map(s=>s.analysis)));
  current[index]=color.toLowerCase();
  comparePaletteOverride=current;
  renderCompareTool();
}

function renderCompareSharedPalette(container,palette=[]){
  if(!container)return;
  if(!palette.length){
    container.innerHTML='<div class="compare-empty" style="height:90px;">Todavía no hay paleta compartida</div>';
    return;
  }
  container.innerHTML='';
  palette.forEach((col,i)=>{
    const item=document.createElement('div');
    item.className='compare-palette-item';
    item.innerHTML=`
      <div class="compare-palette-swatch" title="${col}" style="background:${col};"></div>
      <input class="compare-palette-input" type="color" value="${col}" aria-label="Change color">
      <div class="compare-palette-tools">
        <button class="compare-palette-tool" title="Pick from references" data-pick="${i}">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8Z"/></svg>
        </button>
      </div>`;
    item.querySelector('.compare-palette-input').oninput=e=>setComparePaletteColor(i,e.target.value);
    item.querySelector('[data-pick]').onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      comparePickColorIndex=i;
      document.body.classList.add('compare-pick-mode');
      toast('Click a reference image to pick a color');
    };
    item.querySelector('.compare-palette-swatch').onclick=()=>{
      navigator.clipboard?.writeText(col).catch(()=>{});
      toast('Copiado '+col);
    };
    container.appendChild(item);
  });
}

function sampleCompareImageColor(imgEl,e){
  try{
    const rect=imgEl.getBoundingClientRect();
    const naturalW=imgEl.naturalWidth||imgEl.width;
    const naturalH=imgEl.naturalHeight||imgEl.height;
    const renderedRatio=rect.width/rect.height;
    const naturalRatio=naturalW/naturalH;
    let drawW=rect.width,drawH=rect.height,offX=0,offY=0;
    if(naturalRatio>renderedRatio){
      drawH=rect.width/naturalRatio;
      offY=(rect.height-drawH)/2;
    }else{
      drawW=rect.height*naturalRatio;
      offX=(rect.width-drawW)/2;
    }
    const x=(e.clientX-rect.left-offX)/drawW;
    const y=(e.clientY-rect.top-offY)/drawH;
    if(x<0||x>1||y<0||y>1)return null;
    const c=document.createElement('canvas');
    c.width=naturalW;c.height=naturalH;
    const ctx=c.getContext('2d');
    ctx.drawImage(imgEl,0,0);
    const px=Math.max(0,Math.min(naturalW-1,Math.floor(x*naturalW)));
    const py=Math.max(0,Math.min(naturalH-1,Math.floor(y*naturalH)));
    const sx=Math.max(0,px-2);
    const sy=Math.max(0,py-2);
    const sw=Math.min(5,naturalW-sx);
    const sh=Math.min(5,naturalH-sy);
    const data=ctx.getImageData(sx,sy,sw,sh).data;
    let r=0,g=0,b=0,n=0;
    for(let i=0;i<data.length;i+=4){
      if(data[i+3]<20)continue;
      r+=data[i];g+=data[i+1];b+=data[i+2];n++;
    }
    if(!n)return null;
    return rgbToHex(r/n,g/n,b/n);
  }catch(err){
    return null;
  }
}

function analyzeCompareImage(src){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const palette=extractPaletteFromElement(img,5);
      const stats=extractImageStats(img);
      const tone=stats.hue<30||stats.hue>330?'Warm':stats.hue<180?'Neutral':'Cool';
      const mood=stats.saturation>42?(stats.brightness>145?'Bright':'Vivid'):(stats.brightness>150?'Soft':'Muted');
      const contrast=stats.contrast>55?'High':stats.contrast>28?'Medium':'Low';
      resolve({...stats,palette,tone,mood,contrast,contrastScore:stats.contrast,src});
    };
    img.onerror=()=>resolve({palette:[],tone:'Unknown',mood:'Unknown',contrast:'Unknown',contrastScore:0,brightness:0,saturation:0,hue:0,src});
    img.src=src;
  });
}

function rgbToHsl(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h=0,s=0;
  const l=(max+min)/2;
  const d=max-min;
  if(d){
    s=l>.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r:h=(g-b)/d+(g<b?6:0);break;
      case g:h=(b-r)/d+2;break;
      default:h=(r-g)/d+4;break;
    }
    h*=60;
  }
  return [h,s*100,l*100];
}

function perceptualRgbDistance(a,b){
  const dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];
  return Math.sqrt(.3*dr*dr+.59*dg*dg+.11*db*db);
}

function quantizedRgbKey(r,g,b,step=12){
  const q=v=>Math.max(0,Math.min(255,Math.round(v/step)*step));
  return `${q(r)},${q(g)},${q(b)}`;
}

function extractPaletteFromElement(el,count=5){
  const c=document.createElement('canvas');
  const W=128,H=128;
  c.width=W;c.height=H;
  const ctx=c.getContext('2d');
  try{ctx.drawImage(el,0,0,W,H);}catch(e){return [];}
  const data=ctx.getImageData(0,0,W,H).data;
  const border=new Map();
  const borderKeyAt=(x,y)=>{
    const i=(y*W+x)*4;
    if(data[i+3]<30)return null;
    return quantizedRgbKey(data[i],data[i+1],data[i+2],18);
  };
  for(let x=0;x<W;x++){
    [borderKeyAt(x,0),borderKeyAt(x,H-1)].forEach(k=>{if(k)border.set(k,(border.get(k)||0)+1);});
  }
  for(let y=1;y<H-1;y++){
    [borderKeyAt(0,y),borderKeyAt(W-1,y)].forEach(k=>{if(k)border.set(k,(border.get(k)||0)+1);});
  }
  const borderTotal=[...border.values()].reduce((a,b)=>a+b,0)||1;
  const backgroundKeys=new Set([...border.entries()].filter(([,n])=>n/borderTotal>.18).map(([k])=>k));

  const buckets=new Map();
  for(let i=0;i<data.length;i+=4){
    const a=data[i+3];
    if(a<35)continue;
    const r=data[i],g=data[i+1],b=data[i+2];
    const [h,s,l]=rgbToHsl(r,g,b);
    if(l>98||l<2)continue;
    const borderKey=quantizedRgbKey(r,g,b,18);
    let weight=1;
    if(s<7)weight*=.22;
    if(l>92||l<8)weight*=.32;
    if(backgroundKeys.has(borderKey)&&(s<18||l>84||l<16))weight*=.14;
    weight*=.65+Math.min(1.35,s/55);
    const key=quantizedRgbKey(r,g,b,10);
    const bucket=buckets.get(key)||{r:0,g:0,b:0,weight:0,raw:0,h:0,s:0,l:0};
    bucket.r+=r*weight;bucket.g+=g*weight;bucket.b+=b*weight;
    bucket.h+=h*weight;bucket.s+=s*weight;bucket.l+=l*weight;
    bucket.weight+=weight;bucket.raw++;
    buckets.set(key,bucket);
  }

  let candidates=[...buckets.values()].filter(x=>x.weight>.8).map(x=>{
    const rgb=[x.r/x.weight,x.g/x.weight,x.b/x.weight];
    const hsl=rgbToHsl(rgb[0],rgb[1],rgb[2]);
    const centerBonus=1-Math.min(.55,Math.abs(hsl[2]-55)/110);
    const satBonus=.7+Math.min(1.15,hsl[1]/70);
    return {rgb,weight:x.weight,score:x.weight*satBonus*centerBonus,hsl};
  }).sort((a,b)=>b.score-a.score).slice(0,80);

  if(!candidates.length)return [];
  const seeds=[];
  for(const cnd of candidates){
    if(seeds.length>=count)break;
    if(seeds.every(seed=>perceptualRgbDistance(seed.rgb,cnd.rgb)>28))seeds.push({rgb:[...cnd.rgb]});
  }
  for(const cnd of candidates){
    if(seeds.length>=count)break;
    if(!seeds.some(seed=>perceptualRgbDistance(seed.rgb,cnd.rgb)<16))seeds.push({rgb:[...cnd.rgb]});
  }
  const centroids=seeds.length?seeds:candidates.slice(0,count).map(cnd=>({rgb:[...cnd.rgb]}));
  for(let iter=0;iter<7;iter++){
    const groups=centroids.map(()=>({r:0,g:0,b:0,w:0,score:0}));
    candidates.forEach(cnd=>{
      let best=0,bestD=Infinity;
      centroids.forEach((centroid,idx)=>{
        const d=perceptualRgbDistance(centroid.rgb,cnd.rgb);
        if(d<bestD){bestD=d;best=idx;}
      });
      groups[best].r+=cnd.rgb[0]*cnd.weight;
      groups[best].g+=cnd.rgb[1]*cnd.weight;
      groups[best].b+=cnd.rgb[2]*cnd.weight;
      groups[best].w+=cnd.weight;
      groups[best].score+=cnd.score;
    });
    groups.forEach((g,idx)=>{
      if(g.w)centroids[idx].rgb=[g.r/g.w,g.g/g.w,g.b/g.w];
      centroids[idx].score=g.score;
    });
  }

  const palette=centroids
    .map(c=>({rgb:c.rgb,hsl:rgbToHsl(c.rgb[0],c.rgb[1],c.rgb[2]),score:c.score||0}))
    .filter(c=>c.hsl[2]>4&&c.hsl[2]<96)
    .sort((a,b)=>b.score-a.score)
    .reduce((acc,c)=>{
      if(acc.length<count&&acc.every(x=>perceptualRgbDistance(x.rgb,c.rgb)>24))acc.push(c);
      return acc;
    },[]);

  for(const cnd of candidates){
    if(palette.length>=count)break;
    if(palette.every(x=>perceptualRgbDistance(x.rgb,cnd.rgb)>24))palette.push(cnd);
  }

  return palette.slice(0,count).map(c=>rgbToHex(c.rgb[0],c.rgb[1],c.rgb[2]));
}

function extractImageStats(el){
  const c=document.createElement('canvas');
  const W=48,H=48;
  c.width=W;c.height=H;
  const ctx=c.getContext('2d');
  try{ctx.drawImage(el,0,0,W,H);}catch(e){return {brightness:0,saturation:0,hue:0,contrast:0};}
  const data=ctx.getImageData(0,0,W,H).data;
  let sumR=0,sumG=0,sumB=0,sumBright=0,sumSat=0,hueX=0,hueY=0,count=0;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
    if(a<10)continue;
    const [hue,sat]=rgbToHsl(r,g,b);
    const hueWeight=Math.max(.04,sat/100);
    sumR+=r;sumG+=g;sumB+=b;
    sumBright+=0.299*r+0.587*g+0.114*b;
    sumSat+=sat;
    hueX+=Math.cos(hue*Math.PI/180)*hueWeight;
    hueY+=Math.sin(hue*Math.PI/180)*hueWeight;
    count++;
  }
  if(!count)return {brightness:0,saturation:0,hue:0,contrast:0,avgHex:'#000000'};
  const avgR=sumR/count, avgG=sumG/count, avgB=sumB/count;
  let variance=0;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
    if(a<10)continue;
    const bright=0.299*r+0.587*g+0.114*b;
    variance+=(bright-(sumBright/count))**2;
  }
  variance=Math.sqrt(variance/Math.max(1,count));
  let hue=Math.round(Math.atan2(hueY,hueX)*180/Math.PI);
  if(hue<0)hue+=360;
  return {
    brightness:Math.round(sumBright/count),
    saturation:Math.round(sumSat/count),
    hue:hue||0,
    contrast:Math.round(variance),
    avgHex:`#${Math.round(avgR).toString(16).padStart(2,'0')}${Math.round(avgG).toString(16).padStart(2,'0')}${Math.round(avgB).toString(16).padStart(2,'0')}`
  };
}

function rgbToHex(r,g,b){
  return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}

function hexToRgb(hex){
  const m=String(hex||'').replace('#','').match(/^([0-9a-f]{6})$/i);
  if(!m)return null;
  const n=parseInt(m[1],16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}

function colorDistance(a,b){
  const ar=hexToRgb(a), br=hexToRgb(b);
  if(!ar||!br)return 999;
  const dr=ar[0]-br[0], dg=ar[1]-br[1], db=ar[2]-br[2];
  return Math.sqrt(dr*dr+dg*dg+db*db);
}

function buildCompareSummary(items){
  if(!items.length)return {chips:[],lines:[],overlap:[]};
  const tones=items.map(i=>i.tone);
  const moods=items.map(i=>i.mood);
  const contrasts=items.map(i=>Number.isFinite(i.contrastScore)?i.contrastScore:(i.contrast==='High'?65:i.contrast==='Medium'?40:18));
  const brightnesses=items.map(i=>i.brightness||0);
  const saturations=items.map(i=>i.saturation||0);

  const paletteHits={};
  items.forEach(item=>{
    (item.palette||[]).forEach(col=>{
      const key=(Object.entries(paletteHits).find(([k])=>colorDistance(k,col)<28)||[col])[0];
      paletteHits[key]=(paletteHits[key]||0)+1;
    });
  });
  const overlap=Object.entries(paletteHits).filter(([,n])=>n>1).map(([col])=>col).slice(0,8);

  const countBy=arr=>arr.reduce((acc,v)=>{acc[v]=(acc[v]||0)+1;return acc;},{});
  const bucketCounts=(values,rules)=>values.reduce((acc,v)=>{
    const rule=rules.find(r=>r.test(v))||rules[rules.length-1];
    acc[rule.key]=(acc[rule.key]||0)+1;
    return acc;
  },{});
  const topLabel=(counts)=>{
    const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    if(!entries.length)return null;
    return entries.length>1&&entries[0][1]===entries[1][1]?null:entries[0][0];
  };
  const hasMeaningfulSplit=(counts)=>Object.values(counts).filter(n=>n>0).length>1&&Math.max(...Object.values(counts))<items.length;

  const toneCounts=countBy(tones);
  const moodCounts=countBy(moods);
  const lightCounts=bucketCounts(brightnesses,[
    {key:'dark',test:v=>v<105},
    {key:'mid',test:v=>v<=165},
    {key:'light',test:v=>v>165}
  ]);
  const satCounts=bucketCounts(saturations,[
    {key:'muted',test:v=>v<28},
    {key:'balanced',test:v=>v<=48},
    {key:'saturated',test:v=>v>48}
  ]);
  const contrastCounts=bucketCounts(contrasts,[
    {key:'soft',test:v=>v<30},
    {key:'medium',test:v=>v<=55},
    {key:'high',test:v=>v>55}
  ]);

  const dominantTone=topLabel(toneCounts);
  const dominantMood=topLabel(moodCounts);
  const dominantLight=topLabel(lightCounts);
  const dominantSat=topLabel(satCounts);
  const dominantContrast=topLabel(contrastCounts);

  const chips=[];
  chips.push(dominantTone?{Warm:'Cálida',Cool:'Fría',Neutral:'Neutra'}[dominantTone]||dominantTone:'Temperatura mixta');
  chips.push(dominantLight?{light:'Luminosa',mid:'Luz media',dark:'Oscura'}[dominantLight]:'Luz mixta');
  chips.push(dominantSat?{saturated:'Colorida',balanced:'Equilibrada',muted:'Sobria'}[dominantSat]:'Saturación mixta');
  chips.push(dominantContrast?{high:'Contraste alto',medium:'Contraste medio',soft:'Contraste suave'}[dominantContrast]:'Contraste mixto');
  if(dominantMood)chips.push(dominantMood==='Bright'?'Brillante':dominantMood==='Muted'?'Suave':dominantMood==='Soft'?'Delicada':'Viva');

  const lightDirection=!dominantLight
    ?`combina referencias luminosas y oscuras (${lightCounts.light||0} claras, ${lightCounts.dark||0} oscuras, ${lightCounts.mid||0} intermedias), así que no hay una única dirección de luz todavía`
    :dominantLight==='light'
      ?'va hacia una dirección clara, aireada y luminosa'
      :dominantLight==='dark'
        ?'va hacia una dirección oscura, densa y dramática'
        :'se mantiene en una luminosidad media, equilibrada y flexible';
  const contrastDirection=!dominantContrast
    ?`El contraste está dividido (${contrastCounts.high||0} alto, ${contrastCounts.medium||0} medio, ${contrastCounts.soft||0} suave); conviene decidir si la dirección debe ser más dramática o más limpia.`
    :dominantContrast==='high'
      ?'Predomina un contraste alto, con una lectura más marcada y gráfica.'
      :dominantContrast==='soft'
        ?'Predomina un contraste suave, con una lectura más calmada y continua.'
        :'Predomina un contraste medio, suficiente para ordenar la imagen sin volverse demasiado dramático.';
  const saturationDirection=!dominantSat
    ?`La saturación también está mezclada (${satCounts.saturated||0} coloridas, ${satCounts.balanced||0} equilibradas, ${satCounts.muted||0} sobrias), así que el color todavía no apunta a una sola intensidad.`
    :dominantSat==='saturated'
      ?'El grupo se siente más saturado y expresivo.'
      :dominantSat==='muted'
        ?'El grupo se siente más apagado, sobrio y contenido.'
        :'El grupo tiene una saturación equilibrada, con una lectura editorial pero no neutra del todo.';

  const lines=[
    `Las referencias ${lightDirection}.`,
    overlap.length?`Hay colores compartidos entre las referencias, así que la dirección es bastante coherente.`:`Hay poco solapamiento de color, así que estas referencias van por caminos distintos.`,
    contrastDirection,
    saturationDirection
  ];
  return {chips,lines,overlap};
}

function getComparatorPayload(){
  const refs=(compareSlots||[])
    .map((slot,idx)=>slot&&slot.analysis?{...slot,idx}:null)
    .filter(Boolean);
  const analyses=refs.map(r=>r.analysis);
  const summary=buildCompareSummary(analyses);
  const allColors=[];
  refs.forEach(r=>(r.analysis.palette||[]).forEach(c=>{
    if(!allColors.some(x=>colorDistance(x,c)<24))allColors.push(c);
  }));
  const palette=(comparePaletteOverride&&comparePaletteOverride.length?comparePaletteOverride:(summary.overlap.length?summary.overlap:allColors)).slice(0,8);
  return {refs,summary,palette};
}

function ensureProjectAssets(pid){
  const p=projects[pid];
  if(!p)return null;
  if(!Array.isArray(p.palettes))p.palettes=[];
  if(!Array.isArray(p.comparisons))p.comparisons=[];
  return p;
}

function saveComparatorAssets(pid,cid,payload){
  const p=ensureProjectAssets(pid);
  if(!p)return;
  let paletteId=null;
  if(payload.palette.length){
    paletteId=genId();
    p.palettes.unshift({
      id:paletteId,
      name:'Visual Direction Palette',
      colors:[...payload.palette],
      source:'comparison',
      canvasId:cid,
      createdAt:new Date().toISOString()
    });
  }
  p.comparisons.unshift({
    id:genId(),
    name:'Visual Direction',
    canvasId:cid,
    paletteId,
    createdAt:new Date().toISOString(),
    refs:payload.refs.map(r=>({name:r.name,palette:r.analysis.palette,tone:r.analysis.tone,mood:r.analysis.mood,contrast:r.analysis.contrast})),
    summary:payload.summary,
    palette:[...payload.palette]
  });
  p.comparisons=p.comparisons.slice(0,12);
  p.palettes=p.palettes.slice(0,24);
}

async function convertComparatorToBoard(){
  if(compareConverting)return toast('Ya se esta creando el board');
  const payload=getComparatorPayload();
  if(!payload.refs.length)return toast('Añade al menos una referencia');
  compareConverting=true;
  renderCompareTool();
  await Promise.all(payload.refs.map(async r=>{
    r.src=await compressImageDataUrl(r.src,520,.62);
  }));
  let pid=curProj;
  if(compareReturnScreen!=='editor-screen'||!pid||!projects[pid]){
    compareConverting=false;
    renderCompareTool();
    _pendingComparePayload=payload;
    const input=document.getElementById('m-compare-proj-n');
    if(input)input.value='Visual Direction';
    openM('m-compare-proj');
    setTimeout(()=>input?.focus(),40);
    return;
  }
  createVisualDirectionFromPayload(payload,pid);
}

function cancelCompareProjectModal(){
  _pendingComparePayload=null;
  closeM('m-compare-proj');
}

function confirmCompareProjectModal(){
  if(compareConverting)return toast('Ya se esta creando el board');
  const payload=_pendingComparePayload;
  if(!payload)return closeM('m-compare-proj');
  compareConverting=true;
  renderCompareTool();
  const name=(document.getElementById('m-compare-proj-n')?.value||'Visual Direction').trim()||'Visual Direction';
  const pid=createProjWithTags(name,[],'in_progress');
  _pendingComparePayload=null;
  closeM('m-compare-proj');
  createVisualDirectionFromPayload(payload,pid);
}

function createVisualDirectionFromPayload(payload,pid){
  ensureProjectAssets(pid);
  const cid=createCv(pid,'Visual Direction');
  saveComparatorAssets(pid,cid,payload);
  openEditor(pid,cid);
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      Promise.resolve(buildVisualDirectionCanvas(payload,pid,cid))
        .catch(err=>{
          console.warn('MoodBoard Pro compare conversion failed',err);
          toast('No se pudo crear el board desde la comparacion');
        })
        .finally(()=>{
          compareConverting=false;
          renderCompareTool();
        });
    });
  });
}

function addBoardObject(o,layerId){
  o.__id=o.__id||genId();
  applyObjectControls(o);
  o.set({selectable:true,evented:true,hasControls:true,hasBorders:true});
  assignToLayer(o,layerId);
  cv.add(o);
  return o;
}

function makeBoardText(text,left,top,width,opts={}){
  const t=new fabric.Textbox(text,{
    left,top,width,
    fontFamily:opts.fontFamily||'Syne',
    __fontFamily:opts.fontFamily||'Syne',
    fontSize:opts.fontSize||18,
    fontWeight:opts.fontWeight||'600',
    fill:opts.fill||'#111827',
    lineHeight:opts.lineHeight||1.18,
    objectCaching:false,
  });
  normalizeTextBox(t);
  return t;
}

function addBoardImage(src,left,top,maxW,maxH,layerId){
  return new Promise(resolve=>{
    fabric.Image.fromURL(src,img=>{
      if(!img)return resolve(null);
      const scale=Math.min(maxW/img.width,maxH/img.height,1);
      img.set({
        left,
        top,
        scaleX:scale,
        scaleY:scale,
        objectCaching:false,
        noScaleCache:true,
      });
      addBoardObject(img,layerId);
      resolve(img);
    });
  });
}

async function buildVisualDirectionCanvas(payload,pid,cid){
  if(!cv||curProj!==pid||curCv!==cid)return;
  histLock=true;
  cv.clear();
  cv.backgroundColor=null;
  layers=[];activeLayerId=null;selectedLayerIds=new Set();setCollapsedLayerIds([]);
  manualGuides={x:[],y:[]};
  const refLayer=newLayer('References');
  const insightLayer=newLayer('Direction Notes');
  const paletteLayer=newLayer('Project Palette');
  cv.setViewportTransform([1,0,0,1,0,0]);

  const w=Math.max(cv.width,1000);
  const left=60, top=78, gap=22;
  const notesX=w-330;
  const cols=payload.refs.length>2?2:Math.max(1,payload.refs.length);
  const rows=Math.ceil(payload.refs.length/cols);
  const refW=Math.min(250,Math.max(190,(notesX-left-44-gap*(cols-1))/cols));
  const refH=payload.refs.length>2?180:260;
  addBoardObject(makeBoardText('Visual Direction',left,28,360,{fontSize:30,fontWeight:'800'}),insightLayer);
  addBoardObject(makeBoardText(`${payload.refs.length} visual reference${payload.refs.length!==1?'s':''}`,left,62,360,{fontSize:12,fontWeight:'600',fill:'#78716C',fontFamily:'DM Mono'}),insightLayer);

  for(let i=0;i<payload.refs.length;i++){
    const r=payload.refs[i];
    const col=i%cols;
    const row=Math.floor(i/cols);
    const x=left+col*(refW+gap);
    const y=top+row*(refH+62);
    await addBoardImage(r.src,x,y,refW,refH,refLayer);
    const refColors=(r.analysis.palette||[]).slice(0,5);
    const swGap=5;
    const swSize=Math.min(26,Math.floor((refW-swGap*(refColors.length-1))/Math.max(1,refColors.length)));
    refColors.forEach((col,j)=>{
      addBoardObject(new fabric.Rect({
        left:x+j*(swSize+swGap),
        top:y+refH+12,
        width:swSize,
        height:18,
        fill:col,
        rx:3,
        ry:3
      }),paletteLayer);
    });
  }

  const chips=payload.summary.chips.join('  /  ');
  const lines=payload.summary.lines.join('\n\n');
  addBoardObject(makeBoardText('Shared Direction',notesX,top,280,{fontSize:17,fontWeight:'800'}),insightLayer);
  addBoardObject(makeBoardText(chips,notesX,top+30,280,{fontSize:12,fontWeight:'700',fill:'#C8102E',fontFamily:'DM Mono'}),insightLayer);
  addBoardObject(makeBoardText(lines,notesX,top+62,280,{fontSize:13,fontWeight:'500',fill:'#44403C',lineHeight:1.35}),insightLayer);

  const palY=top+rows*(refH+58)+30;
  addBoardObject(makeBoardText('Project Palette',left,palY,240,{fontSize:16,fontWeight:'800'}),paletteLayer);
  payload.palette.forEach((col,i)=>{
    const x=left+i*70;
    const rect=new fabric.Rect({left:x,top:palY+34,width:54,height:54,fill:col,rx:4,ry:4});
    addBoardObject(rect,paletteLayer);
    addBoardObject(makeBoardText(col,x,palY+94,66,{fontSize:9,fontWeight:'600',fill:'#78716C',fontFamily:'DM Mono'}),paletteLayer);
  });

  histLock=false;
  rebuildCanvasZOrder();
  cv.discardActiveObject();
  cv.renderAll();
  const state={canvas:canvasJSON(),layers,activeLayerId,manualGuides,collapsedLayerIds:getCollapsedLayerIds(),viewport:cv.viewportTransform.slice()};
  const imageCount=(state.canvas.objects||[]).filter(o=>o.type==='image'&&o.src).length;
  if(imageCount<payload.refs.length){
    toast('No se pudieron preparar todas las imágenes para guardar');
  }
  projects[pid].canvases[cid].json=JSON.stringify(state);
  const saved=await saveLS();
  saveH();renderLayers();renderCvList();renderProjectPalettes();updateStatus();
  toast(saved?'Visual Direction board creado':'Board creado, pero el navegador no pudo guardarlo');
}

function renderProjectPalettes(){
  const wrap=document.getElementById('project-palettes');
  const list=document.getElementById('project-palette-list');
  if(!wrap||!list)return;
  const p=curProj?projects[curProj]:null;
  const palettes=Array.isArray(p?.palettes)?p.palettes:[];
  wrap.style.display=palettes.length?'block':'none';
  list.innerHTML='';
  if(!palettes.length){
    list.innerHTML='<div class="project-palette-empty">No saved palettes yet</div>';
    return;
  }
  palettes.slice(0,6).forEach(pal=>{
    const row=document.createElement('div');
    row.className='project-palette-row';
    const colors=(pal.colors||[]).slice(0,6);
    row.innerHTML=`
      <div class="project-palette-name" title="${escHtml(pal.name||'Palette')}">${escHtml(pal.name||'Palette')}</div>
      <div class="project-palette-swatches">${colors.map((c,i)=>`
        <label class="project-palette-swatch-wrap" title="Edit ${c}">
          <span class="project-palette-swatch" style="background:${c}" data-color="${c}"></span>
          <input type="color" value="${c}" data-edit-color="${i}" aria-label="Edit color ${i+1}">
        </label>`).join('')}</div>
      <div class="project-palette-actions">
        <button class="ly-tool" title="Place palette on canvas" data-place="${pal.id}">Place</button>
        <button class="ly-tool red" title="Delete palette" data-delete-palette="${pal.id}">Del</button>
      </div>`;
    row.querySelectorAll('[data-edit-color]').forEach(input=>{
      input.oninput=e=>setProjectPaletteColor(pal.id,+e.target.dataset.editColor,e.target.value);
    });
    row.querySelector('[data-place]').onclick=()=>placeProjectPalette(pal.id);
    row.querySelector('[data-delete-palette]').onclick=()=>deleteProjectPalette(pal.id);
    list.appendChild(row);
  });
}

function setProjectPaletteColor(paletteId,index,color){
  if(!/^#[0-9a-f]{6}$/i.test(color||''))return;
  const palettes=projects[curProj]?.palettes;
  const pal=Array.isArray(palettes)?palettes.find(p=>p.id===paletteId):null;
  if(!pal||!Array.isArray(pal.colors)||index<0||index>=pal.colors.length)return;
  pal.colors[index]=color.toLowerCase();
  saveLS();
  renderProjectPalettes();
}

function deleteProjectPalette(paletteId){
  const project=projects[curProj];
  const pal=project?.palettes?.find(p=>p.id===paletteId);
  if(!project||!pal)return;
  customConfirm(`Delete palette "${pal.name||'Palette'}"?`,()=>{
    project.palettes=project.palettes.filter(p=>p.id!==paletteId);
    if(Array.isArray(project.comparisons)){
      project.comparisons.forEach(c=>{if(c.paletteId===paletteId)c.paletteId=null;});
    }
    saveLS();
    renderProjectPalettes();
  },'Delete palette','Delete',true);
}

function placeProjectPalette(paletteId){
  const pal=(projects[curProj]?.palettes||[]).find(p=>p.id===paletteId);
  if(!pal||!pal.colors?.length||!cv)return;
  ensureDefaultLayer();
  const items=[];
  const sw=54,gap=8,pad=12;
  const colors=pal.colors.slice(0,8);
  const totalW=colors.length*sw+(colors.length-1)*gap+pad*2;
  const bg=new fabric.Rect({left:0,top:0,width:totalW,height:94,fill:'#ffffff',rx:6,ry:6,stroke:'#e7e5e4',strokeWidth:1,originX:'center',originY:'center'});
  items.push(bg);
  colors.forEach((col,i)=>{
    items.push(new fabric.Rect({left:-totalW/2+pad+i*(sw+gap),top:-24,width:sw,height:42,fill:col,rx:4,ry:4,originX:'left',originY:'top',objectCaching:false}));
    items.push(new fabric.Text(col,{left:-totalW/2+pad+i*(sw+gap),top:24,fontSize:9,fontFamily:'DM Mono',__fontFamily:'DM Mono',fill:'#78716C',originX:'left',originY:'top',objectCaching:false}));
  });
  const group=new fabric.Group(items,{left:cv.width/2,top:cv.height/2,originX:'center',originY:'center',objectCaching:false,noScaleCache:true});
  addObj(group);
}
