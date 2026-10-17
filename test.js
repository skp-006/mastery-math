// Node tests: node test.js   (loads core.js + topics.js + engine.js exactly as the browser build does)
const fs=require("fs"),path=require("path");
const src=["core.js","topics.js","engine.js"].map(f=>fs.readFileSync(path.join(__dirname,f),"utf8")).join("\n");
const L=new Function(src+`;return {ri,pick,shuffle,gcd,lcm,frs,parseNum,parsePoly,polyEq,parseIneq,parsePair,check,showAns,M,polyStr,lin,sup,stripTags,
 TOPICS,TOPIC_BY_ID,UNITS,PASS_CORRECT,PRACTICE_LEN,INTERVALS,DAY,dayNum,graphProblems,ancestorsOf,descendantsOf,prereqsOf,newState,validState,pickNewer,normState,
 isMastered,isUnlocked,missingPrereqs,topicStatus,nextTopic,countMastered,makePractice,masteryPassed,addXP,currentStreak,todayXP,goalMetToday,completePractice,
 recordReview,dueTopics,interleave,buildReviewQueue,dxInit,dxPickNext,dxRecord,dxTopicKnown,dxFinish,DX_MAX_TOPICS,DX_Q_PER_TOPIC,XP,setMastered}`)();
const {TOPICS,TOPIC_BY_ID,parseNum,parsePoly,check}=L;
let fails=0,checks=0;
const ok=(c,msg)=>{checks++;if(!c){fails++;if(fails<=40)console.log("FAIL:",msg)}};
const eq=(a,b,msg)=>ok(JSON.stringify(a)===JSON.stringify(b),`${msg}: got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`);
const at=(d,h=12)=>new Date(2026,9,17+d,h,0,0).getTime();   // local noon, d days from 2026-10-17

// ---------- 1. knowledge graph ----------
eq(L.graphProblems(),[],"graph problems");
ok(TOPICS.length>=20,"at least 20 topics");
ok(TOPICS.some(t=>t.prereqs.length===0),"has root topics");
for(const t of TOPICS){ok(t.gens.length>=3,t.id+" has >=3 generators");ok(t.lesson&&t.lesson.intro&&t.lesson.points.length>=3,t.id+" lesson");ok(t.std&&t.title,t.id+" meta")}
ok(L.ancestorsOf("sys-elim").includes("int-addsub"),"sys-elim transitively needs int-addsub");
ok(L.descendantsOf("int-addsub").length===TOPICS.length-1,"everything depends on int-addsub");

