const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><body><div id="om-id">QA_CONTROLS</div><input id="om-camp1" value="First"><input id="om-camp2" value="Second"><div id="om2-p2-panel"></div><div id="om2-p4-panel"></div>',{runScripts:'outside-only'}),w=dom.window;
const order={id:'QA_CONTROLS',_fbKey:'qa_controls',status:'review',assignee:'DOM',submitLinks:['https://example.test/1','https://example.test/2']};
w._rbUser={role:'audit',name:'Audit'};w.lpORD=()=>[order];
w.eval(fs.readFileSync(path.join(__dirname,'../snippets/order-audit-version-workflow-v1.js'),'utf8'));
function render(force=true){w.rbRenderAuditVersionWorkflow(order,force);}
render();const select=w.document.querySelector('.rb-av-result-input');select.focus();
for(let i=0;i<5;i++)render(i%2===0);
assert.equal(w.document.querySelector('.rb-av-result-input'),select,'duplicate delayed refreshes must preserve the open control');
assert.equal(w.document.activeElement,select,'refresh must not steal keyboard focus');
select.value='issue';select.dispatchEvent(new w.Event('change',{bubbles:true}));
const selected=w.document.querySelector('.rb-av-result-input'),note=w.document.querySelector('.rb-av-note-input');note.value='Keep typed details';note.dispatchEvent(new w.Event('input',{bubbles:true}));render();
assert.equal(w.document.querySelector('.rb-av-result-input'),selected);assert.equal(w.document.querySelector('.rb-av-note-input'),note);assert.equal(note.value,'Keep typed details');
w.document.querySelector('#om-camp1').value='Updated source';render();
assert.notEqual(w.document.querySelector('.rb-av-result-input'),selected,'changed campaign data refreshes the card');assert.equal(w.document.querySelector('.rb-av-note-input').value,'Keep typed details','source refresh preserves Audit draft');
assert.equal(w.document.querySelector('.rb-av-result-input').value,'issue');
w._rbUser={role:'graphic',name:'DOM'};render();assert.equal(w.document.querySelectorAll('#rb-audit-version-workflow .rb-av-result-input').length,0,'role changes must rebuild permissions');
assert.equal(w.document.querySelectorAll('.rb-av-employee-save').length,0,'reviewed submission cannot be sent twice');order.status='revision';render();assert.equal(w.document.querySelectorAll('.rb-av-employee-save').length,1,'a new correction request enables submission');
order.assignee='OTHER';render();assert.equal(w.document.querySelectorAll('.rb-av-employee-save').length,0,'reassigning the job must revoke the old employee controls without a role change');
// A browser focus scroll must reposition an open desktop menu, while a
// control scrolled out of view must close it. Exercise the shipped listener.
const selectHtml=w.document.createElement('select');selectHtml.innerHTML='<option value="pending">รอตรวจ</option><option value="issue">ต้องแก้ไข</option>';w.document.body.appendChild(selectHtml);
let top=200;selectHtml.getBoundingClientRect=()=>({top,bottom:top+40,left:20,right:220,width:200,height:40});w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');w.eval(html.match(/<script id="rb-global-dropdown-v5-script">([\s\S]*?)<\/script>/)[1]);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
selectHtml.dispatchEvent(new w.MouseEvent('pointerdown',{button:0,bubbles:true}));const popover=w.document.querySelector('#rb-dd-popover');assert.equal(popover.style.display,'block');
w.document.dispatchEvent(new w.Event('scroll'));assert.equal(popover.style.display,'block','focus-driven modal scroll must preserve the menu');
top=-100;w.document.dispatchEvent(new w.Event('scroll'));assert.equal(popover.style.display,'none','out-of-view controls must close their menu');
dom.window.close();console.log('audit control stability: focus, selection, drafts, source updates, roles, status and scroll behavior passed');
