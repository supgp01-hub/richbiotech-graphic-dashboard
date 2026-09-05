import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

window.__RB_SECURE_AUTH__=true;
window.addEventListener('storage',event=>{if(event.key==='rb_session')event.stopImmediatePropagation();},true);

const CONFIG={apiKey:'AIzaSyCfhpRlo_jVl9_vuBKkwDq0H7kAmC-_nho',authDomain:'richbiotech-c4e41.firebaseapp.com',projectId:'richbiotech-c4e41',storageBucket:'richbiotech-c4e41.firebasestorage.app',messagingSenderId:'238265709540',appId:'1:238265709540:web:dcbac40e5d49467afc8df1'};
const DB='https://richbiotech-c4e41-default-rtdb.firebaseio.com';
const SUPERVISOR_EMAIL='supgp01@richbiotech.com';
const PIN_SESSION_KEY='rb_firebase_pin_session_v3';
const LOGIN_DIRECTORY_CACHE_KEY='rb_login_directory_cache_v1';
const EMPLOYEES=['วิว','มอส','ดอม','เตอร์','นุ่น','แจ๋ม','บอล','นุ้ย','มายด์','MY Boss','Audit'];
const PIN_ACCOUNTS={
  'วิว':'pin.view@richbiotech.team','มอส':'pin.moss@richbiotech.team','ดอม':'pin.dom@richbiotech.team',
  'เตอร์':'pin.ter@richbiotech.team','นุ่น':'pin.nune@richbiotech.team','แจ๋ม':'pin.jam@richbiotech.team',
  'บอล':'pin.ball@richbiotech.team','นุ้ย':'pin.nui@richbiotech.team','มายด์':'pin.mind@richbiotech.team',
  'MY Boss':'pin.myboss@richbiotech.team','Audit':'pin.audit@richbiotech.team'
};
const ROLES=[['sup','Supervisor'],['spec','Specialist'],['graphic','Graphic & Ads'],['ads','Ads Optimizer'],['audit','Audit']];
const ENGLISH_NAMES={'วิว':'View','มอส':'Moss','ดอม':'Dom','เตอร์':'Ter','นุ่น':'Nune','แจ๋ม':'Jam','บอล':'Ball','นุ้ย':'Nui','มายด์':'Mind'};
let loginAccounts={...PIN_ACCOUNTS};
let loginNames=[...EMPLOYEES];
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
let loginDirectoryReady=Promise.resolve();
let loginDirectoryUsable=false;
let resolveReady;
const ready=new Promise(resolve=>{resolveReady=resolve;});

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function displayName(value){return ENGLISH_NAMES[value]||String(value||'User');}
function canonicalLoginName(value){
  const raw=String(value||'').trim(),key=raw.toLowerCase();
  return EMPLOYEES.find(name=>name.toLowerCase()===key||displayName(name).toLowerCase()===key)||raw;
}
function avatarLetter(value){const found=displayName(value).match(/[A-Za-z]/);return found?found[0].toUpperCase():'U';}
function roleLabel(value){return ROLES.find(x=>x[0]===value)?.[1]||value||'ไม่ระบุสิทธิ์';}
function loginOptions(){return loginNames.map(name=>'<option value="'+esc(name)+'">'+esc(displayName(name))+'</option>').join('');}
function refreshLoginSelect(){
  const select=document.getElementById('rb-auth-name');if(!select)return;
  const selected=select.value;select.innerHTML='<option value="">— เลือกชื่อ —</option>'+loginOptions();
  if(loginNames.includes(selected))select.value=selected;
}
function applyLoginDirectoryRows(rows){
  rows=Array.isArray(rows)?rows.filter(Boolean):[];
  const activeRows=rows.filter(row=>row.active!==false&&row.name&&row.loginEmail).map(row=>({...row,name:canonicalLoginName(row.name)}));
  const activeNames=new Set(activeRows.map(row=>displayName(row.name).toLowerCase()));
  const activeEmails=new Set(activeRows.map(row=>String(row.loginEmail).toLowerCase()));
  rows.filter(row=>row.active===false).forEach(row=>{
    const name=canonicalLoginName(row.name),email=String(row.loginEmail||'').toLowerCase(),nameKey=displayName(name).toLowerCase();
    if(activeNames.has(nameKey)||activeEmails.has(email))return;
    loginNames=loginNames.filter(item=>displayName(item).toLowerCase()!==nameKey&&String(loginAccounts[item]||'').toLowerCase()!==email);
    delete loginAccounts[name];
  });
  activeRows.forEach(row=>{
    const email=String(row.loginEmail).toLowerCase(),nameKey=displayName(row.name).toLowerCase();
    loginNames=loginNames.filter(name=>name===row.name||(displayName(name).toLowerCase()!==nameKey&&String(loginAccounts[name]||'').toLowerCase()!==email));
    loginAccounts[row.name]=email;if(!loginNames.includes(row.name))loginNames.push(row.name);
  });
}
async function loadLoginDirectory(){
  loginAccounts={...PIN_ACCOUNTS};loginNames=[...EMPLOYEES];
  try{const cached=JSON.parse(localStorage.getItem(LOGIN_DIRECTORY_CACHE_KEY)||'null');if(cached&&Array.isArray(cached.rows)){applyLoginDirectoryRows(cached.rows);loginDirectoryUsable=true;}}catch(_error){}
  loginNames.sort((a,b)=>displayName(a).localeCompare(displayName(b),'en'));refreshLoginSelect();
  try{
    const controller=typeof AbortController!=='undefined'?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),8000):null;
    const response=await nativeFetch(pathUrl('login_directory')+'?v='+Date.now(),{cache:'no-store',signal:controller?.signal});
    if(timer)clearTimeout(timer);
    if(response.ok){
      const rows=Object.values(await response.json()||{}).filter(Boolean);
      loginAccounts={...PIN_ACCOUNTS};loginNames=[...EMPLOYEES];applyLoginDirectoryRows(rows);
      loginDirectoryUsable=true;
      try{localStorage.setItem(LOGIN_DIRECTORY_CACHE_KEY,JSON.stringify({rows,updatedAt:Date.now()}));}catch(_error){}
    }
  }catch(_error){}
  loginNames.sort((a,b)=>displayName(a).localeCompare(displayName(b),'en'));
  refreshLoginSelect();
}
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
function savePinSession(session){
  const payload=JSON.stringify({uid:session.uid,email:session.email,refreshToken:session._refreshToken});
  try{localStorage.setItem(PIN_SESSION_KEY,payload);}catch(_e){}
  try{sessionStorage.setItem(PIN_SESSION_KEY,payload);}catch(_e){}
}
function restorePinSession(){
  let raw='';try{raw=localStorage.getItem(PIN_SESSION_KEY)||'';}catch(_e){}
  if(!raw){try{raw=sessionStorage.getItem(PIN_SESSION_KEY)||'';}catch(_e){}}
  try{const saved=JSON.parse(raw||'null');return saved?.uid&&saved?.refreshToken?makePinSession({localId:saved.uid,email:saved.email,refreshToken:saved.refreshToken}):null;}catch(_e){return null;}
}
function clearPinSession(){pinSession=null;try{localStorage.removeItem(PIN_SESSION_KEY);}catch(_e){}try{sessionStorage.removeItem(PIN_SESSION_KEY);}catch(_e){}}
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
  el.innerHTML='<section class="rb-auth-card"><header class="rb-auth-head"><div class="rb-auth-brand"><span class="rb-auth-logo">🌿</span><div><div class="rb-auth-title">RICHBIOTECH Graphic &amp; Ads</div><div class="rb-auth-subtitle">ระบบทีมงานและข้อมูลออนไลน์</div></div></div></header><div class="rb-auth-body"><div id="rb-auth-status" class="rb-auth-status"><strong>กำลังตรวจสอบบัญชี</strong>กรุณารอสักครู่ ระบบกำลังเชื่อมต่อข้อมูล</div><div id="rb-auth-pin-form" class="rb-auth-pin-form" hidden><label for="rb-auth-name">เลือกชื่อพนักงาน</label><select id="rb-auth-name"><option value="">— เลือกชื่อ —</option>'+loginOptions()+'</select><div id="rb-auth-pin-label" class="rb-auth-pin-label">PIN 4 หลัก</div><div id="rb-auth-pin-group" class="rb-auth-pin-group" role="group" aria-labelledby="rb-auth-pin-label" aria-describedby="rb-auth-pin-hint">'+[1,2,3,4].map(i=>'<input class="rb-auth-pin-digit" data-pin-index="'+(i-1)+'" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true" placeholder=" " aria-label="PIN หลักที่ '+i+'">').join('')+'</div><div id="rb-auth-pin-hint" class="rb-auth-pin-hint">กรอกครบ 4 หลัก ระบบจะเข้าสู่ระบบให้อัตโนมัติ</div><button id="rb-auth-pin-login" class="rb-auth-button" type="button">เข้าสู่ระบบ</button></div><button id="rb-auth-google-login" class="rb-auth-button rb-auth-secondary" type="button" hidden>เข้าแบบ Google สำหรับ Supervisor</button><button id="rb-auth-logout" class="rb-auth-button rb-auth-secondary" type="button" hidden>เปลี่ยนบัญชี</button><div id="rb-auth-error" class="rb-auth-error" aria-live="polite"></div></div></section>';
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
    let signed=await tokenUrl(parsed.toString());
    let response=await nativeFetch(signed,options);
    if((response.status===401||response.status===403)&&activeFirebaseUser()){
      const current=activeFirebaseUser();
      const token=await current.getIdToken(true);
      const retryUrl=new URL(parsed.toString());retryUrl.searchParams.set('auth',token);
      response=await nativeFetch(retryUrl.toString(),options);
    }
    return response;
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
    if(!loginDirectoryUsable)await loginDirectoryReady;
    const loginEmail=loginAccounts[name];if(!loginEmail)throw new Error('LOGIN_ACCOUNT_NOT_FOUND');
    const user=await pinRestLogin(loginEmail,pin);const p=await ensureProfile(user);
    if(p){applyProfile(user,p);return;}
  }catch(restError){
    try{
      await setPersistence(auth,browserLocalPersistence);
      const loginEmail=loginAccounts[name];if(!loginEmail)throw new Error('LOGIN_ACCOUNT_NOT_FOUND');
      const credential=await signInWithEmailAndPassword(auth,loginEmail,'rb'+pin);
      const user=credential.user;const refreshToken=user.refreshToken||user.stsTokenManager?.refreshToken||'';
      if(refreshToken){
        pinSession=makePinSession({localId:user.uid,email:user.email||loginEmail,idToken:await user.getIdToken(),refreshToken,expiresIn:3600});
        savePinSession(pinSession);
      }
      const p=await ensureProfile(user);if(p){applyProfile(user,p);return;}
    }catch(loginError){
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
  const isSupervisor=p.role==='sup';
  const settingsButton=document.getElementById('sb-settings-btn');if(settingsButton)settingsButton.style.display=isSupervisor?'':'none';
  const settingsSub=document.getElementById('sb-sub');if(settingsSub)settingsSub.style.display=isSupervisor?'':'none';
  const legacy=document.getElementById('rb-login-modal');if(legacy)legacy.remove();
  hideGate();setupAdmin(isSupervisor);
  resolveReady(window._rbUser);
  window.dispatchEvent(new CustomEvent('rb:auth-ready',{detail:window._rbUser}));
  setTimeout(()=>{
    const staleLogin=document.getElementById('rb-login-modal');if(staleLogin)staleLogin.remove();
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
let adminData={requests:[],groups:[],mode:'add',selectedUid:'',message:'',messageType:''};
function isPinEmail(value){return /^pin\..+@richbiotech\.team$/i.test(String(value||''));}
function groupedUsers(users){
  const groups=new Map();
  Object.entries(users||{}).forEach(([uid,row])=>{
    if(!row||row.active===false||!row.name)return;
    const account={...row,uid:row.uid||uid};const key=displayName(row.name).trim().toLowerCase();
    if(!groups.has(key))groups.set(key,{key,name:row.name,accounts:[]});groups.get(key).accounts.push(account);
  });
  return Array.from(groups.values()).map(group=>{
    const pinAccount=group.accounts.find(x=>isPinEmail(x.email))||null;
    const primary=pinAccount||group.accounts[0];
    return {...group,uid:primary.uid,name:primary.name,role:primary.role,department:primary.department||'',pinAccount,primary,loginKey:primary.loginKey||(pinAccount&&pinAccount.uid)||primary.uid};
  }).sort((a,b)=>displayName(a.name).localeCompare(displayName(b.name),'en'));
}
function adminModal(){
  let modal=document.getElementById('rb-auth-admin');
  if(!modal){
    modal=document.createElement('div');modal.id='rb-auth-admin';
    modal.innerHTML='<section class="rb-auth-admin-card"><header class="rb-auth-admin-head"><div><strong>USER</strong><div>รายชื่อผู้ใช้และสิทธิ์การเข้าใช้งานออนไลน์</div></div><div class="rb-auth-admin-head-actions"><button class="rb-auth-add-user" type="button">＋ เพิ่ม User ใหม่</button><button class="rb-auth-admin-close" type="button" aria-label="ปิด">×</button></div></header><div id="rb-auth-admin-body" class="rb-auth-admin-body"></div></section>';
    modal.querySelector('.rb-auth-admin-close').addEventListener('click',()=>modal.classList.remove('is-open'));
    modal.querySelector('.rb-auth-add-user').addEventListener('click',()=>setAdminMode('add'));
    modal.addEventListener('click',event=>{if(event.target===modal)modal.classList.remove('is-open');});document.body.appendChild(modal);
  }
  return modal;
}
function roleOptions(selected){return ROLES.map(x=>'<option value="'+x[0]+'"'+(x[0]===selected?' selected':'')+'>'+esc(x[1])+'</option>').join('');}
function adminMessage(text,type='error'){adminData.message=text;adminData.messageType=type;const el=document.getElementById('rb-auth-form-message');if(el){el.className='rb-auth-form-message '+(type==='success'?'is-success':'is-error');el.textContent=text;}}
function selectedGroup(){return adminData.groups.find(group=>group.uid===adminData.selectedUid)||null;}
function renderAdminPanel(){
  const group=selectedGroup();
  if(adminData.mode==='edit'&&group)return '<form id="rb-auth-edit-form" class="rb-auth-user-form"><div class="rb-auth-form-title"><div><strong>แก้ไขสิทธิ์</strong><span>'+esc(displayName(group.name))+'</span></div><button type="button" data-admin-action="cancel">×</button></div><label>สิทธิ์ใช้งาน <b>*</b><select name="role" required>'+roleOptions(group.role)+'</select></label><label>แผนก / หน้าที่ <b>*</b><input name="department" value="'+esc(group.department||roleLabel(group.role))+'" maxlength="60" required></label><p>ระบบจะอัปเดตสิทธิ์ให้บัญชีของ User นี้ทุกช่องทาง โดยไม่เปลี่ยนข้อมูลงานเดิม</p><button class="rb-auth-form-submit" type="submit">บันทึกสิทธิ์</button><div id="rb-auth-form-message" class="rb-auth-form-message"></div></form>';
  if(adminData.mode==='pin'&&group)return '<form id="rb-auth-pin-reset-form" class="rb-auth-user-form"><div class="rb-auth-form-title"><div><strong>เปลี่ยนรหัส PIN</strong><span>'+esc(displayName(group.name))+'</span></div><button type="button" data-admin-action="cancel">×</button></div><label>PIN ใหม่ 4 หลัก <b>*</b><input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password" required></label><label>ยืนยัน PIN ใหม่ <b>*</b><input name="confirmPin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password" required></label><p>เมื่อบันทึก PIN เดิมจะถูกปิดทันที และงานทั้งหมดของ User ยังคงอยู่</p><button class="rb-auth-form-submit" type="submit">บันทึก PIN ใหม่</button><div id="rb-auth-form-message" class="rb-auth-form-message"></div></form>';
  if(adminData.mode==='delete'&&group)return '<form id="rb-auth-delete-form" class="rb-auth-user-form is-danger"><div class="rb-auth-form-title"><div><strong>ลบ User</strong><span>'+esc(displayName(group.name))+'</span></div><button type="button" data-admin-action="cancel">×</button></div><div class="rb-auth-delete-note"><b>งานและประวัติจะไม่ถูกลบ</b><span>ระบบจะปิดเฉพาะสิทธิ์เข้าใช้งานของ User นี้</span></div><label>พิมพ์ชื่อ <b>'+esc(displayName(group.name))+'</b> เพื่อยืนยัน<input name="confirmation" autocomplete="off" required></label><button class="rb-auth-form-submit is-danger" type="submit">ยืนยันลบ User</button><div id="rb-auth-form-message" class="rb-auth-form-message"></div></form>';
  return '<form id="rb-auth-create-form" class="rb-auth-user-form"><div class="rb-auth-form-title"><div><strong>เพิ่ม User ใหม่</strong><span>กรอกข้อมูลที่มีเครื่องหมาย * ให้ครบ</span></div></div><label>ชื่อ User ภาษาอังกฤษ <b>*</b><input name="name" maxlength="32" placeholder="เช่น Jane" autocomplete="off" required></label><label>สิทธิ์ใช้งาน <b>*</b><select name="role" required><option value="">— เลือกสิทธิ์ —</option>'+roleOptions('')+'</select></label><label>แผนก / หน้าที่ <b>*</b><input name="department" maxlength="60" placeholder="เช่น Graphic & Ads" required></label><label>อีเมล Google <em>ไม่บังคับ</em><input name="contactEmail" type="email" maxlength="100" placeholder="name@company.com"></label><div class="rb-auth-pin-fields"><label>PIN 4 หลัก <b>*</b><input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password" required></label><label>ยืนยัน PIN <b>*</b><input name="confirmPin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password" required></label></div><p>PIN จะใช้สำหรับเข้าระบบเท่านั้น และจะไม่แสดงในรายชื่อ User</p><button class="rb-auth-form-submit" type="submit">สร้าง User และเปิดสิทธิ์</button><div id="rb-auth-form-message" class="rb-auth-form-message"></div></form>';
}
function renderAdmin(){
  const body=document.getElementById('rb-auth-admin-body');if(!body)return;
  const current='<div class="rb-auth-current"><span>'+esc(avatarLetter(profile?.name))+'</span><div><strong>'+esc(displayName(profile?.name||'ผู้ดูแล'))+'</strong><small>'+esc(roleLabel(profile?.role))+'</small></div><i>กำลังใช้งาน</i></div>';
  const directory=adminData.groups.length?adminData.groups.map(group=>{
    const self=group.accounts.some(x=>x.uid===activeFirebaseUser()?.uid);const noPin=!group.pinAccount;
    return '<article class="rb-auth-user-row"><span>'+esc(avatarLetter(group.name))+'</span><div class="rb-auth-user-info"><strong>'+esc(displayName(group.name))+'</strong><small>'+esc(group.department||roleLabel(group.role))+' · '+esc(roleLabel(group.role))+'</small></div><div class="rb-auth-user-actions"><button type="button" data-admin-action="edit" data-uid="'+esc(group.uid)+'">แก้ไขสิทธิ์</button><button type="button" data-admin-action="pin" data-uid="'+esc(group.uid)+'"'+(noPin?' disabled title="บัญชีนี้เข้าใช้งานด้วย Google"':'')+'>เปลี่ยน PIN</button><button class="is-danger" type="button" data-admin-action="delete" data-uid="'+esc(group.uid)+'"'+(self?' disabled title="ไม่สามารถลบบัญชีที่กำลังใช้งาน"':'')+'>ลบ</button></div></article>';
  }).join(''):'<div class="rb-auth-empty">ยังไม่พบรายชื่อผู้ใช้</div>';
  const pending=adminData.requests.length?'<section class="rb-auth-pending"><h4>คำขอเข้าใช้งาน Google <b>'+adminData.requests.length+'</b></h4>'+adminData.requests.map((request,index)=>'<div class="rb-auth-request" data-uid="'+esc(request.uid)+'"><div><strong>'+esc(request.displayName||'บัญชีใหม่')+'</strong><div class="rb-auth-request-email">'+esc(request.email)+'</div></div><select data-kind="name">'+loginNames.map(name=>'<option value="'+esc(name)+'"'+(displayName(name)===displayName(request.displayName||'')?' selected':'')+'>'+esc(displayName(name))+'</option>').join('')+'</select><select data-kind="role">'+roleOptions('')+'</select><button class="rb-auth-approve" type="button" data-index="'+index+'">อนุมัติ</button></div>').join('')+'</section>':'<div class="rb-auth-no-pending">ไม่มีคำขอใหม่ที่รออนุมัติ</div>';
  body.innerHTML=current+'<div class="rb-auth-admin-grid"><section class="rb-auth-directory-panel"><div class="rb-auth-directory-head"><span>รายชื่อผู้ใช้งาน</span><b>'+adminData.groups.length+' คน</b></div><div class="rb-auth-directory">'+directory+'</div>'+pending+'</section><aside class="rb-auth-form-panel">'+renderAdminPanel()+'</aside></div>';
  bindAdmin();if(adminData.message)adminMessage(adminData.message,adminData.messageType);
}
function setAdminMode(mode,uid=''){adminData.mode=mode;adminData.selectedUid=uid;adminData.message='';renderAdmin();}
function setBusy(form,busy,label){Array.from(form.elements).forEach(el=>{el.disabled=busy;});const button=form.querySelector('.rb-auth-form-submit');if(button){button.dataset.label=button.dataset.label||button.textContent;button.textContent=busy?label:button.dataset.label;}}
function bindAdmin(){
  const body=document.getElementById('rb-auth-admin-body');if(!body)return;
  body.querySelectorAll('[data-admin-action]').forEach(button=>button.addEventListener('click',()=>{if(button.disabled)return;const action=button.dataset.adminAction;if(action==='cancel')setAdminMode('add');else setAdminMode(action,button.dataset.uid);}));
  body.querySelectorAll('.rb-auth-approve').forEach((button,index)=>button.addEventListener('click',()=>approve(adminData.requests[index],button)));
  body.querySelector('#rb-auth-create-form')?.addEventListener('submit',createUser);
  body.querySelector('#rb-auth-edit-form')?.addEventListener('submit',saveUserAccess);
  body.querySelector('#rb-auth-pin-reset-form')?.addEventListener('submit',resetUserPin);
  body.querySelector('#rb-auth-delete-form')?.addEventListener('submit',deleteUser);
}
async function publicDirectory(){try{const response=await nativeFetch(pathUrl('login_directory')+'?v='+Date.now(),{cache:'no-store'});return response.ok?(await response.json()||{}):{};}catch(_error){return {};}}
async function seedLoginDirectory(groups){
  const existing=await publicDirectory();const patch={};
  groups.forEach(group=>{const account=group.pinAccount;if(!account)return;const key=group.loginKey||account.uid;const desired={name:group.name,loginEmail:String(account.email).toLowerCase(),active:true,updatedAt:Date.now()};const old=existing[key];if(!old||old.name!==desired.name||old.loginEmail!==desired.loginEmail||old.active!==true)patch['login_directory/'+key]=desired;});
  if(Object.keys(patch).length)await db('',json('PATCH',patch));
}
async function openAdmin(){
  const modal=adminModal();
  modal.classList.add('is-open');const body=modal.querySelector('#rb-auth-admin-body');body.innerHTML='<div class="rb-auth-empty">กำลังโหลดคำขอ...</div>';
  try{
    const [requests,users]=await Promise.all([db('access_requests'),db('auth_users')]);
    const approvedEmails=new Set(Object.values(users||{}).filter(Boolean).map(x=>(x.email||'').toLowerCase()));
    const rows=Object.values(requests||{}).filter(x=>x&&x.status==='pending'&&!approvedEmails.has((x.email||'').toLowerCase()));
    const groups=groupedUsers(users);await seedLoginDirectory(groups);await loadLoginDirectory();
    adminData={requests:rows,groups,mode:adminData.mode||'add',selectedUid:adminData.selectedUid||'',message:'',messageType:''};
    if(adminData.selectedUid&&!groups.some(group=>group.uid===adminData.selectedUid)){adminData.mode='add';adminData.selectedUid='';}
    renderAdmin();
  }catch(error){body.innerHTML='<div class="rb-auth-empty" style="color:#b42318">โหลดคำขอไม่สำเร็จ: '+esc(error.message)+'</div>';}
}
function accountLoginEmail(name){const slug=String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')||'user';return 'pin.'+slug+'.'+Date.now().toString(36)+'@richbiotech.team';}
async function signUpPinAccount(email,pin){
  const response=await nativeFetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+encodeURIComponent(CONFIG.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'rb'+pin,returnSecureToken:true})});
  const data=await response.json();if(!response.ok||!data.localId)throw new Error(data?.error?.message||'CREATE_AUTH_ACCOUNT_FAILED');return data;
}
async function verifyPinReplacement(uid,email,pin){
  const loginResponse=await nativeFetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(CONFIG.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'rb'+pin,returnSecureToken:true})});
  const loginData=await loginResponse.json();
  if(!loginResponse.ok||loginData.localId!==uid||!loginData.idToken)throw new Error('PIN_VERIFY_FAILED');
  const profileUrl=new URL(pathUrl('auth_users/'+uid));profileUrl.searchParams.set('auth',loginData.idToken);profileUrl.searchParams.set('v',Date.now());
  const profileResponse=await nativeFetch(profileUrl.toString(),{cache:'no-store'});const checked=profileResponse.ok?await profileResponse.json():null;
  if(!checked||checked.active!==true||String(checked.email||'').toLowerCase()!==String(email).toLowerCase())throw new Error('PROFILE_VERIFY_FAILED');
  return true;
}
async function discardPinAccount(created){
  if(!created?.idToken)return;
  try{await nativeFetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key='+encodeURIComponent(CONFIG.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:created.idToken})});}catch(_error){}
}
async function createUser(event){
  event.preventDefault();const form=event.currentTarget;const values=Object.fromEntries(new FormData(form));const name=String(values.name||'').trim();const role=String(values.role||'');const department=String(values.department||'').trim();const contactEmail=String(values.contactEmail||'').trim().toLowerCase();const pin=String(values.pin||'');const confirmPin=String(values.confirmPin||'');
  if(!/^[A-Za-z][A-Za-z0-9 ._-]{1,31}$/.test(name)){adminMessage('ชื่อ User ต้องเป็นภาษาอังกฤษ 2–32 ตัวอักษร');return;}
  if(!ROLES.some(x=>x[0]===role)||!department){adminMessage('กรุณาเลือกสิทธิ์และกรอกแผนก / หน้าที่');return;}
  if(!/^\d{4}$/.test(pin)){adminMessage('PIN ต้องเป็นตัวเลข 4 หลัก');return;}if(pin!==confirmPin){adminMessage('PIN ทั้งสองช่องไม่ตรงกัน');return;}
  if(adminData.groups.some(group=>displayName(group.name).toLowerCase()===name.toLowerCase())){adminMessage('มีชื่อ User นี้อยู่แล้ว กรุณาใช้ชื่ออื่น');return;}
  setBusy(form,true,'กำลังสร้าง User...');
  try{
    const now=Date.now();const loginEmail=accountLoginEmail(name);const created=await signUpPinAccount(loginEmail,pin);const loginKey=created.localId;const approver=activeFirebaseUser();
    const userProfile={uid:created.localId,email:loginEmail,name,role,department,contactEmail,loginKey,active:true,createdAt:now,updatedAt:now,approvedBy:approver.uid};
    const patch={};patch['auth_users/'+created.localId]=userProfile;patch['login_directory/'+loginKey]={name,loginEmail,active:true,updatedAt:now};
    await db('',json('PATCH',patch));await loadLoginDirectory();adminData.mode='add';await openAdmin();adminMessage('สร้าง User '+name+' และเปิดสิทธิ์ออนไลน์แล้ว','success');
  }catch(error){setBusy(form,false,'');adminMessage('สร้าง User ไม่สำเร็จ: '+(error.message||error));}
}
async function saveUserAccess(event){
  event.preventDefault();const form=event.currentTarget;const group=selectedGroup();if(!group)return;const values=Object.fromEntries(new FormData(form));const role=String(values.role||'');const department=String(values.department||'').trim();
  if(!ROLES.some(x=>x[0]===role)||!department){adminMessage('กรุณาเลือกสิทธิ์และกรอกแผนก / หน้าที่');return;}
  const currentUid=activeFirebaseUser()?.uid;if(group.accounts.some(x=>x.uid===currentUid)&&role!=='sup'){adminMessage('ไม่สามารถลดสิทธิ์ Supervisor ของบัญชีที่กำลังใช้งาน');return;}
  if(group.role==='sup'&&role!=='sup'&&adminData.groups.filter(x=>x.role==='sup').length<=1){adminMessage('ต้องมี Supervisor อย่างน้อย 1 คน');return;}
  setBusy(form,true,'กำลังบันทึก...');
  try{const now=Date.now(),patch={};group.accounts.forEach(account=>{patch['auth_users/'+account.uid+'/role']=role;patch['auth_users/'+account.uid+'/department']=department;patch['auth_users/'+account.uid+'/updatedAt']=now;patch['auth_users/'+account.uid+'/updatedBy']=currentUid||'';});await db('',json('PATCH',patch));await openAdmin();adminMessage('บันทึกสิทธิ์ของ '+displayName(group.name)+' แล้ว','success');}catch(error){setBusy(form,false,'');adminMessage('บันทึกสิทธิ์ไม่สำเร็จ: '+(error.message||error));}
}
async function resetUserPin(event){
   event.preventDefault();const form=event.currentTarget;const group=selectedGroup();if(!group||!group.pinAccount)return;const values=Object.fromEntries(new FormData(form));const pin=String(values.pin||''),confirmPin=String(values.confirmPin||'');
  if(!/^\d{4}$/.test(pin)){adminMessage('PIN ต้องเป็นตัวเลข 4 หลัก');return;}if(pin!==confirmPin){adminMessage('PIN ทั้งสองช่องไม่ตรงกัน');return;}
  setBusy(form,true,'กำลังเปลี่ยน PIN...');
  let created=null,replacementStaged=false,switchConfirmed=false;
  try{
    const now=Date.now(),old=group.pinAccount,loginEmail=accountLoginEmail(displayName(group.name)),loginKey=group.loginKey||old.uid;
    created=await signUpPinAccount(loginEmail,pin);
    const replacement={...old,uid:created.localId,email:loginEmail,loginKey,active:true,createdAt:old.createdAt||now,updatedAt:now,pinChangedAt:now,replaces:old.uid};delete replacement.replacedBy;delete replacement.disabledAt;
    await db('auth_users/'+created.localId,json('PUT',replacement));replacementStaged=true;
    await verifyPinReplacement(created.localId,loginEmail,pin);
    const patch={};patch['auth_users/'+old.uid+'/active']=false;patch['auth_users/'+old.uid+'/replacedBy']=created.localId;patch['auth_users/'+old.uid+'/updatedAt']=now;patch['login_directory/'+loginKey]={name:group.name,loginEmail,active:true,updatedAt:now};
    try{await db('',json('PATCH',patch));switchConfirmed=true;}catch(writeError){const directory=await publicDirectory();switchConfirmed=String(directory?.[loginKey]?.loginEmail||'').toLowerCase()===loginEmail;if(!switchConfirmed)throw writeError;}
    await loadLoginDirectory();adminData.mode='add';adminData.selectedUid='';await openAdmin();adminMessage('เปลี่ยน PIN ของ '+displayName(group.name)+' และตรวจสอบการเข้าใช้งานแล้ว','success');
  }catch(error){
    if(created&&replacementStaged&&!switchConfirmed){try{await db('auth_users/'+created.localId,json('PATCH',{active:false,disabledAt:Date.now(),updatedAt:Date.now()}));}catch(_cleanupError){}await discardPinAccount(created);}
    setBusy(form,false,'');adminMessage('ยังไม่เปลี่ยน PIN เพราะระบบตรวจสอบบัญชีใหม่ไม่ผ่าน PIN เดิมยังใช้งานได้ กรุณาลองอีกครั้ง');
  }
}
async function deleteUser(event){
  event.preventDefault();const form=event.currentTarget;const group=selectedGroup();if(!group)return;const confirmation=String(new FormData(form).get('confirmation')||'').trim();
  if(confirmation!==displayName(group.name)){adminMessage('กรุณาพิมพ์ชื่อ '+displayName(group.name)+' ให้ตรงกัน');return;}
  const currentUid=activeFirebaseUser()?.uid;if(group.accounts.some(x=>x.uid===currentUid)){adminMessage('ไม่สามารถลบบัญชีที่กำลังใช้งาน');return;}
    if(group.role==='sup'&&adminData.groups.filter(x=>x.role==='sup').length<=1){adminMessage('ต้องมี Supervisor อย่างน้อย 1 คน');return;}
  setBusy(form,true,'กำลังปิดสิทธิ์...');
  try{
    const now=Date.now(),patch={};group.accounts.forEach(account=>{patch['auth_users/'+account.uid+'/active']=false;patch['auth_users/'+account.uid+'/disabledAt']=now;patch['auth_users/'+account.uid+'/updatedAt']=now;});
    if(group.pinAccount)patch['login_directory/'+group.loginKey]={name:group.name,loginEmail:String(group.pinAccount.email).toLowerCase(),active:false,updatedAt:now};
    await db('',json('PATCH',patch));await loadLoginDirectory();adminData.mode='add';adminData.selectedUid='';await openAdmin();adminMessage('ปิดสิทธิ์ '+displayName(group.name)+' แล้ว ข้อมูลงานเดิมยังอยู่','success');
  }catch(error){setBusy(form,false,'');adminMessage('ลบ User ไม่สำเร็จ: '+(error.message||error));}
}
async function approve(request,button){
  const row=button.closest('.rb-auth-request');const name=row.querySelector('[data-kind="name"]').value;const role=row.querySelector('[data-kind="role"]').value;
  button.disabled=true;button.textContent='กำลังบันทึก...';
  try{
    const now=Date.now();
    const approver=activeFirebaseUser();
    await db('auth_users/'+request.uid,json('PUT',{uid:request.uid,email:request.email||'',name,role,active:true,createdAt:now,updatedAt:now,approvedBy:approver.uid}));
    await db('access_requests/'+request.uid,json('PATCH',{status:'approved',approvedAt:now,approvedBy:approver.uid,name,role}));
    await openAdmin();adminMessage('อนุมัติสิทธิ์ Google แล้ว','success');
  }catch(error){button.disabled=false;button.textContent='ลองอีกครั้ง';alert('อนุมัติไม่สำเร็จ: '+error.message);}
}

const legacyShowSettings=window._rbShowSP;
window._rbShowSP=tab=>{
  if(tab==='user'){openAdmin();return;}
  if(typeof legacyShowSettings==='function')legacyShowSettings(tab);
};

window.rbFirebaseAuth={ready,get user(){return authUser;},get profile(){return profile;},db,fetch:secureFetch,urlWithAuth:tokenUrl,openAdmin};
window.fetch=secureFetch;
window._rbLogout=logout;
window._rbShowLC=()=>{const dialog=document.getElementById('rb-lc-wrap');if(dialog)dialog.classList.add('lc-open');else signOut(auth);};
try{sessionStorage.removeItem('rb_session');}catch(_e){}
gate();loginDirectoryReady=loadLoginDirectory();
setPersistence(auth,browserLocalPersistence).catch(()=>{}).finally(()=>{
  onAuthStateChanged(auth,async user=>{
    setupAdmin(false);
    if(!user&&pinSession){
      setGate('กำลังตรวจสอบสิทธิ์','กำลังเรียกคืนการเข้าสู่ระบบ',{login:false,logout:true});
      try{const p=await ensureProfile(pinSession);if(p)applyProfile(pinSession,p);return;}catch(_error){clearPinSession();}
    }
    if(!user){authUser=null;profile=null;window._rbUser=null;setGate('เข้าสู่ระบบทีมงาน','',{login:true,error:lastPinError});return;}
    const email=(user.email||'').toLowerCase();
    const isPinAccount=isPinEmail(email);
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
