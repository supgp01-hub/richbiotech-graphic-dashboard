const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=file=>fs.readFileSync(file,'utf8');
const index=read('index.html');
const cases=[
  ['งานและรายละเอียดงาน',index,"fbQueueOrderOp('PUT'"],
  ['วันหยุด',read('snippets/leave-persistence-v2.js'),"CLOUD_PATH='/lv_data'"],
  ['วันทำงานพิเศษ',read('snippets/specialwork-persistence-v2.js'),"ITEM_PATH='/specialwork_v2/items'"],
  ['Content Tracker',read('snippets/performance-v4.js'),"window.fbSet('/content_tracker_v2',payload)"],
  ['แผนงานอัตโนมัติ',read('snippets/order-planner-v1.js'),"CLOUD='/order_planner/drafts'"],
  ['บัตรประชาชน',read('snippets/idcard-save-reliability-v1.js'),"SHARED_PATH='/workflow_snapshots/idcards_shared_v1'"],
  ['ค่าคอมมิชชั่น',read('snippets/commission-center-v1.js'),"CLOUD_STORE='/commission_center_v1'"],
  ['List Facebook',read('snippets/list-facebook-editor.js'),"path='/listfacebook_manual/'"],
  ['ติดตามสถานะ Facebook',read('snippets/list-facebook-followup.js'),"FOLLOW_CLOUD_PATH='/listfacebook_followups'"],
  ['แก้ไข Facebook Pages',read('snippets/facebook-pages-inline-editor-v2.js'),"CLOUD_PATH='/workflow_snapshots/fbpages_edits_shared_v1'"],
  ['ประวัติและ Workflow',read('snippets/workflow-ops-v1.js'),"cloud('/workflow_audit/"],
  ['ข้อมูลช่องทางและข้อมูลรุ่นเดิม',read('snippets/shared-business-sync-v1.js'),"rb_channel_data_v1:{path:'/channel_data_v1'"],
  ['ประวัติการทำรายการ',read('snippets/shared-business-sync-v1.js'),"rb_timeline_v1:{path:'/timeline_v1'"]
  ,['แบบร่างฟอร์มสั่งงาน',read('snippets/shared-business-sync-v1.js'),"path:'/order_form_drafts/'"]
];

for(const [label,source,contract] of cases)assert.ok(source.includes(contract),`${label} ต้องมีเส้นทางบันทึกออนไลน์`);
assert.ok(index.includes('snippets/persistence-reliability-v3.js?v=fix340'),'ทุกโมดูลต้องใช้คิวออนไลน์ที่ลองใหม่ได้');
assert.ok(!read('snippets/shared-business-sync-v1.js').includes("rb_users:{path:'/rb_users'"),'รายชื่อผู้ใช้ต้องไม่ถูกเขียนทับผ่านระบบซิงก์รุ่นเก่า');
assert.ok(index.includes('snippets/shared-business-sync-v1.js?v=fix341'),'ข้อมูลธุรกิจรุ่นเดิมต้องใช้ชั้นซิงก์กลาง');
console.log(`business-persistence-coverage: ${cases.length} business areas covered`);
