const {JSDOM}=require('jsdom'),test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
test('grouped HOOK matches dates per employee and hides other submissions for staff',()=>{
 const d=new JSDOM('<table class="ct-table"><thead><tr></tr></thead></table>',{runScripts:'outside-only'}),w=d.window;
 const r={id:'r1',brand:'A',episode:'Title',ready:'Hook'};
 w._rbUser={uid:'view',name:'วิว',role:'sup'};w.ctContentRows=()=>[r];w.ctProductOwners=()=>({A:'TER NUNE'});w.ctSubmissions={entries:()=>[{ownerName:'TER',ownerUid:'ter',text:'private',updatedAt:1000}]};
 w.lpORD=()=>[{id:'1',product:'A',name:'Title',hook:'Hook',assignee:'TER',createdAt:1000,deadline:'2026-09-10'},{id:'2',product:'A',name:'Title',hook:'Hook',assignee:'NUNE',createdAt:2000,deadline:'2026-09-12'},{id:'3',product:'A',name:'Title',hook:'Hook',assignee:'TER',createdAt:3000,deadline:'2026-09-11'}];
 w.eval(fs.readFileSync('snippets/content-hook-history-v1.js','utf8'));w.eval(fs.readFileSync('snippets/content-grouped-v1.js','utf8'));
 let people=w.ctGrouped.people(r);assert.equal(people[0].order.id,'3');assert.equal(people[1].order.id,'2');
 w.document.body.insertAdjacentHTML('beforeend',w.ctGrouped.row(r,1));w.document.querySelector('[data-ctg-toggle]').click();let html=w.ctGrouped.row(r,1);assert.doesNotMatch(html,/วันที่สั่งล่าสุด/);assert.match(html,/11\/09\/2569/);assert.match(html,/12\/09\/2569/);assert.match(html,/data-content-owner="ter"/);
 w._rbUser={uid:'nune',name:'NUNE',role:'graphic'};people=w.ctGrouped.people(r);assert.equal(people.length,1);assert.equal(people[0].name,'NUNE');html=w.ctGrouped.row(r,1);assert.doesNotMatch(html,/วันที่สั่งล่าสุด|owner="ter"/);assert.match(html,/เพิ่มข้อความ/);d.window.close();
});
