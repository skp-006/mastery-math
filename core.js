// ===== CORE helpers + answer checking (pure; shared by browser and node tests) =====
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const rnz=(a,b)=>{let x;do{x=ri(a,b)}while(x===0);return x};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
const lcm=(a,b)=>Math.abs(a*b)/gcd(a,b);
const SUPD="⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup=n=>String(n).replace(/-/g,"⁻").replace(/\d/g,d=>SUPD[d]);
// M(): convert an ASCII math string into display text (minus signs, superscripts, times)
const M=s=>String(s).replace(/sqrt\((\d+)\)/g,"√$1").replace(/sqrt\(/g,"√(").replace(/cbrt\(/g,"∛(").replace(/(?<![a-z])pi(?![a-z])/g,"π").replace(/\^(-?\d+)/g,(_,n)=>sup(n)).replace(/ \* /g," × ").replace(/<=/g,"≤").replace(/>=/g,"≥").replace(/(?<![A-Za-z])-|-(?![A-Za-z])/g,"−");
// reduced fraction as ASCII string ("-3/4", "5" when denominator is 1)
function frs(n,d){if(d<0){n=-n;d=-d}const g=gcd(n,d);n/=g;d/=g;return d===1?String(n):n+"/"+d}
const cf=(c,v)=>c===1?v:c===-1?"-"+v:c+v;   // coefficient+variable, e.g. cf(1,'x')='x'
const pcf=(c,v)=>c<0?"("+cf(c,v)+")":cf(c,v);
const P=n=>n<0?"("+n+")":String(n);               // parenthesise negatives (ASCII)
const PF=(n,d)=>n<0?"("+n+"/"+d+")":n+"/"+d;      // fraction, parenthesised if negative
// polynomial / linear-expression string builder (ASCII). terms: [[coef,"x^2"],[3,"x"],[-5,""]]
function polyStr(terms){let s="";for(const [c,v] of terms){if(!c)continue;const a=Math.abs(c);
  const body=v?(a===1?v:a+v):String(a);s+=s?(c<0?" - ":" + ")+body:(c<0?"-":"")+body}return s||"0"}
const lin=(m,b,v="x")=>polyStr([[m,v],[b,""]]);
// decimal helpers (integer arithmetic to avoid float noise)
const decStr=(i,p)=>{const s=(i/Math.pow(10,p)).toFixed(p);return s};
const decTrim=(i,p)=>String(parseFloat((i/Math.pow(10,p)).toFixed(p)));

// ---- number parsing ----
function parseNum(s){s=String(s).trim().replace(/[−–]/g,"-").replace(/,/g,"");
  let m=s.match(/^([-+]?)(\d+)\s+(\d+)\/(\d+)$/);if(m){const v=+m[2]+(+m[3])/(+m[4]);return m[1]==="-"?-v:v}
  s=s.replace(/\s+/g,"");
  m=s.match(/^([-+]?\d*\.?\d+)\/([-+]?\d*\.?\d+)$/);if(m){const d=parseFloat(m[2]);return d===0?NaN:parseFloat(m[1])/d}
  if(/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s))return parseFloat(s);
  return NaN}
const SUPMAP={"⁰":0,"¹":1,"²":2,"³":3,"⁴":4,"⁵":5,"⁶":6,"⁷":7,"⁸":8,"⁹":9};
function normAlg(s){return String(s).toLowerCase().replace(/[−–]/g,"-").replace(/[×·*]/g,"").replace(/\s+/g,"")
  .replace(/(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,(_,neg,d)=>"^"+(neg?"-":"")+[...d].map(c=>SUPMAP[c]).join(""))}
// parse a polynomial (no parentheses) in any letters -> {key:coef} or null
function parsePoly(str){let s=normAlg(str);if(!s||/[()=<>]/.test(s))return null;
  s=s.replace(/\^-/g,"^~");const toks=s.split(/(?=[+-])/).filter(t=>t!=="");const out={};
  for(let t of toks){let sign=1;if(t[0]==="+")t=t.slice(1);else if(t[0]==="-"){sign=-1;t=t.slice(1)}
    if(t===""||/[+-]/.test(t))return null;
    const m=t.match(/^(\d*\.?\d*(?:\/\d+)?)((?:[a-z](?:\^~?\d+)?)*)$/);if(!m)return null;
    let coef;if(m[1]===""){if(m[2]==="")return null;coef=1}else{coef=parseNum(m[1]);if(isNaN(coef))return null}
    coef*=sign;const vars={};
    for(const mm of m[2].matchAll(/([a-z])(?:\^(~?)(\d+))?/g)){const e=mm[3]===undefined?1:(mm[2]?-1:1)*(+mm[3]);vars[mm[1]]=(vars[mm[1]]||0)+e}
    const key=Object.keys(vars).filter(k=>vars[k]!==0).sort().map(k=>k+"^"+vars[k]).join("*");
    out[key]=(out[key]||0)+coef}
  for(const k of Object.keys(out))if(Math.abs(out[k])<1e-9)delete out[k];return out}
function polyEq(a,b){if(!a||!b)return false;const ka=Object.keys(a),kb=Object.keys(b);
  return ka.length===kb.length&&ka.every(k=>k in b&&Math.abs(a[k]-b[k])<1e-9)}
function parseIneq(str){let s=String(str).replace(/[−–]/g,"-").replace(/≤/g,"<=").replace(/≥/g,">=").replace(/=>/g,">=").replace(/=</g,"<=").replace(/\s+/g,"");
  let m=s.match(/^([a-z])(<=|>=|<|>)(.+)$/);if(m){const v=parseNum(m[3]);return isNaN(v)?null:{v:m[1],op:m[2],n:v}}
  m=s.match(/^(.+?)(<=|>=|<|>)([a-z])$/);if(m){const v=parseNum(m[1]);if(isNaN(v))return null;const f={"<":">",">":"<","<=":">=",">=":"<="};return {v:m[3],op:f[m[2]],n:v}}
  return null}
function parsePair(str){let s=String(str).replace(/[−–]/g,"-").replace(/\s+/g,"").replace(/[xy]=/gi,"").replace(/^\(|\)$/g,"");
  const p=s.split(",");if(p.length!==2)return null;const a=parseNum(p[0]),b=parseNum(p[1]);return isNaN(a)||isNaN(b)?null:[a,b]}
const near=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b));

