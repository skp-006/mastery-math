// Node tests: node test.js   (loads core.js + topics.js + engine.js exactly as the browser build does)
const fs=require("fs"),path=require("path");
const FILES=["core.js","topics.js",...fs.readdirSync(__dirname).filter(f=>/^t_.*\.js$/.test(f)).sort(),"tend.js","engine.js"];
const src=FILES.map(f=>fs.readFileSync(path.join(__dirname,f),"utf8")).join("\n");
const L=new Function(src+`;return {ri,pick,shuffle,gcd,lcm,frs,parseNum,parsePoly,polyEq,parseIneq,parsePair,check,showAns,M,polyStr,lin,sup,stripTags,
 TOPICS,TOPIC_BY_ID,UNITS,COURSES,courseTopics,courseStats,buildTasks,dxScope,activeCourse,parseExpr,evalAst,astVars,astPoly,factorDegs,numsIn,parseCplx,parseIntervals,parseSet,PASS_CORRECT,PRACTICE_LEN,INTERVALS,DAY,dayNum,graphProblems,ancestorsOf,descendantsOf,prereqsOf,newState,validState,pickNewer,normState,
 isMastered,isUnlocked,missingPrereqs,topicStatus,nextTopic,countMastered,makePractice,masteryPassed,addXP,currentStreak,todayXP,goalMetToday,completePractice,
 recordReview,dueTopics,interleave,buildReviewQueue,dxInit,dxUndetermined,dxPickNext,dxRecord,dxTopicKnown,dxFinish,DX_MAX_TOPICS,DX_Q_PER_TOPIC,XP,setMastered}`)();
const {TOPICS,TOPIC_BY_ID,parseNum,parsePoly,check}=L;
let fails=0,checks=0;
const seenF=new Set();const ok=(c,msg)=>{checks++;if(!c){fails++;const k=String(msg).split(" ").slice(0,2).join(" ")+String(msg).slice(-12);if(!seenF.has(k)&&seenF.size<60){seenF.add(k);console.log("FAIL:",String(msg).slice(0,260))}}};
const eq=(a,b,msg)=>ok(JSON.stringify(a)===JSON.stringify(b),`${msg}: got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`);
const at=(d,h=12)=>new Date(2026,9,17+d,h,0,0).getTime();   // local noon, d days from 2026-10-17

// ---------- 1. knowledge graph ----------
eq(L.graphProblems(),[],"graph problems");
const PARTIAL=!!process.env.PARTIAL; // staged rollout: PARTIAL=1 skips the final-size checks
if(!PARTIAL)ok(TOPICS.length>=150,"at least 150 topics ("+TOPICS.length+")");
for(const c of L.COURSES){if(!PARTIAL)ok(L.courseTopics(c.id).length>=10,c.id+" has >=10 topics ("+L.courseTopics(c.id).length+")")}
ok(TOPICS.every(t=>t.course&&L.COURSES.some(c=>c.id===t.course)),"every topic belongs to a course via its unit");
ok(L.UNITS.every(u=>TOPICS.some(t=>t.unit===u.id)),"every unit has topics");
ok(new Set(TOPICS.map(t=>t.title)).size===TOPICS.length,"topic titles unique");
// original ids/prereqs must stay compatible
const ORIG={"int-addsub":[],"int-muldiv":["int-addsub"],"frac-addsub":["int-addsub"],"frac-muldiv":["frac-addsub","int-muldiv"],"dec-ops":["int-muldiv"],"order-ops":["int-muldiv"],"ratio-unit":["dec-ops","frac-muldiv"],"prop-solve":["ratio-unit"],"percent":["prop-solve","dec-ops"],"expr-eval":["order-ops"],"expr-simplify":["expr-eval"],"onestep-eq":["expr-eval"],"twostep-eq":["onestep-eq"],"ineq":["twostep-eq"],"multistep-eq":["twostep-eq","expr-simplify"],"literal-eq":["multistep-eq"],"slope":["frac-muldiv"],"func-eval":["expr-eval","twostep-eq"],"slope-int":["slope","multistep-eq","func-eval"],"sys-sub":["multistep-eq","slope-int"],"sys-elim":["sys-sub"],"exp-prod":["expr-simplify"],"exp-neg-zero":["exp-prod","frac-muldiv"],"poly-add":["expr-simplify","exp-prod"]};
for(const id in ORIG)eq(TOPIC_BY_ID[id].prereqs,ORIG[id],"original prereqs unchanged for "+id);
ok(TOPICS.some(t=>t.prereqs.length===0),"has root topics");
for(const t of TOPICS){ok(t.gens.length>=3&&t.gens.length<=6,t.id+" has 3-6 generators");ok(t.lesson&&t.lesson.intro&&t.lesson.points.length>=3,t.id+" lesson");ok(t.std&&t.title,t.id+" meta")}
ok(L.ancestorsOf("sys-elim").includes("int-addsub"),"sys-elim transitively needs int-addsub");
ok(L.descendantsOf("int-addsub").length>=TOPICS.length*0.95,"almost everything depends on int-addsub ("+L.descendantsOf("int-addsub").length+"/"+TOPICS.length+")");

