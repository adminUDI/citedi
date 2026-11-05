import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {cleanPortalBody} from './portal.js';

const seed=JSON.parse(readFileSync('portal-seed.json','utf8'));
const report=JSON.parse(readFileSync('../portal-migration-report.json','utf8'));
const docs=new Map(seed.documents.map(d=>[d.id,d]));
const origin='https://www.citedi.mx';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const mediaBySource=new Map(Object.entries(seed.media).map(([key,value])=>[value.source,'/media/'+key]));
const pageBySource=new Map(seed.documents.filter(d=>/^https?:/.test(d.source)).map(d=>{
  const url=new URL(d.source);
  return [url.hostname.replace(/^www\./,'')+url.pathname,'/'+d.id];
}));
pageBySource.set('citedi.mx/portal/eventos.php','/eventos');
const baseType={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf'};
async function copyMedia(source){
  const url=new URL(source,origin),local=path.join('C:/Users/UDI/citedi',decodeURIComponent(url.pathname));
  if(mediaBySource.has(url.href))return mediaBySource.get(url.href);
  try{
    const bytes=existsSync(local)?readFileSync(local):Buffer.from(await (await fetch(url,{signal:AbortSignal.timeout(12000)})).arrayBuffer());
    const extension=path.extname(url.pathname).toLowerCase();
    if(!baseType[extension]||bytes.length<50)return url.href;
    const key=hash(bytes)+extension;writeFileSync('media/'+key,bytes);
    seed.media[key]={type:baseType[extension],size:bytes.length,source:url.href};
    mediaBySource.set(url.href,'/media/'+key);
    return '/media/'+key;
  }catch{return url.href;}
}
function rewrite(raw,source) {
  const $=load(raw);
  for(const el of $('[href],[src]').toArray()){
    for(const attr of ['href','src']){
      const value=$(el).attr(attr);if(!value||value.startsWith('#')||value.startsWith('/media/'))continue;
      let url;try{url=new URL(value,source);}catch{continue;}
      const key=url.hostname.replace(/^www\./,'')+url.pathname;
      if(attr==='href'&&url.searchParams.get('opt')==='past'&&/eventos\.php$/.test(url.pathname))$(el).attr(attr,'/eventos-historial');
      else if(pageBySource.has(key))$(el).attr(attr,pageBySource.get(key)+url.hash);
      else if(mediaBySource.has(url.href))$(el).attr(attr,mediaBySource.get(url.href));
    }
  }
  return cleanPortalBody($('body').html()||'');
}
const official=load(readFileSync('../official-home.html','utf8'));
const counts=official('.number-counter[data-count-to]').map((i,el)=>({value:official(el).attr('data-count-to'),label:official(el).closest('.col-md-3,.col-sm-3,.col-lg-3').find('.numeralia-texto').text().trim()})).get();
const fallbackLabels=['Estudiantes','Egresados','Laboratorios','Programas'];
const numeralia='<section id="numeralia"><h2>Numeralia</h2><ul>'+counts.map((item,index)=>'<li><strong>'+item.value+'</strong> '+(item.label||fallbackLabels[index])+'</li>').join('')+'</ul><p>Cifras mostradas por el portal oficial del IPN al recuperar esta página el 5 de noviembre de 2026. <a href="https://www.citedi.ipn.mx/">Consultar la fuente institucional</a>.</p></section>';
if(!docs.get('conocenos').body.includes('id="numeralia"'))docs.get('conocenos').body+=numeralia;
const conocenos=load(docs.get('conocenos').body);
docs.set('entorno',{id:'entorno',title:'La ciudad de Tijuana',kind:'page',date:'',body:'<p>El CITEDI se encuentra en Tijuana, Baja California, México.</p>'+conocenos('#ubicacion').html(),source:'https://www.citedi.mx/portal/conocenos.php#ubicacion',sourceType:'respaldo del portal'});
seed.aliases['/entorno.php']='/entorno';
const eventHistory=load(docs.get('eventos-historial').body);
const months={Jan:'01',Ene:'01',Feb:'02',Mar:'03',Apr:'04',Abr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Ago:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12',Dic:'12'};
let eventCount=0;
eventHistory('a[id]').each((i,element)=>{
  const anchor=eventHistory(element),originalId=anchor.attr('id');
  if(!/^\d+$/.test(originalId))return;
  const entry=anchor.nextAll('div').first();
  const title=entry.find('em').first().text().trim();
  if(!title)return;
  const found=entry.text().match(/(\d{2})-([A-Za-z]{3})-(\d{4})/);
  const date=found&&months[found[2]]?found[3]+'-'+months[found[2]]+'-'+found[1]:'';
  const body='<p><a href="/eventos-historial">Volver al historial de eventos</a></p>'+eventHistory.html(entry);
  docs.set('event-'+originalId,{id:'event-'+originalId,title,kind:'event',date,body,source:'https://www.citedi.mx/portal/eventos.php?opt=past#'+originalId,sourceType:'web'});
  eventCount++;
});
docs.get('eventos-historial').body='<p>Consulta los eventos recuperados del portal. Puedes buscar por título y filtrar por año.</p>';
const home=load(readFileSync('../old-home.html','utf8'));
seed.homePanels='<div class="home-panels">'+home('#news .col-lg-4').toArray().slice(0,3).map(el=>'<article>'+rewrite(home.html(el),origin+'/portal/')+'</article>').join('')+'</div>';
seed.banners=[];
for(const el of home('#news_top img').toArray()){
  const image=home(el),src=image.attr('src'),url=image.closest('a').attr('href');
  if(!src)continue;
  seed.banners.push({image:await copyMedia(src),url:url&&url.includes('CitediQR')?'/redes':url||'',title:'Aviso institucional CITEDI'});
}
docs.set('redes',{id:'redes',title:'Conéctate con CITEDI',kind:'page',date:'',body:'<p>Conoce las actividades y contenidos del centro en sus redes institucionales.</p><ul><li><a href="https://www.facebook.com/CITEDI.IPN/">Facebook</a></li><li><a href="https://www.youtube.com/user/citediipn">YouTube</a></li><li><a href="https://www.instagram.com/citedi_ipn/">Instagram</a></li><li><a href="https://twitter.com/CITEDI">X</a></li><li><a href="https://www.linkedin.com/company/citedi-ipn/">LinkedIn</a></li></ul>',source:'https://citedi.mx/CitediQR/',sourceType:'web'});
for(const document of docs.values())document.body=rewrite(document.body,/^http/.test(document.source)?document.source:origin+'/portal/');
seed.documents=[...docs.values()];
report.records.events=eventCount;
report.pages=seed.documents.filter(d=>d.kind==='page').map(d=>({id:d.id,title:d.title,source:d.source,origin:d.sourceType,characters:d.body.length}));
report.media=Object.entries(seed.media).map(([name,entry])=>({name,...entry}));
report.notes=['Entorno estaba anunciado sin enlace en el menú original. Se recuperó la información de ubicación del centro.','Numeralia se recuperó de las cifras públicas de www.citedi.ipn.mx del 05/11/2026.','El historial de eventos se dividió en registros individuales para permitir consulta y edición.'];
writeFileSync('portal-seed.json',JSON.stringify(seed,null,2));
writeFileSync('../portal-migration-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({pages:report.pages.length,events:eventCount,media:report.media.length,maxPage:Math.max(...seed.documents.map(d=>d.body.length))}));

