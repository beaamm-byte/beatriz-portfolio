#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [source, output, password] = process.argv.slice(2);
if (!source || !output || !password) {
  console.error('Uso: node tools/encrypt-proposal.js <origen.html> <destino.html> <clave>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('La clave debe tener al menos 8 caracteres.');
  process.exit(1);
}

let html = fs.readFileSync(source, 'utf8');
if (!/name=["']robots["']/i.test(html)) {
  html = html.replace(/(<meta\s+charset=[^>]+>)/i, '$1\n  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">');
}

const iterations = 310000;
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(html, 'utf8'), cipher.final()]);
const payload = Buffer.concat([encrypted, cipher.getAuthTag()]).toString('base64');
const b64 = value => value.toString('base64');

const page = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
  <meta name="referrer" content="no-referrer">
  <title>Propuesta privada · Beatriz Morón</title>
  <style>
    :root{--ink:#171713;--paper:#f4f0e8;--line:#cfc6b8;--accent:#a8442d;--muted:#706b62}*{box-sizing:border-box}html,body{min-height:100%;margin:0}body{display:grid;place-items:center;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif;padding:24px}.shell{width:min(940px,100%);display:grid;grid-template-columns:1.2fr .8fr;gap:80px;align-items:end}.eyebrow{color:var(--accent);font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}.brand{position:fixed;top:30px;right:38px;font:700 14px Georgia,serif;color:var(--accent)}h1{font:400 clamp(54px,9vw,108px)/.87 Georgia,serif;letter-spacing:-.06em;margin:32px 0}.intro{font:400 clamp(18px,2vw,24px)/1.4 Georgia,serif;max-width:640px}.panel{border-top:1px solid var(--ink);padding-top:25px}label{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}input{width:100%;border:1px solid var(--line);background:#fffdf8;color:var(--ink);font:16px Arial;padding:15px}button{width:100%;margin-top:12px;border:1px solid var(--ink);background:var(--ink);color:#fff;font:700 12px Arial;letter-spacing:.08em;text-transform:uppercase;padding:15px;cursor:pointer}button:hover{background:var(--accent);border-color:var(--accent)}button:disabled{opacity:.55;cursor:wait}.help,.status{font-size:12px;color:var(--muted);margin-top:14px}.status{min-height:18px;color:var(--accent)}@media(max-width:760px){.shell{grid-template-columns:1fr;gap:45px}.brand{top:20px;right:20px}h1{margin-top:26px}}
  </style>
</head>
<body>
  <div class="brand">BM / PRIVADO</div>
  <main class="shell">
    <section><div class="eyebrow">Documento confidencial</div><h1>Una propuesta<br>solo para ti.</h1><p class="intro">Introduce la clave que te ha facilitado Beatriz para consultar la propuesta.</p></section>
    <form class="panel" id="access"><label for="password">Clave de acceso</label><input id="password" type="password" autocomplete="current-password" required autofocus><button id="open" type="submit">Ver propuesta</button><p class="status" id="status" role="alert"></p><p class="help">El documento se descifra únicamente en tu navegador.</p></form>
  </main>
  <script>
    const vault={iterations:${iterations},salt:'${b64(salt)}',iv:'${b64(iv)}',data:'${payload}'};
    const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    document.getElementById('access').addEventListener('submit',async e=>{e.preventDefault();const button=document.getElementById('open'),status=document.getElementById('status'),password=document.getElementById('password').value;button.disabled=true;status.textContent='Abriendo propuesta…';try{const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(vault.salt),iterations:vault.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(vault.iv)},key,bytes(vault.data));const html=new TextDecoder().decode(plain);document.open();document.write(html);document.close()}catch(error){status.textContent='La clave no es correcta. Revísala e inténtalo de nuevo.';button.disabled=false;document.getElementById('password').select()}});
  </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, page, 'utf8');
console.log(`Propuesta cifrada creada: ${output}`);
