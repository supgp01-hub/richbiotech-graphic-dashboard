(function(w,d){
'use strict';
// Keep persisted employee keys and audit history intact; normalize only labels.
function label(value){return String(value==null?'':value).replace(/^(\s*(?:ผู้รับผิดชอบ\s+)?)(?:mos|moss)(\s*)$/i,'$1MOSS$2');}
function apply(node){
 if(node.nodeType===3){var p=node.parentElement;if(!p||p.closest('script,style,textarea,input,[contenteditable="true"]'))return;var next=label(node.nodeValue);if(next!==node.nodeValue){if(p.tagName==='OPTION'&&!p.hasAttribute('value'))p.value=p.value;node.nodeValue=next;}return;}
 if(node.nodeType!==1||node.matches('script,style,textarea,input,[contenteditable="true"]'))return;
 Array.from(node.childNodes).forEach(apply);
}
w.rbEmployeeDisplayName=label;
var pending=new Set(),scheduled=false;
new MutationObserver(function(changes){changes.forEach(function(change){if(change.type==='characterData')pending.add(change.target);else change.addedNodes.forEach(function(node){pending.add(node);});});if(scheduled||!pending.size)return;scheduled=true;queueMicrotask(function(){scheduled=false;var nodes=Array.from(pending);pending.clear();nodes.forEach(function(node){if(node.isConnected)apply(node);});});}).observe(d.documentElement,{childList:true,subtree:true,characterData:true});
apply(d.documentElement);
})(window,document);
