(function(root){
'use strict';
// Supervisor requested a fresh ledger beginning 12 September 2026, Bangkok.
var start=Date.parse('2026-09-12T00:00:00+07:00');
function eligible(row){var at=Number(row&&row.detectedAt);return !!row&&Number.isFinite(at)&&at>=start;}
function clean(store){var next=Object.assign({},store||{});['manual','sheetImports'].forEach(function(key){next[key]={};Object.keys(store&&store[key]||{}).forEach(function(id){if(eligible(store[key][id]))next[key][id]=store[key][id];});});next.decisions={};Object.keys(store&&store.decisions||{}).forEach(function(id){var decision=store.decisions[id];if(Number(decision&&decision.at)>=start)next.decisions[id]=decision;});next.resetPolicy={startDate:'2026-09-12',timezone:'Asia/Bangkok',version:1};return next;}
var api={start:start,eligible:eligible,clean:clean};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.rbDeductionResetPolicy=api;
})(typeof window!=='undefined'?window:this);
