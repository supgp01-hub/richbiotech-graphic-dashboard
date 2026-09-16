(function(w){
'use strict';
var BOOK='16tMMVcw0TueyypCgn9h7Trh9WNPAccXBZ6Et2qy0qzc', TAB='บันทึกออดิต', BASE='https://docs.google.com/spreadsheets/d/'+BOOK;
var cache=null, pending=null, failed=false;
function nodes(root,name){return Array.from(root.getElementsByTagNameNS('*',name))}
function xml(text){var d=new DOMParser().parseFromString(text,'application/xml');if(nodes(d,'parsererror').length)throw Error('ข้อมูลชีทไม่สมบูรณ์');return d}
function text(el){return el?el.textContent:''}
function http(value){try{var u=new URL(String(value||''));return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return ''}}
function path(base,target){var result=[];(target[0]==='/'?target.slice(1):base+target).split('/').forEach(function(p){if(p==='..')result.pop();else if(p&&p!=='.')result.push(p)});return result.join('/')}
// Read only the central directory and the XML parts needed for this one worksheet.
async function unzip(buffer){
 if(buffer.byteLength>20000000)throw Error('ไฟล์ชีทใหญ่เกินขนาดที่รองรับ');
 var v=new DataView(buffer), bytes=new Uint8Array(buffer), end=-1;
 for(var i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break}
 if(end<0)throw Error('อ่านไฟล์ชีทไม่ได้');
 var count=v.getUint16(end+10,true), offset=v.getUint32(end+16,true), entries={}, decoder=new TextDecoder();
 for(var j=0;j<count;j++){
  if(v.getUint32(offset,true)!==0x02014b50)throw Error('โครงสร้างไฟล์ชีทไม่ถูกต้อง');
  var size=v.getUint32(offset+20,true), full=v.getUint32(offset+24,true), n=v.getUint16(offset+28,true), extra=v.getUint16(offset+30,true), comment=v.getUint16(offset+32,true);
  entries[decoder.decode(bytes.slice(offset+46,offset+46+n))]={size:size,full:full,method:v.getUint16(offset+10,true),at:v.getUint32(offset+42,true)};offset+=46+n+extra+comment;
 }
 return async function(name,optional){
  var e=entries[name];if(!e){if(optional)return '';throw Error('ไม่พบข้อมูลในไฟล์ชีท: '+name)}
  if(e.full>16000000||e.size>20000000)throw Error('ข้อมูลชีทใหญ่เกินขนาดที่รองรับ');
  var at=e.at;if(v.getUint32(at,true)!==0x04034b50)throw Error('ข้อมูลชีทไม่สมบูรณ์');
  at+=30+v.getUint16(at+26,true)+v.getUint16(at+28,true);var data=bytes.slice(at,at+e.size);
  if(e.method===8){var stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));data=new Uint8Array(await new Response(stream).arrayBuffer())}
  else if(e.method!==0)throw Error('รูปแบบไฟล์ชีทไม่รองรับ');
  if(data.length!==e.full)throw Error('ข้อมูลชีทไม่ครบ');return decoder.decode(data);
 };
}
function relationships(doc){var out={};nodes(doc,'Relationship').forEach(function(r){out[r.getAttribute('Id')]=r.getAttribute('Target')});return out}
async function parse(buffer){
 var read=await unzip(buffer), workbook=xml(await read('xl/workbook.xml')), rel=relationships(xml(await read('xl/_rels/workbook.xml.rels')));
 var sheet=nodes(workbook,'sheet').find(function(s){return s.getAttribute('name')===TAB});if(!sheet)throw Error('ไม่พบแท็บ '+TAB);
 var sheetPath=path('xl/',rel[sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')]), base=sheetPath.slice(0,sheetPath.lastIndexOf('/')+1);
 var stringsXml=await read('xl/sharedStrings.xml',true), strings=stringsXml?nodes(xml(stringsXml),'si').map(function(s){return nodes(s,'t').map(text).join('')}):[];
 var doc=xml(await read(sheetPath)), relText=await read(base+'_rels/'+sheetPath.slice(base.length)+'.rels',true), linkRels=relText?relationships(xml(relText)):{}, links={};
 nodes(doc,'hyperlink').forEach(function(h){var id=h.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');links[h.getAttribute('ref')]=http(linkRels[id])});
 var rows=[];
 nodes(doc,'row').forEach(function(r){
  var row=[], number=Number(r.getAttribute('r'));
  nodes(r,'c').forEach(function(c){var ref=c.getAttribute('r'), letters=ref.replace(/[0-9]/g,''), col=0;for(var k=0;k<letters.length;k++)col=col*26+letters.charCodeAt(k)-64;
   var type=c.getAttribute('t'), value=text(nodes(c,'v')[0]);if(type==='s')value=strings[Number(value)]||'';else if(type==='inlineStr')value=nodes(c,'t').map(text).join('');
   // Google exports calendar dates as Excel serials. Keep calendar days independent of timezone.
   if([1,5,6,8].indexOf(col)>=0&&type!=='s'&&type!=='inlineStr'&&/^\d+(\.\d+)?$/.test(value)&&Number(value)>20000){var date=new Date(Date.UTC(1899,11,30)+Math.floor(Number(value))*86400000);value=date.getUTCDate()+'/'+(date.getUTCMonth()+1)+'/'+date.getUTCFullYear()}
   row[col-1]=value;
   if(col===12){var formula=text(nodes(c,'f')[0]), match=formula.match(/^HYPERLINK\(\s*"((?:[^"]|"")*)"/i);row.evidenceUrl=links[ref]||http(match&&match[1].replace(/""/g,'"'))||http(value)}
  });
  if(number>1&&row[0]&&row[2]&&row[3]){row.sourceRow=number;row.sourceUrl=BASE+'/edit#range='+encodeURIComponent("'"+TAB+"'!A"+number+':M'+number);rows.push(row)}
 });
 if(!rows.length)throw Error('ไม่พบรายการในชีท · เก็บข้อมูลเดิมไว้');return rows;
}
function read(force){
 if(pending)return pending;if(!force&&cache&&Date.now()-cache.at<60000)return Promise.resolve(cache.rows);
 var started=Date.now(), controller=new AbortController(), timer=setTimeout(function(){controller.abort()},20000);
 pending=fetch(BASE+'/export?format=xlsx&_='+started,{cache:'no-store',credentials:'omit',signal:controller.signal}).then(function(r){if(!r.ok)throw Error('อ่านชีทไม่ได้');return r.arrayBuffer()}).then(parse).then(function(rows){cache={at:started,rows:rows};failed=false;return rows}).catch(function(e){failed=true;throw e}).finally(function(){clearTimeout(timer);pending=null});return pending;
}
w.rbAuditSheetEvidence={read:read,parse:parse,http:http,source:BASE+'/edit#range='+encodeURIComponent("'"+TAB+"'!A:M"),status:function(){return {at:cache?cache.at:0,failed:failed}}};
})(window);