// ---------- 2. generators & checker ----------
const N=400;let genRuns=0;
const evalJS=js=>Function(`"use strict";return (${js})`)();
const nz=t=>L.stripTags(t).replace(/\s+/g,"").replace(/[−–]/g,"-").replace(/≤/g,"<=").replace(/≥/g,">=").replace(/\$/g,"");
function plain(s){return String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g,m=>"^"+m.replace(/⁻/g,"-").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>"⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)))}
for(const t of TOPICS){t.gens.forEach((g,gi)=>{for(let k=0;k<N;k++){genRuns++;const q=g();const id=`${t.id}#${gi}`;
  ok(["num","poly","ineq","pair","mc"].includes(q.type),id+" type");
  ok(typeof q.q==="string"&&q.q.length>5,id+" has question text");
  const all=(q.q+" "+(q.steps||[]).join(" ")+" "+q.answer).replace(/slope undefined/g,"").replace(/Answer:<\/b> undefined/g,"");
  ok(!/NaN|undefined|Infinity|\[object|null/.test(all),id+" bad token in: "+all.slice(0,160));
  ok(Array.isArray(q.steps)&&q.steps.length>=3,id+" >=3 steps");
  ok(/Ask:/.test(q.steps[0])&&/Rule:/.test(q.steps[1])&&/Answer:/.test(q.steps[q.steps.length-1]),id+" step structure");
  ok(!q.steps.some(s=>typeof s!=="string"||stripLen(s)<8),id+" short step");
  if(q.type==="mc"){ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,id+" mc idx");ok(new Set(q.choices).size===q.choices.length,id+" mc dup");
    ok(check(q,q.answer).ok&&!check(q,(q.answer+1)%q.choices.length).ok,id+" mc check");continue}
  ok(check(q,q.answer).ok,id+" self-check fails for answer "+q.answer+" ("+q.q+")");
  ok(check(q,M2(q.answer)).ok,id+" unicode-minus form of answer fails: "+q.answer);
  const fin=nz(q.steps[q.steps.length-1]);const want=nz(L.M(q.answer));
  ok(fin.includes(want)||fin.includes(nz(plain(L.M(q.answer)))),id+" final step missing answer: "+q.steps[q.steps.length-1]+" want "+q.answer);
  // independent verification
  if(q.type==="num"){const t0=parseNum(q.answer);
    if(q.js){const v=evalJS(q.js);ok(Math.abs(v-t0)<1e-9*Math.max(1,Math.abs(t0)),id+" js value "+v+" != "+q.answer+" for "+q.js)}
    if(q.eqs){for(const e of q.eqs){const [l,r]=e.split("=");const f=s=>Function("x",`return (${s})`)(t0);ok(Math.abs(f(l)-f(r))<1e-9,id+" eq "+e+" fails at x="+q.answer)}}
    ok(!check(q,String(t0+1)).ok,id+" wrong answer accepted")}
  if(q.type==="pair"){const [x,y]=L.parsePair(q.answer);for(const e of q.eqs){const [l,r]=e.split("=");const f=s=>Function("x","y",`return (${s})`)(x,y);ok(Math.abs(f(l)-f(r))<1e-9,id+" system eq "+e+" fails at "+q.answer)}
    // unique solution: perturbing either coordinate must break at least one equation
    ok(!check(q,`(${x+1}, ${y})`).ok,id+" wrong pair accepted")}
  if(q.type==="ineq"){const a=L.parseIneq(q.answer);const f=(xv)=>Function("x",`return (${q.ineq})`)(xv);
    const strict=a.op==="<"||a.op===">",dir=a.op[0]==="<"?-1:1;
    ok(f(a.n+dir*1)===true&&f(a.n-dir*1)===false,id+" inequality directions wrong for "+q.ineq+" ans "+q.answer);
    ok(f(a.n)===!strict,id+" boundary wrong for "+q.ineq+" ans "+q.answer)}
  if(q.type==="poly"){ok(L.parsePoly(q.answer)!==null,id+" answer parses")}
}})}
function stripLen(s){return L.stripTags(s).trim().length}
function M2(a){return String(a).replace(/-/g,"−")}
// uniqueness: each generator should produce varied problems
for(const t of TOPICS){const seen=new Set();for(let k=0;k<200;k++)seen.add(t.gens[k%t.gens.length]().q);ok(seen.size>=15,t.id+" produces varied problems ("+seen.size+")")}
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

// ---------- 7. diagnostic ----------
function runDx(truth,perTopicCorrect){let dx=L.dxInit(),steps=0;
  while(true){const id=L.dxPickNext(dx);if(!id)break;steps++;const known=truth.has(id);dx=L.dxRecord(dx,id,L.dxTopicKnown(known?L.DX_Q_PER_TOPIC:0));if(steps>100)throw new Error("dx loop")}
  return {dx,steps}}
const allIds=TOPICS.map(t=>t.id);
let maxSteps=0,over=0,exact=0,trials=300,sumSteps=0;
for(let k=0;k<trials;k++){ // random ancestor-closed "true knowledge" set
  const truth=new Set();for(const t of TOPICS){if(Math.random()<0.5&&t.prereqs.every(p=>truth.has(p)))truth.add(t.id)}
  const {dx,steps}=runDx(truth);maxSteps=Math.max(maxSteps,steps);sumSteps+=steps;
  for(const id of allIds){if(dx.status[id]==="known"&&!truth.has(id))over++}
  if(allIds.every(id=>(dx.status[id]==="known")===truth.has(id)))exact++;
  const fin=L.dxFinish(L.newState(),dx,at(0));
  ok(allIds.every(id=>L.isMastered(fin.state,id)===(dx.status[id]==="known")),"dxFinish masters exactly the known topics");
  ok(allIds.every(id=>!L.isMastered(fin.state,id)||L.prereqsOf(id).every(p=>L.isMastered(fin.state,p))),"diagnostic never creates mastered topic with unmastered prereq");
  ok(allIds.filter(id=>L.topicStatus(fin.state,id,at(0))==="available").every(id=>L.prereqsOf(id).every(p=>L.isMastered(fin.state,p))),"unlocking consistent after diagnostic");
}
ok(over===0,"diagnostic never over-credits knowledge ("+over+")");ok(maxSteps<=L.DX_MAX_TOPICS,"diagnostic probes at most "+L.DX_MAX_TOPICS+" topics (max "+maxSteps+")");
console.log(`diagnostic: avg topics probed ${(sumSteps/trials).toFixed(1)} of ${TOPICS.length}, max ${maxSteps}, exact placement ${exact}/${trials}`);
ok(runDx(new Set(allIds)).steps<=L.DX_MAX_TOPICS,"a student who knows everything is placed within the cap ("+runDx(new Set(allIds)).steps+" topics)");
ok(runDx(new Set()).steps<=6,"a student who knows nothing is placed with few questions ("+runDx(new Set()).steps+" topics)");
{const {dx}=runDx(new Set(allIds));eq(Object.values(dx.status).filter(v=>v==="known").length,TOPICS.length,"all known -> all placed");}
{const {dx}=runDx(new Set());eq(Object.values(dx.status).filter(v=>v==="unknown").length,TOPICS.length,"none known -> none placed");}
ok(L.dxTopicKnown(2)&&!L.dxTopicKnown(1)&&!L.dxTopicKnown(0),"topic known only if all diagnostic questions right");
const dxs=L.dxFinish(L.newState(),runDx(new Set(["int-addsub","int-muldiv"])).dx,at(0));ok(dxs.state.diagnostic&&dxs.state.diagnostic.done&&dxs.state.topics["int-addsub"].src==="diagnostic","diagnostic recorded, src tagged");
ok(dxs.state.topics["int-addsub"].due>L.dayNum(at(0)),"diagnostic-placed topics scheduled for later review");

// ---------- 8. sync helpers ----------
const a=L.newState(),b=L.newState();a.updatedAt=5;b.updatedAt=9;
eq(L.pickNewer(a,b).source,"remote","newer remote wins");eq(L.pickNewer(b,a).source,"local","newer local wins");eq(L.pickNewer(a,null).source,"local","null remote");eq(L.pickNewer(a,{bogus:1}).source,"local","invalid remote ignored");eq(L.pickNewer({bogus:1},b).source,"remote","invalid local replaced");
ok(!L.validState({topics:{nonexistent:{}},xp:0,daily:{},streak:{}}),"unknown topic id invalid");
ok(L.validState(JSON.parse(JSON.stringify(S))),"state survives JSON round trip");
ok(JSON.stringify(many).length<150000,"worst-case state well under the 200 kB sql limit ("+JSON.stringify(many).length+" bytes)");

console.log(`generator runs: ${genRuns}; checks: ${checks}; failures: ${fails}`);
if(fails){console.log("TESTS FAILED");process.exit(1)}console.log("ALL TESTS PASSED");
