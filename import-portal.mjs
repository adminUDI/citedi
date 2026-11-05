import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import sanitizeHtml from 'sanitize-html';
const root='C:/Users/UDI/citedi',origin='https://www.citedi.mx',cache='../portal-cache';
mkdirSync(cache,{recursive:true});mkdirSync('media',{recursive:true});
const report={pages:[],media:[],unavailable:[]},documents=[],media={};
const aliases={'/portal/':'/','/portal/index.php':'/','/index.php':'/'},known=new Map();
const titles={
'/portal/conocenos.php':['conocenos','Conócenos'],
'/portal/investigacion.php':['investigacion','Investigación'],
'/portal/serviciosyvinculacion.php':['servicios','Servicios y vinculación'],
'/portal/sgc-sip.html':['calidad','Sistema de Gestión de la Calidad'],
'/portal/directorio.php':['directorio','Directorio'],
'/portal/contactanos.php':['contacto','Contacto'],
'/portal/eventos.php':['eventos','Eventos'],
'/portal/prensa.php':['noticias','CITEDI en las noticias'],
'/portal/convocatorias.php':['convocatorias','Convocatorias'],
'/portal/oportunidades.php':['oportunidades','Oportunidades'],
'/portal/calendario.php':['calendario','Calendario'],
'/portal/avisos.php':['avisos','Avisos'],
'/portal/admision.php':['admision','Admisión'],
'/comiteambiental/':['sustentabilidad','Sustentabilidad'],
'/cosecovi/':['cosecovi','CoSeCoVi'],
'/etica/':['etica','Ética y función pública'],
'/habilidades_blandas/index.php':['habilidades-blandas','Habilidades blandas'],
'/portal/en/':['english','CITEDI · English']
};
const todo=Object.entries(titles).map(([legacy,[id,title]])=>({legacy,id,title,depth:0}));
todo.push(
  {legacy:'/portal/eventos.php?opt=past',id:'eventos-historial',title:'Historial de eventos',depth:0},
  {legacy:'https://maestria.citedi.mx/portal/',id:'maestria',title:'Maestría en Ciencias en Sistemas Digitales',depth:0},
  {legacy:'https://doctorado.citedi.mx/portal/',id:'doctorado',title:'Doctorado en Ciencias en Sistemas Digitales',depth:0}
);
for(const item of todo){known.set(item.legacy,item.id);if(item.legacy.endsWith('/'))known.set(item.legacy+'index.php',item.id);}
const digest=value=>createHash('sha256').update(value).digest('hex');
const isLocal=url=>['citedi.mx','www.citedi.mx'].includes(url.hostname);
const isProgram=url=>['maestria.citedi.mx','doctorado.citedi.mx'].includes(url.hostname);
const urlKey=url=>isProgram(url)?url.hostname+url.pathname:url.pathname;
for(const item of todo.filter(item=>item.legacy.startsWith('https:'))) {
  const url=new URL(item.legacy);
  known.set(urlKey(url),item.id);
  known.set(urlKey(url)+'index.php',item.id);
}
const sourceFor=(pathname,hostname='www.citedi.mx')=>path.join(root,isProgram({hostname})?hostname.split('.')[0]:'',decodeURIComponent(pathname));
function expandPHP(text,base,seen=new Set()){
return text.replace(/<\?php[\s\S]*?\?>/gi,block=>{
const inc=block.match(/include\s*\(\s*['"]pages\/['"]\s*\.\s*\$lang\s*\.\s*['"]\/([^'"]+)['"]\s*\)/);
if(!inc||/\/\/\s*include/.test(block))return '';
const file=path.join(base,'pages/es',inc[1]);if(!existsSync(file)||seen.has(file))return '';
seen.add(file);return expandPHP(readFileSync(file,'utf8'),base,seen);
}).replace(/<\?[\s\S]*?\?>/g,'').replace(/<!--[\s\S]*?-->/g,'');
}
async function fetchFile(url,limit=32*1024*1024){
const response=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('HTTP '+response.status);
const reader=response.body.getReader(),chunks=[];let length=0;
while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw Error('Archivo mayor de 32 MB');}chunks.push(value);}
return Buffer.concat(chunks);
}
async function getPage(legacy){
const url=new URL(legacy,origin),saved=path.join(cache,digest(url.href)+'.html');
if(existsSync(saved))return {html:readFileSync(saved,'utf8'),source:'web'};
try{const text=(await fetchFile(url.href)).toString('utf8');if(!/<(?:html|body|section|p)[\s>]/i.test(text))throw Error('Respuesta sin HTML');writeFileSync(saved,text);return {html:text,source:'web'};}
catch(error){let file=sourceFor(url.pathname,url.hostname);if(url.pathname.endsWith('/'))file=path.join(file,'index.php');if(existsSync(file)&&statSync(file).isFile())return {html:expandPHP(readFileSync(file,'utf8'),path.dirname(file)),source:'respaldo local'};report.unavailable.push({url:url.href,error:error.message});return null;}
}
const types={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.webp':'image/webp','.pdf':'application/pdf','.svg':'image/svg+xml','.doc':'application/msword','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.xls':'application/vnd.ms-excel'};
const pendingMedia=new Map();
if(existsSync('portal-seed.json')) {
  const previous=JSON.parse(readFileSync('portal-seed.json','utf8'));
  for(const [name,entry] of Object.entries(previous.media)) {
    if(existsSync('media/'+name)) {
      media[name]=entry;
      pendingMedia.set(entry.source,Promise.resolve('/media/'+name));
    }
  }
}
async function migrateMedia(url){
if(pendingMedia.has(url.href))return pendingMedia.get(url.href);
const promise=(async()=>{const ext=path.extname(url.pathname).toLowerCase();if(!types[ext])return url.href;
try{const file=sourceFor(url.pathname,url.hostname);const bytes=existsSync(file)&&statSync(file).isFile()?readFileSync(file):await fetchFile(url.href);if(bytes.length>32*1024*1024)throw Error('Archivo mayor de 32 MB');
if(ext==='.svg'&&/<script|onload\s*=|<foreignObject|<!ENTITY|href\s*=\s*["'](?:https?:|\/\/|data:|javascript:)/i.test(bytes.toString('utf8')))throw Error('SVG con contenido activo');
const name=digest(bytes)+ext;if(!media[name]){writeFileSync('media/'+name,bytes);media[name]={type:types[ext],size:bytes.length,source:url.href};}return '/media/'+name;
}catch(error){report.unavailable.push({url:url.href,error:error.message});return url.href;}})();pendingMedia.set(url.href,promise);return promise;
}
const ignored=/(?:index\s*-|copia|conflict|index_original|index0|prensaols|directorio0|menu_|\/(?:ajax|classes|include|mail|js|css|manager|oldVersion)\/)/i;
function discover(url,depth){
if((!isLocal(url)&&!isProgram(url))||ignored.test(url.pathname))return null;
if(known.has(urlKey(url)))return known.get(urlKey(url));
if(!/^\/(?:portal|comiteambiental|cosecovi|etica|habilidades_blandas)\/(?:[^?#]+\/)?[^/]+\.(?:php|html?)$/i.test(url.pathname)||url.search||/download|upload|save|delete|contact_me|getImail/i.test(url.pathname))return null;
const id='pagina-'+digest(urlKey(url)).slice(0,16);known.set(urlKey(url),id);todo.push({legacy:isProgram(url)?url.href:url.pathname,id,title:null,depth:depth+1});return id;
}
async function cleanContent(raw,legacy,depth){
const $=load(raw);
const originalBase=new URL(legacy,origin);
if(isProgram(originalBase)) {
  for(const element of $('a[href]').toArray()) {
    try {discover(new URL($(element).attr('href'),originalBase),depth);} catch {}
  }
}
$('script,style,link,meta,nav,footer,noscript,.navbar,.modal,.carousel-control,.breadcrumb,form').remove();
$('iframe,embed,object').each((i,el)=>{const src=$(el).attr('src')||$(el).attr('data');if(src)$(el).replaceWith($('<p>').append($('<a>').attr('href',src).text(/maps/i.test(src)?'Ver ubicación en Google Maps':'Abrir documento o contenido multimedia')));else $(el).remove();});
const base=new URL(legacy,origin);
for(const el of $('[href],[src]').toArray()){for(const attr of ['href','src']){const value=$(el).attr(attr);if(!value)continue;let url;try{url=new URL(value,base);}catch{$(el).removeAttr(attr);continue;}if(!['http:','https:','mailto:','tel:'].includes(url.protocol)){$(el).removeAttr(attr);continue;}if(value.startsWith('#'))continue;
if(isLocal(url)||isProgram(url)){const id=known.get(urlKey(url))||discover(url,depth);if(id){$(el).attr(attr,'/'+id+url.hash);continue;}if(Object.hasOwn(aliases,url.pathname)&&!isProgram(url)){$(el).attr(attr,aliases[url.pathname]+url.hash);continue;}if(types[path.extname(url.pathname).toLowerCase()]){$(el).attr(attr,await migrateMedia(url));continue;}}$(el).attr(attr,url.href);}}
$('img').each((i,el)=>{if(!$(el).attr('src')||/getImailImg\.php/.test($(el).attr('src')))$(el).remove();});
return sanitizeHtml($('body').html()||'',{allowedTags:['p','br','strong','em','b','i','u','s','h2','h3','h4','h5','h6','ul','ol','li','a','img','figure','figcaption','table','thead','tbody','tfoot','tr','th','td','blockquote','section','div','span','hr','details','summary'],allowedAttributes:{'*':['id'],'a':['href','title'],'img':['src','alt'],'th':['colspan','rowspan','scope'],'td':['colspan','rowspan']},allowedSchemes:['http','https','mailto','tel'],allowProtocolRelative:false,transformTags:{h1:'h2'}}).replace(/<(div|span|p)(?:\s[^>]*)?>\s*<\/\1>/g,'');
}
function selectMain(raw,legacy){const $=load(raw);if(legacy.includes('conocenos'))$('section.home-section').first().attr('id','quienes');$('#logos,#footer,footer,.modal').remove();if(legacy.includes('sgc-sip'))return $('.main-content').html()||$('body').html();return $('body').html()||raw;}
for(let i=0;i<todo.length;i++){const item=todo[i],response=await getPage(item.legacy);if(!response)continue;const $=load(response.html);const title=item.title||$('title').text().trim()||$('h1,h2,h3').first().text().trim()||item.id;const body=await cleanContent(selectMain(response.html,item.legacy),item.legacy,item.depth);
documents.push({id:item.id,title,kind:'page',date:'',body,source:new URL(item.legacy,origin).href,sourceType:response.source});aliases[item.legacy]='/'+item.id;if(item.legacy.endsWith('/'))aliases[item.legacy+'index.php']='/'+item.id;
report.pages.push({id:item.id,title,source:item.legacy,origin:response.source,characters:body.length});console.log('Página',i+1,'/',todo.length,item.id);}
const home=load(readFileSync('../old-home.html','utf8')),homeLinks=[];
const names={'pure-ipn-citedi':'Producción científica en Pure','comite-ambiental':'Sustentabilidad','Icono-CoSeCoVi':'CoSeCoVi','CeroTolerancia':'Cero tolerancia','b1':'Buzón de sugerencias','b2':'INAI','b3':'Transparencia SIPOT','ECCO2025':'Resultados ECCO 2025','b5':'SIDEC','habilidadesblandas':'Habilidades blandas','b6':'Ética y función pública','proteccionDP':'Protección de datos personales'};
for(const el of home('a:has(img)').toArray()){const a=home(el),src=a.find('img').attr('src'),href=a.attr('href');if(!src||!/(?:home_news|CeroTolerancia|ECCO|habilidades)/i.test(src))continue;const image=await migrateMedia(new URL(src,origin+'/portal/'));const url=href?new URL(href,origin+'/portal/'):null;let target=url?(aliases[url.pathname]||url.href):'/buzon';if(url?.pathname.includes('comiteambiental'))target='/sustentabilidad';if(url&&types[path.extname(url.pathname).toLowerCase()]&&isLocal(url))target=await migrateMedia(url);const key=path.basename(src,path.extname(src));homeLinks.push({title:names[key]||key,image,url:target});}
function escape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function parseTable(sql,table){
const quoted=String.fromCharCode(96)+table+String.fromCharCode(96),start=sql.indexOf('CREATE TABLE '+quoted);if(start<0)return [];
const schema=sql.slice(start,sql.indexOf(';',start)),columns=[...schema.matchAll(/^\s+\x60([^\x60]+)\x60/gm)].map(x=>x[1]);
const insert='INSERT INTO '+quoted+' VALUES';const rows=[];let pos=0;
while((pos=sql.indexOf(insert,pos))>=0){pos+=insert.length;while(pos<sql.length){while(/[\s,]/.test(sql[pos]))pos++;if(sql[pos]!=='(')break;pos++;const values=[];
while(pos<sql.length){while(/\s/.test(sql[pos]))pos++;let value='';if(sql[pos]==="'"){pos++;while(pos<sql.length){const c=sql[pos++];if(c==='\\'){const next=sql[pos++];value+=({n:'\n',r:'\r',t:'\t','0':'\0',b:'\b',Z:'\x1a'}[next]??next);}else if(c==="'"){if(sql[pos]==="'"){value+="'";pos++;}else break;}else value+=c;}}else{while(pos<sql.length&&sql[pos]!==','&&sql[pos]!==')')value+=sql[pos++];value=value.trim()==='NULL'?'':value.trim();}values.push(value);while(/\s/.test(sql[pos]))pos++;const end=sql[pos++];if(end===')')break;if(end!==',')throw Error('SQL no reconocido '+table);}rows.push(Object.fromEntries(columns.map((name,i)=>[name,values[i]??''])));if(sql[pos]===';')break;}}
return rows;}
const dump=readFileSync('C:/Users/UDI/AdmAcademic/backUp/20211014-055215-log_db_citedi.sql','utf8');
const records={events:parseTable(dump,'events').filter(r=>r.enabled==='1'&&r.citedi==='1'),news:parseTable(dump,'papernews'),calls:parseTable(dump,'calls').filter(r=>r.erase!=='1'&&/ctd|citedi/i.test(r.publishOn)),articles:parseTable(dump,'articles').filter(r=>r.publish==='1')};
for(const [table,rows] of Object.entries(records)){for(const row of rows){const kind={events:'event',news:'news',calls:'call',articles:'article'}[table],title=row.title||row.name;if(!title)continue;let body='';
if(table==='events')body='<p>'+escape(row.description)+'</p><p>'+escape([row.place,row.speaker].filter(Boolean).join(' · '))+'</p>';
if(table==='news')body='<p>'+escape(row.newspaper)+'</p>';if(table==='calls')body='<p>'+escape(row.description)+'</p><p>'+escape(row.importantDates)+'</p>';if(table==='articles')body='<p>'+escape(row.authors)+'</p><p>'+escape(row.reference||row.journalName)+'</p>';
const more=row.url||row.more;if(more)body+='<p><a href="'+escape(more)+'">Consultar publicación original</a></p>';
documents.push({id:kind+'-'+row.id,title,kind,date:(row.date||row.datePublish||'').slice(0,10),body:await cleanContent(body,'/portal/'+(table==='news'?'prensa.php':table==='events'?'eventos.php':'convocatorias.php'),0),source:'Respaldo público de la base de datos · 14/10/2021',sourceType:'respaldo de base de datos'});}}
writeFileSync('portal-seed.json',JSON.stringify({documents,aliases,homeLinks,media},null,2));
report.records=Object.fromEntries(Object.entries(records).map(([key,rows])=>[key,rows.length]));report.media=Object.entries(media).map(([name,info])=>({name,...info}));writeFileSync('../portal-migration-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({pages:report.pages.length,records:report.records,media:report.media.length,unavailable:report.unavailable.length}));

