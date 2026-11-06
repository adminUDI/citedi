import fs from 'node:fs';
import * as c from 'cheerio';
const $=c.load(fs.readFileSync('../ipn-reference.html','utf8'));
const origin='https://www.citedi.ipn.mx/';
const types={};
async function asset(url,name){const r=await fetch(new URL(url,origin));if(!r.ok)throw Error(url+' '+r.status);fs.writeFileSync('assets/'+name,Buffer.from(await r.arrayBuffer()));types[name]=r.headers.get('content-type').split(';')[0];return '/assets/'+name;}
const agenda=[];
for(const pane of $('.principal-tabs-pane').toArray()){
 const category=$(pane).attr('id').replace('tabpane_','');const items=[];
 for(const card of $(pane).find('.noticia-simple').toArray()){
  const image=$(card).find('img');const imageUrl=await asset(image.attr('src'),'agenda-'+agenda.length+'-'+items.length+new URL(image.attr('src'),origin).pathname.match(/\.[^.]+$/)[0]);
  items.push({title:image.attr('alt').trim(),image:imageUrl,url:$(card).find('a').first().attr('href').trim(),date:$(card).find('.noticia-simple-txt').text().trim()});
 }agenda.push({category,items});
}
const education=await asset($('.logo-educacion-footer').attr('src'),'education-footer.png');
const government=await asset('https://framework-gb.cdn.gob.mx/gobmx/img/logo_blanco.svg','government-footer.svg');
const strip=await asset('https://framework-gb.cdn.gob.mx/gobmx/img/pleca.svg','government-pleca.svg');
const help=await asset('https://framework-gb.cdn.gob.mx/gobmx/img/079.png','government-079.png');
const footerParagraphs=$('.footer-ipn p').map((i,e)=>$(e).text().trim()).get();
const govColumns=$('footer.footer-gob .col-sm-3').toArray().slice(1,3).map(el=>({title:$(el).find('h5').first().text(),description:$(el).find('p').text().trim(),links:$(el).find('li a').map((i,a)=>({title:$(a).text().trim(),url:$(a).attr('href')})).get()}));
const govSocial=[];for(const a of $('footer.footer-gob .social-media a').toArray()){const img=$(a).find('img');govSocial.push({title:img.attr('alt'),url:$(a).attr('href'),image:await asset(img.attr('src'),'gov-social-'+govSocial.length+'.png')});}
const fonts=await(await fetch('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;800&display=swap',{headers:{'User-Agent':'Mozilla/5.0'}})).text();
let css=fonts;let n=0;for(const match of [...fonts.matchAll(/url\((https:[^)]+)\)/g)])css=css.replace(match[1],await asset(match[1],'red-hat-display-'+n+++'.woff2'));
fs.writeFileSync('assets/reference-font.css',css);types['reference-font.css']='text/css; charset=utf-8';
fs.writeFileSync('portal-reference.json',JSON.stringify({agenda,education,government,strip,help,footerParagraphs,govColumns,govSocial,types},null,2));
console.log('Agenda recuperada:',agenda.map(x=>[x.category,x.items.length]));
