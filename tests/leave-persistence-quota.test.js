const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('snippets/leave-persistence-v2.js','utf8');
const writes=[];
let relieved=0;
const localStorage={
  getItem(){return null;},
  setItem(){const error=new Error('Setting the value exceeded the quota');error.name='QuotaExceededError';throw error;},
  removeItem(){}
};
const document={visibilityState:'visible',documentElement:{setAttribute(name,value){this[name]=value;}}};
const window={
  LV_DATA:{},LV_UID:1,document,localStorage,
  rbStorageResilience:{relieve(){relieved++;}},
  lvDK:(y,m,d)=>`${y}-${m}-${d}`,
  lvSaveLS(){},lvSaveDay(){},lvRender(){},lvRestorePhotos(){},
  fbGet(path,cb){cb(null,{d:{},u:1,t:1});},
  fbSet(path,value){writes.push({path,value});return Promise.resolve(true);},
  addEventListener(){}
};
const context={window,document,localStorage,console,Date,JSON,Object,Array,String,Number,Math,isFinite,Promise,setTimeout,clearTimeout,setInterval:()=>1,clearInterval};
vm.createContext(context);vm.runInContext(source,context);

(async function(){
  window.lvSaveDay(2026,9,2,[{uid:1,empId:'dom',type:'vac',createdAt:100,updatedAt:100}]);
  assert.strictEqual(window.rbLeavePersistence.pending(),true,'the queue must survive in memory when browser storage is full');
  const synced=await window.rbLeavePersistence.waitForSync(1500);
  assert.strictEqual(synced,true,'the save must report success only after cloud confirmation');
  assert.ok(relieved>=1,'quota recovery must be attempted');
  assert.ok(writes.some(item=>item.path.startsWith('/lv_data/d/2026-9-2/')),'the leave entry must still reach its isolated cloud path');
  assert.ok(writes.some(item=>item.path==='/lv_data/t'),'the cloud revision must be committed');
  assert.strictEqual(window.rbLeavePersistence.pending(),false,'the memory queue must clear after confirmed cloud writes');
  assert.strictEqual(document.documentElement['data-leave-persistence'],'3.2.0');
  console.log('leave persistence quota regression: passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
