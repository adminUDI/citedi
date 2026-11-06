import fs from 'node:fs';
import * as c from 'cheerio';
import sanitize from 'sanitize-html';
const origin='https://www.citedi.ipn.mx';
const roots=[['estudiantes',origin+'/informacion-estudiantes/tramites-escolares-citedi-ipn/'],['egresados',origin+'/informacion-estudiantes/egresados.html'],['laboratorios',origin+'/lineas-investigacion/laboratorios/'],['programas',origin+'/oferta-educativa-citedi-ipn/']];
const queue=[...roots],documents=[],types={},mapping=new Map(roots.map(([id,url])=>[url,'/'+id]));
mapping.set(origin+'/oferta-educativa-citedi-ipn/maestria-sistemas-digitales/','/maestria');mapping.set(origin+'/oferta-educativa-citedi-ipn/doctorado-sistemas-digitales/','/doctorado');
const pages=[];
for(let i=0;i<queue.length;i++){
 const [id,url]=queue[i];const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(url+' '+r.status);const $=c.load(await r.text());
 const blocks=$('main').children('div').filter((i,e)=>!$(e).is('#menu-principal,#tituloUnidad,.container')).clone();blocks.find('script,style,form').remove();
 if(!blocks.length)throw Error('No content blocks: '+url);
 if(id==='laboratorios')for(const a of blocks.find('table a').toArray()){const target=new URL($(a).attr('href'),url).href;if(target.startsWith(origin+'/lineas-investigacion/laboratorios/')&&!mapping.has(target)){const slug='laboratorio-'+(queue.length-3);mapping.set(target,'/'+slug);queue.push([slug,target]);}}
 pages.push({id,url,title:($('h1').first().text().trim()||blocks.find('h2,h3,h4').first().text().trim()),blocks,$});
}
for(const {id,url,title,blocks,$} of pages){
 for(const el of blocks.find('img').toArray()){
  const img=$(el);const src=img.attr('src');if(!src)continue;const resolved=new URL(src,url).href;const r=await fetch(resolved,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Missing image '+resolved);const type=r.headers.get('content-type')?.split(';')[0];if(!type?.startsWith('image/'))throw Error('Not an image '+resolved);const name='quick-page-'+id+'-'+Object.keys(types).length+({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/svg+xml':'.svg','image/gif':'.gif'}[type]||'.png');fs.writeFileSync('assets/'+name,Buffer.from(await r.arrayBuffer()));types[name]=type;img.attr('src','/assets/'+name);img.attr('loading','lazy');if(!img.attr('alt'))img.attr('alt',title);
 }
 for(const el of blocks.find('a').toArray()){
  const a=$(el);const href=a.attr('href');if(!href)continue;try{const absolute=new URL(href,url).href;const target=new URL(absolute);const base=absolute.split('#')[0];a.attr('href',(mapping.get(base)||absolute)+(mapping.has(base)?target.hash:''));}catch{a.removeAttr('href');}
 }
 for(const el of blocks.find('iframe').toArray()){const frame=$(el),src=frame.attr('src');if(src)frame.replaceWith('<p><a href="'+new URL(src,url).href.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" target="_blank" rel="noopener">Abrir formulario oficial de actualización de datos ↗</a></p>');else frame.remove();}
 const body=sanitize(blocks.map((i,e)=>$.html(e)).get().join(''),{allowedTags:['div','section','p','br','hr','h2','h3','h4','h5','h6','a','img','ul','ol','li','strong','b','em','i','table','thead','tbody','tr','th','td','figure','figcaption','span'],allowedAttributes:{'*':['class','id'],'a':['href','target','rel'],'img':['src','alt','loading'],'td':['colspan','rowspan'],'th':['colspan','rowspan']},allowedSchemes:['https','http','mailto','tel']});
 documents.push({id,title,body,kind:'page',date:'',source:url,sourceType:'web'});
}
fs.writeFileSync('quick-pages.json',JSON.stringify({documents,types},null,2));console.log(JSON.stringify({pages:documents.map(d=>[d.id,d.title]),images:Object.keys(types).length}));
