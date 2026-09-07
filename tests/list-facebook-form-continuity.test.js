const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('snippets/list-facebook-followup.js','utf8');
function extract(name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);return source.slice(start,end);}
function field(value=''){return {value,disabled:false,hidden:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},removeAttribute(k){delete this.attrs[k];},classList:{toggle(){}}};}
const ids={};
for(const key of ['type','name','emp','prod','st','fbid','passFb','email','emailPass','twofa','limit','bal','note'])ids['lfbi-'+key]=field('');
ids['lfbi-name'].value='Unsaved name';ids['lfbi-note'].value='Unsaved note';
ids['lfbi-passFb'].value='edited';
ids['lfb-account-detail']=field();ids['lfb-account-detail'].attrs={'data-account-key':'account-a','data-editing':'1'};
ids['lfb-account-save']=field();ids['lfb-account-save-state']=field();
ids['lfb-credentials-open']=field();ids['lfb-credentials-drawer']=field();
ids['lfb-credentials-drawer'].querySelector=()=>field();
let finish, written;
const ctx={document:{getElementById:id=>ids[id]||null},credentialsOpen:false,credentialsEditing:false,selectedKey:'account-b',
  rowByKey:()=>({passFb:'saved'}),renderAll(){throw Error('must not redraw while new edits exist');},
  recommendedNextDate:()=>'',window:{_lfbSaveAccountRecord(key,values){written={key,values};return new Promise(resolve=>{finish=resolve;});}}};
vm.createContext(ctx);
for(const name of ['updateCredentialsDrawer','openCredentialsDrawer','closeCredentialsDrawer','cancelCredentialsEdit','persistAccountDetail'])vm.runInContext(extract(name),ctx);
(async()=>{
  ctx.openCredentialsDrawer(true);ctx.closeCredentialsDrawer();ctx.cancelCredentialsEdit();
  assert.equal(ids['lfbi-name'].value,'Unsaved name');
  assert.equal(ids['lfbi-note'].value,'Unsaved note');
  assert.equal(ids['lfbi-passFb'].value,'saved','cancel only resets credential fields');
  ctx.persistAccountDetail(false);
  assert.equal(written.key,'account-a','save must target the mounted form, even if list selection changes');
  ids['lfbi-note'].value='Typed during save';finish({online:true});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ids['lfbi-note'].value,'Typed during save');
  assert.equal(ids['lfb-account-detail'].attrs['data-editing'],'1');
  assert.match(ids['lfb-account-save-state'].textContent,/ยังไม่บันทึก/);
  console.log('List Facebook form continuity passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
