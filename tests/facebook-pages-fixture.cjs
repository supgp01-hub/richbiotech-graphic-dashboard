// Fictional rows for repeatable tests. An optional local CSV path verifies the actual source without publishing it.
const fs=require('node:fs');
module.exports=function(api,path){if(path)return api.parse(fs.readFileSync(path,'utf8'));
 const counts={MOS:17,NUNE:39,TER:21,BALL:21,DOM:25,LINK:6,JAM:32,'':39},rows=[];
 Object.entries(counts).forEach(([own,count])=>{for(let i=0;i<count;i++)rows.push({name:own==='LINK'&&i<2?'Duplicate test page':(own||'Spare')+' test page '+i,prod:'Test product',own,emp:own,st:own==='LINK'&&i===1?'ว่าง':'ใช้งาน',shareFacebook:'Shared test account '+(i%3),fbid:''});});return api.normalize(rows);
};