// check(q,input) -> {ok:boolean, note?:string}.  q.type: num | poly | ineq | pair | mc
function check(q,input){
  if(q.type==="mc")return {ok:Number(input)===q.answer};
  let raw=String(input==null?"":input).trim();if(!raw)return {ok:false,note:"Type an answer first."};
  if(q.type==="num"){raw=raw.replace(/^[a-zA-Z]\s*=\s*/,"").replace(/^\$/,"").replace(/%\s*$/,"").replace(/\s*[a-zA-Z°/. ]*[a-zA-Z]$/,"");
    const v=parseNum(raw);if(isNaN(v))return {ok:false,note:"Enter a number (fractions like 3/4 are fine)."};
    const t=parseNum(q.answer);if(!near(v,t))return {ok:false};
    const fm=raw.replace(/[−–]/g,"-").replace(/\s+/g,"").match(/^[-+]?(\d+)\/(\d+)$/);
    if(fm&&gcd(+fm[1],+fm[2])>1)return {ok:false,note:"That's the right value, but reduce the fraction to lowest terms."};
    return {ok:true}}
  if(q.type==="poly"){let rhs=raw;if(raw.includes("=")){const p=raw.split("=");if(p.length!==2)return {ok:false,note:"Use one equals sign."};
      if(normAlg(p[0])!==(q.lhs||""))return {ok:false,note:q.lhs?`Write it as ${q.lhs} = …`:"Type just the expression, no equals sign."};rhs=p[1]}
    const pa=parsePoly(rhs);if(!pa)return {ok:false,note:"I couldn't read that. Write a simplified expression without parentheses, e.g. 3x^2 - 5x + 2."};
    return {ok:polyEq(pa,parsePoly(q.answer))}}
  if(q.type==="ineq"){const a=parseIneq(raw),t=parseIneq(q.answer);if(!a)return {ok:false,note:"Write it like x > 3 or x <= -2."};
    return {ok:a.v===t.v&&a.op===t.op&&near(a.n,t.n)}}
  if(q.type==="pair"){const a=parsePair(raw),t=parsePair(q.answer);if(!a)return {ok:false,note:"Write the solution as an ordered pair, like (3, -2)."};
    return {ok:near(a[0],t[0])&&near(a[1],t[1])}}
  return checkNew(q,raw)}

