(function(root){
'use strict';
function text(v){return String(v==null?'':v).trim();}
function csvRows(csv){var rows=[],row=[],field='',quoted=false;csv=String(csv||'').replace(/^\uFEFF/,'');for(var i=0;i<csv.length;i++){var c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(field);if(row.some(function(v){return text(v);}))rows.push(row);row=[];field='';}else field+=c;}row.push(field);if(row.some(function(v){return text(v);}))rows.push(row);return rows;}
function base(row){return JSON.stringify([text(row._fbpSourceName||row.name),text(row.prod),text(row.emp||row.own)]);}
function normalize(rows){var seen={};return(rows||[]).filter(function(r){return r&&text(r.name);}).map(function(src){var r=Object.assign({},src),b=base(r);seen[b]=(seen[b]||0)+1;r._pageSourceKey=r._pageSourceKey||b+'#'+seen[b];if(!r.pageId&&r.fbid){r.shareFacebook=r.shareFacebook||r.fbid;r.fbid='';}return r;});}
function parse(csv){var all=csvRows(csv),headers=all.shift()||[];if(headers[0]!=='ชื่อเพจ'||headers[1]!=='สินค้า')throw new Error('รูปแบบหัวตารางเพจไม่ตรง กรุณาตรวจชีท');var id=headers.findIndex(function(h){return /^(Page ID|รหัสเพจ)$/i.test(text(h));});return normalize(all.map(function(c){return{name:text(c[0]),prod:text(c[1]),st:text(c[2]),emp:text(c[3]),own:text(c[3]),shareFacebook:text(c[4]),pageId:id>=0?text(c[id]):'',fbid:'',type:''};}));}
// Never use a Facebook account name as a page identifier. One account owns many pages.
function merge(existing,incoming){var old=normalize(existing),fresh=normalize(incoming),keys={},out=fresh.slice();fresh.forEach(function(r){keys[r._pageSourceKey]=true;});old.forEach(function(r){if(!keys[r._pageSourceKey]){out.push(r);keys[r._pageSourceKey]=true;}});return out;}
root.rbFacebookPagesSource={parse:parse,normalize:normalize,merge:merge,base:base,csvRows:csvRows};
})(window);
