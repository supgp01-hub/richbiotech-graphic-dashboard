const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('snippets/order-audit-persistence-v1.js','utf8'),safe=fs.readFileSync('snippets/safe-order-write-v1.js','utf8');
function setup(role='audit'){
 const dom=new JSDOM('<input id="om-fbname"><input id="om-camp1"><input id="om-camp2"><textarea id="om-audit-note"></textarea><div id="om-camp-extra"></div>',{runScripts:'outside-only'});
 const w=dom.window;w._rbUser={role};w.Response=Response;w.eval(safe);w.eval(source);
 const row={id:'GR1',_fbKey:'order1',status:'review',fbName:'',camp1:'',camp2:'',auditVersions:[{jobId:'GR1',version:1,result:'pending'}],updatedAt:10};
 w.rbCaptureAuditBaseline(row);return {w,row,dom};
}
function persist(w,row){return w.rbPersistAuditFields(row,id=>w.document.getElementById(id),w.document);}
(async()=>{
 let {w,row,dom}=setup();
 const latest={...row,fbName:'Online audit',camp1:'Online 1',camp2:'Online 2',auditVersions:[{jobId:'GR1',version:1,result:'issue'}]};
 persist(w,latest);assert.equal(latest.fbName,'Online audit');assert.equal(latest.camp1,'Online 1');assert.equal(latest.auditVersions[0].result,'issue');
 // Explicitly edited fields retain their modal-open baseline for conflicts.
 w.document.getElementById('om-fbname').value='My audit edit';persist(w,latest);
 const base=w.rbAuditSaveBase(latest,'fbName','Online audit');assert.equal(base,'');assert.equal(w.rbAuditSaveBase(latest,'fbName','Online audit'),'Online audit','baseline consumed only for this write');
 let writes=0;
 const request=async(_url,opts)=>{if(opts.method){writes++;return new Response('{}');}return new Response(JSON.stringify({...latest,fbName:'Online audit',updatedAt:20}),{headers:{ETag:'v1'}});};
 await assert.rejects(()=>w.rbSafeOrderWrite.write('fixture',{method:'PATCH',body:JSON.stringify({fbName:'My audit edit',updatedAt:30}),rbBaseUpdatedAt:20,rbBaseValues:{fbName:base}},request),e=>e.code==='RB_ORDER_CONFLICT');
 assert.equal(writes,0,'even a refreshed record timestamp cannot override the original field baseline');
 assert.equal(w.document.getElementById('om-fbname').value,'My audit edit','conflicts retain entered text');
 dom.window.close();
 for(const role of ['graphic','ads','spec']){
  ({w,row,dom}=setup(role));const latest={...row,fbName:'Protected',camp1:'Protected campaign',auditNote:'Fix colour',auditVersions:[{result:'issue'}]};
  w.document.getElementById('om-fbname').value='Stale worker field';persist(w,latest);
  assert.equal(latest.fbName,'Protected');assert.equal(latest.camp1,'Protected campaign');assert.equal(latest.auditNote,'Fix colour');assert.equal(latest.auditVersions[0].result,'issue');
  assert.equal(w.rbGuardEmployeeOrderAction({...latest,status:'revision'},'inprogress'),false);
  assert.equal(w.rbGuardEmployeeOrderAction({...latest,status:'revision'},'revision'),true);
  assert.equal(w.rbGuardEmployeeOrderAction(null,'review'),false);
  assert.equal(w.rbGuardEmployeeAuditEvidence(latest),false,'new audit decisions block stale proof submission');dom.window.close();
 }
 ({w,row,dom}=setup('sup'));
 const oldPanel=w.document.createElement('div');oldPanel.id='rb-audit-version-workflow';w.document.body.append(oldPanel);
 w.rbCaptureAuditBaseline(row);assert.equal(w.document.getElementById(oldPanel.id),null,'reopening the same job discards prior rendered cards');
 w.document.getElementById('om-camp1').value='Campaign one';w.document.getElementById('om-camp2').value='Campaign two';persist(w,row);assert.equal(row.camp1,'Campaign one');assert.equal(row.camp2,'Campaign two');
 // Quota exhaustion does not affect capturing or submitting audit fields.
 Object.defineProperty(w,'localStorage',{value:{setItem(){throw Error('QuotaExceededError');}}});
  w.document.getElementById('om-audit-note').value='Both versions need correction';persist(w,row);assert.equal(row.auditNote,'Both versions need correction');
 // An online receipt rebases to submitted values, never to text typed in flight.
 w.document.getElementById('om-audit-note').value='Typed while saving';w.rbAuditSaveAcknowledged();persist(w,row);
 assert.equal(row.auditNote,'Typed while saving');assert.equal(w.rbAuditSaveBase(row,'auditNote',null),'Both versions need correction');
 dom.window.close();console.log('audit stale form452: untouched fields, field conflicts, roles, stale actions, two campaigns, quota passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
