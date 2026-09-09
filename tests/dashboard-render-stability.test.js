const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
function body(name){const start=html.indexOf('function '+name+'('),end=html.indexOf('\nfunction ',start+1);return html.slice(start,end)}
function element(){return {children:[],style:{},setAttribute(){},appendChild(x){this.children.push(x);this.firstElementChild=this.children[0]},get innerHTML(){return ''},set innerHTML(v){this.children=[];this.firstElementChild=null;this.clears=(this.clears||0)+1}}}
test('unchanged sync preserves order controls; real changes and filters refresh them',()=>{
 const wrap=element(),sum=element(),stats=element();let rows=[{id:'GR1',_fbKey:'one',name:'Task',type:'Graphic',deadline:'2026-09-09',status:'pending',assignee:'MOS'}];
 const c={window:{_rbUser:{name:'View',role:'sup'}},document:{getElementById:id=>({'ord-tw':wrap,'ord-result-summary':sum,'ord-stats':stats}[id]),createElement:element},_OF:{sort:'name'},rbOrderViewerContext:()=>({isGraphic:false}),rbOrdersForViewer:r=>r,lpORD:()=>rows,dlSt:()=> 'ok',rbOrderRef:o=>o._fbKey,ST:[{k:'pending',l:'Pending',bg:'white',col:'black'}],MB_GR:['MOS'],rbOrderTypeLabel:x=>x,fmtD:x=>x,esc:x=>String(x||''),Date,JSON};
 vm.createContext(c);vm.runInContext(body('renderOrders')+body('renderOrderStats'),c);
 c.renderOrders();c.renderOrderStats();const table=wrap.firstElementChild,card=stats.firstElementChild;
 for(let i=0;i<50;i++){c.renderOrders();c.renderOrderStats()}
 assert.equal(wrap.firstElementChild,table);assert.equal(stats.firstElementChild,card);assert.equal(wrap.clears,1);
 rows[0].note='changed';c.renderOrders();assert.notEqual(wrap.firstElementChild,table);
 c._OF.status='done';c.renderOrders();assert.equal(wrap.firstElementChild.children.length,0);
 c._OF.status='';c.window._rbUser.role='graphic';c.renderOrders();assert.equal(wrap.children.length,1);
});
test('background scheduling uses one visible leader while explicit dispatch is unchanged',()=>{
 const src=fs.readFileSync('snippets/order-planner-v1.js','utf8');const start=src.indexOf('function runBackgroundWorker'),end=src.indexOf('\nfunction boot',start);let calls=0,leader=false;
 const c={window:{_rbUser:{},rbMultiTab:{isLeader:()=>leader}},document:{hidden:false},runWorker:()=>{calls++}};vm.createContext(c);vm.runInContext(src.slice(start,end),c);
 c.runBackgroundWorker();assert.equal(calls,0);leader=true;c.document.hidden=true;c.runBackgroundWorker();assert.equal(calls,0);c.document.hidden=false;c.runBackgroundWorker();assert.equal(calls,1);
});
test('shared pagers preserve controls on unrelated updates and process mixed mutation batches',()=>{
 const src=fs.readFileSync('snippets/page-size-pagination-v1.js','utf8');let callback,scheduled=0,writes=0;
 const pager={_rbPageKey:null,set innerHTML(v){writes++},get innerHTML(){return ''}},row={tagName:'TR',hidden:false,classList:{contains:()=>false},hasAttribute:()=>false};
 const table={},tbody={children:[row],closest:s=>s==='table'?table:null,contains:n=>n===row};
 const panel={getAttribute:()=>null,setAttribute(){},addEventListener(){},querySelector:s=>s.includes('rbps-pager')?pager:tbody};
 const c={window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){},querySelector:()=>panel},localStorage:{getItem:()=>null,setItem(){}},MutationObserver:function(fn){callback=fn;this.observe=()=>{}},setTimeout:()=>{scheduled++;return scheduled},clearTimeout(){},Array,Object,JSON,Math,String,parseInt};
 vm.createContext(c);vm.runInContext(src,c);c.window.rbPageSizePagination.refresh();const before=writes;
 c.window.rbPageSizePagination.apply('order');assert.equal(writes,before);
 const base=scheduled;callback([{target:{closest:()=>null},addedNodes:[],removedNodes:[]}]);assert.equal(scheduled,base);
 callback([{target:{closest:()=>pager},addedNodes:[],removedNodes:[]},{target:tbody,addedNodes:[],removedNodes:[]}]);assert.equal(scheduled,base+1);
});

