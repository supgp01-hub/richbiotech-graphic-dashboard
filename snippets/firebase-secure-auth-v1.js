import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

window.__RB_SECURE_AUTH__=true;
window.addEventListener('storage',event=>{if(event.key==='rb_session')event.stopImmediatePropagation();},true);

const CONFIG={apiKey:'AIzaSyCfhpRlo_jVl9_vuBKkwDq0H7kAmC-_nho',authDomain:'richbiotech-c4e41.firebaseapp.com',projectId:'richbiotech-c4e41',storageBucket:'richbiotech-c4e41.firebasestorage.app',messagingSenderId:'238265709540',appId:'1:238265709540:web:dcbac40e5d49467afc8df1'};
const DB='https://richbiotech-c4e41-default-rtdb.firebaseio.com';
const SUPERVISOR_EMAIL='supgp01@richbiotech.com';
const PIN_SESSION_KEY='rb_firebase_pin_session_v1';
const EMPLOYEES=['วิว','มอส','ดอม','เตอร์','นุ่น','แจ๋ม','บอล','นุ้ย','มายด์','MY Boss','Audit'];
const PIN_ACCOUNTS={
  'วิว':'pin.view@richbiotech.team','มอส':'pin.moss@richbiotech.team','ดอม':'pin.dom@richbiotech.team',
  'เตอร์':'pin.ter@richbiotech.team','นุ่น':'pin.nune@richbiotech.team','แจ๋ม':'pin.jam@richbiotech.team',
  'บอล':'pin.ball@richbiotech.team','นุ้ย':'pin.nui@richbiotech.team','มายด์':'pin.mind@richbiotech.team',
  'MY Boss':'pin.myboss@richbiotech.team','Audit':'pin.audit@richbiotech.team'
};
const ROLES=[['sup','Supervisor'],['spec','Specialist'],['graphic','Graphic & Ads'],['ads','Ads Optimizer'],['audit','Audit']];
const app=initializeApp(CONFIG);
const auth=getAuth(app);
const provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
const nativeFetch=window.fetch.bind(window);
let authUser=null;
let profile=null;
let pinSession=restorePinSession();
let pinLoginBusy=false;
let lastPinError='';
let resolveReady;
const ready=new Promise(resolve=>{resolveReady=resolve;});

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function makePinSession(data){
  const session={uid:data.localId||data.user_id||'',email:data.email||'',_idToken:data.idToken||data.id_token||'',_refreshToken:data.refreshToken||data.refresh_token||'',_expiresAt:Date.now()+Number(data.expiresIn||data.expires_in||3600)*1000};
  session.getIdToken=async force=>{
    if(!force&&session._idToken&&Date.now()<session._expiresAt-60000)return session._idToken;
    const body=new URLSearchParams({grant_type:'refresh_token',refresh_token:session._refreshToken});
    const response=await nativeFetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(CONFIG.apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    const refreshed=await response.json();
    if(!response.ok||!refreshed.id_token)throw new Error(refreshed?.error?.message||'TOKEN_REFRESH_FAILED');
    session.uid=refreshed.user_id||session.uid;session._idToken=refreshed.id_token;session._refreshToken=refreshed.refresh_token||session._refreshToken;session._expiresAt=Date.now()+Number(refreshed.expires_in||3600)*1000;
    savePinSession(session);return session._idToken;
  };
  return session;
}
function savePinSession(session){try{localStorage.setItem(PIN_SESSION_KEY,JSON.stringify({uid:session.uid,email:session.email,refreshToken:session._refreshToken}));}catch(_e){}}
function restorePinSession(){try{const saved=JSON.parse(localStorage.getItem(PIN_SESSION_KEY)||'null');return saved?.uid&&saved?.refreshToken?makePinSession({localId:saved.uid,email:saved.email,refreshToken:saved.refreshToken}):null;}catch(_e){return null;}}
function clearPinSession(){pinSession=null;try{localStorage.removeItem(PIN_SESSION_KEY);}catch(_e){}}
function activeFirebaseUser(){return auth.currentUser||pinSession;}
async function pinRestLogin(email,pin){
  const response=await nativeFetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(CONFIG.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'rb'+pin,returnSecureToken:true})});
  const data=await response.json();
  if(!response.ok||!data.idToken){const error=new Error(data?.error?.message||'INVALID_LOGIN_CREDENTIALS');error.code=data?.error?.message||'INVALID_LOGIN_CREDENTIALS';throw error;}
  pinSession=makePinSession(data);savePinSession(pinSession);return pinSession;
}
async function logout(){clearPinSession();try{await signOut(auth);}finally{authUser=null;profile=null;window._rbUser=null;setGate('เข้าสู่ระบบทีมงาน','',{login:true});}}
function gate(){
  let el=document.getElementById('rb-auth-gate');
  if(el)return el;
  el=document.createElement('div');el.id='rb-auth-gate';
  el.innerHTML='<section class="rb-auth-card"><header class="rb-auth-head"><div class="rb-auth-brand"><span class="rb-auth-logo">🌿</span><div><div class="rb-auth-title">RICHBIOTECH Graphic &amp; Ads</div><div class="rb-auth-subtitle">ระบบทีมงานและข้อมูลออนไลน์</div></div></div></header><div class="rb-auth-body"><div id="rb-auth-status" class="rb-auth-status"><strong>กำลังตรวจสอบบัญชี</strong>กรุณารอสักครู่ ระบบกำลังเชื่อมต่อข้อมูล</div><div id="rb-auth-pin-form" class="rb-auth-pin-form" hidden><label for="rb-auth-name">เลือกชื่อพนักงาน</label><select id="rb-auth-name"><option value="">— เลือกชื่อ —</option>'+EMPLOYEES.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('')+'</select><div id="rb-auth-pin-label" class="rb-auth-pin-label">PIN 4 หลัก</div><div id="rb-auth-pin-group" class="rb-auth-pin-group" role="group" aria-labelledby="rb-auth-pin-label" aria-describedby="rb-auth-pin-hint">'+[1,2,3,4].map(i=>'<input class="rb-auth-pin-digit" data-pin-index="'+(i-1)+'" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true" placeholder=" " aria-label="PIN หลักที่ '+i+'">').join('')+'</div><div id="rb-auth-pin-hint" class="rb-auth-pin-hint">กรอกครบ 4 หลัก ระบบจะเข้าสู่ระบบให้อัตโนมัติ</div><button id="rb-auth-pin-login" class="rb-auth-button" type="button">เข้าสู่ระบบ</button></div><button id="rb-auth-google-login" class="rb-auth-button rb-auth-secondary" type="button" hidden>เข้าแบบ Google สำหรับ Supervisor</button><button id="rb-auth-logout" class="rb-auth-button rb-auth-secondary" type="button" hidden>เปลี่ยนบัญชี</button><div id="rb-auth-error" class="rb-auth-error" aria-live="polite"></div></div></section>';
  document.body.appendChild(el);
  el.querySelector('#rb-auth-pin-login').addEventListener('click',pinLogin);
  const inputs=pinInputs(el);
  inputs.forEach(input=>{
    input.addEventListener('input',handlePinInput);
    input.addEventListener('keydown',handlePinKeydown);
    input.addEventListener('paste',handlePinPaste);
  });
  el.querySelector('#rb-auth-name').addEventListener('change',()=>{
    lastPinError='';el.querySelector('#rb-auth-error').textContent='';
    if(readPin(el).length===4)pinLogin();else inputs[0].focus();
  });
  el.querySelector('#rb-auth-google-login').addEventListener('click',googleLogin);
  el.querySelector('#rb-auth-logout').addEventListener('click',logout);
  return el;
}
function pinInputs(el=gate()){return Array.from(el.querySelectorAll('.rb-auth-pin-digit'));}
function readPin(el=gate()){return pinInputs(el).map(input=>input.value).join('');}
function clearPin(el=gate(),focus=true){const inputs=pinInputs(el);inputs.forEach(input=>{input.value='';});if(focus&&inputs[0])inputs[0].focus();}
function maybeAutoLogin(el=gate()){
  if(readPin(el).length===4&&!pinLoginBusy)pinLogin();
}
function handlePinInput(event){
  const input=event.currentTarget;
  input.value=input.value.replace(/\D/g,'').slice(-1);
  lastPinError='';gate().querySelector('#rb-auth-error').textContent='';
  const inputs=pinInputs();const index=inputs.indexOf(input);
  if(input.value&&index<inputs.length-1)inputs[index+1].focus();
  maybeAutoLogin();
}
function handlePinKeydown(event){
  if(event.key==='Enter'){event.preventDefault();pinLogin();}
  const inputs=pinInputs();const index=inputs.indexOf(event.currentTarget);
  if(event.key==='Backspace'&&!event.currentTarget.value&&index>0){event.preventDefault();inputs[index-1].value='';inputs[index-1].focus();}
  if(event.key==='ArrowLeft'&&index>0){event.preventDefault();inputs[index-1].focus();}
  if(event.key==='ArrowRight'&&index<inputs.length-1){event.preventDefault();inputs[index+1].focus();}
}
function handlePinPaste(event){
  const digits=(event.clipboardData?.getData('text')||'').replace(/\D/g,'').slice(0,4);
  if(!digits)return;
  event.preventDefault();const inputs=pinInputs();
  inputs.forEach((input,index)=>{input.value=digits[index]||'';});
  lastPinError='';gate().querySelector('#rb-auth-error').textContent='';
  (inputs[Math.min(digits.length,inputs.length)-1]||inputs[0]).focus();
  maybeAutoLogin();
}
function setGate(title,message,{login=true,logout=false,error=''}={}){
  const el=gate();el.hidden=false;
  el.querySelector('#rb-auth-status').innerHTML='<strong>'+esc(title)+'</strong>'+esc(message);
  el.querySelector('#rb-auth-pin-form').hidden=!login;
  el.querySelector('#rb-auth-google-login').hidden=!login;
  el.querySelector('#rb-auth-logout').hidden=!logout;
  el.querySelector('#rb-auth-error').textContent=error;
}
function hideGate(){gate().hidden=true;}
function pathUrl(path){return DB+'/'+String(path||'').replace(/^\/+|\/+$/g,'')+'.json';}
async function tokenUrl(url,user=activeFirebaseUser()){
  if(!user)throw new Error('กรุณาเข้าสู่ระบบ');
  const token=await user.getIdToken();
  const parsed=new URL(url,location.href);parsed.searchParams.set('auth',token);return parsed.toString();
}
async function secureFetch(url,options={}){
  const parsed=new URL(url,location.href);
  if(parsed.origin===new URL(DB).origin){
    const signed=await tokenUrl(parsed.toString());
    return nativeFetch(signed,options);
  }
  return nativeFetch(url,options);
}
async function db(path,options={}){
  const response=await secureFetch(pathUrl(path),options);
  if(!response.ok){let detail='';try{detail=(await response.json()).error||'';}catch(_e){}throw new Error(detail||('HTTP '+response.status));}
  if(response.status===204)return null;
  const text=await response.text();return text?JSON.parse(text):null;
}
function json(method,data){return {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)};}
async function googleLogin(){
  const button=gate().querySelector('#rb-auth-google-login');button.disabled=true;
  try{await setPersistence(auth,browserLocalPersistence);await signInWithPopup(auth,provider);}catch(error){
    if(error&&error.code!=='auth/popup-closed-by-user')setGate('เข้าสู่ระบบไม่สำเร็จ','ลองอีกครั้ง หรือเลือกบัญชี Google อื่น',{login:true,error:error.message||String(error)});
  }finally{button.disabled=false;}
}
async function pinLogin(){
  if(pinLoginBusy)return;
  const el=gate();const name=el.querySelector('#rb-auth-name').value;const pin=readPin(el);
  const button=el.querySelector('#rb-auth-pin-login');const error=el.querySelector('#rb-auth-error');lastPinError='';error.textContent='';
  if(!name){error.textContent='กรุณาเลือกชื่อพนักงาน';el.querySelector('#rb-auth-name').focus();return;}
  if(!/^\d{4}$/.test(pin)){error.textContent='กรุณาใส่ PIN 4 หลัก';(pinInputs(el).find(input=>!input.value)||pinInputs(el)[0]).focus();return;}
  pinLoginBusy=true;button.disabled=true;button.textContent='กำลังเข้าสู่ระบบ...';
  pinInputs(el).forEach(input=>{input.disabled=true;});el.querySelector('#rb-auth-name').disabled=true;
  try{
    await setPersistence(auth,browserLocalPersistence);
    const credential=await signInWithEmailAndPassword(auth,PIN_ACCOUNTS[name],'rb'+pin);
    const user=credential.user;const refreshToken=user.refreshToken||user.stsTokenManager?.refreshToken||'';
    if(refreshToken){
      pinSession=makePinSession({localId:user.uid,email:user.email||PIN_ACCOUNTS[name],idToken:await user.getIdToken(),refreshToken,expiresIn:3600});
      savePinSession(pinSession);
    }
  }
  catch(loginError){
    try{
      const user=await pinRestLogin(PIN_ACCOUNTS[name],pin);const p=await ensureProfile(user);
      if(p){applyProfile(user,p);return;}
    }catch(restError){
      const code=(restError?.code||restError?.message||loginError?.code||'');
      lastPinError=/too-many|TOO_MANY/i.test(code)?'มีการลองหลายครั้งเกินไป กรุณารอประมาณ 1 นาทีแล้วลองใหม่':/network|fetch|TOKEN/i.test(code)?'เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่':'ชื่อหรือ PIN ไม่ถูกต้อง กรุณาลองใหม่';
      error.textContent=lastPinError;clearPin(el,false);
    }
  }
  finally{pinLoginBusy=false;button.disabled=false;button.textContent='เข้าสู่ระบบ';pinInputs(el).forEach(input=>{input.disabled=false;});el.querySelector('#rb-auth-name').disabled=false;if(error.textContent)pinInputs(el)[0].focus();}
}
async function ensureProfile(user){
  let current=null;try{current=await db('auth_users/'+user.uid);}catch(error){if(!/Permission denied/i.test(error.message))throw error;}
  if(current&&current.active===true)return current;
  const email=(user.email||'').toLowerCase();
  if(email===SUPERVISOR_EMAIL&&!current){
    const supervisor={uid:user.uid,email,name:'วิว',role:'sup',active:true,createdAt:Date.now(),updatedAt:Date.now()};
    await db('auth_users/'+user.uid,json('PUT',supervisor));return supervisor;
  }
  const request={uid:user.uid,email,displayName:user.displayName||'',photoURL:user.photoURL||'',status:'pending',requestedAt:Date.now(),updatedAt:Date.now()};
  await db('access_requests/'+user.uid,json('PUT',request));
  setGate('รอ Supervisor อนุมัติ','ส่งคำขอของ '+(user.email||'บัญชีนี้')+' แล้ว เมื่ออนุมัติให้เปิดหน้านี้ใหม่',{login:false,logout:true});
  return null;
}
function applyProfile(user,p){
  authUser=user;profile=p;
  window._rbLoginAt=Date.now();
  window._rbUser={uid:user.uid,email:user.email||p.email||'',name:p.name,role:p.role,active:true};
  try{localStorage.removeItem('rb_users');sessionStorage.removeItem('rb_session');}catch(_e){}
  document.body.classList.toggle('rb-not-sup',p.role!=='sup');
  document.body.classList.toggle('rb-ads-only',p.role==='ads');
  ['rb-cu-name','sb-foot-name'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=p.name;});
  ['rb-cu-role','sb-foot-role'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=ROLES.find(x=>x[0]===p.role)?.[1]||p.role;});
  const av=document.getElementById('sb-foot-av');if(av)av.textContent=p.name.slice(0,2).toUpperCase();
  const uname=document.getElementById('sb-uc-uname');if(uname)uname.textContent=p.name+' ('+(ROLES.find(x=>x[0]===p.role)?.[1]||p.role)+')';
  const legacy=document.getElementById('rb-login-modal');if(legacy)legacy.remove();
  hideGate();setupAdmin(p.role==='sup');
  resolveReady(window._rbUser);
  window.dispatchEvent(new CustomEvent('rb:auth-ready',{detail:window._rbUser}));
  setTimeout(()=>{
    try{window.fbStopNetwork&&window.fbStopNetwork();}catch(_e){}
    try{window.fbRefreshOrders&&window.fbRefreshOrders();}catch(_e){}
    try{window.fbSyncStart&&window.fbSyncStart();}catch(_e){}
    try{window._rbRenderMyWork&&window._rbRenderMyWork();}catch(_e){}
    try{window._rbRenderHomeStats&&window._rbRenderHomeStats();}catch(_e){}
  },80);
}
function setupAdmin(show){
  let button=document.getElementById('rb-auth-admin-button');
  if(!button){button=document.createElement('button');button.id='rb-auth-admin-button';button.type='button';button.textContent='🔐 จัดการสิทธิ์ผู้ใช้';button.addEventListener('click',openAdmin);document.body.appendChild(button);}
  button.classList.toggle('is-visible',show);
}
async function openAdmin(){
  let modal=document.getElementById('rb-auth-admin');
  if(!modal){modal=document.createElement('div');modal.id='rb-auth-admin';modal.innerHTML='<section class="rb-auth-admin-card"><header class="rb-auth-admin-head"><div><strong>จัดการสิทธิ์ผู้ใช้</strong><div style="font-size:11px;color:#71837c;margin-top:3px">อนุมัติบัญชี Google และกำหนดชื่อพนักงาน</div></div><button class="rb-auth-admin-close" type="button" aria-label="ปิด">×</button></header><div id="rb-auth-admin-body" class="rb-auth-admin-body"></div></section>';modal.querySelector('.rb-auth-admin-close').addEventListener('click',()=>modal.classList.remove('is-open'));modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('is-open');});document.body.appendChild(modal);}
  modal.classList.add('is-open');const body=modal.querySelector('#rb-auth-admin-body');body.innerHTML='<div class="rb-auth-empty">กำลังโหลดคำขอ...</div>';
  try{
    const [requests,users]=await Promise.all([db('access_requests'),db('auth_users')]);
    const approvedEmails=new Set(Object.values(users||{}).filter(Boolean).map(x=>(x.email||'').toLowerCase()));
    const rows=Object.values(requests||{}).filter(x=>x&&x.status==='pending'&&!approvedEmails.has((x.email||'').toLowerCase()));
    if(!rows.length){body.innerHTML='<div class="rb-auth-empty">ไม่มีคำขอที่รออนุมัติ</div>';return;}
    body.innerHTML=rows.map((r,i)=>'<div class="rb-auth-request" data-uid="'+esc(r.uid)+'"><div><strong>'+esc(r.displayName||'บัญชีใหม่')+'</strong><div class="rb-auth-request-email">'+esc(r.email)+'</div></div><select data-kind="name">'+EMPLOYEES.map(n=>'<option value="'+esc(n)+'"'+(n===(r.displayName||'')?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select><select data-kind="role">'+ROLES.map(x=>'<option value="'+x[0]+'">'+esc(x[1])+'</option>').join('')+'</select><button class="rb-auth-approve" type="button" data-index="'+i+'">อนุมัติ</button></div>').join('');
    body.querySelectorAll('.rb-auth-approve').forEach((btn,i)=>btn.addEventListener('click',()=>approve(rows[i],btn)));
  }catch(error){body.innerHTML='<div class="rb-auth-empty" style="color:#b42318">โหลดคำขอไม่สำเร็จ: '+esc(error.message)+'</div>';}
}
async function approve(request,button){
  const row=button.closest('.rb-auth-request');const name=row.querySelector('[data-kind="name"]').value;const role=row.querySelector('[data-kind="role"]').value;
  button.disabled=true;button.textContent='กำลังบันทึก...';
  try{
    const now=Date.now();
    const approver=activeFirebaseUser();
    await db('auth_users/'+request.uid,json('PUT',{uid:request.uid,email:request.email||'',name,role,active:true,createdAt:now,updatedAt:now,approvedBy:approver.uid}));
    await db('access_requests/'+request.uid,json('PATCH',{status:'approved',approvedAt:now,approvedBy:approver.uid,name,role}));
    row.remove();const body=document.getElementById('rb-auth-admin-body');if(body&&!body.querySelector('.rb-auth-request'))body.innerHTML='<div class="rb-auth-empty">อนุมัติครบแล้ว</div>';
  }catch(error){button.disabled=false;button.textContent='ลองอีกครั้ง';alert('อนุมัติไม่สำเร็จ: '+error.message);}
}

window.rbFirebaseAuth={ready,get user(){return authUser;},get profile(){return profile;},db,fetch:secureFetch,urlWithAuth:tokenUrl,openAdmin};
window.fetch=secureFetch;
window._rbLogout=logout;
window._rbShowLC=()=>{const dialog=document.getElementById('rb-lc-wrap');if(dialog)dialog.classList.add('lc-open');else signOut(auth);};
try{sessionStorage.removeItem('rb_session');}catch(_e){}
gate();
setPersistence(auth,browserLocalPersistence).catch(()=>{}).finally(()=>{
  onAuthStateChanged(auth,async user=>{
    setupAdmin(false);
    if(!user&&pinSession){
      setGate('กำลังตรวจสอบสิทธิ์','กำลังเรียกคืนการเข้าสู่ระบบ',{login:false,logout:true});
      try{const p=await ensureProfile(pinSession);if(p)applyProfile(pinSession,p);return;}catch(_error){clearPinSession();}
    }
    if(!user){authUser=null;profile=null;window._rbUser=null;setGate('เข้าสู่ระบบทีมงาน','',{login:true,error:lastPinError});return;}
    const email=(user.email||'').toLowerCase();
    const isPinAccount=Object.values(PIN_ACCOUNTS).includes(email);
    if(isPinAccount&&!pinSession){
      const refreshToken=user.refreshToken||user.stsTokenManager?.refreshToken||'';
      if(refreshToken){
        try{pinSession=makePinSession({localId:user.uid,email,idToken:await user.getIdToken(),refreshToken,expiresIn:3600});savePinSession(pinSession);}catch(_error){}
      }
    }else if(!isPinAccount){clearPinSession();}
    setGate('กำลังตรวจสอบสิทธิ์','ตรวจสอบบัญชี '+(user.email||''),{login:false,logout:true});
    try{const p=await ensureProfile(user);if(p)applyProfile(user,p);}catch(error){setGate('ตรวจสอบสิทธิ์ไม่สำเร็จ','ระบบยังไม่อนุญาตให้เปิดข้อมูล กรุณาลองใหม่',{login:false,logout:true,error:error.message||String(error)});}
  });
});
