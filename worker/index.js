import {communityAssetTypes} from '../community-news.js';
import {visualShortcuts,visualResearch} from '../visual-sections.js';
import quickPages from '../quick-pages.json' with {type:'json'};
import {citediStatistics} from '../citedi-statistics.js';
import {portalHeader} from '../portal-header.js';
import {englishResponse,englishPages} from '../english.js';
import {referenceTypes,programVideo,agendaSection,institutionalFooter} from '../institutional-reference.js';
import {socialIcons,contactSection} from '../portal-design.js';
import {contactForm,migratedNavigation,portalExtras,portalHomeUpdates,portalMedia,portalPublic,portalAdmin,portalTarget} from '../portal.js';
import {readMotion,renderFeature,renderNotice,motionAdmin,uploadMotionImage,uploadedMotionImage} from '../home-motion.js';
const ipn = 'https://www.citedi.ipn.mx';
const offer = ipn + '/oferta-educativa-citedi-ipn/';
const bundledAssets = {};
const assetTypes = {'campus.jpg':'image/jpeg','ipn.png':'image/png','citedi.png':'image/png'};
const homeAssetTypes={...communityAssetTypes,...quickPages.types,'language-ipn.png':'image/png','header-education.svg':'image/svg+xml','header-ipn.svg':'image/svg+xml',...referenceTypes,'home-client.js':'text/javascript; charset=utf-8','home-enhancements.css':'text/css; charset=utf-8'};
const academicIconTypes = {'academic-thesis.png':'image/png','academic-registroTesis.png':'image/png','academic-tabs-syllabus-lab.png':'image/png','academic-cv.png':'image/png','academic-contact.png':'image/png','academic-graduates.png':'image/png','academic-evaluaciondocente.png':'image/png','academic-projects.png':'image/png','academic-papers.png':'image/png','academic-agreements.png':'image/png','academic-icon-oportunities.png':'image/png','academic-events.png':'image/png','academic-news.png':'image/png','academic-icon-ds.png':'image/png','academic-certificate.png':'image/png','academic-vue.gif':'image/gif','academic-focusgroup.png':'image/png','academic-gpr.png':'image/png','academic-sipot.png':'image/png','academic-viaticos.png':'image/png','academic-requisiciones.png':'image/png','academic-bolsa-de-la-compra.png':'image/png'};
const groups = [
  ['Presentación', [
    ['eyebrow','Etiqueta','INVESTIGACIÓN · POSGRADO · INNOVACIÓN'],
    ['title','Título principal','Centro de Investigación y Desarrollo de Tecnología Digital', 110],
    ['intro','Descripción','Formamos talento e impulsamos la investigación aplicada en sistemas digitales desde Tijuana, Baja California.', 350],
    ['heroImage','Imagen principal (URL HTTPS o foto del campus)','', 500, 'optional'],
    ['heroAlt','Descripción de la imagen','', 200, 'optional']
  ]],
  ['Oferta educativa', [
    ['masters','Título de maestría','Maestría en Ciencias en Sistemas Digitales'],
    ['mastersText','Descripción de maestría',"Formamos profesionales de posgrado de alta calidad para contribuir a solucionar las necesidades de la sociedad.",350],
    ['mastersObjective','Objetivo de maestría',"El programa tiene como objetivo formar profesionistas productivos con alto nivel académico capaces de realizar actividades de investigación científica y desarrollo tecnológico significativos para la sociedad, en sus Líneas de Generación y Aplicación del Conocimiento.",700,'multiline'],
    ['mastersLink','Enlace de maestría',offer + 'maestria-sistemas-digitales/',500,'url'],
    ['doctorate','Título de doctorado','Doctorado en Ciencias en Sistemas Digitales'],
    ['doctorateText','Descripción de doctorado',"Formamos científicos de alta calidad para contribuir en la construcción de conocimiento de frontera.",350],
    ['doctorateObjective','Objetivo de doctorado',"El programa tiene como objetivo formar investigadores con perfil de liderazgo y de competencia internacional que favorezcan la creación de un conocimiento original e innovador en tecnologías actuales y emergentes a efecto de impulsar el desarrollo científico y tecnológico que requiere el país.",700,'multiline'],
    ['doctorateLink','Enlace de doctorado',offer + 'doctorado-sistemas-digitales/',500,'url']
  ]],
  ['Agenda y contacto', [
    ['notice','Título del aviso','Convocatorias de admisión'],
    ['noticeText','Descripción del aviso','Consulta las bases y el proceso de ingreso a los programas de posgrado.',350],
    ['noticeLink','Enlace del aviso',offer + 'convocatorias-de-admisi%C3%B3n/',500,'url'],
    ['contact','Dirección','Av. Instituto Politécnico Nacional 1310, Colonia Nueva Tijuana, Tijuana, Baja California'],
    ['researchText','Descripción de investigación','Conoce las líneas que conectan el cómputo inteligente, los sistemas dinámicos y las tecnologías de imagen y telecomunicaciones.',350],
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
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; connect-src 'self'; frame-src https://www.google.com https://www.youtube-nocookie.com https://www.facebook.com; font-src 'self'; style-src 'self'; img-src 'self' https:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'X-Content-Type-Options':'nosniff',
  'Cache-Control':'no-store'
};
const redirect = (to,cookie) => new Response(null,{status:303,headers:{...headers,Location:to,...(cookie ? {'Set-Cookie':cookie} : {})}});
const cookie = (url,value,age) => 'citedi_session=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + age + (url.protocol === 'https:' ? '; Secure' : '');
function page(title, body, status = 200) {
  return new Response('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Portal académico del Centro de Investigación y Desarrollo de Tecnología Digital"><title>' + html(title) + ' · CITEDI</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/assets/reference-font.css"><link rel="stylesheet" href="/assets/home-enhancements.css"><script src="/assets/home-client.js" defer></script></head><body><a class="skip" href="#contenido">Ir al contenido</a>' + body + '</body></html>',{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
const link = (url,label,classes = '') => '<a class="' + classes + '" href="' + html(url) + '">' + html(label) + ' <span aria-hidden="true">↗</span></a>';
const input = (name,label,type = 'text',attributes = '') => '<label>' + label + '<input name="' + name + '" type="' + type + '" required ' + attributes + '></label>';
const brand = '<a href="/" class="brand"><img src="/assets/citedi.png" alt="CITEDI · IPN" width="591" height="177"></a>';
const officialLinks = {
  students: ipn + '/informacion-estudiantes/tramites-escolares-citedi-ipn/',
  alumni: ipn + '/informacion-estudiantes/egresados.html',
  labs: ipn + '/lineas-investigacion/laboratorios/',
  research: '/investigacion',
  calendar: 'https://www.ipn.mx/calendario-academico.html'
};
const socialLinks = [
  ['Facebook','https://www.facebook.com/CITEDIIPN/'],
  ['LinkedIn','https://www.linkedin.com/company/citedi-ipn/'],
  ['Instagram','https://www.instagram.com/citedi_ipn/'],
  ['YouTube','https://www.youtube.com/@citediipn']
];
const footer = institutionalFooter(html);
function navigation(content) {
  return migratedNavigation(html);
}
function normalizePrograms(content) { const value={...content};if(value.mastersText==='Desarrolla soluciones científicas y tecnológicas a través de la investigación aplicada.')value.mastersText=initial.mastersText;if(value.doctorateText==='Genera conocimiento original y lidera proyectos de investigación en tecnologías emergentes.')value.doctorateText=initial.doctorateText;return value;}
function home(content, preview = false, updates = [], motion) {
  const c = {...initial,...normalizePrograms(content)};
  for (const key of ['mastersLink','doctorateLink','noticeLink','contactLink']) c[key]=portalTarget(c[key]);
  const programs=[['01','Maestría','masters'],['02','Doctorado','doctorate']];
  const shortcuts=[
    ['Estudiantes',officialLinks.students,'Servicios y trámites escolares'],
    ['Egresados',officialLinks.alumni,'Vinculación con la comunidad'],
    ['Laboratorios',officialLinks.labs,'Infraestructura de investigación'],
    ['Programas','#oferta','Maestría y doctorado']
  ];
  const programCards=programs.map(([number,label,key])=>
    '<article class="program" data-reveal><h3>'+html(c[key])+'</h3><p>'+html(c[key+'Text'])+'</p><p class="program-objective">'+html(c[key+'Objective'])+'</p>'+programVideo(key)+link(c[key+'Link'],'Conocer el programa','text-link')+'</article>'
  ).join('');
  const researchTopics=[
    ['01','Sistemas dinámicos y control','sdycte'],
    ['02','Cómputo inteligente','ciar'],
    ['03','Imagen y telecomunicaciones','titm']
  ].map(([number,label,anchor])=>'<a href="/investigacion#'+anchor+'"><div><span>LÍNEA '+number+'</span>'+label+'</div><b aria-hidden="true">↗</b></a>').join('');
  return page('Inicio',
    (preview?'<div class="preview-banner">Vista previa del borrador <a href="/admin">Volver al gestor</a></div>':'')+
    portalHeader()+navigation(c)+
    '<main id="contenido" class="home-main">'+renderFeature(c,motion,html)+renderNotice(motion,html)+
    citediStatistics()+
    visualShortcuts()+
    '<section class="wrap section" id="oferta" data-reveal><div class="section-head"><div><div class="eyebrow"><span></span> CONSTRUYE TU SIGUIENTE ETAPA</div><h2>Oferta educativa</h2></div><p>Formación de posgrado en sistemas digitales, investigación y desarrollo tecnológico.</p></div><div class="programs">'+programCards+'</div></section>'+
    visualResearch(c,html)+
    agendaSection(html)+portalExtras(html,updates)+
    contactSection(c,html,contactForm)+'</main>'+footer);
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
  const draft = {...initial,...normalizePrograms(JSON.parse(state.draft))};
  const accountSection = admin ? '<section id="usuarios" class="editor-box"><h2>Usuarios</h2><div class="accounts">' +
    accounts.map(account => '<div><span><strong>' + html(account.name) + '</strong><small>' + html(account.email) + ' · ' + (account.role === 'admin' ? 'Administrador' : account.active ? 'Editor activo' : 'Editor desactivado') + '</small></span>' +
      (account.role === 'editor' ? '<form method="post" action="/admin/accounts/status"><input type="hidden" name="email" value="' + html(account.email) + '"><input type="hidden" name="active" value="' + (account.active ? 0 : 1) + '"><button class="button secondary">' + (account.active ? 'Desactivar' : 'Activar') + '</button></form>' : '') + '</div>').join('') +
    '</div><h3>Crear cuenta de edición</h3><form class="new-account" method="post" action="/admin/accounts">' + input('name','Nombre','text','maxlength="100"') + input('email','Correo electrónico','email','maxlength="254"') + input('password','Contraseña inicial','password','autocomplete="new-password" minlength="12" maxlength="128"') + '<button class="button primary">Crear editor</button></form></section>' : '';
  return page('Gestor de contenidos','<div class="utility"><div class="wrap"><span>GESTOR DE CONTENIDOS</span><a href="/">Ver portal ↗</a></div></div><header class="wrap header">' + brand +
    '<form method="post" action="/logout"><button class="button secondary">Cerrar sesión</button></form></header><main class="wrap dashboard" id="contenido"><aside><small>ESPACIO EDITORIAL</small><strong>' + html(user.name) + '</strong><p>' + (admin ? 'Administrador' : 'Editor') + '</p><a href="#editor">Portada</a><a href="/admin/carrusel">Carrusel y avisos</a><a href="/admin/contenidos">Páginas y publicaciones</a>' + (admin ? '<a href="#usuarios">Usuarios</a><a href="/admin/academico">AdmAcademic</a><a href="/admin/mensajes">Mensajes recibidos</a>' : '') + '<a href="#cuenta">Mi contraseña</a></aside><div class="editor"><div class="eyebrow"><span></span> CONTENIDO DEL PORTAL</div><h1>Editar portada</h1><p>Completa los campos de la página y revisa el borrador antes de publicar.</p>' +
    alert(message,status === 200) + '<div id="editor" class="editor-toolbar"><strong>' + (state.draft === state.published ? 'Sin cambios pendientes' : 'Borrador pendiente de publicación') + '</strong><a href="/admin/preview" target="_blank" rel="noopener">Vista previa ↗</a></div><form method="post" action="/admin/home"><input type="hidden" name="revision" value="' + state.revision + '">' +
    groups.map(([title,entries]) => '<fieldset class="editor-box"><legend>' + title + '</legend>' + entries.map(([key,label,,limit = 160,kind]) => '<label>' + label + ((limit === 350 || kind === 'multiline') ? '<textarea name="' + key + '" required maxlength="' + limit + '" rows="3">' + html(draft[key]) + '</textarea>' : '<input name="' + key + '" value="' + html(draft[key]) + '" maxlength="' + limit + '"' + (kind === 'optional' ? '' : ' required') + '></label>')).map(field => field.endsWith('</label>') ? field : field + '</label>').join('') + '</fieldset>').join('') +
    '<div class="actions editor-actions"><button class="button secondary" name="action" value="save">Guardar borrador</button>' + (admin ? '<button class="button primary" name="action" value="publish">Publicar cambios</button>' : '') + '</div></form>' + accountSection +
    '<section id="cuenta" class="editor-box"><h2>Mi contraseña</h2><form class="new-account" method="post" action="/admin/password">' + input('current','Contraseña actual','password','autocomplete="current-password" maxlength="128"') + input('password','Nueva contraseña','password','autocomplete="new-password" minlength="12" maxlength="128"') + '<button class="button secondary">Actualizar contraseña</button></form></section></div></main>',status);
}
const clean = value => String(value ?? '').trim();
const emailOf = data => clean(data.get('email')).toLowerCase();
const validEmail = email => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = value => value.length >= 12 && value.length <= 128;
const date = () => Date.now();
const sessionToken = request => request.headers.get('cookie')?.match(/(?:^|;\s*)citedi_session=([a-f0-9]{64})(?:;|$)/)?.[1];
async function readForm(request,limit=24000) {
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
    if (length > limit) { await reader.cancel(); return null; }
    text += decoder.decode(value,{stream:true});
  }
  return new URLSearchParams(text + decoder.decode());
}
const academicGroups = [
  ['Académico', [
    ['tesis','Tesis','Tesista','Programa'],
    ['registro-tesis','Registro de temas y directores','Tesista','Director propuesto'],
    ['planes','Planes de estudio','Programa','Clave o periodo'],
    ['curriculos','Currículum académico','Investigador','Área'],
    ['prospectos','Prospectos','Persona interesada','Programa'],
    ['egresados','Egresados','Persona egresada','Generación'],
    ['evaluaciones','Evaluación docente','Docente','Periodo']
  ]],
  ['Investigación y vinculación', [
    ['proyectos','Proyectos','Responsable','Clave'],
    ['publicaciones','Productos científicos','Autores','DOI o referencia'],
    ['convenios','Convenios','Institución','Folio'],
    ['convocatorias','Convocatorias y oportunidades','Organizador','Enlace o referencia'],
    ['eventos','Eventos','Organizador','Sede'],
    ['noticias','Noticias','Área responsable','Referencia'],
    ['cartelera','Cartelera digital','Área responsable','Referencia'],
    ['reconocimientos','Reconocimientos','Persona reconocida','Folio']
  ]],
  ['Administración', [
    ['atencion','Ventanilla de atención','Área responsable','Folio'],
    ['funcionarios','Currículum de funcionarios','Funcionario','Cargo'],
    ['metas','Gestión para resultados','Área responsable','Indicador'],
    ['sipot','Transparencia SIPOT','Área responsable','Fracción o periodo'],
    ['sipot-viaticos','Transparencia de viáticos','Área responsable','Fracción o periodo'],
    ['viaticos','Viáticos','Comisionado','Folio'],
    ['requisiciones','Requisiciones','Área solicitante','Folio'],
    ['compras','Órdenes de compra','Proveedor','Folio']
  ]]
];
const academicModules = new Map(academicGroups.flatMap(([,items]) => items.map(([key,...info]) => [key,info])));
const academicIcons = {
  'tesis':'academic-thesis.png',
  'registro-tesis':'academic-registroTesis.png',
  'planes':'academic-tabs-syllabus-lab.png',
  'curriculos':'academic-cv.png',
  'prospectos':'academic-contact.png',
  'egresados':'academic-graduates.png',
  'evaluaciones':'academic-evaluaciondocente.png',
  'proyectos':'academic-projects.png',
  'publicaciones':'academic-papers.png',
  'convenios':'academic-agreements.png',
  'convocatorias':'academic-icon-oportunities.png',
  'eventos':'academic-events.png',
  'noticias':'academic-news.png',
  'cartelera':'academic-icon-ds.png',
  'reconocimientos':'academic-certificate.png',
  'atencion':'academic-vue.gif',
  'funcionarios':'academic-focusgroup.png',
  'metas':'academic-gpr.png',
  'sipot':'academic-sipot.png',
  'sipot-viaticos':'academic-sipot.png',
  'viaticos':'academic-viaticos.png',
  'requisiciones':'academic-requisiciones.png',
  'compras':'academic-bolsa-de-la-compra.png'
};
function academicCard(key,label) {
  return '<a class="module-card" href="' + academicRoot + '/' + key + '"><span class="module-label">' + html(label) + '</span><span class="module-art"><img src="/assets/' + academicIcons[key] + '" alt="" width="104" height="104" decoding="async"></span></a>';
}
const academicStates = ['Pendiente','En proceso','Concluido','Archivado'];
const academicRoot = '/admin/academico';
function academicPage(title, body, status = 200) {
  return page(title,'<header class="wrap header">' + brand + '<nav aria-label="Gestor"><a href="/admin">Gestor editorial</a><a href="' + academicRoot + '">Módulos académicos</a></nav></header><main class="wrap section academic" id="contenido"><div class="eyebrow"><span></span> ADMINISTRACIÓN ACADÉMICA</div><h1>' + html(title) + '</h1>' + body + '</main>',status);
}
async function academicRoute(path,method,form,url,user,sql) {
  if (user.role !== 'admin') return academicPage('Acceso restringido','<p>Los registros académicos requieren una cuenta administradora.</p>',403);
  if (path === academicRoot && method === 'GET') {
    return academicPage('Administrador académico','<p>Selecciona un módulo para consultar o registrar información.</p>' + academicGroups.map(([group,items]) => '<section class="academic-group"><h2>' + group + '</h2><div class="module-grid">' + items.map(([key,label]) => academicCard(key,label)).join('') + '</div></section>').join(''));
  }
  const key = path.slice(academicRoot.length + 1);
  const module = academicModules.get(key);
  if (!module) return academicPage('Módulo no encontrado','<p>Selecciona un módulo del tablero académico.</p>',404);
  const [label,ownerLabel,referenceLabel] = module;
  const here = academicRoot + '/' + key;
  const getRecord = id => sql('SELECT * FROM academic_records WHERE module=? AND id=?',key,id).first();
  const id = method === 'POST' ? clean(form.get('id')) : clean(url.searchParams.get('editar'));
  const record = id ? await getRecord(id) : null;
  if (id && !record) return academicPage(label,'<p>El registro solicitado no existe en este módulo.</p>',404);
  let feedback = '';
  let status = 200;
  let values = record ?? {title:'', owner:'', reference:'', date:'', status:'Pendiente', notes:''};
  if (method === 'POST') {
    values = Object.fromEntries(['title','owner','reference','date','status','notes'].map(field => [field,clean(form.get(field))]));
    const {title,owner,reference,date:recordDate,status:recordStatus,notes} = values;
    const parsedDate = recordDate && new Date(recordDate + 'T00:00:00Z');
    const validDate = !recordDate || /^\d{4}-\d{2}-\d{2}$/.test(recordDate) && Number.isFinite(parsedDate.getTime()) && parsedDate.toISOString().slice(0,10) === recordDate;
    if (!title || title.length > 180 || owner.length > 150 || reference.length > 250 || notes.length > 2500 || !validDate || !academicStates.includes(recordStatus)) {
      feedback = 'Revisa el título, la fecha y la longitud de los campos.';
      status = 400;
    } else {
      const params = [title,owner,reference,recordDate,recordStatus,notes,user.email,new Date().toISOString()];
      if (record) {
        const result = await sql('UPDATE academic_records SET title=?,owner=?,reference=?,date=?,status=?,notes=?,updated_by=?,updated_at=?,revision=revision+1 WHERE module=? AND id=? AND revision=?',...params,key,id,clean(form.get('revision'))).run();
        if (!result.meta.changes) return academicPage(label,'<p>Otra sesión actualizó este registro. <a href="' + here + '?editar=' + html(id) + '">Abrir la revisión actual</a>.</p>',409);
      } else {
        await sql('INSERT INTO academic_records (title,owner,reference,date,status,notes,updated_by,updated_at,module,id) VALUES (?,?,?,?,?,?,?,?,?,?)',...params,key,crypto.randomUUID()).run();
      }
      return redirect(here + '?guardado=1');
    }
  }
  const query = clean(url.searchParams.get('q')).slice(0,100);
  const filter = '%' + query.replace(/[\\%_]/g,'\\$&') + '%';
  const offset = Math.max(0,Math.min(1000000,Number.parseInt(url.searchParams.get('desde'),10) || 0));
  const {results} = await sql("SELECT id,title,owner,reference,date,status FROM academic_records WHERE module=? AND (title LIKE ? ESCAPE '\\' OR owner LIKE ? ESCAPE '\\' OR reference LIKE ? ESCAPE '\\') ORDER BY updated_at DESC,id LIMIT 51 OFFSET ?",key,filter,filter,filter,offset).all();
  const browse = n => here + '?' + new URLSearchParams({q:query,desde:n});
  const rows = results.slice(0,50).map(row => '<tr><th scope="row"><a href="' + here + '?editar=' + html(row.id) + '#registro">' + html(row.title) + '</a></th><td>' + html(row.owner) + '</td><td>' + html(row.reference) + '</td><td>' + html(row.date) + '</td><td>' + html(row.status) + '</td></tr>').join('');
  const editorField = (name,title,max,type='text') => '<label>' + title + '<input type="' + type + '" name="' + name + '" value="' + html(values[name]) + '" maxlength="' + max + '"' + (name === 'title' ? ' required' : '') + '></label>';
  return academicPage(label,
    (url.searchParams.has('guardado') ? alert('Registro guardado.',true) : '') +
    '<div class="actions"><a class="button primary" href="' + here + '#registro">Nuevo registro</a><a href="' + academicRoot + '">Volver a los módulos</a></div>' +
    '<form class="record-search" method="get" action="' + here + '"><label>Buscar registros<input name="q" maxlength="100" value="' + html(query) + '" placeholder="Título, nombre o referencia"></label><button class="button secondary">Buscar</button></form>' +
    (rows ? '<div class="record-table"><table><thead><tr><th scope="col">Título</th><th scope="col">' + ownerLabel + '</th><th scope="col">' + referenceLabel + '</th><th scope="col">Fecha</th><th scope="col">Estado</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="record-empty">No hay registros que mostrar.</p>') +
    '<div class="actions">' + (offset ? link(browse(Math.max(0,offset-50)),'Anterior') : '') + (results.length > 50 ? link(browse(offset+50),'Siguiente') : '') + '</div>' +
    '<form id="registro" class="editor-box record-editor" method="post" action="' + here + '#registro"><h2>' + (record ? 'Editar registro' : 'Nuevo registro') + '</h2>' + alert(feedback) +
    (record ? '<input type="hidden" name="id" value="' + html(record.id) + '"><input type="hidden" name="revision" value="' + html(record.revision) + '">' : '') +
    editorField('title','Título',180) + editorField('owner',ownerLabel,150) + editorField('reference',referenceLabel,250) + editorField('date','Fecha',10,'date') +
    '<label>Estado<select name="status">' + academicStates.map(state => '<option' + (state === values.status ? ' selected' : '') + '>' + state + '</option>').join('') + '</select></label><label>Observaciones<textarea name="notes" rows="4" maxlength="2500">' + html(values.notes) + '</textarea></label><div><button class="button primary">Guardar registro</button></div></form>',status);
}
async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if(url.pathname.startsWith('/internal/media-import/')) return new Response(null,{status:404});
  const importedFile = await portalMedia(request,env,url);
  if (importedFile) return importedFile;
  const asset = path.startsWith('/assets/') ? path.slice(8) : '';
  const assetType = Object.hasOwn(assetTypes,asset) ? assetTypes[asset] : Object.hasOwn(academicIconTypes,asset) ? academicIconTypes[asset] : Object.hasOwn(homeAssetTypes,asset) ? homeAssetTypes[asset] : null;
  if (method === 'GET' && assetType) {
    const encoded = bundledAssets[asset];
    const bytes = encoded ? Uint8Array.from(atob(encoded), char => char.charCodeAt(0)) : env.ASSETS?.[asset];
    if (bytes) return new Response(bytes,{headers:{...headers,'Content-Type':assetType}});
  }
  if (method === 'GET' && ['/portal','/portal/','/portal/index.php','/index.php'].includes(path)) return redirect('/');
  if (path === '/style.css' && method === 'GET') return new Response(css,{headers:{...headers,'Content-Type':'text/css; charset=utf-8'}});
  const sql = (query,...values) => env.DB.prepare(query).bind(...values);
  const uploadedFile=await uploadedMotionImage(request,env,url,sql);
  if(uploadedFile)return uploadedFile;
  const portalContext={html,alert,page,brand,footer,redirect,validEmail,digest,clientAddress:request.headers.get('CF-Connecting-IP')||'local'};
  const stateOf = async () => await sql('SELECT * FROM home WHERE id=1').first() ??
    {draft:JSON.stringify(initial),published:JSON.stringify(initial),revision:0};
  if(method==='GET'&&['/english','/english/'].includes(path))return redirect('/en');
  if (method === 'GET' && (path === '/'||path==='/en'||path==='/en/')) {
    const content=JSON.parse((await stateOf()).published);
    const response=home(content,false,await portalHomeUpdates(sql),await readMotion(sql,false,content));
    return path.startsWith('/en')?englishResponse(response):response;
  }
  let form;
  if (method === 'POST') {
    if (request.headers.get('origin') !== url.origin) return page('Solicitud rechazada','<main id="contenido" class="auth"><h1>Solicitud rechazada</h1></main>',403);
    if(path!=='/admin/carrusel/imagen') {
      form = await readForm(request,path.startsWith('/admin/contenidos/')?2000000:50000);
      if (!form) return page('Solicitud inválida','<main id="contenido" class="auth"><h1>Solicitud inválida</h1></main>',400);
    }
  }
  const token = sessionToken(request);
  const tokenHash = token && await digest(token);
  const user = tokenHash && await sql('SELECT a.email,a.name,a.role FROM sessions s JOIN accounts a ON a.email=s.email WHERE s.token=? AND s.expires>? AND a.active=1',tokenHash,date()).first();
  if(path==='/admin/carrusel/imagen'&&method==='POST') {
    if(!user)return Response.json({error:'Inicia sesión en el gestor para subir una imagen.'},{status:401});
    return uploadMotionImage(request,env,user,sql);
  }
  if(path.startsWith('/en/')) {
    const slug=path.slice(4).replace(/\/$/,'');
    if(method==='GET'&&englishPages[slug]){const [title,body]=englishPages[slug];return englishResponse(page(title,portalHeader()+navigation()+ '<main class="wrap section portal-document" id="contenido"><p class="breadcrumbs"><a href="/en">Home</a> / '+html(title)+'</p><h1>'+html(title)+'</h1>'+body+'</main>'+footer));}
    if(slug==='contact'&&method==='GET')return englishResponse(page('Contact',portalHeader()+navigation()+'<main id="contenido"><h1 class="wrap section">Contact CITEDI</h1>'+contactSection(initial,html,contactForm)+'</main>'+footer));
    if(slug==='contact'&&method==='POST')return englishResponse(await portalPublic('/contacto',method,form,url,sql,portalContext));
    if(slug==='search'&&method==='GET')return englishResponse(await portalPublic('/portal-buscar',method,form,url,sql,portalContext));
    return englishResponse(page('Page not found',portalHeader()+navigation()+'<main class="wrap section" id="contenido"><h1>Page not found</h1><a href="/en">Back to home</a></main>'+footer,404));
  }
  const publicPage = await portalPublic(path,method,form,url,sql,portalContext);
  if (publicPage) return publicPage;
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
  if (method === 'GET' && ['/AdmAcademic','/AdmAcademic/','/AdmAcademic/index.php'].includes(path)) return redirect(academicRoot);
  if (path.startsWith('/admin')) {
    if (!user) return redirect('/admin');
    if(path==='/admin/carrusel/vista-previa'&&method==='GET')return home(JSON.parse((await stateOf()).published),true,await portalHomeUpdates(sql),await readMotion(sql,true));
    if(path==='/admin/carrusel'&&['GET','POST'].includes(method))return motionAdmin(method,form,url,user,sql,portalContext);
    const contentPage = await portalAdmin(path,method,form,url,user,sql,portalContext);
    if (contentPage) return contentPage;
    if (path === academicRoot || path.startsWith(academicRoot + '/')) {
      if (!['GET','POST'].includes(method)) return new Response(null,{status:405,headers:{Allow:'GET, POST'}});
      return academicRoute(path,method,form,url,user,sql);
    }
    const render = async (message,status) => panel(user,await stateOf(),user.role === 'admin' ? (await sql('SELECT email,name,role,active FROM accounts ORDER BY role,name,email').all()).results : [],message,status);
    if (path === '/admin' && method === 'GET') {
      const messages = {saved:'Borrador guardado.',published:'Cambios publicados en la portada.',created:'Cuenta de edición creada.',account:'Estado de la cuenta actualizado.',password:'Contraseña actualizada.'};
      return render(Object.hasOwn(messages,url.searchParams.get('ok')) ? messages[url.searchParams.get('ok')] : '');
    }
    if (path === '/admin/preview' && method === 'GET') return home(JSON.parse((await stateOf()).draft),true,await portalHomeUpdates(sql),await readMotion(sql,true));
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
          try { const target = new URL(value,'https://portal.local'); valid = valid && (target.protocol === 'https:') && !target.username && !target.password && (value.startsWith('https://') || value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')); }
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
.academic h1{font-size:clamp(2.5rem,6vw,4.5rem);margin:.18em 0}.academic-group{margin-block:30px}.academic-group h2,.record-editor h2{font-size:1.65rem;margin-bottom:12px}.module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(158px,100%),1fr));gap:16px}.module-card{display:grid;grid-template-rows:auto 1fr;overflow:hidden;border:1px solid var(--line);border-radius:10px;background:white;text-align:center;transition:box-shadow .15s,border-color .15s}.module-card:hover{border-color:var(--wine);box-shadow:0 4px 12px #3814291a;text-decoration:none}.module-label{display:grid;place-items:center;min-height:55px;padding:8px;background:#ffbf16;color:#362409;font-weight:750;line-height:1.2}.module-art{display:grid;place-items:center;min-height:127px;padding:12px}.module-art img{width:104px;height:104px;object-fit:contain}@media(max-width:420px){.module-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.module-art{min-height:105px}.module-art img{width:80px;height:80px}}.record-search{display:flex;align-items:end;gap:10px;margin-block:20px}.record-search label{flex:1;max-width:400px}.record-table{overflow:auto}.record-table table{border-collapse:collapse;width:100%;text-align:left}.record-table td,.record-table th{padding:10px 12px;border-bottom:1px solid var(--line)}.record-table a{color:var(--wine);text-decoration:underline}.record-editor{max-width:760px;margin-top:24px}.record-editor select{font:inherit;padding:9px;border:1px solid var(--line);border-radius:6px}.record-empty{padding:20px 0}
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

.social-links{display:flex;flex-wrap:wrap;gap:5px 13px;font-size:.85rem}.brand img{display:block;width:clamp(135px,17vw,210px);height:auto}
.ipn-identity img{display:block;width:clamp(155px,26vw,340px);height:auto}
.institutional-header{min-height:98px;flex-wrap:nowrap}
.institution-nav{background:#641a38;color:white;position:relative;z-index:2}
.nav-items{display:flex;flex-wrap:wrap;gap:0 22px;min-height:48px;align-items:center}
.nav-items details{position:relative}
.nav-items summary{cursor:pointer;padding:10px 0}
.nav-items ul{position:absolute;z-index:2;min-width:235px;list-style:none;margin:0;padding:7px;background:white;color:var(--ink);box-shadow:0 8px 25px #230d2540;border-bottom:3px solid var(--wine)}
.nav-items li a{display:block;padding:8px 10px}
.nav-items li a:hover{background:var(--soft)}
.masthead{position:relative;display:grid;min-height:510px;isolation:isolate;background:#301b2b;color:#fff}
.masthead>img,.masthead::after{position:absolute;inset:0;width:100%;height:100%;z-index:-1}
.masthead>img{object-fit:cover;object-position:center 52%}
.masthead::after{content:"";background:linear-gradient(90deg,#21101bea 4%,#24101acc 36%,#29142845 74%,#2b162326)}
.masthead-inner{display:grid;align-items:center}
.masthead-copy{max-width:760px;padding-block:72px}
.masthead-copy .eyebrow{color:#f4cedd}
.masthead-copy h1{max-width:22ch;font-size:clamp(2.5rem,5vw,4.75rem);margin:15px 0}
.masthead-copy p{color:#fff6fb;font-size:1.12rem;max-width:53ch}
.campus-secondary{color:#fff;border-color:#f1dbe5;background:#2b142b66}
.shortcuts{background:#fff;border-bottom:1px solid var(--line)}
.shortcuts .wrap{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.shortcuts a{padding:20px 14px;display:flex;gap:12px;align-items:center;border-right:1px solid var(--line)}
.shortcuts a:first-child{border-left:1px solid var(--line)}
.shortcuts small,.shortcuts strong{display:block}
.shortcuts small{color:var(--muted);font-size:.73rem}
.shortcut-number{color:var(--wine);background:var(--soft);border-radius:6px;padding:6px;font-size:.75rem;font-weight:800}
.program h2{font-size:clamp(1.5rem,2.7vw,2.25rem);margin:12px 0}
.program .text-link+.text-link{margin-top:7px}
@media(max-width:700px){.nav-items{gap:0 13px;font-size:.82rem}.nav-items ul{position:static;min-width:0;max-width:240px}.masthead{min-height:430px}.masthead-copy{padding-block:46px}.masthead::after{background:#261121bb}.shortcuts .wrap{grid-template-columns:repeat(2,minmax(0,1fr))}.shortcuts a{border:0!important;padding:12px 5px}.institutional-header{min-height:75px}}

.portal-document h1{font-size:clamp(2rem,5vw,3.8rem);margin:14px 0 32px}.portal-body{font-size:1.04rem;line-height:1.75;overflow-wrap:anywhere}.portal-body section{margin:28px 0;scroll-margin-top:24px}.portal-body h2{font-size:2rem;margin:34px 0 15px}.portal-body h3{font-size:1.5rem;margin:22px 0 12px}.portal-body p{margin:12px 0}.portal-body ul,.portal-body ol{padding-left:24px}.portal-body img{max-width:100%;height:auto;max-height:650px;object-fit:contain;margin:10px 0}.portal-body a,.portal-results a{color:var(--wine);text-decoration:underline;text-underline-offset:3px}.portal-body table{display:block;max-width:100%;overflow:auto;border-collapse:collapse;margin-block:20px;font-size:.9rem}.portal-body td,.portal-body th{padding:8px;border:1px solid var(--line);min-width:90px}.portal-body th{background:var(--soft)}.portal-body div:has(>img){text-align:center}.breadcrumbs,.source-note{font-size:.8rem}.source-note{padding-top:30px;margin-top:35px;border-top:1px solid var(--line)}.institutional-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:18px}.institutional-links a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;border:1px solid var(--line);border-radius:10px;font-size:.8rem;text-align:center;background:white}.institutional-links img{width:100%;height:105px;object-fit:contain}.migrated-home>div:not(.section-head){overflow-wrap:anywhere}.migrated-home img{max-width:100%;height:auto}.migrated-home h2{font-size:1.7rem}.migrated-home h3{font-size:1.3rem}.migrated-home a{color:var(--wine)}.migrated-home .home-panels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:25px}.portal-results{padding:0;list-style:none}.portal-results li{display:flex;gap:16px;border-bottom:1px solid var(--line);padding:12px 0;align-items:baseline}.portal-results time,.portal-results span{color:var(--muted);font-size:.8rem;min-width:90px}.portal-editor textarea{font:14px/1.5 ui-monospace,monospace}.contact-form{max-width:760px;margin:40px 0}.contact-form h2{font-size:2rem;margin-bottom:18px}.contact-form form{display:grid;gap:14px}.contact-form button{justify-self:start}.contact-form p{font-size:.85rem}.message-body{white-space:pre-wrap}.nav-items details summary{max-width:200px}.nav-items ul{max-width:350px}.nav-items a{overflow-wrap:anywhere}@media(max-width:700px){.migrated-home .home-panels{grid-template-columns:1fr}.portal-results li{display:block}.portal-results time,.portal-results span{display:block}.portal-body h2{font-size:1.6rem}}
.portal-banners{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:20px}.portal-banners figure{margin:0;padding:10px;background:white;border:1px solid var(--line);border-radius:10px}.portal-banners img{width:100%;height:250px;object-fit:contain}.program-index{padding:16px;background:var(--soft);margin-bottom:22px;border-radius:8px}.program-index summary{font-weight:750;color:var(--wine);cursor:pointer}.program-index ul{columns:2;padding-left:22px}.program-index li{break-inside:avoid;margin:8px 0}@media(max-width:650px){.program-index ul{columns:1}}
`;
