import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {cleanPortalBody} from './portal.js';
const seed=JSON.parse(readFileSync('portal-seed.json','utf8'));
const people=new Map();
for(const document of seed.documents.filter(d=>d.kind==='page'&&/^https?:/.test(d.source))){
 const file='../portal-cache/'+createHash('sha256').update(document.source).digest('hex')+'.html';
 if(!existsSync(file))continue;
 const $=load(readFileSync(file,'utf8'));
 $('.MoreInfo[data-id]').each((i,el)=>{
  const id=$(el).attr('data-id'),name=$(el).attr('data-name')||$(el).find('td').first().text().trim();
  if(/^\d+$/.test(id)&&name)people.set(id,name);
 });
}
const norm=text=>text.replace(/\s+/g,' ').trim().toLocaleLowerCase('es');
let profiles=0;
for(const [id,name] of people){
 const file='../portal-cache/profile-'+id+'.html';
 let raw=existsSync(file)?readFileSync(file,'utf8'):null;
 try{
  if(!raw){
   const response=await fetch('https://www.citedi.mx/portal/ajax/getResumePreview.php',{method:'POST',body:new URLSearchParams({id_employee:id}),signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('HTTP '+response.status);raw=await response.text();writeFileSync(file,raw);
  }
  const body=cleanPortalBody(raw);
  if(load(body).text().trim().length<30)continue;
  seed.documents.push({id:'investigador-'+id,title:name,kind:'profile',date:'',body,source:'https://www.citedi.mx/portal/investigacion.php',sourceType:'perfil público del portal'});
  profiles++;
  for(const document of seed.documents.filter(d=>d.kind==='page')){
   const $=load(document.body);let changed=false;
   $('td').each((i,el)=>{if(!$(el).find('a').length&&norm($(el).text())===norm(name)){const a=$('<a>').attr('href','/investigador-'+id).text($(el).text());$(el).empty().append(a);changed=true;}});
   if(changed)document.body=$('body').html();
  }
 }catch(error){console.log('Perfil no recuperado',id,error.message);}
}
writeFileSync('portal-seed.json',JSON.stringify(seed,null,2));
const report=JSON.parse(readFileSync('../portal-migration-report.json','utf8'));report.records.profiles=profiles;writeFileSync('../portal-migration-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({profiles,linkedResearchers:people.size}));

