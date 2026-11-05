import {readFileSync,writeFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const seed=JSON.parse(readFileSync('portal-seed.json','utf8'));
const report=JSON.parse(readFileSync('../portal-migration-report.json','utf8'));
const root='C:/Users/UDI/citedi';
const fixes=new Map();
const pending=[];
for(const missing of report.unavailable){
 const url=new URL(missing.url),name=decodeURIComponent(path.basename(url.pathname));
 const sub=['maestria','doctorado'].find(sub=>url.hostname.startsWith(sub+'.'));
 const candidates=[path.join(root,sub||'',decodeURIComponent(url.pathname)),path.join(root,decodeURIComponent(url.pathname))];
 for(const folder of [path.dirname(candidates[0]),path.dirname(candidates[1]),path.join(root,'maestria/portal/files'),path.join(root,'doctorado/portal/files'),path.join(root,'portal/img'),path.join(root,'img/events'),path.join(root,'files')]){
  if(!existsSync(folder))continue;
  const matched=readdirSync(folder).find(file=>file.normalize('NFC').toLowerCase()===name.normalize('NFC').toLowerCase());
  if(matched)candidates.push(path.join(folder,matched));
 }
 let bytes;
 const local=candidates.find(file=>existsSync(file)&&statSync(file).isFile());
 if(local)bytes=readFileSync(local);
 else {try{const response=await fetch(url,{signal:AbortSignal.timeout(8000)});if(response.ok)bytes=Buffer.from(await response.arrayBuffer());}catch{}}
 const ext=path.extname(url.pathname).toLowerCase(),types={'.pdf':'application/pdf','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png'};
 if(!bytes||!types[ext]){pending.push(missing);continue;}
 const key=createHash('sha256').update(bytes).digest('hex')+ext;
 writeFileSync('media/'+key,bytes);seed.media[key]={type:types[ext],size:bytes.length,source:url.href};
 fixes.set(url.href,'/media/'+key);
}
const failed=new Set(pending.map(item=>item.url));
for(const doc of seed.documents){
 const $=load(doc.body);
 $('img[src],a[href]').each((i,node)=>{
  const el=$(node),attr=node.name==='img'?'src':'href',value=el.attr(attr);
  if(fixes.has(value))el.attr(attr,fixes.get(value));
  else if(failed.has(value)){
   if(node.name==='img')el.replaceWith($('<p>').text('Imagen histórica no disponible: '+decodeURIComponent(path.basename(new URL(value).pathname))));
   else {el.attr('title','Archivo original no disponible en el respaldo ni en el servidor');el.after($('<span>').text(' (archivo histórico no recuperado)'));}
  }
  if(node.name==='a'&&/^#\d+$/.test(value)&&/eventos\.php/.test(doc.source))el.attr('href','/event-'+value.slice(1));
 });
 doc.body=$('body').html();
}
report.unavailable=pending;
report.recoveredFiles=[...fixes.keys()];
report.media=Object.entries(seed.media).map(([name,entry])=>({name,...entry}));
writeFileSync('portal-seed.json',JSON.stringify(seed,null,2));
writeFileSync('../portal-migration-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({recovered:fixes.size,unavailable:pending.length,media:report.media.length}));

