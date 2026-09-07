const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('snippets/firebase-secure-auth-v1.js','utf8');
const classifier=source.slice(source.indexOf('function isExpiredSession('),source.indexOf('function retryAuthState('));
const handler=source.slice(source.indexOf('async function handleAuthState('));
let cleared=0,retried=0;
const ctx={authRetryTimer:null,clearTimeout(){},setupAdmin(){},setGate(){},pinSession:{uid:'staff'},
  async ensureProfile(){throw new TypeError('Failed to fetch');},
  clearPinSession(){cleared++;ctx.pinSession=null;},retryAuthState(){retried++;},
  authUser:null,profile:null,window:{},lastPinError:''};
vm.createContext(ctx);vm.runInContext(classifier+handler,ctx);
(async()=>{
  await ctx.handleAuthState(null);
  assert.equal(cleared,0,'network failure must not erase the persisted employee session');
  assert.equal(retried,1);
  ctx.ensureProfile=async()=>{throw Error('TOKEN_EXPIRED');};
  await ctx.handleAuthState(null);
  assert.equal(cleared,1,'revoked tokens must still require login');
  console.log('auth transient recovery passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
