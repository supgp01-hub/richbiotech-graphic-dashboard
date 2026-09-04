async function installSecureAuthMock(context,{role='sup',name='View',orders=[]}={}){
  const uid='qa-secure-user';
  await context.addInitScript(({uid})=>{
    localStorage.setItem('rb_firebase_pin_session_v3',JSON.stringify({uid,email:'qa@richbiotech.team',refreshToken:'qa-refresh-token'}));
  },{uid});
  await context.addInitScript(profile=>{sessionStorage.setItem('rb_e2e_profile',JSON.stringify(profile));},{role,name});
  await context.addInitScript(()=>{try{Object.defineProperty(window,'EventSource',{value:undefined,configurable:true});}catch(_error){window.EventSource=undefined;}});
  const moduleHeaders={'access-control-allow-origin':'*','cache-control':'no-store'};
  await context.route(/gstatic\.com\/firebasejs\/10\.14\.1\/firebase-app\.js/,route=>route.fulfill({status:200,contentType:'text/javascript',headers:moduleHeaders,body:'export function initializeApp(config){return {config};}'}));
  await context.route(/gstatic\.com\/firebasejs\/10\.14\.1\/firebase-auth\.js/,route=>route.fulfill({status:200,contentType:'text/javascript',headers:moduleHeaders,body:'const user={uid:"qa-secure-user",email:"qa@richbiotech.team",refreshToken:"qa-refresh-token",getIdToken:async()=>"qa-id-token"}; export function getAuth(){return {currentUser:user};} export class GoogleAuthProvider{setCustomParameters(){}} export async function signInWithPopup(){return {user};} export async function signInWithEmailAndPassword(){return {user};} export async function signOut(){} export function onAuthStateChanged(_auth,callback){setTimeout(()=>callback(user),0);} export async function setPersistence(){} export const browserLocalPersistence={};'}));
  await context.route(/securetoken\.googleapis\.com/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user_id:uid,id_token:'qa-id-token',refresh_token:'qa-refresh-token',expires_in:'3600'})}));
  await context.route(/firebaseio\.com/,route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/^\/+|\.json$/g,'');
    if(path==='login_directory')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({qa:{name,loginEmail:'qa@richbiotech.team',active:true}})});
    if(path==='auth_users/'+uid)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({uid,email:'qa@richbiotech.team',name,role,active:true})});
    if(path==='orders'&&request.method()==='GET'){
      const data={};orders.forEach((order,index)=>{data[order._fbKey||('qa_order_'+index)]={...order};delete data[order._fbKey||('qa_order_'+index)]._fbKey;});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
    }
    return route.fulfill({status:200,contentType:'application/json',body:request.method()==='GET'?'null':'true'});
  });
}
module.exports={installSecureAuthMock};
