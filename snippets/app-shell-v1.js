(function(){
'use strict';
if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;
window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(function(error){console.warn('โหมดทำงานต่อเนื่องยังไม่พร้อม',error);});},{once:true});
})();
