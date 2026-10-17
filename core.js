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
const M=s=>String(s).replace(/\^(-?\d+)/g,(_,n)=>sup(n)).replace(/ \* /g," × ").replace(/<=/g,"≤").replace(/>=/g,"≥").replace(/(?<![A-Za-z])-|-(?![A-Za-z])/g,"−");
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
  return {ok:false}}
const showAns=q=>q.type==="mc"?q.choices[q.answer]:M(q.answer);
const stripTags=t=>String(t).replace(/<[^>]*>/g,"");
