const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('index.html','utf8');
const guard=fs.readFileSync('snippets/order-viewer-filter-state-v1.js','utf8');

assert.ok(source.includes('snippets/order-viewer-filter-state-v1.js?v=fix348'),
  'the viewer state guard must be cache-busted into the dashboard');
assert.ok(guard.includes('function rows(source,ctx)'),
  'order counters and rows need one shared viewer filter');
assert.ok(source.includes('var orders=rbOrdersForViewer(lpORD());'),
  'order counters must use the shared viewer rows');
assert.ok(source.includes('var viewerContext=rbOrderViewerContext(),orders=rbOrdersForViewer(lpORD(),viewerContext);'),
  'order table must use the same viewer rows as the counters');
assert.ok(guard.includes("if(panel&&previous!==viewer.key){reset(viewer);panel.setAttribute('data-order-viewer-key',viewer.key);}"),
  'switching accounts in one tab must clear filters left by the previous account');
assert.ok(source.includes("if(!viewerContext.isGraphic&&_OF.assignee&&!rbOrderMatchesAssignee(o,_OF.assignee))return false;"),
  'an employee table must not be filtered a second time by a stale team chip');
assert.ok(source.includes("window.addEventListener('rb:auth-ready'"),
  'a newly authenticated employee must immediately refresh an initialized order panel');

const filters={status:'review',type:'กราฟิก',search:'old',dl:'over',assignee:'MOS',date:'2026-09-05',activeCard:'review',sort:'name'};
const attrs={};
const panel={getAttribute:key=>attrs[key]||null,setAttribute:(key,value)=>{attrs[key]=value;}};
const context={
  window:null,document:{getElementById(){return null;}},
  rbOrderAssigneeCode(value){return String(value||'').trim().toUpperCase();},
  rbOrderMatchesAssignee(order,value){return String(order.assignee||'').trim().toUpperCase()===String(value||'').trim().toUpperCase();},
  _rbUser:{uid:'ball-uid',name:'Ball',role:'graphic'},_OF:filters
};
context.window=context;
vm.runInNewContext(guard,context);
const viewer=context.rbEnsureOrderViewerState(panel);
assert.equal(viewer.code,'BALL');
assert.deepEqual(JSON.parse(JSON.stringify(filters)),{status:'',type:'',search:'',dl:'',assignee:'',date:'',activeCard:'all',sort:'priority'},
  'Ball must not inherit a hidden filter from the previous account');
assert.deepEqual(context.rbOrdersForViewer([
  {id:'GR1',assignee:'BALL'},{id:'GR2',assignee:'MOS'},{id:'GR3',assignee:'ball '}
]).map(row=>row.id),['GR1','GR3'],
  'Ball must see every Ball spelling accepted by the shared assignee matcher and no other employee work');

console.log('order-viewer-filter-state-v1: counters and rows stay aligned for employee accounts');