// ---- expression parser (AST) used by expr / factor / set / eq / cplx / interval answer types ----
const FN_NAMES=["arcsin","arccos","arctan","asin","acos","atan","sqrt","cbrt","abs","sin","cos","tan","sec","csc","cot","ln","log","exp"];
function normX(s){return String(s).toLowerCase().replace(/[−–]/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/").replace(/√/g,"sqrt").replace(/π/g,"pi").replace(/θ/g,"t")
  .replace(/(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,(_,neg,d)=>"^"+(neg?"-":"")+[...d].map(c=>SUPMAP[c]).join("")).replace(/\s+/g,"")}
function tokX(s){const t=[];let i=0;while(i<s.length){const c=s[i];let m;
  if((m=/^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)))){t.push({k:"n",v:parseFloat(m[1])});i+=m[1].length;continue}
  if(s.startsWith("pi",i)){t.push({k:"n",v:Math.PI,pi:1});i+=2;continue}
  const fn=FN_NAMES.find(f=>s.startsWith(f,i));if(fn){t.push({k:"f",v:fn});i+=fn.length;continue}
  if(/[a-z]/.test(c)){t.push({k:"v",v:c});i++;continue}
  if("+-*/^()°,".includes(c)){t.push({k:c});i++;continue}
  return null}return t}
function parseExpr(str){const s=normX(str);if(!s)return null;const T=tokX(s);if(!T)return null;let p=0;const pk=()=>T[p]&&T[p].k;
  const atomStart=()=>{const k=pk();return k==="n"||k==="v"||k==="f"||k==="("};
  function expr(){let l=term();while(pk()==="+"||pk()==="-"){const o=T[p++].k;l={t:"b",o,l,r:term()}}return l}
  function term(){let l=unary();for(;;){const k=pk();if(k==="*"||k==="/"){p++;l={t:"b",o:k,l,r:unary()}}else if(atomStart())l={t:"b",o:"*",l,r:unary()};else break}return l}
  function unary(){if(pk()==="-"){p++;return {t:"u",e:unary()}}if(pk()==="+"){p++;return unary()}return power()}
  function power(){let b=post();if(pk()==="^"){p++;b={t:"b",o:"^",l:b,r:unary()}}return b}
  function post(){let a=atom();while(pk()==="°"){p++;a={t:"b",o:"*",l:a,r:{t:"n",v:Math.PI/180}}}return a}
  function atom(){const k=pk();if(k==="n"){return {t:"n",v:T[p++].v}}if(k==="v")return {t:"v",n:T[p++].v};
    if(k==="("){p++;const e=expr();if(pk()!==")")throw 0;p++;return e}
    if(k==="f"){const name=T[p++].v;let pw=null;if(pk()==="^"){p++;pw=unary()}
      let arg;if(pk()==="("){p++;arg=expr();if(pk()!==")")throw 0;p++}else arg=post();
      const f={t:"f",n:name,a:arg};return pw?{t:"b",o:"^",l:f,r:pw}:f}
    throw 0}
  try{const e=expr();return p===T.length?e:null}catch(e){return null}}
const FNS={sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,sin:Math.sin,cos:Math.cos,tan:Math.tan,sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x),
  ln:Math.log,log:Math.log10,exp:Math.exp,asin:Math.asin,acos:Math.acos,atan:Math.atan,arcsin:Math.asin,arccos:Math.acos,arctan:Math.atan};
function evalAst(a,env){switch(a.t){case "n":return a.v;case "v":return a.n in env?env[a.n]:a.n==="e"?Math.E:NaN;case "u":return -evalAst(a.e,env);
  case "f":return FNS[a.n](evalAst(a.a,env));
  case "b":{const l=evalAst(a.l,env),r=evalAst(a.r,env);return a.o==="+"?l+r:a.o==="-"?l-r:a.o==="*"?l*r:a.o==="/"?l/r:Math.pow(l,r)}}}
