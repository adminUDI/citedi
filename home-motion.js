import {institutionalVideoHero} from './video-hero.js';
import seed from './portal-seed.json' with {type:'json'};

const root='/admin/carrusel';
const maxSlides=8;
function defaults(content={}) {
  return {
    autoplay:true,interval:7,effect:'fade',noticeEnabled:true,noticeInterval:6,
    notices:[
      {text:'Conoce nuestros programas de Maestría y Doctorado en Sistemas Digitales',url:'/maestria'},
      {text:'Consulta las convocatorias y el proceso de admisión',url:'/admision'},
      {text:'Explora las líneas de investigación del CITEDI',url:'/investigacion'}
    ],
    slides:[
      {title:'Un espacio para investigar y crear',description:'Conoce el campus del CITEDI en Tijuana.',image:content.heroImage||'/assets/campus.jpg',alt:content.heroAlt||'Edificio del CITEDI en Tijuana',url:'/conocenos',label:'Conoce el centro',fit:'cover'},
      ...(seed.banners||[]).map((item,index)=>({title:index===0?'En nuestra comunidad':'Conéctate con CITEDI',description:'Aviso recuperado del portal institucional.',image:item.image,alt:item.title,url:item.url||'/avisos',label:'Consultar información',fit:'contain'}))
    ]
  };
}
export async function readMotion(sql,draft=false,content) {
  const row=await sql('SELECT * FROM home_motion WHERE id=1').first();
  if(row)return {config:JSON.parse(draft?row.draft:row.published),revision:row.revision};
  if(!content){
    const home=await sql('SELECT published FROM home WHERE id=1').first();
    content=home?JSON.parse(home.published):{};
  }
  return {config:defaults(content),revision:-1};
}
function safeUrl(value,required=false) {
  if(!value)return !required;
  if(/[\u0000-\u0020\\]/.test(value)||value.startsWith('//'))return false;
  try {
    const url=new URL(value,'https://portal.local');
    return !url.username&&!url.password&&url.protocol==='https:'&&(value.startsWith('https://')||value.startsWith('/'));
  }catch{return false;}
}
export function renderFeature(content,state,html) {
  const config=state.config;
  const carousel =
    '<section class="feature-carousel" aria-label="Imágenes y avisos destacados" aria-roledescription="carrusel" tabindex="0" data-carousel data-autoplay="'+config.autoplay+'" data-interval="'+config.interval+'" data-effect="'+config.effect+'">'+
    '<div class="carousel-viewport">'+config.slides.map((slide,index)=>
      '<article class="carousel-slide" data-slide aria-roledescription="diapositiva" aria-label="'+(index+1)+' de '+config.slides.length+'"'+(index?' hidden inert':'')+'><div class="slide-image '+(slide.fit==='cover'?'slide-cover':'slide-contain')+'"><img src="'+html(slide.image)+'" alt="'+html(slide.alt)+'"'+(index?' loading="lazy"':' fetchpriority="high"')+'></div><div class="slide-caption"><div><span class="slide-kicker">DESTACADO '+String(index+1).padStart(2,'0')+'</span><h2>'+html(slide.title)+'</h2><p>'+html(slide.description)+'</p></div>'+(slide.url?'<a href="'+html(slide.url)+'">'+html(slide.label||'Consultar')+' <span aria-hidden="true">↗</span></a>':'')+'</div></article>'
    ).join('')+'</div>'+
    '<div class="carousel-controls" data-carousel-controls hidden><div class="carousel-arrows"><button type="button" data-prev aria-label="Imagen anterior">←</button><button type="button" data-next aria-label="Imagen siguiente">→</button></div><div class="carousel-dots" aria-label="Seleccionar imagen">'+config.slides.map((slide,index)=>'<button type="button" data-go="'+index+'" aria-label="Mostrar imagen '+(index+1)+': '+html(slide.title)+'" aria-pressed="'+(index===0)+'"><span></span></button>').join('')+'</div><button type="button" data-pause aria-pressed="false" aria-label="Pausar cambio automático">Pausar</button></div><p class="sr-only" data-slide-status aria-live="polite"></p></section>';
  return '<header class="portal-name-band"><h1>'+html(content.title)+'</h1></header><section class="unified-feature" data-unified-feature><div data-unified-video>'+institutionalVideoHero(html)+'</div><div class="unified-banners" data-unified-banners hidden>'+carousel+'</div><div class="unified-switch"><button type="button" data-show-video aria-pressed="true">Video institucional</button><button type="button" data-show-banners aria-pressed="false">Avisos destacados</button></div><p class="sr-only" data-feature-status aria-live="polite"></p></section>';
}
export function renderNotice(state,html) {
  const c=state.config;
  if(!c.noticeEnabled||!c.notices.length)return '';
  return '<section class="notice-bar" aria-label="Avisos del portal"><div class="wrap notice-inner"><strong><span class="notice-dot" aria-hidden="true"></span> AL DÍA</strong><div class="notice-rotator" data-carousel data-autoplay="true" data-interval="'+c.noticeInterval+'" data-effect="slide" aria-label="Avisos rotativos" tabindex="0">'+c.notices.map((notice,index)=>'<p data-slide'+(index?' hidden inert':'')+'>'+(notice.url?'<a href="'+html(notice.url)+'">'+html(notice.text)+' <span aria-hidden="true">↗</span></a>':html(notice.text))+'</p>').join('')+'<div data-carousel-controls hidden><button type="button" data-pause aria-pressed="false" aria-label="Pausar avisos">Pausar avisos</button></div></div></div></section>';
}
function editorShell(title,body,context,status=200) {
  return context.page(title,'<header class="wrap header">'+context.brand+'<a href="/admin">← Volver al gestor</a></header><main class="wrap section motion-editor" id="contenido"><div class="eyebrow"><span></span> PORTADA DEL PORTAL</div><h1>'+title+'</h1>'+body+'</main>',status);
}
export async function motionAdmin(method,form,url,user,sql,context) {
  const {html,alert}=context;
  const state=await readMotion(sql,true);
  let config=state.config,error='',status=200;
  if(method==='POST'){
    const slides=[],notices=[];
    for(let index=0;index<maxSlides;index++){
      if(form.get('slide_'+index+'_enabled')!=='on')continue;
      const values=Object.fromEntries(['title','description','image','alt','url','label','fit','order'].map(key=>[key,String(form.get('slide_'+index+'_'+key)||'').trim()]));
      const order=Number(values.order);
      if(!values.title||values.title.length>110||values.description.length>250||!values.alt||values.alt.length>200||values.image.length>1000||values.url.length>1000||values.label.length>60||!['contain','cover'].includes(values.fit)||!safeUrl(values.image,true)||!safeUrl(values.url)||!Number.isInteger(order)||order<1||order>8)error='Revisa los datos de la imagen '+(index+1)+'. Usa enlaces HTTPS o rutas del portal.';
      slides.push({...values,order});
    }
    slides.sort((a,b)=>a.order-b.order);
    for(const slide of slides)delete slide.order;
    for(let index=0;index<4;index++){
      const text=String(form.get('notice_'+index+'_text')||'').trim(),link=String(form.get('notice_'+index+'_url')||'').trim();
      if(!text&&!link)continue;
      if(!text||text.length>220||link.length>1000||!safeUrl(link))error='Revisa el texto y el enlace de los avisos.';
      notices.push({text,url:link});
    }
    const interval=Number(form.get('interval')),noticeInterval=Number(form.get('noticeInterval')),effect=String(form.get('effect'));
    if(!slides.length)error='Activa al menos una imagen para el carrusel.';
    if(!Number.isInteger(interval)||interval<4||interval>30||!Number.isInteger(noticeInterval)||noticeInterval<4||noticeInterval>30||!['fade','slide'].includes(effect))error='Elige tiempos de 4 a 30 segundos y una transición válida.';
    const action=form.get('action');
    if(!['save','publish'].includes(action))error='La acción no es válida.';
    config={autoplay:form.get('autoplay')==='on',interval,effect,noticeEnabled:form.get('noticeEnabled')==='on',noticeInterval,notices,slides};
    if(action==='publish'&&user.role!=='admin')return editorShell('Carrusel y avisos',alert('Solo el administrador puede publicar los cambios.'),context,403);
    if(error)status=400;
    else{
      const revision=String(form.get('revision'));
      const serialized=JSON.stringify(config);
      let result;
      if(revision==='-1')result=await sql('INSERT OR IGNORE INTO home_motion (id,draft,published,revision,updated_by,updated_at) VALUES (1,?,?,0,?,?)',serialized,action==='publish'?serialized:JSON.stringify((await readMotion(sql)).config),user.email,new Date().toISOString()).run();
      else if(/^\d+$/.test(revision)){
        result=action==='publish'
          ?await sql('UPDATE home_motion SET draft=?,published=?,revision=revision+1,updated_by=?,updated_at=? WHERE id=1 AND revision=?',serialized,serialized,user.email,new Date().toISOString(),revision).run()
          :await sql('UPDATE home_motion SET draft=?,revision=revision+1,updated_by=?,updated_at=? WHERE id=1 AND revision=?',serialized,user.email,new Date().toISOString(),revision).run();
      }
      if(!result?.meta.changes)return editorShell('Conflicto de edición','<p>Otra sesión modificó el carrusel. <a href="'+root+'">Cargar la revisión actual</a>.</p>',context,409);
      return context.redirect(root+'?guardado='+action);
    }
  }
  const {results:uploads}=await sql('SELECT key,original_name FROM motion_media ORDER BY created_at DESC LIMIT 100').all();
  const available=[
    {url:'/assets/campus.jpg',name:'Campus CITEDI'},
    ...uploads.map(item=>({url:'/uploads/'+item.key,name:item.original_name})),
    ...Object.entries(seed.media).filter(([,item])=>item.type.startsWith('image/')).map(([key,item])=>({url:'/media/'+key,name:decodeURIComponent(new URL(item.source).pathname.split('/').pop())}))
  ];
  const field=(name,label,value,max=250)=>'<label>'+label+'<input name="'+name+'" value="'+html(value||'')+'" maxlength="'+max+'"></label>';
  const check=(name,label,checked)=>'<label class="check-label"><input type="checkbox" name="'+name+'"'+(checked?' checked':'')+'>'+label+'</label>';
  const slideForms=Array.from({length:maxSlides},(_,index)=>{
    const slide=config.slides[index]||{fit:'contain'};
    const prefix='slide_'+index+'_';
    return '<details class="slide-editor"'+(index<config.slides.length?' open':'')+'><summary>Imagen '+(index+1)+(slide.title?' · '+html(slide.title):' · Espacio disponible')+'</summary><div class="slide-editor-fields">'+check(prefix+'enabled','Mostrar esta imagen',Boolean(slide.image))+
      '<div class="slide-editor-grid"><div><label>Imagen · URL HTTPS o ruta del portal<input data-image-url list="motion-images" name="'+prefix+'image" value="'+html(slide.image||'')+'" maxlength="1000"></label><div class="image-upload"><label>Subir imagen desde tu equipo<input type="file" data-image-file accept="image/png,image/jpeg,image/webp,image/gif"></label><button type="button" class="button secondary" data-upload>Subir imagen</button><p data-upload-status role="status"></p></div>'+
      field(prefix+'alt','Descripción de la imagen para accesibilidad',slide.alt,200)+'</div><img data-image-preview class="slide-editor-preview" src="'+html(slide.image||'/assets/campus.jpg')+'" alt="Vista de la imagen seleccionada" loading="lazy"></div>'+
      '<div class="form-grid">'+field(prefix+'title','Título',slide.title,110)+field(prefix+'description','Descripción breve',slide.description,250)+field(prefix+'url','Enlace al hacer clic',slide.url,1000)+field(prefix+'label','Texto del enlace',slide.label,60)+
      '<label>Posición<input type="number" name="'+prefix+'order" min="1" max="8" value="'+(index+1)+'"></label><label>Ajuste de la imagen<select name="'+prefix+'fit"><option value="contain"'+(slide.fit==='contain'?' selected':'')+'>Mostrar completa · carteles</option><option value="cover"'+(slide.fit==='cover'?' selected':'')+'>Cubrir el espacio · fotografías</option></select></label></div></div></details>';
  }).join('');
  const noticeForms=Array.from({length:4},(_,index)=>'<div class="notice-editor-row">'+field('notice_'+index+'_text','Aviso '+(index+1),config.notices[index]?.text,220)+field('notice_'+index+'_url','Enlace opcional',config.notices[index]?.url,1000)+'</div>').join('');
  return editorShell('Carrusel y avisos','<p>Organiza las imágenes de la portada y los textos de la franja en movimiento. Guarda el borrador para revisar antes de publicar.</p>'+alert(error)+(url.searchParams.has('guardado')?alert(url.searchParams.get('guardado')==='publish'?'Carrusel y avisos publicados.':'Borrador guardado.',true):'')+
    '<div class="actions"><a class="button secondary" href="'+root+'/vista-previa" target="_blank" rel="noopener">Vista previa guardada ↗</a><a href="/">Abrir portada ↗</a></div><form method="post" action="'+root+'" class="motion-form"><input type="hidden" name="revision" value="'+state.revision+'"><fieldset class="editor-box"><legend>Movimiento de las imágenes</legend><div class="form-grid">'+check('autoplay','Cambiar imágenes automáticamente',config.autoplay)+'<label>Segundos entre imágenes<input name="interval" type="number" min="4" max="30" value="'+config.interval+'" required></label><label>Transición<select name="effect"><option value="fade"'+(config.effect==='fade'?' selected':'')+'>Desvanecimiento</option><option value="slide"'+(config.effect==='slide'?' selected':'')+'>Desplazamiento</option></select></label></div></fieldset><datalist id="motion-images">'+available.map(item=>'<option value="'+html(item.url)+'">'+html(item.name)+'</option>').join('')+'</datalist>'+
    '<section><h2>Imágenes del carrusel</h2><p>Para retirar una imagen, desactiva “Mostrar esta imagen”. La posición define su orden.</p>'+slideForms+'</section>'+
    '<fieldset class="editor-box"><legend>Franja de avisos en movimiento</legend>'+check('noticeEnabled','Mostrar la franja de avisos',config.noticeEnabled)+'<label>Segundos entre avisos<input type="number" name="noticeInterval" min="4" max="30" value="'+config.noticeInterval+'"></label>'+noticeForms+'</fieldset><div class="actions"><button class="button secondary" name="action" value="save">Guardar borrador</button>'+(user.role==='admin'?'<button class="button primary" name="action" value="publish">Publicar carrusel y avisos</button>':'')+'</div></form>',context,status);
}
export async function uploadMotionImage(request,env,user,sql) {
  const respond=(body,status)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  const reader=request.body?.getReader();
  if(!reader)return respond({error:'Selecciona una imagen.'},400);
  const chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>5*1024*1024){await reader.cancel();return respond({error:'La imagen debe pesar como máximo 5 MB.'},413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let extension,type;
  if(bytes.length>=12&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10){extension='png';type='image/png';}
  else if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255){extension='jpg';type='image/jpeg';}
  else if(bytes.length>=12&&new TextDecoder().decode(bytes.slice(0,6)).match(/^GIF8[79]a$/)){extension='gif';type='image/gif';}
  else if(bytes.length>=12&&new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){extension='webp';type='image/webp';}
  else return respond({error:'Usa una imagen PNG, JPEG, WebP o GIF válida.'},400);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const key=hash+'.'+extension;
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:type}});
  let name;try{name=decodeURIComponent(request.headers.get('X-File-Name')||'Imagen');}catch{name='Imagen';}
  await sql('INSERT OR IGNORE INTO motion_media (key,type,size,original_name,created_by,created_at) VALUES (?,?,?,?,?,?)',key,type,length,name.slice(0,180),user.email,new Date().toISOString()).run();
  return respond({url:'/uploads/'+key},201);
}
export async function uploadedMotionImage(request,env,url,sql) {
  if(!url.pathname.startsWith('/uploads/'))return null;
  const key=url.pathname.slice(9);
  if(!/^[a-f0-9]{64}\.(png|jpg|webp|gif)$/.test(key)||!['GET','HEAD'].includes(request.method))return new Response(null,{status:404});
  const metadata=await sql('SELECT type FROM motion_media WHERE key=?',key).first();
  if(!metadata)return new Response(null,{status:404});
  const object=await env.BUCKET.get(key);
  if(!object)return new Response(null,{status:404});
  return new Response(request.method==='HEAD'?null:object.body,{headers:{'Content-Type':metadata.type,'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=31536000,immutable'}});
}

