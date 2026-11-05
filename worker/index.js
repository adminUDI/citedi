const ipn = 'https://www.citedi.ipn.mx';
const offer = ipn + '/oferta-educativa-citedi-ipn/';
const groups = [
  ['Presentación', [
    ['eyebrow','Etiqueta','INVESTIGACIÓN · POSGRADO · INNOVACIÓN'],
    ['title','Título principal','Centro de Investigación y Desarrollo de Tecnología Digital', 110],
    ['intro','Descripción','Formamos talento e impulsamos la investigación aplicada en sistemas digitales desde Tijuana, Baja California.', 350],
    ['heroImage','Imagen principal (URL HTTPS, opcional)','', 500, 'optional'],
    ['heroAlt','Descripción de la imagen','', 200, 'optional']
  ]],
  ['Oferta educativa', [
    ['masters','Título de maestría','Maestría en Ciencias en Sistemas Digitales'],
    ['mastersText','Descripción de maestría','Desarrolla soluciones científicas y tecnológicas a través de la investigación aplicada.', 350],
    ['mastersLink','Enlace de maestría',offer + 'maestria-sistemas-digitales/',500,'url'],
    ['doctorate','Título de doctorado','Doctorado en Ciencias en Sistemas Digitales'],
    ['doctorateText','Descripción de doctorado','Genera conocimiento original y lidera proyectos de investigación en tecnologías emergentes.',350],
    ['doctorateLink','Enlace de doctorado',offer + 'doctorado-sistemas-digitales/',500,'url']
  ]],
  ['Agenda y contacto', [
    ['notice','Título del aviso','Convocatorias de admisión'],
    ['noticeText','Descripción del aviso','Consulta las bases y el proceso de ingreso a los programas de posgrado.',350],
    ['noticeLink','Enlace del aviso',offer + 'convocatorias-de-admisi%C3%B3n/',500,'url'],
    ['contact','Texto de contacto','Tijuana, Baja California, México'],
    ['contactLink','Enlace de contacto',ipn + '/conocenos/contactanos.html',500,'url']
  ]]
];
const fields = groups.flatMap(([, entries]) => entries);
const initial = Object.fromEntries(fields.map(([key,, value]) => [key,value]));
const enc = new TextEncoder();
const html = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2,'0')).join('');
const hex = bytes => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2,'0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256', enc.encode(value)));
async function passwordHash(password, salt = random()) {
  let material = enc.encode(password);
  // Workers caps each PBKDF2 derivation at 100,000 iterations.
  for (let round = 0; round < 6; round++) {
    const key = await crypto.subtle.importKey('raw',material,'PBKDF2',false,['deriveBits']);
    material = await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt + ':' + round),iterations:100000,hash:'SHA-256'},key,256);
  }
  return salt + ':' + hex(material);
}
function equal(a,b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
const headers = {
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; img-src 'self' https:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'X-Content-Type-Options':'nosniff',
  'Cache-Control':'no-store'
};
const redirect = (to,cookie) => new Response(null,{status:303,headers:{...headers,Location:to,...(cookie ? {'Set-Cookie':cookie} : {})}});
const cookie = (url,value,age) => 'citedi_session=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + age + (url.protocol === 'https:' ? '; Secure' : '');
function page(title, body, status = 200) {
  return new Response('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Portal académico del Centro de Investigación y Desarrollo de Tecnología Digital"><title>' + html(title) + ' · CITEDI</title><link rel="stylesheet" href="/style.css"></head><body><a class="skip" href="#contenido">Ir al contenido</a>' + body + '</body></html>',{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
const link = (url,label,classes = '') => '<a class="' + classes + '" href="' + html(url) + '">' + html(label) + ' <span aria-hidden="true">↗</span></a>';
const input = (name,label,type = 'text',attributes = '') => '<label>' + label + '<input name="' + name + '" type="' + type + '" required ' + attributes + '></label>';
const mark = '<span class="mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M8 29V13h24v16H8Zm5-16V8m7 5V8m7 5V8m-14 21v5m7-5v5m7-5v5M8 18H4m4 7H4m28-7h4m-4 7h4m-21-4 4 4 7-8" stroke="currentColor" stroke-width="2"/></svg></span>';
const brand = '<a href="/" class="brand">' + mark + '<span><strong>CITEDI<span class="brand-divider"> / </span>IPN</strong><small>Centro de Tecnología Digital</small></span></a>';
const footer = '<footer><div class="wrap footer">' + brand + '<p>Instituto Politécnico Nacional<br><small>Portal académico · Tijuana, B.C.</small></p><a href="/admin">Gestor de contenidos <span aria-hidden="true">↗</span></a></div></footer>';
function art() {
  const traces = Array.from({length:11},(_,i) => '<path d="M0 ' + (50+i*48) + 'h' + (117+i*11) + 'l55 -55h' + (300-i*14) + 'l70 70H900"/><circle cx="' + (117+i*11) + '" cy="' + (50+i*48) + '" r="4"/>').join('');
  return '<svg class="art" viewBox="0 0 850 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0v32" fill="none" stroke="#ce9aab" stroke-opacity=".19"/></pattern><radialGradient id="light"><stop stop-color="#a44866"/><stop offset="1" stop-color="#3a1329"/></radialGradient><linearGradient id="chip" x2="1" y2="1"><stop stop-color="#55273f"/><stop offset="1" stop-color="#20101e"/></linearGradient></defs><path fill="url(#light)" d="M0 0h850v650H0z"/><path fill="url(#grid)" d="M0 0h850v650H0z"/><g fill="none" stroke="#eab0a8" stroke-opacity=".47">' + traces + '</g><g transform="translate(435 326) rotate(-24)"><rect x="-163" y="-163" width="326" height="326" rx="29" fill="#371927" stroke="#e298a3"/><rect x="-144" y="-144" width="288" height="288" rx="23" fill="url(#chip)" stroke="#b86c82" stroke-width="2"/><rect x="-117" y="-117" width="234" height="234" rx="12" fill="url(#grid)" stroke="#ac697a"/><path d="M-66 0h132M0-66V66M-46-46l92 92m0-92-92 92" stroke="#ebadb7" opacity=".7"/><circle r="42" fill="#2f1529" stroke="#efb3b5"/><circle r="11" fill="#efb3b5"/></g></svg>';
}
function home(content, preview = false) {
  const c = Object.fromEntries(Object.entries(content).map(([key,value]) => [key,html(value)]));
  const official = [
    ['Conócenos','#conocenos'], ['Oferta educativa','#oferta'], ['Estudiantes',ipn + '/informacion-estudiantes/tramites-escolares-citedi-ipn/'], ['Investigación','#investigacion'], ['Contacto','#contacto']
  ];
  const cards = [['01','MAESTRÍA','masters'],['02','DOCTORADO','doctorate']];
  return page('Inicio',
    (preview ? '<div class="preview-banner">Vista previa del borrador <a href="/admin">Volver al editor</a></div>' : '') +
    '<div class="utility"><div class="wrap"><span>INSTITUTO POLITÉCNICO NACIONAL</span><div><a href="https://www.ipn.mx/directorio-telefonico.html">Directorio</a><a href="https://www.ipn.mx/calendario-academico.html">Calendario</a><a href="/admin">Acceso CMS ↗</a></div></div></div>' +
    '<header class="wrap header">' + brand + '<nav aria-label="Navegación principal">' + official.map(([name,url]) => '<a href="' + url + '">' + name + '</a>').join('') + '</nav></header>' +
    '<main id="contenido"><section class="hero" id="conocenos"><div class="hero-copy"><div class="eyebrow"><span></span>' + c.eyebrow + '</div><h1>' + c.title + '</h1><p>' + c.intro + '</p><div class="actions"><a class="button primary" href="#oferta">Explorar posgrados <span aria-hidden="true">→</span></a><a class="quiet" href="#investigacion">Nuestra investigación <span aria-hidden="true">↗</span></a></div></div><div class="hero-visual">' +
    (c.heroImage ? '<img src="' + c.heroImage + '" alt="' + c.heroAlt + '">' : art()) + '<span class="visual-tag">01 / TECNOLOGÍA DIGITAL</span></div></section>' +
    '<div class="ribbon"><div class="wrap"><span>ACCESOS RÁPIDOS</span>' + link(content.noticeLink,'Admisión') + link(ipn + '/lineas-investigacion/lgac.html','Líneas de investigación') + link(content.contactLink,'Atención institucional') + '</div></div>' +
    '<section class="wrap section" id="oferta"><div class="section-head"><div><div class="eyebrow"><span></span> FORMACIÓN DE POSGRADO</div><h2>Oferta educativa</h2></div><p>Programas de posgrado en sistemas digitales con sede en Tijuana.</p></div><div class="programs">' +
    cards.map(([number,label,key]) => '<article class="program"><div class="program-top"><span>' + label + '</span><span>' + number + '</span></div><h3>' + c[key] + '</h3><p>' + c[key + 'Text'] + '</p>' + link(content[key + 'Link'],'Conocer el programa','text-link') + '</article>').join('') +
    '</div></section><section id="investigacion" class="research"><div class="wrap section split"><div><div class="eyebrow"><span></span> CIENCIA APLICADA</div><h2>Investigación</h2><p>Conoce las líneas que conectan el cómputo inteligente, los sistemas dinámicos y las tecnologías de imagen y telecomunicaciones.</p></div>' + link(ipn + '/lineas-investigacion/lgac.html','Ver líneas de investigación','button primary') + '</div></section>' +
    '<div class="wrap section programs"><section id="agenda" class="program"><div class="eyebrow"><span></span> AGENDA ACADÉMICA</div><h3>' + c.notice + '</h3><p>' + c.noticeText + '</p>' + link(content.noticeLink,'Consultar aviso','text-link') + '</section><section id="contacto" class="program"><div class="eyebrow"><span></span> CONTACTO</div><h3>Visita el CITEDI</h3><p>' + c.contact + '</p>' + link(content.contactLink,'Información de contacto','text-link') + '</section></div></main>' + footer);
}
function authForm(setup, error = '', status = 200) {
  const title = setup ? 'Crea la primera cuenta' : 'Inicia sesión';
  const body = setup
    ? input('key','Clave de configuración','password','autocomplete="off"') + input('name','Nombre','text','autocomplete="name" maxlength="100"') + input('email','Correo electrónico','email','autocomplete="email" maxlength="254"') + input('password','Contraseña','password','autocomplete="new-password" minlength="12" maxlength="128"')
    : input('email','Correo electrónico','email','autocomplete="username" maxlength="254"') + input('password','Contraseña','password','autocomplete="current-password" maxlength="128"');
  return page(title,'<div class="wrap header">' + brand + '<a href="/">← Volver al portal</a></div><main id="contenido" class="auth"><div class="eyebrow"><span></span> ESPACIO EDITORIAL</div><h1>' + title + '</h1><p>' + (setup ? 'Usa la clave de configuración para habilitar el gestor.' : 'Accede al gestor de contenidos del portal.') + '</p>' + alert(error) + '<form method="post" action="' + (setup ? '/setup' : '/login') + '">' + body + '<button class="button primary">' + (setup ? 'Crear administrador' : 'Entrar al gestor') + '</button></form></main>',status);
}
const alert = (message, okay = false) => message ? '<p role="status" class="alert ' + (okay ? 'success' : '') + '">' + html(message) + '</p>' : '';
function panel(user,state,accounts,message = '',status = 200) {
  const admin = user.role === 'admin';
  const draft = JSON.parse(state.draft);
  const accountSection = admin ? '<section id="usuarios" class="editor-box"><h2>Usuarios</h2><div class="accounts">' +
    accounts.map(account => '<div><span><strong>' + html(account.name) + '</strong><small>' + html(account.email) + ' · ' + (account.role === 'admin' ? 'Administrador' : account.active ? 'Editor activo' : 'Editor desactivado') + '</small></span>' +
      (account.role === 'editor' ? '<form method="post" action="/admin/accounts/status"><input type="hidden" name="email" value="' + html(account.email) + '"><input type="hidden" name="active" value="' + (account.active ? 0 : 1) + '"><button class="button secondary">' + (account.active ? 'Desactivar' : 'Activar') + '</button></form>' : '') + '</div>').join('') +
    '</div><h3>Crear cuenta de edición</h3><form class="new-account" method="post" action="/admin/accounts">' + input('name','Nombre','text','maxlength="100"') + input('email','Correo electrónico','email','maxlength="254"') + input('password','Contraseña inicial','password','autocomplete="new-password" minlength="12" maxlength="128"') + '<button class="button primary">Crear editor</button></form></section>' : '';
  return page('Gestor de contenidos','<div class="utility"><div class="wrap"><span>GESTOR DE CONTENIDOS</span><a href="/">Ver portal ↗</a></div></div><header class="wrap header">' + brand +
    '<form method="post" action="/logout"><button class="button secondary">Cerrar sesión</button></form></header><main class="wrap dashboard" id="contenido"><aside><small>ESPACIO EDITORIAL</small><strong>' + html(user.name) + '</strong><p>' + (admin ? 'Administrador' : 'Editor') + '</p><a href="#editor">Portada</a>' + (admin ? '<a href="#usuarios">Usuarios</a>' : '') + '<a href="#cuenta">Mi contraseña</a></aside><div class="editor"><div class="eyebrow"><span></span> CONTENIDO DEL PORTAL</div><h1>Editar portada</h1><p>Completa los campos de la página y revisa el borrador antes de publicar.</p>' +
    alert(message,status === 200) + '<div id="editor" class="editor-toolbar"><strong>' + (state.draft === state.published ? 'Sin cambios pendientes' : 'Borrador pendiente de publicación') + '</strong><a href="/admin/preview" target="_blank" rel="noopener">Vista previa ↗</a></div><form method="post" action="/admin/home"><input type="hidden" name="revision" value="' + state.revision + '">' +
    groups.map(([title,entries]) => '<fieldset class="editor-box"><legend>' + title + '</legend>' + entries.map(([key,label,,limit = 160,kind]) => '<label>' + label + (limit === 350 ? '<textarea name="' + key + '" required maxlength="' + limit + '" rows="3">' + html(draft[key]) + '</textarea>' : '<input name="' + key + '" value="' + html(draft[key]) + '" maxlength="' + limit + '"' + (kind === 'optional' ? '' : ' required') + '></label>')).map(field => field.endsWith('</label>') ? field : field + '</label>').join('') + '</fieldset>').join('') +
    '<div class="actions editor-actions"><button class="button secondary" name="action" value="save">Guardar borrador</button>' + (admin ? '<button class="button primary" name="action" value="publish">Publicar cambios</button>' : '') + '</div></form>' + accountSection +
    '<section id="cuenta" class="editor-box"><h2>Mi contraseña</h2><form class="new-account" method="post" action="/admin/password">' + input('current','Contraseña actual','password','autocomplete="current-password" maxlength="128"') + input('password','Nueva contraseña','password','autocomplete="new-password" minlength="12" maxlength="128"') + '<button class="button secondary">Actualizar contraseña</button></form></section></div></main>',status);
}
const clean = value => String(value ?? '').trim();
const emailOf = data => clean(data.get('email')).toLowerCase();
const validEmail = email => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = value => value.length >= 12 && value.length <= 128;
const date = () => Date.now();
const sessionToken = request => request.headers.get('cookie')?.match(/(?:^|;\s*)citedi_session=([a-f0-9]{64})(?:;|$)/)?.[1];
async function readForm(request) {
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  let length = 0;
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 24000) { await reader.cancel(); return null; }
    text += decoder.decode(value,{stream:true});
  }
  return new URLSearchParams(text + decoder.decode());
}
async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (path === '/style.css' && method === 'GET') return new Response(css,{headers:{...headers,'Content-Type':'text/css; charset=utf-8'}});
  const sql = (query,...values) => env.DB.prepare(query).bind(...values);
  const stateOf = async () => await sql('SELECT * FROM home WHERE id=1').first() ??
    {draft:JSON.stringify(initial),published:JSON.stringify(initial),revision:0};
  if (method === 'GET' && path === '/') return home(JSON.parse((await stateOf()).published));
  let form;
  if (method === 'POST') {
    if (request.headers.get('origin') !== url.origin) return page('Solicitud rechazada','<main id="contenido" class="auth"><h1>Solicitud rechazada</h1></main>',403);
    form = await readForm(request);
    if (!form) return page('Solicitud inválida','<main id="contenido" class="auth"><h1>Solicitud inválida</h1></main>',400);
  }
  const token = sessionToken(request);
  const tokenHash = token && await digest(token);
  const user = tokenHash && await sql('SELECT a.email,a.name,a.role FROM sessions s JOIN accounts a ON a.email=s.email WHERE s.token=? AND s.expires>? AND a.active=1',tokenHash,date()).first();
  if (path === '/setup' || (path === '/admin' && method === 'GET' && !user)) {
    const admin = await sql("SELECT email FROM accounts WHERE role='admin' LIMIT 1").first();
    if (!admin && env.CMS_SETUP_KEY) {
      if (method === 'GET') return authForm(true);
      if (path === '/setup' && method === 'POST') {
        const key = clean(form.get('key'));
        const email = emailOf(form);
        const name = clean(form.get('name'));
        const password = form.get('password') ?? '';
        if (!equal(await digest(key),await digest(env.CMS_SETUP_KEY))) return authForm(true,'La clave de configuración es incorrecta.',403);
        if (!validEmail(email) || !name || name.length > 100 || !validPassword(password)) return authForm(true,'Revisa los datos. La contraseña debe tener de 12 a 128 caracteres.',400);
        await sql("INSERT OR IGNORE INTO accounts (email,name,role,password) SELECT ?,?,'admin',? WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE role='admin')",email,name,await passwordHash(password)).run();
        return redirect('/admin');
      }
    }
    if (path === '/setup') return redirect('/admin');
    if (!admin) return authForm(false,'El gestor requiere una clave de configuración en el servidor.',503);
    return authForm(false);
  }
  if (path === '/login' && method === 'POST') {
    const email = emailOf(form);
    const password = form.get('password') ?? '';
    if (!validEmail(email) || !validPassword(password)) return authForm(false,'Correo o contraseña incorrectos.',401);
    const key = await digest(email);
    const now = date();
    await sql('DELETE FROM login_limits WHERE until<=?',now).run();
    const limit = await sql('INSERT INTO login_limits (key,attempts,until) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=MIN(attempts+1,9) RETURNING attempts',key,now+900000).first();
    if (limit.attempts > 8) return authForm(false,'Demasiados intentos. Intenta de nuevo en 15 minutos.',429);
    const account = await sql('SELECT * FROM accounts WHERE email=?',email).first();
    const computed = await passwordHash(password,account?.password.split(':')[0] ?? '0'.repeat(64));
    if (!account?.active || !equal(computed,account.password)) return authForm(false,'Correo o contraseña incorrectos.',401);
    const secret = random();
    await sql('DELETE FROM login_limits WHERE key=?',key).run();
    await sql('DELETE FROM sessions WHERE expires<=?',now).run();
    await sql('INSERT INTO sessions VALUES (?,?,?)',await digest(secret),email,now+28800000).run();
    return redirect('/admin',cookie(url,secret,28800));
  }
  if (path === '/logout' && method === 'POST') {
    if (tokenHash) await sql('DELETE FROM sessions WHERE token=?',tokenHash).run();
    return redirect('/admin',cookie(url,'',0));
  }
  if (path.startsWith('/admin')) {
    if (!user) return redirect('/admin');
    const render = async (message,status) => panel(user,await stateOf(),user.role === 'admin' ? (await sql('SELECT email,name,role,active FROM accounts ORDER BY role,name,email').all()).results : [],message,status);
    if (path === '/admin' && method === 'GET') {
      const messages = {saved:'Borrador guardado.',published:'Cambios publicados en la portada.',created:'Cuenta de edición creada.',account:'Estado de la cuenta actualizado.',password:'Contraseña actualizada.'};
      return render(Object.hasOwn(messages,url.searchParams.get('ok')) ? messages[url.searchParams.get('ok')] : '');
    }
    if (path === '/admin/preview' && method === 'GET') return home(JSON.parse((await stateOf()).draft),true);
    if (path === '/admin/home' && method === 'POST') {
      const action = form.get('action');
      const publish = action === 'publish';
      if (publish && user.role !== 'admin') return render('Tu cuenta solo puede guardar borradores.',403);
      if (!publish && action !== 'save') return render('La acción no es válida.',400);
      const content = {};
      for (const [key,label,,limit = 160,kind] of fields) {
        const value = clean(form.get(key));
        let valid = value.length <= limit && (value || kind === 'optional');
        if ((kind === 'url' || key === 'heroImage') && value) {
          try { const target = new URL(value); valid = valid && target.protocol === 'https:' && !target.username && !target.password; }
          catch { valid = false; }
        }
        if (!valid) return render('Revisa el campo «' + label + '». Los enlaces deben usar HTTPS.',400);
        content[key] = value;
      }
      if (content.heroImage && !content.heroAlt) return render('Describe la imagen principal para los lectores de pantalla.',400);
      const rawRevision = form.get('revision') ?? '';
      const revision = Number(rawRevision);
      if (!/^\d+$/.test(rawRevision) || !Number.isSafeInteger(revision)) return render('La versión del borrador es inválida.',400);
      const seed = JSON.stringify(initial);
      await sql('INSERT OR IGNORE INTO home (id,draft,published) VALUES (1,?,?)',seed,seed).run();
      const serialized = JSON.stringify(content);
      const result = publish
        ? await sql('UPDATE home SET draft=?,published=?,published_at=?,revision=revision+1 WHERE id=1 AND revision=?',serialized,serialized,new Date().toISOString(),revision).run()
        : await sql('UPDATE home SET draft=?,revision=revision+1 WHERE id=1 AND revision=?',serialized,revision).run();
      if (!result.meta.changes) return render('Otra cuenta modificó la portada. Se cargó la revisión más reciente.',409);
      return redirect('/admin?ok=' + (publish ? 'published' : 'saved'));
    }
    if (path === '/admin/accounts' && method === 'POST') {
      if (user.role !== 'admin') return render('Se requiere una cuenta de administración.',403);
      const email = emailOf(form);
      const name = clean(form.get('name'));
      const password = form.get('password') ?? '';
      if (!validEmail(email) || !name || name.length > 100 || !validPassword(password)) return render('Revisa el nombre, el correo y la longitud de la contraseña.',400);
      const result = await sql("INSERT OR IGNORE INTO accounts (email,name,role,password) VALUES (?,?,'editor',?)",email,name,await passwordHash(password)).run();
      if (!result.meta.changes) return render('Ya existe una cuenta con ese correo.',409);
      return redirect('/admin?ok=created#usuarios');
    }
    if (path === '/admin/accounts/status' && method === 'POST') {
      if (user.role !== 'admin') return render('Se requiere una cuenta de administración.',403);
      const active = form.get('active');
      if (!['0','1'].includes(active)) return render('El estado solicitado no es válido.',400);
      const email = emailOf(form);
      const result = await sql("UPDATE accounts SET active=? WHERE email=? AND role='editor'",Number(active),email).run();
      if (!result.meta.changes) return render('No se encontró la cuenta de edición.',404);
      if (active === '0') await sql('DELETE FROM sessions WHERE email=?',email).run();
      return redirect('/admin?ok=account#usuarios');
    }
    if (path === '/admin/password' && method === 'POST') {
      const current = form.get('current') ?? '';
      const password = form.get('password') ?? '';
      if (!validPassword(current) || !validPassword(password)) return render('Las contraseñas deben tener de 12 a 128 caracteres.',400);
      const account = await sql('SELECT password FROM accounts WHERE email=?',user.email).first();
      if (!equal(await passwordHash(current,account.password.split(':')[0]),account.password)) return render('La contraseña actual es incorrecta.',400);
      const result = await sql('UPDATE accounts SET password=? WHERE email=? AND password=?',await passwordHash(password),user.email,account.password).run();
      if (!result.meta.changes) return render('La contraseña cambió en otra sesión.',409);
      await sql('DELETE FROM sessions WHERE email=? AND token<>?',user.email,tokenHash).run();
      return redirect('/admin?ok=password#cuenta');
    }
  }
  return page('Página no encontrada','<main id="contenido" class="auth"><h1>Página no encontrada</h1><a href="/">Volver al inicio</a></main>',404);
}
export default {
  async fetch(request,env) {
    try { return await route(request,env); }
    catch (error) {
      console.error(error);
      return page('Error del servidor','<main id="contenido" class="auth"><h1>No se pudo completar la solicitud</h1><a href="/">Volver al inicio</a></main>',500);
    }
  }
};
const css = `
:root{color-scheme:light;--ink:#271922;--muted:#695b63;--wine:#6c1e3d;--deep:#381429;--line:#e7dce1;--paper:#fffdfc;--soft:#f8f1f3;--accent:#bf746f;font:16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink)}
a{color:inherit;text-decoration:none}
a:hover{text-decoration:underline;text-underline-offset:.23em}
:focus-visible{outline:3px solid #b25877;outline-offset:4px}
h1,h2,h3,p{margin:0}
p{color:var(--muted)}
h1,h2,h3{letter-spacing:-.04em;line-height:1.1}
.wrap{width:min(100% - 80px,1240px);margin-inline:auto}
.skip{position:absolute;z-index:10;left:12px;top:-5em;background:white;padding:12px}
.skip:focus{top:10px}
.utility{background:var(--deep);color:#fff4fa;font-size:.72rem}
.utility .wrap{min-height:37px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.utility .wrap>span{font-weight:800;letter-spacing:.12em}
.utility .wrap>div{display:flex;gap:22px}
.header{min-height:87px;display:flex;align-items:center;justify-content:space-between;gap:22px}
.brand{display:inline-flex;align-items:center;gap:11px;flex-shrink:0}
.mark{width:46px;height:46px;display:grid;place-items:center;background:var(--wine);color:white;border-radius:11px}
.mark svg{width:30px}
.brand strong{font-size:1.17rem;letter-spacing:.035em;display:block;line-height:1.2}
.brand-divider{color:#a86b81}
.brand small{display:block;font-size:.72rem;color:var(--muted)}
nav{display:flex;gap:clamp(12px,2.6vw,38px);font-weight:650;font-size:.88rem}
.hero{display:grid;grid-template-columns:1.02fr 1fr;background:var(--soft);min-height:565px}
.hero-copy{align-self:center;padding:66px clamp(32px,4.5vw,82px) 66px max(40px,calc((100vw - 1240px)/2))}
.eyebrow{display:flex;align-items:center;gap:10px;color:var(--wine);font-size:.7rem;font-weight:850;letter-spacing:.15em}
.eyebrow>span{display:inline-block;width:17px;height:2px;background:var(--accent);flex-shrink:0}
.hero h1{font-size:clamp(2.55rem,4.5vw,4.9rem);margin:20px 0;max-width:800px;line-height:1.02}
.hero p{font-size:clamp(1rem,1.35vw,1.2rem);max-width:45ch}
.actions{display:flex;align-items:center;flex-wrap:wrap;gap:14px 22px;margin-top:27px}
.button{display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:12px 17px;border:1px solid transparent;border-radius:7px;font:inherit;font-size:.875rem;font-weight:750;cursor:pointer}
.primary{color:#fff;background:var(--wine)}
.primary:hover{background:#502039;text-decoration:none}
.secondary{background:var(--paper);border-color:var(--line);color:var(--wine)}
.secondary:hover{background:var(--soft)}
.quiet{font-size:.86rem;font-weight:750;color:var(--wine)}
.hero-visual{position:relative;min-width:0;overflow:hidden;background:#421832}
.hero-visual>svg,.hero-visual>img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}
.visual-tag{position:absolute;right:25px;bottom:24px;background:#321021;color:#fff2f6;border:1px solid #9e687f;border-radius:5px;padding:8px 11px;font-size:.68rem;letter-spacing:.14em;font-weight:800}
.ribbon{background:#fff;border-bottom:1px solid var(--line)}
.ribbon .wrap{display:grid;grid-template-columns:.8fr 1fr 1fr 1fr;align-items:stretch}
.ribbon .wrap>*{padding:19px clamp(8px,2vw,25px);font-size:.9rem;display:flex;gap:9px;align-items:center;justify-content:space-between;border-right:1px solid var(--line)}
.ribbon .wrap>span{color:var(--wine);font-weight:850;font-size:.69rem;letter-spacing:.12em;padding-left:0}
.ribbon a:last-child{border:0}
.ribbon a span,.text-link span{color:var(--wine)}
.section{padding-block:65px;scroll-margin-top:16px}
.section-head{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:24px}
.section-head p{max-width:32ch}
h2{font-size:clamp(2rem,4vw,3.5rem);margin-top:9px}
.programs{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.program{background:white;border:1px solid var(--line);border-radius:12px;padding:clamp(20px,3.1vw,39px);display:flex;flex-direction:column;align-items:start}
.program-top{display:flex;justify-content:space-between;width:100%;font-size:.72rem;color:var(--wine);font-weight:850;letter-spacing:.12em}
.program h3{font-size:clamp(1.5rem,3vw,2.3rem);margin:15px 0 10px}
.program p{margin-bottom:19px}
.text-link{font-weight:750;color:var(--wine);margin-top:auto}
.research{background:var(--soft)}
.split{display:flex;justify-content:space-between;gap:25px;align-items:center}
.split p{margin-top:12px;max-width:64ch}
footer{background:#2d1725;color:white;padding:27px 0}
.footer{display:flex;gap:25px;align-items:center;justify-content:space-between}
.footer p,.footer small{color:#e0cdd8}
.footer>a:last-child{font-size:.86rem}
.preview-banner{background:#fbe2ae;padding:11px 20px;text-align:center;font-weight:700}
.preview-banner a{margin-left:12px;text-decoration:underline}
.auth{margin:45px auto;width:min(calc(100% - 32px),480px);border:1px solid var(--line);padding:clamp(20px,4vw,42px);border-radius:14px;background:white}
.auth h1,.editor h1{font-size:clamp(2rem,4vw,3.4rem);margin:9px 0 12px}
form label{display:grid;gap:6px;font-weight:650;font-size:.9rem}
input,textarea{font:inherit;color:var(--ink);padding:10px 12px;border:1px solid #cbbac3;border-radius:6px;background:white;width:100%}
textarea{resize:vertical}
.auth form,.new-account{display:grid;gap:14px;margin-top:21px}
.auth form button,.new-account button{justify-self:start}
.alert{border:1px solid #dc9daf;background:#fae8ed;color:#72213c;padding:11px 14px;margin-top:15px;border-radius:6px}
.alert.success{border-color:#a1c8ac;background:#edf8ed;color:#224d32}
.dashboard{display:grid;grid-template-columns:215px minmax(0,850px);gap:32px;margin-block:30px 60px;align-items:start}
aside,.editor-box{border:1px solid var(--line);background:white;border-radius:10px;padding:20px}
aside{display:grid;gap:10px}
aside small{font-size:.7rem;font-weight:850;letter-spacing:.12em;color:var(--wine)}
aside a{color:var(--wine);font-weight:700}
.editor-toolbar{display:flex;justify-content:space-between;gap:12px;margin:22px 0 15px;padding:14px 16px;border-radius:8px;background:var(--soft);color:var(--wine);font-size:.9rem}
.editor-box{min-width:0;margin:0 0 18px;display:grid;gap:13px}
.editor-box legend{font-weight:800;padding-inline:7px}
.editor-box h2{font-size:1.8rem}
.editor-box h3{font-size:1.2rem}
.editor-actions{margin:4px 0 28px}
.accounts>div{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}
.accounts small{display:block;color:var(--muted);overflow-wrap:anywhere}
@media(max-width:920px){.wrap{width:calc(100% - 44px)}.header{flex-wrap:wrap;padding-block:14px;gap:13px}.hero-copy{padding-left:22px}.hero{min-height:510px}.dashboard{grid-template-columns:175px minmax(0,1fr);gap:17px}}
@media(max-width:650px){.wrap{width:calc(100% - 32px)}.utility .wrap>div{gap:9px}.utility .wrap>span{max-width:18ch}.header nav{width:100%;overflow-x:auto;white-space:nowrap;padding:4px 2px 7px;gap:16px}.hero{grid-template-columns:1fr}.hero-copy{padding:42px 16px}.hero-visual{min-height:250px}.visual-tag{right:12px;bottom:12px}.ribbon .wrap{grid-template-columns:1fr 1fr}.ribbon .wrap>*{padding:10px 7px;font-size:.75rem;border:0}.ribbon .wrap>span{font-size:.6rem}.section{padding-block:40px}.section-head,.split,.footer{display:grid;justify-items:start}.programs,.dashboard{grid-template-columns:1fr}.dashboard aside{display:flex;align-items:center;flex-wrap:wrap}.dashboard aside small{display:none}}
`;