function astVars(a,s=new Set()){if(a.t==="v"){if(a.n!=="e")s.add(a.n)}else if(a.t==="b"){astVars(a.l,s);astVars(a.r,s)}else if(a.t==="u")astVars(a.e,s);else if(a.t==="f")astVars(a.a,s);return s}
// single-variable polynomial coefficients (ascending) or null
function astPoly(a){const mul=(p,q)=>{const r=Array(p.length+q.length-1).fill(0);p.forEach((x,i)=>q.forEach((y,j)=>r[i+j]+=x*y));return r};
  const add=(p,q,sg)=>{const r=Array(Math.max(p.length,q.length)).fill(0);p.forEach((x,i)=>r[i]+=x);q.forEach((x,i)=>r[i]+=sg*x);return r};
  let V=null;function go(a){switch(a.t){case "n":return [a.v];case "v":if(V&&V!==a.n)throw 0;V=a.n;return [0,1];case "u":return go(a.e).map(x=>-x);
    case "b":if(a.o==="+"||a.o==="-")return add(go(a.l),go(a.r),a.o==="+"?1:-1);if(a.o==="*")return mul(go(a.l),go(a.r));
      if(a.o==="/"){const d=go(a.r);if(d.length!==1||!d[0])throw 0;return go(a.l).map(x=>x/d[0])}
      if(a.o==="^"){const e=go(a.r);if(e.length!==1||e[0]<0||e[0]!==Math.floor(e[0])||e[0]>12)throw 0;let r=[1];for(let i=0;i<e[0];i++)r=mul(r,go(a.l));return r}throw 0;default:throw 0}}
  try{const c=go(a);while(c.length>1&&Math.abs(c[c.length-1])<1e-12)c.pop();return c}catch(e){return null}}
const BASEPTS=[1.7,2.3,0.6,3.1,1.1,2.9,0.45,1.35];
function ptSets(vars,off=0){const out=[];for(let i=0;i<8;i++){const e={};vars.forEach((v,j)=>e[v]=BASEPTS[(i*3+j*5)%8]+off);out.push(e)}return out}
function exprEquiv(A,B,off=0){const vars=[...new Set([...astVars(A),...astVars(B)])];let valid=0;
  for(const e of ptSets(vars,off)){const a=evalAst(A,e),b=evalAst(B,e);if(!isFinite(a)||!isFinite(b)){if(isFinite(a)!==isFinite(b)&&vars.length)return false;continue}
    if(Math.abs(a-b)>1e-9*Math.max(1,Math.abs(a),Math.abs(b)))return false;valid++}return valid>=3}
function eqEquiv(sa,sb,off=0){const sp=s=>{const p=normX(s).split("=");if(p.length!==2)return null;const l=parseExpr(p[0]),r=parseExpr(p[1]);return l&&r?{t:"b",o:"-",l,r}:null};
  const A=sp(sa),B=sp(sb);if(!A||!B)return false;const vars=[...new Set([...astVars(A),...astVars(B)])];let k=null,valid=0;
  for(const e of ptSets(vars,off)){const a=evalAst(A,e),b=evalAst(B,e);if(!isFinite(a)||!isFinite(b))continue;
    if(k===null){if(Math.abs(b)>1e-9){k=a/b;if(Math.abs(k)<1e-12)return false}else if(Math.abs(a)>1e-9)return false}
    else if(Math.abs(a-k*b)>1e-8*Math.max(1,Math.abs(a)))return false;valid++}return k!==null&&valid>=3}
function factorLeaves(a,out=[]){if(a.t==="u")factorLeaves(a.e,out);else if(a.t==="b"&&a.o==="*"){factorLeaves(a.l,out);factorLeaves(a.r,out)}
  else if(a.t==="b"&&a.o==="/"&&astPoly(a.r)&&astPoly(a.r).length===1)factorLeaves(a.l,out);
  else if(a.t==="b"&&a.o==="^"&&a.r.t==="n"&&Number.isInteger(a.r.v)&&a.r.v>=1&&a.r.v<=6&&!(a.l.t==="n")){for(let i=0;i<a.r.v;i++)factorLeaves(a.l,out)}else out.push(a);return out}
