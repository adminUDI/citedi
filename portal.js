import {socialSection} from './social-section.js';
import {communityNews,communityDocuments} from './community-news.js';
import quickPages from './quick-pages.json' with {type:'json'};
import {sustainabilityCarousel} from './sustainability-carousel.js';
import {portalHeader,searchCorner} from './portal-header.js';
import sanitizeHtml from 'sanitize-html';
import seed from './portal-seed.json' with {type:'json'};

const sourceDocuments = new Map([...seed.documents,...quickPages.documents,...communityDocuments].map(document => [document.id,document]));
export function portalTarget(value) {
  const targets={
    'https://www.citedi.ipn.mx/oferta-educativa-citedi-ipn/maestria-sistemas-digitales/':'/maestria',
    'https://www.citedi.ipn.mx/oferta-educativa-citedi-ipn/doctorado-sistemas-digitales/':'/doctorado',
    'https://www.citedi.ipn.mx/oferta-educativa-citedi-ipn/convocatorias-de-admisi%C3%B3n/':'/admision',
    'https://www.citedi.ipn.mx/conocenos/contactanos.html':'/contacto'
  };
  return Object.hasOwn(targets,value)?targets[value]:value;
}
const kinds = {page:'Página',news:'Noticia',event:'Evento',call:'Convocatoria',article:'Publicación',profile:'Perfil de investigador'};
export const portalMenu = [
  ['Conócenos',[
    ['¿Quiénes somos?','/conocenos#quienes'],['Misión y visión','/conocenos#misionvision'],
    ['Identidad institucional','/conocenos#identidad'],['Estructura funcional','/conocenos#estructura'],
    ['Numeralia','/conocenos#numeralia'],['¿Cómo llegar?','/conocenos#ubicacion'],
    ['Titular','/conocenos#titular'],['Contacto','/contacto'],
    ['Sistema de Gestión de la Calidad','/calidad']
  ]],
  ['Entorno',[['La ciudad de Tijuana','/entorno'],['Sustentabilidad','/sustentabilidad'],['CoSeCoVi','/cosecovi']]],
  ['Investigación',[
    ['Ciencia','/investigacion#ciencia'],['Productos científicos','/investigacion#productos'],
    ['Sistemas dinámicos y control en tecnologías emergentes','/investigacion#sdycte'],
    ['Cómputo inteligente de alto rendimiento','/investigacion#ciar'],
    ['Tecnologías de imagen y telecomunicaciones modernas','/investigacion#titm'],
    ['Tecnología','/investigacion#tecnologia'],['Proyectos de innovación','/investigacion#innovacion'],
    ['Propiedad intelectual','/investigacion#pintelectual']
  ]],
  ['Posgrado',[['Maestría','/maestria'],['Doctorado','/doctorado'],['Admisión','/admision'],['Convocatorias','/convocatorias']]],
  ['Servicios',[['Servicios y vinculación','/servicios'],['Directorio','/directorio'],['Sistema de Gestión de la Calidad','/calidad'],['Contacto','/contacto']]]
];
export function migratedNavigation(html) {
  return '<nav class="institution-nav" aria-label="Navegación principal"><a class="nav-citedi" href="/"><img src="/assets/citedi.png" alt="CITEDI · IPN"></a><div class="wrap nav-items"><a href="/">Inicio</a>' +
    portalMenu.map(([title,items]) => '<details><summary>' + title + '</summary><ul>' +
      items.map(([label,url]) => '<li><a href="' + html(url) + '">' + html(label) + '</a></li>').join('') + '</ul></details>').join('') +
    '<a href="/eventos">Eventos</a><a href="/noticias">Noticias</a></div>'+searchCorner()+'</nav>';
}
export function cleanPortalBody(body) {
  return sanitizeHtml(body,{
    allowedTags:['p','br','strong','em','b','i','u','s','h2','h3','h4','h5','h6','ul','ol','li','a','img','figure','figcaption','table','thead','tbody','tfoot','tr','th','td','blockquote','section','div','span','hr','details','summary'],
    allowedAttributes:{'*':['id'],'a':['href','title'],'img':['src','alt'],'th':['colspan','rowspan','scope'],'td':['colspan','rowspan']},
    allowedSchemes:['http','https','mailto','tel'],allowProtocolRelative:false,
    transformTags:{h1:'h2'}
  });
}
export function portalExtras(html,updates=[]) {
  return communityNews(html,updates)+socialSection(html)+
    '<section class="institutional-hub" id="comunidad-institucional" aria-labelledby="institutional-hub-title"><div class="wrap institutional-hub-heading"><div><div class="eyebrow">COMUNIDAD Y COMPROMISO</div><h2 id="institutional-hub-title">Enlaces de interés institucional</h2></div></div><div class="wrap institutional-links">' + seed.homeLinks.map(item =>
      '<a href="' + html(item.url) + '"><img src="' + html(item.image) + '" alt="' + html(item.title) + '" loading="lazy"><span>' + html(item.title) + '</span><span class="institutional-card-arrow" aria-hidden="true">↗</span></a>').join('') + '</div></section>';
}
export async function portalHomeUpdates(sql) {
  const {results}=await sql('SELECT published FROM portal_documents WHERE published IS NOT NULL ORDER BY updated_at DESC LIMIT 30').all();
  return results.map(row=>JSON.parse(row.published)).filter(d=>['news','event','call'].includes(d.kind)).slice(0,6);
}
async function documentById(id,sql,draft=false) {
  const row = await sql('SELECT * FROM portal_documents WHERE id=?',id).first();
  if (row) {
    const value = draft ? row.draft : row.published;
    return value ? {...JSON.parse(value),revision:row.revision} : null;
  }
  const document = sourceDocuments.get(id);
  return document ? {...document,revision:-1} : null;
}
async function allDocuments(sql,draft=false) {
  const documents = new Map(sourceDocuments);
  const {results} = await sql('SELECT id,draft,published,revision FROM portal_documents').all();
  for (const row of results) {
    const value = draft ? row.draft : row.published;
    if (value) documents.set(row.id,{...JSON.parse(value),revision:row.revision});
    else documents.delete(row.id);
  }
  return [...documents.values()];
}
function portalShell(title,body,{page,brand,footer,html},status=200) {
  return page(title,portalHeader() +
    migratedNavigation(html) + '<main class="wrap section portal-document" id="contenido"><p class="breadcrumbs"><a href="/">Inicio</a> / ' + html(title) + '</p><h1>' + html(title) + '</h1>' + body + '</main>' + footer,status);
}
export function contactForm(type,html) {
  return '<section class="contact-form"><h2>' + (type==='suggestion' ? 'Buzón de sugerencias' : 'Escríbenos') + '</h2><form method="post" action="/contacto"><input type="hidden" name="type" value="' + type + '">' +
    '<label>Nombre completo<input name="name" required maxlength="120" autocomplete="name"></label>' +
    '<label>Correo electrónico<input name="email" type="email" required maxlength="254" autocomplete="email"></label>' +
    '<label>Teléfono, opcional<input name="phone" maxlength="40" autocomplete="tel"></label>' +
    '<label>Asunto<input name="subject" required maxlength="180"></label>' +
    '<label>Mensaje<textarea name="message" required maxlength="4000" rows="5"></textarea></label>' +
    '<p>Tu solicitud se guardará para su atención por el equipo del portal. <a href="https://www.ipn.mx/proteccion-datos-personales/">Consulta la información de protección de datos personales</a>.</p>' +
    '<button class="button primary">Enviar solicitud</button></form></section>';
}
export async function portalMedia(request,env,url) {
  if (!url.pathname.startsWith('/media/')) return null;
  const key=url.pathname.slice(7);
  if(!Object.hasOwn(seed.media,key)||!['GET','HEAD'].includes(request.method))return new Response(null,{status:404});
  const object=await env.BUCKET?.get(key);
  if(!object)return new Response('Archivo no disponible',{status:404,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  return new Response(request.method==='HEAD'?null:object.body,{headers:{
    'Content-Type':seed.media[key].type,'X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':"default-src 'none'; sandbox",
    'Cache-Control':'public,max-age=31536000,immutable',
    ...(!seed.media[key].type.startsWith('image/')&&seed.media[key].type!=='application/pdf'?{'Content-Disposition':'attachment'}:{})
  }});
}
export async function portalPublic(path,method,form,url,sql,context) {
  const {html,alert}=context;
  if(Object.hasOwn(seed.aliases,path)) {
    const destination=seed.aliases[path];
    if(url.searchParams.get('opt')==='past'&&path.endsWith('eventos.php'))return context.redirect('/eventos-historial');
    return context.redirect(destination+url.search);
  }
  if(method==='POST'&&path==='/contacto') {
    const values=Object.fromEntries(['name','email','phone','subject','message','type'].map(key=>[key,String(form.get(key)||'').trim()]));
    const {name,email,phone,subject,message,type}=values;
    if(!name||name.length>120||!context.validEmail(email)||phone.length>40||!subject||subject.length>180||!message||message.length>4000||!['contact','suggestion'].includes(type))return portalShell('Contacto',alert('Revisa los datos del formulario.')+contactForm('contact',html),context,400);
    const limiter='contact:'+await context.digest(context.clientAddress);
    const until=Date.now()+900000;
    await sql('DELETE FROM login_limits WHERE until<=?',Date.now()).run();
    const limit=await sql('INSERT INTO login_limits (key,attempts,until) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=MIN(attempts+1,6) RETURNING attempts',limiter,until).first();
    if(limit.attempts>5)return portalShell('Contacto',alert('Has enviado varias solicitudes. Intenta nuevamente en 15 minutos.'),context,429);
    await sql('INSERT INTO portal_messages (id,type,name,email,phone,subject,message,created_at,status) VALUES (?,?,?,?,?,?,?,?,?)',crypto.randomUUID(),type,name,email,phone,subject,message,new Date().toISOString(),'Pendiente').run();
    return portalShell('Solicitud registrada',alert('Tu solicitud se guardó correctamente. El equipo del portal podrá consultarla en su bandeja de mensajes.',true)+'<p><a href="/">Volver al inicio</a></p>',context);
  }
  if(method!=='GET')return null;
  if(path==='/buzon')return portalShell('Buzón de sugerencias',contactForm('suggestion',html),context);
  if(path==='/portal-buscar') {
    const q=String(url.searchParams.get('q')||'').trim().toLocaleLowerCase('es').slice(0,120);
    const documents=await allDocuments(sql);
    const results=q?documents.filter(d=>(d.title+' '+d.body.replace(/<[^>]+>/g,' ')).toLocaleLowerCase('es').includes(q)).slice(0,60):[];
    return portalShell('Buscar en el portal','<form class="record-search"><label>Palabra o tema<input name="q" value="'+html(q)+'" maxlength="120" required></label><button class="button primary">Buscar</button></form>'+(q?'<p>'+results.length+' resultados.</p>':'')+'<ul class="portal-results">'+results.map(d=>'<li><a href="/'+html(d.id)+'">'+html(d.title)+'</a></li>').join('')+'</ul>',context);
  }
  const id=path.slice(1);
  const document=await documentById(id,sql);
  if(!document)return null;
  const displayBody=id==='sustentabilidad'?sustainabilityCarousel(document.body,html):document.body;
  let body='<div class="portal-body'+(quickPages.documents.some(d=>d.id===id)?' replica-page':'')+'">'+displayBody+'</div>';
  const programHost=/^https?:\/\/(maestria|doctorado)\.citedi\.mx/.exec(document.source||'')?.[1];
  if(programHost) {
    const related=seed.documents.filter(d=>d.kind==='page'&&d.source.startsWith('https://'+programHost+'.citedi.mx/'));
    body='<details class="program-index"><summary>Secciones del programa</summary><ul>'+related.map(d=>'<li><a href="/'+html(d.id)+'">'+html(d.title)+'</a></li>').join('')+'</ul></details>'+body;
  }
  if(['contacto','conocenos'].includes(id))body+=contactForm('contact',html);
  if(id==='egresados')body+=contactForm('contact',html).replace('Escríbenos','Solicitud de actualización de datos de egresados');
  if(['eventos','eventos-historial','noticias','convocatorias'].includes(id)) {
    const kind={eventos:'event','eventos-historial':'event',noticias:'news',convocatorias:'call'}[id];
    const today=new Date().toISOString().slice(0,10);
    const query=String(url.searchParams.get('q')||'').toLocaleLowerCase('es').slice(0,100);
    const year=String(url.searchParams.get('year')||'').slice(0,4);
    const offset=Math.max(0,Number.parseInt(url.searchParams.get('desde'),10)||0);
    const entries=(await allDocuments(sql)).filter(d=>d.kind===kind && !document.body.includes(html(d.title)))
      .filter(d=>id!=='eventos'||d.date>=today)
      .filter(d=>id!=='eventos-historial'||d.date<today)
      .filter(d=>(!query||d.title.toLocaleLowerCase('es').includes(query))&&(!year||d.date.startsWith(year)))
      .sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
    const browse=n=>'?'+new URLSearchParams({q:query,year,desde:n});
    body+='<section><h2>'+ (kind==='event'?'Agenda de eventos':'Publicaciones')+'</h2><form class="record-search"><label>Buscar<input name="q" maxlength="100" value="'+html(query)+'"></label><label>Año<input name="year" maxlength="4" pattern="[0-9]{4}" value="'+html(year)+'"></label><button class="button secondary">Filtrar</button></form><ul class="portal-results">'+entries.slice(offset,offset+40).map(d=>'<li><time>'+html(d.date)+'</time> <a href="/'+html(d.id)+'">'+html(d.title)+'</a></li>').join('')+'</ul><div class="actions">'+(offset?'<a href="'+html(browse(Math.max(0,offset-40)))+'">Anterior</a>':'')+(entries.length>offset+40?'<a href="'+html(browse(offset+40))+'">Siguiente</a>':'')+'</div></section>';
    if(id==='eventos')body+='<p><a href="/eventos-historial">Consultar el historial de eventos</a></p>';
  }
  const historical=/<(?:h2|h3|p)[^>]*>/.test(document.body)&&document.sourceType;
  if(historical)body+='<p class="source-note">Contenido recuperado del portal y sus respaldos. '+html(document.sourceType==='respaldo de base de datos'?document.source:'Fuente de origen: '+document.source)+'</p>';
  return portalShell(document.title,body,context);
}
export async function portalAdmin(path,method,form,url,user,sql,context) {
  const root='/admin/contenidos';
  const {html,alert}=context;
  if(path==='/admin/mensajes') {
    if(user.role!=='admin')return portalShell('Acceso restringido','<p>La bandeja de mensajes requiere una cuenta administradora.</p>',context,403);
    if(method==='POST') {
      if(!['Pendiente','Atendido'].includes(form.get('status')))return new Response(null,{status:400});
      await sql('UPDATE portal_messages SET status=? WHERE id=?',form.get('status'),form.get('id')).run();
      return context.redirect('/admin/mensajes');
    }
    const {results}=await sql('SELECT * FROM portal_messages ORDER BY created_at DESC LIMIT 200').all();
    return portalShell('Mensajes recibidos','<p><a href="/admin">Volver al gestor</a></p>'+results.map(m=>'<article class="editor-box"><h2>'+html(m.subject)+'</h2><p>'+html(m.name)+' · '+html(m.email)+' · '+html(m.phone)+'</p><p>'+html(m.created_at)+' · '+html(m.type==='suggestion'?'Sugerencia':'Contacto')+'</p><p class="message-body">'+html(m.message)+'</p><form method="post"><input type="hidden" name="id" value="'+html(m.id)+'"><input type="hidden" name="status" value="'+(m.status==='Pendiente'?'Atendido':'Pendiente')+'"><button class="button secondary">'+html(m.status)+' · Cambiar estado</button></form></article>').join('')+(results.length?'':'<p>No hay solicitudes recibidas.</p>'),context);
  }
  if(path!==root&&!path.startsWith(root+'/'))return null;
  const id=path.slice(root.length+1);
  if(!id) {
    const q=String(url.searchParams.get('q')||'').toLocaleLowerCase('es').slice(0,120);
    const order=['page','news','event','call','profile','article'];
    const documents=(await allDocuments(sql,true)).filter(d=>!q||(d.title+' '+d.kind).toLocaleLowerCase('es').includes(q)).sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind)||a.title.localeCompare(b.title,'es'));
    return portalShell('Páginas y publicaciones','<p><a href="/admin">Volver al gestor</a></p><div class="actions">'+['page','news','event','call'].map(kind=>'<a class="button secondary" href="'+root+'/nuevo?tipo='+kind+'">Crear '+kinds[kind].toLocaleLowerCase('es')+'</a>').join('')+'</div><form class="record-search"><label>Buscar contenido<input name="q" value="'+html(q)+'"></label><button class="button secondary">Buscar</button></form><ul class="portal-results">'+documents.map(d=>'<li><span>'+html(kinds[d.kind])+'</span><a href="'+root+'/'+html(d.id)+'">'+html(d.title)+'</a></li>').join('')+'</ul>',context);
  }
  let document=id==='nuevo'?{id:'contenido-'+crypto.randomUUID(),title:'',body:'',kind:Object.hasOwn(kinds,url.searchParams.get('tipo'))?url.searchParams.get('tipo'):'page',date:'',revision:-1,source:'CMS CITEDI'}:await documentById(id,sql,true);
  if(!document)return portalShell('Página no encontrada','<p>El contenido no existe.</p>',context,404);
  if(url.searchParams.has('preview')&&id!=='nuevo'&&method==='GET')return portalShell(document.title,'<div class="preview-banner">Vista previa del borrador</div><div class="portal-body">'+document.body+'</div>',context);
  let error='';let status=200;
  if(method==='POST') {
    const title=String(form.get('title')||'').trim(),body=String(form.get('body')||''),date=String(form.get('date')||'');
    const action=form.get('action');
    const validDate=date===''||/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
    if(!title||title.length>250||body.length>180000||!['save','publish'].includes(action)||!validDate){error='Revisa el título, la fecha y la longitud del contenido.';status=400;}
    else if(action==='publish'&&user.role!=='admin'){error='La publicación requiere una cuenta administradora.';status=403;}
    else{
      const actualId=id==='nuevo'?String(form.get('newId')||''):id;
      if(id==='nuevo'&&!/^contenido-[a-f0-9-]{36}$/.test(actualId))return portalShell('Solicitud inválida','<p>Abre nuevamente el formulario de creación.</p>',context,400);
      const next={...document,id:actualId,title,date,body:cleanPortalBody(body)};
      delete next.revision;
      const revision=String(form.get('revision'));
      const serialized=JSON.stringify(next);
      const baseline=sourceDocuments.get(id);
      const published=action==='publish'?serialized:baseline?JSON.stringify(baseline):null;
      let changes=0;
      if(revision==='-1') {
        const result=await sql('INSERT OR IGNORE INTO portal_documents (id,draft,published,revision,updated_by,updated_at) VALUES (?,?,?,0,?,?)',actualId,serialized,published,user.email,new Date().toISOString()).run();
        changes=result.meta.changes;
      } else if(/^\d+$/.test(revision)) {
        const query=action==='publish'?'UPDATE portal_documents SET draft=?,published=?,revision=revision+1,updated_by=?,updated_at=? WHERE id=? AND revision=?':'UPDATE portal_documents SET draft=?,revision=revision+1,updated_by=?,updated_at=? WHERE id=? AND revision=?';
        const params=action==='publish'?[serialized,serialized]:[serialized];
        const result=await sql(query,...params,user.email,new Date().toISOString(),actualId,revision).run();changes=result.meta.changes;
      }
      if(!changes)return portalShell('Conflicto de edición','<p>Otra sesión guardó cambios. <a href="'+root+'/'+html(actualId)+'">Abrir la revisión actual</a>.</p>',context,409);
      return context.redirect(root+'/'+actualId+'?guardado='+action);
    }
    document={...document,title,date,body};
  }
  const message=url.searchParams.get('guardado');
  return portalShell('Editar '+kinds[document.kind].toLocaleLowerCase('es'),'<p><a href="'+root+'">Volver al contenido</a></p>'+
    (message?alert(message==='publish'?'Contenido publicado.':'Borrador guardado.',true):'')+alert(error)+
    '<form class="editor-box portal-editor" method="post"><input type="hidden" name="revision" value="'+document.revision+'">'+(id==='nuevo'?'<input type="hidden" name="newId" value="'+html(document.id)+'">':'')+'<label>Título<input name="title" maxlength="250" value="'+html(document.title)+'" required></label><label>Fecha<input name="date" type="date" value="'+html(document.date)+'"></label><label>Contenido HTML<textarea name="body" rows="22" maxlength="180000">'+html(document.body)+'</textarea></label><p>Puedes conservar imágenes, enlaces, tablas y encabezados del contenido importado.</p><div class="actions"><button class="button secondary" name="action" value="save">Guardar borrador</button>'+(user.role==='admin'?'<button class="button primary" name="action" value="publish">Publicar</button>':'')+(id!=='nuevo'?'<a href="'+root+'/'+html(id)+'?preview=1" target="_blank" rel="noopener">Vista previa guardada ↗</a>':'')+'</div></form>',context,status);
}

