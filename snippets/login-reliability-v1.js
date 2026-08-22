(function(){
'use strict';
var select=document.getElementById('rb-login-name');
var pin=document.getElementById('rb-login-pin');
var error=document.getElementById('rb-login-err');
if(!select||!pin)return;

/* The login selector stays native so embedded and mobile browsers always commit its value. */
select.setAttribute('data-rb-dd-off','');
pin.setAttribute('inputmode','numeric');
pin.setAttribute('pattern','[0-9]*');
pin.setAttribute('autocomplete','current-password');
pin.setAttribute('placeholder','••••');
if(pin.parentElement)pin.parentElement.style.position='relative';

document.addEventListener('input',function(event){
  if(event.target!==pin)return;
  if(error)error.textContent='';
  if(pin.value.length===4&&!select.value){
    event.stopImmediatePropagation();
  }
},true);

select.addEventListener('change',function(){
  if(error)error.textContent='';
  if(select.value&&pin.value.length===4){
    setTimeout(function(){if(window._rbDoLogin)window._rbDoLogin()},0);
  }
});

pin.addEventListener('keydown',function(event){
  if(event.key==='Enter'&&select.value&&pin.value.length===4){event.preventDefault();if(window._rbDoLogin)window._rbDoLogin()}
});

var aliases={
  'วิว':'View',View:'วิว','มอส':'Moss',Moss:'มอส','ดอม':'Dom',Dom:'ดอม',
  'เตอร์':'Ter',Ter:'เตอร์','นุ่น':'Nune',Nune:'นุ่น','แจ๋ม':'Jam',Jam:'แจ๋ม',
  'บอล':'Ball',Ball:'บอล','นุ้ย':'Nui',Nui:'นุ้ย','มายด์':'Mind',Mind:'มายด์'
};
var fingerprint='';
function refreshNames(){
  var users;
  try{users=JSON.parse(localStorage.getItem('rb_users')||'null')}catch(e){}
  if(!Array.isArray(users)||!users.length)return;
  var names=users.map(function(user){return String(user&&user.name||'').trim()}).filter(Boolean);
  var next=names.join('\u001f');
  if(!next||next===fingerprint)return;
  var previous=select.value;
  select.innerHTML='';
  var placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='-- เลือกชื่อ --';select.appendChild(placeholder);
  names.forEach(function(name){var option=document.createElement('option');option.value=name;option.textContent=name;select.appendChild(option)});
  var wanted=names.indexOf(previous)>=0?previous:(aliases[previous]&&names.indexOf(aliases[previous])>=0?aliases[previous]:'');
  select.value=wanted;
  fingerprint=next;
}

refreshNames();
var attempts=0;
var timer=setInterval(function(){refreshNames();attempts++;if(attempts>=20)clearInterval(timer)},500);
window.addEventListener('pageshow',refreshNames);
})();