function factorDegs(ast){const d=[];for(const lf of factorLeaves(ast)){const p=astPoly(lf);if(!p)return null;if(p.length>1)d.push(p.length-1)}return d.sort((a,b)=>a-b)}
const splitTop=(s,re)=>{const out=[];let d=0,cur="";for(let i=0;i<s.length;i++){const c=s[i];if(c==="("||c==="[")d++;if(c===")"||c==="]")d--;
  if(!d&&(c===","||c===";")){out.push(cur);cur=""}else cur+=c}out.push(cur);return out};
function parseSet(str){let s=normX(str).replace(/[{}]/g,"").replace(/andor|or|and/g,",");
  return splitTop(s).map(p=>p.replace(/^[a-z]=/,"")).filter(p=>p!=="").map(p=>{const a=parseExpr(p);return a?evalAst(a,{}):NaN})}
const isNone=s=>/^(none|nosolution|norealsolution|norealsolutions|dne|∅|empty|emptyset)$/i.test(String(s).replace(/[\s{}]/g,""));
function parseCplx(str){let s=normX(str).replace(/[()]/g,m=>m);if(!s)return null;
  const terms=[];let cur="",d=0;for(let i=0;i<s.length;i++){const c=s[i];if(c==="(")d++;if(c===")")d--;if(!d&&(c==="+"||c==="-")&&cur!==""&&!/[*\/^]$/.test(cur)){terms.push(cur);cur=c}else cur+=c}terms.push(cur);
  let re=0,im=0;for(const t of terms){if(/i$/.test(t)){let c=t.replace(/\*?i$/,"");if(c===""||c==="+")c="1";else if(c==="-")c="-1";const a=parseExpr(c);if(!a)return null;const v=evalAst(a,{});if(!isFinite(v))return null;im+=v}
    else{const a=parseExpr(t);if(!a)return null;const v=evalAst(a,{});if(!isFinite(v))return null;re+=v}}return [re,im]}
