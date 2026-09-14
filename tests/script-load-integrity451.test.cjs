const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');let inline=0,external=0;
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const attrs=match[1],src=attrs.match(/\bsrc=["']([^"']+)["']/i);
 if(src){if(/^(https?:)?\/\//.test(src[1]))continue;const file=src[1].split(/[?#]/)[0];assert(fs.existsSync(file),'missing script: '+file);external++;}
 else if(!/type=["'](?:module|application\/ld\+json|application\/json)["']/i.test(attrs)){new vm.Script(match[2],{filename:'index-inline-'+(++inline)});}
}
let snippets=0;for(const file of fs.readdirSync('snippets').filter(f=>f.endsWith('.js'))){const code=fs.readFileSync(path.join('snippets',file),'utf8');if(/^import\s/m.test(code))continue;new vm.Script(code,{filename:file});snippets++;}
console.log(`PASS: ${inline} inline scripts and ${snippets} snippets compile; ${external} local script references exist`);
