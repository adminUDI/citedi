import seed from './portal-seed.json' with {type:'json'};
import {portalMenu} from './portal.js';
import {load} from 'cheerio';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const documents=new Map(seed.documents.map(d=>[d.id,d]));
const missing=[];
for(const [,items] of portalMenu)for(const [,link] of items){
  const [id,anchor]=link.slice(1).split('#');
  const doc=documents.get(id);assert.ok(doc,'Ruta del menú '+link);
  if(anchor)assert.ok(load(doc.body)('[id]').toArray().some(el=>el.attribs.id===anchor),'Ancla '+link);
}
for(const document of seed.documents) {
  const $=load(document.body);
  assert.equal($('script,iframe,form,style,object,embed').length,0,document.id);
  for(const el of $('[href],[src]').toArray()) {
    for(const attribute of ['href','src']) {
      const value=$(el).attr(attribute);
      if(!value?.startsWith('/')||value.startsWith('//'))continue;
      const url=new URL(value,'https://portal.test');
      if(url.pathname.startsWith('/media/'))assert.ok(seed.media[url.pathname.slice(7)],document.id+' '+value);
      else if(!['/','/buzon','/eventos-historial'].includes(url.pathname)&&!documents.has(url.pathname.slice(1)))missing.push({page:document.id,url:value});
    }
  }
}
for(const [name,metadata] of Object.entries(seed.media)){
  const bytes=readFileSync('media/'+name);
  assert.equal(bytes.length,metadata.size,name);
  assert.ok(name.startsWith(createHash('sha256').update(bytes).digest('hex')+'.'),name);
}
writeFileSync('../portal-link-audit.json',JSON.stringify(missing,null,2));
console.log(JSON.stringify({pages:documents.size,media:Object.keys(seed.media).length,missingLinks:missing.length}));
if(missing.length)process.exitCode=1;