function parseIntervals(str){let s=normX(str).replace(/∞/g,"inf").replace(/infinity/g,"inf").replace(/∪|u(?=[\(\[])/g,"U");
  const parts=s.split("U");const out=[];for(const p of parts){const m=p.match(/^([\(\[])(.+?),(.+?)([\)\]])$/);if(!m)return null;const f=x=>x==="inf"||x==="+inf"?Infinity:x==="-inf"?-Infinity:(()=>{const a=parseExpr(x);return a?evalAst(a,{}):NaN})();
    const lo=f(m[2]),hi=f(m[3]);if(isNaN(lo)||isNaN(hi))return null;out.push([lo,m[1]==="[",hi,m[4]==="]"])}
  return out.sort((a,b)=>a[0]-b[0]||b[1]-a[1])}
const sameIv=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>{const y=b[i];const e=(p,q)=>p===q||Math.abs(p-q)<1e-9;return e(x[0],y[0])&&e(x[2],y[2])&&(x[0]===-Infinity||x[1]===y[1])&&(x[2]===Infinity||x[3]===y[3])});
function numsIn(str){return (String(str).replace(/[−–]/g,"-").match(/[-+]?\d*\.?\d+(?:\/\d+)?/g)||[]).map(parseNum)}
const sqfree=n=>{for(let k=2;k*k<=n;k++)if(n%(k*k)===0)return false;return true};
function checkNew(q,raw){
  const bad=(note)=>({ok:false,note});
  if(q.type==="expr"){if(q.form==="sci")raw=raw.replace(/(\d)\s*[xX×]\s*(10)/,"$1*$2");const a=parseExpr(raw);if(!a)return bad("I couldn't read that. Use ^ for powers, sqrt(…), pi, and write products like 2x or (x+1)(x-3).");
    const t=parseExpr(q.answer);const eqv=exprEquiv(a,t,q.off||0);if(!eqv)return {ok:false};
    if(q.form==="factor"){const d=factorDegs(a);if(!d)return bad("Write the answer as a product of factors, e.g. (x+2)(x-3).");
      const top=a.t==="u"?a.e:a;if(!(top.t==="b"&&(top.o==="*"||top.o==="^")))return bad("That equals the original, but it isn't written as a product of factors.");
      for(const lf of factorLeaves(a)){const p=astPoly(lf);if(p&&p.length>1){if(p.some(c=>Math.abs(c-Math.round(c))>1e-9))return bad("Use integer coefficients inside each factor.");
        const g=p.reduce((u,c)=>gcd(u,Math.round(c)),0);if(g>1)return bad("A common factor is still left inside a bracket — factor out the greatest common factor.")}}
      if(JSON.stringify(d)!==JSON.stringify(q.fdeg))return bad("That's equal to the original, but it isn't completely factored in the form asked for.");}
    if(q.form==="lowest"){if(!(a.t==="b"&&a.o==="/"))return bad("Write it as a single fraction in lowest terms.");const n=astPoly(a.l),d=astPoly(a.r);if(!n||!d)return bad("Write it as one fraction of polynomials.");
      if(n.length+d.length-2!==q.dsum)return bad("Equivalent, but not fully simplified (cancel common factors).");}
    if(q.form==="rad"){const n=normX(raw);for(const m of n.matchAll(/sqrt\(?(\d+)\)?/g))if(!sqfree(+m[1]))return bad("Equivalent, but the radical can be simplified further.");
      if(/\/\(?[^+\-)]*sqrt/.test(n))return bad("Rationalize the denominator.");}
    if(q.form==="sci"){const n=normX(raw).replace(/(\d)x10/,"$1*10").replace(/×/g,"*");const m=n.match(/^(\d+\.?\d*)\*10\^\(?(-?\d+)\)?$/);if(!m||+m[1]<1||+m[1]>=10)return bad("Write it as a number from 1 up to (not including) 10 times a power of ten, like 3.2 x 10^5.")}
    if(q.form==="poly"){const p=astPoly(a);if(!p)return bad("Write it expanded and simplified, with no parentheses left to multiply.");if(/\(/.test(normX(raw))&&/\)[\(\d a-z]|[\da-z]\(/.test(normX(raw)))return bad("Expand all products.")}
    return {ok:true}}
  if(q.type==="eq"){if(!raw.includes("="))return bad("Write an equation with an = sign.");if(!/[a-z]/.test(raw.toLowerCase()))return bad("Write an equation.");
    return {ok:eqEquiv(raw,q.answer,q.off||0)}}
  if(q.type==="set"){const exp=q.answer;if(isNone(exp))return {ok:isNone(raw)};if(isNone(raw))return {ok:false};
    const a=parseSet(raw),b=parseSet(exp);if(a.some(v=>!isFinite(v)))return bad("List the solutions separated by commas, like  -3, 2");
    const u=l=>{l=l.map(v=>q.round!=null?+v.toFixed(q.round):v).sort((x,y)=>x-y);return l.filter((v,i)=>!i||Math.abs(v-l[i-1])>1e-9*Math.max(1,Math.abs(v)))};
    const ua=u(a),ub=u(b);return {ok:ua.length===ub.length&&ua.every((v,i)=>Math.abs(v-ub[i])<=1e-9*Math.max(1,Math.abs(ub[i])))}}
  if(q.type==="list"){const a=numsIn(raw),b=numsIn(q.answer);if(!a.length||a.some(isNaN))return bad("Type the numbers separated by commas, e.g. <3, -2>  or  [[1,2],[3,4]]");
    return {ok:a.length===b.length&&a.every((v,i)=>near(v,b[i]))}}
  if(q.type==="cplx"){const a=parseCplx(raw),b=parseCplx(q.answer);if(!a)return bad("Write a complex number like 3 + 4i or -2i.");return {ok:near(a[0],b[0])&&near(a[1],b[1])}}
  if(q.type==="interval"){const a=parseIntervals(raw);if(!a)return bad("Use interval notation like (-inf, 3] or [2, 5) U (7, inf).");return {ok:sameIv(a,parseIntervals(q.answer))}}
  return {ok:false}}
const showAns=q=>q.type==="mc"?q.choices[q.answer]:M(q.answer);
const stripTags=t=>String(t).replace(/<[^>]*>/g,"");