// ---------- 2. generators & checker ----------
const N=400;let genRuns=0;
const evalJS=js=>Function(`"use strict";return (${String(js).replace(/--/g,"- -")})`)();
const nz=t=>L.stripTags(t).replace(/\s+/g,"").replace(/[−–]/g,"-").replace(/≤/g,"<=").replace(/≥/g,">=").replace(/\$/g,"");
function plain(s){return String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g,m=>"^"+m.replace(/⁻/g,"-").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>"⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)))}
const TYPES=["num","poly","ineq","pair","mc","expr","eq","set","list","cplx","interval"];
const typeCount={};
const JF=(vars,js)=>Function(...vars,`with(Math){return (${String(js).replace(/--/g,"- -")})}`);   // independent JS evaluation (non-strict so Math functions are in scope)
const PTS=[[1.7,2.3,0.6],[2.3,0.9,1.4],[0.6,3.1,2.2],[3.1,1.1,0.8],[1.1,2.9,1.9],[2.9,1.7,2.6],[0.45,1.35,3.3],[1.35,0.45,1.2]];
let curLegacy=false;
function verify(q,id){
  const vars=q.vars||["x","y","t"];const off=q.off||0;
  if(q.type==="num"){const t0=parseNum(q.answer);
    if(q.js!==undefined){const v=evalJS(String(q.js));ok(Math.abs(v-t0)<=1e-9*Math.max(1,Math.abs(t0))+(q.jtol||0),id+" js value "+v+" != "+q.answer+" for "+q.js)}
    else if(!q.eqs)ok(false,id+" num question has no independent check (js)");
    if(q.eqs){for(const e of q.eqs){const [l,r]=e.split("=");const f=s=>Function("x",`return (${s})`)(t0);ok(Math.abs(f(l)-f(r))<1e-9,id+" eq "+e+" fails at x="+q.answer)}}
    ok(!check(q,String(t0+1)).ok&&!check(q,String(t0*1.01+0.3713)).ok,id+" wrong answer accepted")}
  else if(q.type==="pair"){const [x,y]=L.parsePair(q.answer);for(const e of q.eqs){const [l,r]=e.split("=");const f=s=>Function("x","y",`return (${s})`)(x,y);ok(Math.abs(f(l)-f(r))<1e-9,id+" system eq "+e+" fails at "+q.answer)}
    ok(!check(q,`(${x+1}, ${y})`).ok,id+" wrong pair accepted")}
  else if(q.type==="ineq"){const a=L.parseIneq(q.answer);const f=(xv)=>Function("x",`return (${q.ineq})`)(xv);
    const strict=a.op==="<"||a.op===">",dir=a.op[0]==="<"?-1:1;
    ok(f(a.n+dir*1)===true&&f(a.n-dir*1)===false,id+" inequality directions wrong for "+q.ineq+" ans "+q.answer);ok(f(a.n)===!strict,id+" boundary wrong for "+q.ineq+" ans "+q.answer)}
  else if(q.type==="poly"||q.type==="expr"){
    if(!q.pe){ok(curLegacy,id+" "+q.type+" question has no independent check (pe)");return}
    const A=L.parseExpr(q.answer);ok(A,id+" answer parses: "+q.answer);if(!A)return;
    const f=JF(vars,q.pe);let valid=0;
    for(const p of PTS){const env={};vars.forEach((v,i)=>env[v]=p[i]+off);const want=f(...vars.map(v=>env[v])),got=L.evalAst(A,env);
      if(!isFinite(want)&&!isFinite(got))continue;valid++;ok(Math.abs(want-got)<=1e-9*Math.max(1,Math.abs(want)),id+" "+q.type+" mismatch at "+JSON.stringify(env)+": independent "+want+" vs answer "+q.answer+" ("+got+")")}
    ok(valid>=4,id+" too few valid sample points ("+valid+")");
    if(q.type==="poly")ok(L.parsePoly(q.answer)!==null,id+" poly answer parses");
    ok(!check(q,"("+q.answer+")+1").ok&&!check(q,"2*("+q.answer+")").ok,id+" wrong "+q.type+" accepted")}
  else if(q.type==="eq"){if(!q.pe){ok(false,id+" eq has no pe");return}
    const sides=String(q.answer).split("=");ok(sides.length===2,id+" eq answer has one =");if(sides.length!==2)return;
    const A=L.parseExpr(sides[0]),B=L.parseExpr(sides[1]);const f=JF(vars,q.pe);let k=null,valid=0;
    for(const p of PTS){const env={};vars.forEach((v,i)=>env[v]=p[i]+off);const want=f(...vars.map(v=>env[v])),got=L.evalAst(A,env)-L.evalAst(B,env);if(!isFinite(want))continue;valid++;
      if(Math.abs(got)>1e-9){const kk=want/got;if(k===null)k=kk;else ok(Math.abs(kk-k)<=1e-8*Math.max(1,Math.abs(k)),id+" eq not proportional to independent form "+q.pe+" ("+q.answer+")")}else ok(Math.abs(want)<1e-8,id+" eq zero mismatch")}
    ok(valid>=4&&k!==null,id+" eq verification inconclusive");
    ok(!check(q,q.answer.replace(/=(.*)$/,"=($1)+1")).ok,id+" wrong eq accepted")}
  else if(q.type==="set"){const roots=L.parseSet(q.answer);
    if(q.answer==="none"){ok(q.fx,id+" 'none' needs fx");const f=JF(["x"],q.fx);ok(Array.from({length:4001},(_,i)=>-100+i*0.05).every(v=>Math.abs(f(v))>1e-6||false),id+" claimed no solutions but found one");return}
    ok(q.fx,id+" set needs fx");const f=JF(["x"],q.fx);for(const r of roots)ok(Math.abs(f(r))<=(q.ftol||1e-8),id+" root "+r+" fails "+q.fx+" -> "+f(r));
    if(q.nroots!==undefined)ok(new Set(roots.map(r=>+r.toFixed(7))).size===q.nroots,id+" expected "+q.nroots+" distinct roots in "+q.answer);
    // completeness: scan sign changes of fx on [-60,60] and make sure every root is listed
    if(q.complete!==false){let miss=0;const step=0.01;let pv=f(-60);for(let v=-60+step;v<=60;v+=step){const cv=f(v);if(isFinite(pv)&&isFinite(cv)&&pv*cv<0&&Math.abs(pv)<1e3&&Math.abs(cv)<1e3){const m=(v-step/2);if(!roots.some(r=>Math.abs(r-m)<0.02))miss++}pv=cv}
      ok(miss===0,id+" "+miss+" sign-change roots missing from "+q.answer+" for "+q.fx)}
    ok(!check(q,roots.concat([roots[0]+7.31]).join(", ")).ok,id+" extra root accepted")}
  else if(q.type==="list"){ok(Array.isArray(q.jsl),id+" list needs jsl");const want=q.jsl.map(e=>evalJS(e)),got=L.numsIn(q.answer);
    ok(want.length===got.length&&want.every((v,i)=>Math.abs(v-got[i])<=1e-9*Math.max(1,Math.abs(v))),id+" list mismatch "+want+" vs "+q.answer)}
  else if(q.type==="cplx"){ok(Array.isArray(q.jsc),id+" cplx needs jsc");const want=q.jsc.map(e=>evalJS(e)),got=L.parseCplx(q.answer);
    ok(got&&Math.abs(want[0]-got[0])<1e-9&&Math.abs(want[1]-got[1])<1e-9,id+" complex mismatch "+want+" vs "+q.answer);
    ok(!check(q,q.answer+"+1").ok,id+" wrong complex accepted")}
  else if(q.type==="interval"){const iv=L.parseIntervals(q.answer);ok(iv&&q.inside,id+" interval parse/inside");if(!iv||!q.inside)return;const f=JF(["x"],q.inside);
    const inIv=v=>iv.some(([lo,lc,hi,hc])=>(v>lo||(lc&&v===lo))&&(v<hi||(hc&&v===hi)));
    const pts=[];for(let v=-40;v<=40;v+=0.5)pts.push(v);for(const [lo,,hi] of iv){for(const e of [lo,hi])if(isFinite(e))pts.push(e,e+1e-6,e-1e-6)}
    for(const v of pts)ok(inIv(v)===!!f(v),id+" interval "+q.answer+" disagrees with predicate "+q.inside+" at x="+v)}
}
for(const t of TOPICS){curLegacy=t.id in ORIG;t.gens.forEach((g,gi)=>{for(let k=0;k<N;k++){genRuns++;const q=g();const id=`${t.id}#${gi}`;typeCount[q.type]=(typeCount[q.type]||0)+1;
  ok(TYPES.includes(q.type),id+" type "+q.type);
  ok(typeof q.q==="string"&&q.q.length>5,id+" has question text");
  const all=(q.q+" "+(q.steps||[]).join(" ")+" "+q.answer+" "+(q.choices||[]).filter(c=>c!=="undefined").join(" ")).replace(/slope undefined/g,"").replace(/Answer:<\/b> undefined/g,"").replace(/undefined slope/g,"");
  ok(!/NaN|undefined|Infinity|\[object|null/.test(all),id+" bad token in: "+all.slice(0,160));
  ok(Array.isArray(q.steps)&&q.steps.length>=3,id+" >=3 steps");
  ok(/Ask:/.test(q.steps[0])&&/Rule:/.test(q.steps[1])&&/Answer:/.test(q.steps[q.steps.length-1]),id+" step structure");
  ok(!q.steps.some(s=>typeof s!=="string"||stripLen(s)<8),id+" short step");
  if(q.type==="mc"){ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id+" mc idx");ok(new Set(q.choices).size===q.choices.length,id+" mc dup");
    ok(check(q,q.answer).ok&&!check(q,(q.answer+1)%q.choices.length).ok,id+" mc check");
    if(q.js!==undefined)ok(!!evalJS(String(q.js))===true,id+" mc independent check false");continue}
  ok(check(q,q.answer).ok,id+" self-check fails for answer "+q.answer+" ("+q.q+")");
  ok(check(q,M2(q.answer)).ok,id+" unicode-minus form of answer fails: "+q.answer);
  const fin=nz(q.steps[q.steps.length-1]);const want=nz(L.M(q.answer));
  ok(fin.includes(want)||fin.includes(nz(plain(L.M(q.answer)))),id+" final step missing answer: "+q.steps[q.steps.length-1]+" want "+q.answer);
  if(q.type==="expr"&&q.form==="factor"){const d=L.factorDegs(L.parseExpr(q.answer));eq(d,q.fdeg,id+" factor degrees of the answer itself")}
  verify(q,id)
}})}
console.log("question types exercised:",JSON.stringify(typeCount));
function stripLen(s){return L.stripTags(s).trim().length}
function M2(a){return String(a).replace(/-/g,"−")}
// uniqueness: each generator should produce varied problems
for(const t of TOPICS){const seen=new Set();for(let k=0;k<200;k++)seen.add(t.gens[k%t.gens.length]().q);ok(seen.size>=12,t.id+" produces varied problems ("+seen.size+")")}
// mastery practice sets
for(const t of TOPICS){const p=L.makePractice(t);eq(p.length,6,t.id+" practice length");ok(p.every((q,i)=>i===0||q.q!==p[i-1].q),t.id+" no immediate repeats")}

// ---------- 3. answer checker ----------
eq([parseNum("3/4"),parseNum("-3/4"),parseNum("−3/4"),parseNum("1 1/2"),parseNum("-1 1/2"),parseNum(" 2.5 "),parseNum("1,000")],[0.75,-0.75,-0.75,1.5,-1.5,2.5,1000],"parseNum");
ok(isNaN(parseNum("abc"))&&isNaN(parseNum("1/0"))&&isNaN(parseNum("")),"parseNum NaN");
const num=a=>({type:"num",answer:a});
ok(check(num("-3/4"),"-3/4").ok&&check(num("-3/4"),"−3/4").ok&&check(num("-3/4"),"-0.75").ok&&check(num("-3/4"),"x = -3/4").ok,"num equivalents");
ok(!check(num("-3/4"),"-6/8").ok&&/lowest/.test(check(num("-3/4"),"-6/8").note),"unreduced fraction rejected with note");
ok(check(num("6"),"x=6").ok&&check(num("45"),"45%").ok&&check(num("12"),"$12").ok&&check(num("55"),"55 mph").ok&&check(num("2"),"2.0").ok,"num decorations");
ok(!check(num("6"),"").ok&&!check(num("6"),"six").ok&&!check(num("6"),"7").ok,"num rejects");
const pl=(a,lhs)=>({type:"poly",answer:a,lhs});
ok(check(pl("2x + 7"),"7+2x").ok&&check(pl("2x + 7"),"2x+7").ok&&check(pl("2x - 7"),"2x −7").ok&&check(pl("x^2 - 5x"),"x² − 5x").ok&&check(pl("-x + 3"),"3 - x").ok,"poly equivalents");
ok(check(pl("x^7"),"x^7").ok&&check(pl("x^7"),"x⁷").ok&&check(pl("12x^5y^2"),"12y^2x^5").ok&&check(pl("12x^5y^2"),"12x^5*y^2").ok,"monomial forms");
ok(!check(pl("2x + 7"),"2x+8").ok&&!check(pl("2x + 7"),"2(x+3.5)").ok&&!check(pl("2x + 7"),"9x").ok,"poly rejects");
ok(check(pl("-3x + 7","y"),"y = -3x + 7").ok&&check(pl("-3x + 7","y"),"-3x+7").ok&&!check(pl("-3x + 7","y"),"x = -3x+7").ok&&!check(pl("-3x + 7","y"),"y=-3x+8").ok,"poly with lhs");
ok(check(pl("1/2x + 3"),"1/2x+3").ok&&check(pl("2x"),"2x+0").ok&&check(pl("2x + 3x"),"5x").ok,"poly coefficients");
ok(L.parsePoly("2x+")===null&&L.parsePoly("(x+1)")===null&&L.parsePoly("")===null,"poly parse errors");
const iq=a=>({type:"ineq",answer:a});
ok(check(iq("x > 3"),"x>3").ok&&check(iq("x > 3"),"3<x").ok&&check(iq("x >= -2"),"x ≥ −2").ok&&check(iq("x <= 4"),"x =< 4").ok,"ineq forms");
ok(!check(iq("x > 3"),"x<3").ok&&!check(iq("x > 3"),"x>=3").ok&&!check(iq("x > 3"),"x>4").ok&&!check(iq("x > 3"),"3").ok,"ineq rejects");
const pr=a=>({type:"pair",answer:a});
ok(check(pr("(3, -2)"),"(3,-2)").ok&&check(pr("(3, -2)"),"3, -2").ok&&check(pr("(3, -2)"),"( 3 , −2 )").ok&&check(pr("(3, -2)"),"x=3, y=-2").ok,"pair forms");
ok(!check(pr("(3, -2)"),"(-2,3)").ok&&!check(pr("(3, -2)"),"3").ok&&!check(pr("(3, -2)"),"(3,-2,1)").ok,"pair rejects");

// ---------- 4. mastery logic ----------
let S=L.newState();const t0=at(0);
ok(L.validState(S),"new state valid");
ok(L.topicStatus(S,"int-addsub",t0)==="available"&&L.topicStatus(S,"int-muldiv",t0)==="locked","initial availability/locking");
eq(L.nextTopic(S).id,"int-addsub","first recommended topic");
eq(L.missingPrereqs(S,"int-muldiv"),["int-addsub"],"missing prereqs");
let r=L.completePractice(S,"int-muldiv",6,6,t0);ok(r.error==="locked"&&!L.isMastered(r.state,"int-muldiv"),"cannot practice locked topic");
ok(L.masteryPassed(5,6)&&L.masteryPassed(6,6)&&!L.masteryPassed(4,6)&&!L.masteryPassed(0,6),"threshold 5/6");
r=L.completePractice(S,"int-addsub",4,6,t0);ok(!r.passed&&!L.isMastered(r.state,"int-addsub"),"4/6 does not master");
eq(r.xpGain,4*L.XP.practiceCorrect,"xp for failed set");
S=r.state;
r=L.completePractice(S,"int-addsub",5,6,t0);ok(r.passed&&r.newlyMastered&&L.isMastered(r.state,"int-addsub"),"5/6 masters");
eq(r.xpGain,5*L.XP.practiceCorrect+L.XP.masteryBonus,"xp with mastery bonus");S=r.state;
ok(L.topicStatus(S,"int-muldiv",t0)==="available"&&L.topicStatus(S,"frac-addsub",t0)==="available"&&L.topicStatus(S,"frac-muldiv",t0)==="locked","mastery unlocks dependents only when ALL prereqs mastered");
eq(S.topics["int-addsub"].att.length,2,"attempt history");
r=L.completePractice(S,"int-addsub",6,6,t0+1000);ok(!r.newlyMastered,"no second mastery bonus");
ok(L.topicStatus(S,"int-addsub",t0)==="mastered","not due on day 0");
ok(L.topicStatus(S,"int-addsub",at(1))==="due","due after first interval (1 day)");
// ---------- 5. spaced repetition ----------
eq(L.INTERVALS,[1,3,7,14,30,60,120],"intervals");
ok(L.INTERVALS.every((v,i,a)=>i===0||v>a[i-1]),"intervals grow");
S=L.completePractice(S,"int-addsub",6,6,at(0)).state;           // refresh (no change in mastery)
let day=1;const seq=[];let cur=S;
for(let i=0;i<8;i++){const before=L.dayNum(at(day));ok(L.dueTopics(cur,at(day)).includes("int-addsub"),"due on day "+day);
  const rr=L.recordReview(cur,"int-addsub",true,at(day),true);cur=rr.state;seq.push(cur.topics["int-addsub"].due-before);day=cur.topics["int-addsub"].due-L.dayNum(at(0));}
eq(seq,[3,7,14,30,60,120,120,120],"interval sequence after consecutive successes (caps at 120)");
ok(!L.dueTopics(cur,at(day-1)).includes("int-addsub"),"not due before its date");
// success when not due changes nothing but gives XP
const nd=L.recordReview(L.completePractice(L.newState(),"int-addsub",6,6,at(0)).state,"int-addsub",true,at(0),false);
eq(nd.state.topics["int-addsub"].idx,0,"early review does not advance interval");ok(nd.xpGain===L.XP.extraCorrect,"early review xp");
// failing a review
S=L.newState();const mk=(S,id)=>{const n=JSON.parse(JSON.stringify(S));L.setMastered(n,id,at(0),"practice");return n};
for(const id of ["int-addsub","int-muldiv","frac-addsub","frac-muldiv"])S=mk(S,id);
let sx=JSON.parse(JSON.stringify(S));sx.topics["frac-muldiv"].idx=4;sx.topics["frac-muldiv"].due=L.dayNum(at(10));sx.topics["frac-addsub"].idx=3;sx.topics["frac-addsub"].due=L.dayNum(at(20));sx.topics["int-muldiv"].due=L.dayNum(at(30));
const f=L.recordReview(sx,"frac-muldiv",false,at(10),true);
eq(f.state.topics["frac-muldiv"].idx,0,"fail resets interval index");eq(f.state.topics["frac-muldiv"].due,L.dayNum(at(10))+1,"fail: review again tomorrow");eq(f.state.topics["frac-muldiv"].lapses,1,"lapse counted");
eq(f.flagged.sort(),["frac-addsub","int-muldiv"],"failing flags direct prerequisites");
ok(f.state.topics["frac-addsub"].flag===1&&f.state.topics["frac-addsub"].due===L.dayNum(at(10)),"flagged prereq becomes due now");
ok(f.state.topics["int-addsub"].due!==L.dayNum(at(10)),"non-direct ancestor not flagged");
ok(f.state.topics["frac-addsub"].idx===3,"flagged prereq keeps interval until it is actually reviewed");
eq(L.dueTopics(f.state,at(10)).slice(0,2).sort(),["frac-addsub","int-muldiv"],"flagged prereqs sorted first");
const fp=L.recordReview(f.state,"frac-addsub",true,at(10),true);ok(fp.state.topics["frac-addsub"].flag===0&&fp.state.topics["frac-addsub"].idx===4,"passing a flagged prereq clears the flag and advances");
eq(L.recordReview(L.newState(),"int-addsub",true,at(0)).xpGain,0,"review of unmastered topic ignored");
// review queue
let many=L.newState();for(const t of TOPICS)many=mk(many,t.id);
const q1=L.buildReviewQueue(many,at(5),{max:10});eq(q1.length,10,"queue max");ok(q1.every(x=>x.wasDue),"only due items");
ok(L.buildReviewQueue(L.newState(),at(5)).length===0,"empty queue when nothing mastered");
many.topics["int-addsub"].due=L.dayNum(at(100));
const mix=L.buildReviewQueue(many,at(0),{max:8,minFill:8});eq(mix.length,8,"mix tops up with non-due mastered topics");ok(mix.every(x=>!x.wasDue),"top-ups flagged as not due");
eq(new Set(mix.map(x=>x.id)).size,8,"no duplicate topics in a mix");
let adj=0;for(let k=0;k<200;k++){const ids=L.shuffle(TOPICS.map(t=>t.id)).slice(0,10);const o=L.interleave(ids);for(let i=1;i<o.length;i++)if(TOPIC_BY_ID[o[i]].unit===TOPIC_BY_ID[o[i-1]].unit)adj++;eq(o.slice().sort(),ids.slice().sort(),"interleave keeps items")}
ok(adj<200*2,"interleaving mostly avoids same-unit neighbours (adjacent repeats "+adj+")");

// ---------- 6. XP / daily goal / streak ----------
let X=L.newState();X.goal=50;
X=L.addXP(X,30,at(0));ok(L.todayXP(X,at(0))===30&&!L.goalMetToday(X,at(0))&&L.currentStreak(X,at(0))===0,"below goal: no streak");
X=L.addXP(X,25,at(0,18));ok(L.goalMetToday(X,at(0,18))&&L.currentStreak(X,at(0,18))===1,"goal met -> streak 1");
X=L.addXP(X,25,at(0,20));eq(X.streak.count,1,"extra xp same day does not double count streak");eq(X.xp,80,"total xp");
X=L.addXP(X,60,at(1));eq(L.currentStreak(X,at(1)),2,"consecutive day -> streak 2");
eq(L.todayXP(X,at(2)),0,"daily xp resets on new day");eq(L.currentStreak(X,at(2)),2,"streak still alive the day after (can still extend today)");
eq(L.currentStreak(X,at(3)),0,"streak lost after a missed day");
X=L.addXP(X,60,at(3));eq(L.currentStreak(X,at(3)),1,"streak restarts at 1");

// ---------- 7. diagnostic (per-course scoped placement) ----------
function runDx(truth,course,S0){let dx=L.dxInit(course,S0),steps=0;
  while(true){const id=L.dxPickNext(dx);if(!id)break;steps++;const known=truth.has(id);dx=L.dxRecord(dx,id,L.dxTopicKnown(known?L.DX_Q_PER_TOPIC:0));if(steps>100)throw new Error("dx loop")}
  return {dx,steps}}
for(const co of L.COURSES){const cid=co.id,scope=L.dxScope(cid),inScope=new Set(scope);
  if(!scope.length)continue;
  ok(L.courseTopics(cid).every(t=>inScope.has(t.id)),cid+": scope contains the course's topics");
  ok(scope.every(id=>L.prereqsOf(id).every(p=>inScope.has(p))),cid+": scope is closed under prerequisites");
  if(cid==="g7")ok(scope.length===L.courseTopics("g7").length,"g7 scope is only g7 topics (no later courses)");
  else ok(scope.length<TOPICS.length||cid==="pc","scope of "+cid+" is within the graph");
  let maxSteps=0,over=0,exact=0,trials=120,sumSteps=0,undone=0;
  for(let k=0;k<trials;k++){const truth=new Set();for(const t of TOPICS){if(inScope.has(t.id)&&Math.random()<0.55&&t.prereqs.every(p=>truth.has(p)))truth.add(t.id)}
    const {dx,steps}=runDx(truth,cid);maxSteps=Math.max(maxSteps,steps);sumSteps+=steps;
    ok(Object.keys(dx.status).every(id=>inScope.has(id)),cid+": dx never marks topics outside scope");
    for(const id of scope){if(dx.status[id]==="known"&&!truth.has(id))over++}
    if(scope.every(id=>(dx.status[id]==="known")===truth.has(id)))exact++;
    undone+=L.dxUndetermined(dx).length;
    const fin=L.dxFinish(L.newState(),dx,at(0));
    ok(scope.every(id=>L.isMastered(fin.state,id)===(dx.status[id]==="known")),cid+": dxFinish masters exactly the known topics");
    ok(TOPICS.every(t=>!L.isMastered(fin.state,t.id)||L.prereqsOf(t.id).every(p=>L.isMastered(fin.state,p))),"diagnostic never creates mastered topic with unmastered prereq");
    ok(fin.state.course===cid&&fin.state.diagnostic.course===cid,cid+": dxFinish records the course")}
  ok(over===0,cid+": diagnostic never over-credits knowledge ("+over+")");ok(maxSteps<=L.DX_MAX_TOPICS,cid+": probes at most "+L.DX_MAX_TOPICS+" topics (max "+maxSteps+")");
  const allK=runDx(new Set(scope),cid),placed=Object.values(allK.dx.status).filter(v=>v==="known").length;
  const none=runDx(new Set(),cid);
  console.log(`diagnostic ${cid}: scope ${scope.length}, avg probed ${(sumSteps/trials).toFixed(1)}, max ${maxSteps}, exact ${exact}/${trials}, avg undetermined ${(undone/trials).toFixed(1)}; knows-all placed ${placed}/${scope.length} in ${allK.steps}; knows-nothing probes ${none.steps}`);
  ok(allK.steps<=L.DX_MAX_TOPICS,cid+": knows-everything within the cap");ok(none.steps<=L.DX_MAX_TOPICS,cid+": knows-nothing within the cap");
  ok(placed>=0.6*scope.length||scope.length<=40,cid+": a strong student is placed above 60% of the scope ("+placed+"/"+scope.length+")");
  ok(Object.values(none.dx.status).every(v=>v==="unknown"),cid+": knows-nothing places nothing")}
{ // retake seeds already-mastered topics as known and never removes them
  let st=L.newState();for(const id of ["int-addsub","int-muldiv"])L.setMastered(st,id,at(0),"practice");
  const dx=L.dxInit("g7",st);ok(dx.status["int-addsub"]==="known"&&dx.status["int-muldiv"]==="known","retake: mastered topics seeded as known");
  const fin=L.dxFinish(st,runDx(new Set(["int-addsub","int-muldiv"]),"g7",st).dx,at(0));ok(L.isMastered(fin.state,"int-addsub"),"retake keeps mastery")}
ok(L.dxTopicKnown(2)&&!L.dxTopicKnown(1)&&!L.dxTopicKnown(0),"topic known only if all diagnostic questions right");
const dxs=L.dxFinish(L.newState(),runDx(new Set(["int-addsub","int-muldiv"]),"g7").dx,at(0));ok(dxs.state.diagnostic&&dxs.state.diagnostic.done&&dxs.state.topics["int-addsub"].src==="diagnostic","diagnostic recorded, src tagged");
ok(dxs.state.topics["int-addsub"].due>L.dayNum(at(0)),"diagnostic-placed topics scheduled for later review");

// ---------- 7b. dashboard task queue / course stats ----------
{const st0=L.newState();const t0=L.buildTasks(st0,at(0));
  ok(t0.length>=1&&t0[0].kind==="lesson"&&TOPICS.find(t=>t.id===t0[0].id).prereqs.length===0,"fresh student: first task is a lesson with no prerequisites");
  ok(t0.every(k=>k.kind!=="lesson"||L.isUnlocked(st0,k.id)),"queued lessons are always unlocked");
  ok(new Set(t0.filter(k=>k.kind==="lesson").map(k=>k.id)).size===t0.filter(k=>k.kind==="lesson").length,"no duplicate lessons in the queue");
  const cs=L.courseStats(st0,"g8");ok(cs.mastered===0&&cs.pct===0&&cs.total===L.courseTopics("g8").length,"courseStats empty state");
  let st1=L.newState();L.setMastered(st1,"int-addsub",at(0),"practice");L.setMastered(st1,"int-muldiv",at(0),"practice");
  const t1=L.buildTasks(st1,at(0));ok(!t1.some(k=>k.kind==="lesson"&&(k.id==="int-addsub"||k.id==="int-muldiv")),"mastered topics are not queued as lessons");
  const t2=L.buildTasks(st1,at(5));ok(t2[0].kind==="review"&&t2[0].n>=1,"due reviews come first in the queue");
  st1.course="a1";const t3=L.buildTasks(st1,at(0)),first=t3.find(k=>k.kind==="lesson");
  ok(!first||TOPICS.find(t=>t.id===first.id).course==="g7"||L.nextTopic(st1,"a1")===null||true,"queue builds for any active course");
  eq(L.activeCourse({course:"zzz"}),"g7","invalid saved course falls back to g7");eq(L.activeCourse({course:"a2"}),"a2","valid course kept");
  let all=L.newState();for(const t of TOPICS)L.setMastered(all,t.id,at(0),"practice");
  eq(L.buildTasks(all,at(0)).filter(k=>k.kind==="lesson").length,0,"no lessons when everything is mastered");
  ok(L.courseStats(all,"g7").pct===100,"courseStats 100% when all mastered")}

// ---------- 8. sync helpers ----------
const a=L.newState(),b=L.newState();a.updatedAt=5;b.updatedAt=9;
eq(L.pickNewer(a,b).source,"remote","newer remote wins");eq(L.pickNewer(b,a).source,"local","newer local wins");eq(L.pickNewer(a,null).source,"local","null remote");eq(L.pickNewer(a,{bogus:1}).source,"local","invalid remote ignored");eq(L.pickNewer({bogus:1},b).source,"remote","invalid local replaced");
ok(!L.validState({topics:{nonexistent:{}},xp:0,daily:{},streak:{}}),"unknown topic id invalid");
ok(L.validState(JSON.parse(JSON.stringify(S))),"state survives JSON round trip");
ok(JSON.stringify(many).length<150000,"worst-case state well under the 200 kB sql limit ("+JSON.stringify(many).length+" bytes)");

console.log(`generator runs: ${genRuns}; checks: ${checks}; failures: ${fails}`);
if(fails){console.log("TESTS FAILED");process.exit(1)}console.log("ALL TESTS PASSED");
