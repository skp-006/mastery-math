// ===== ENGINE: knowledge graph, mastery, spaced repetition, diagnostic, XP/streak (pure functions) =====
const PASS_CORRECT=5, PRACTICE_LEN=6;                 // mastery: 5 of 6 correct
const INTERVALS=[1,3,7,14,30,60,120];                 // days between reviews (grows after each success)
const DX_Q_PER_TOPIC=2, DX_MAX_TOPICS=20;             // diagnostic: 2 questions per topic, at most 14 topics probed
const XP={practiceCorrect:2,masteryBonus:10,reviewCorrect:3,extraCorrect:1};
const DAY=86400000;
const dayNum=ms=>Math.floor((ms-new Date(ms).getTimezoneOffset()*60000)/DAY);
const cl=o=>JSON.parse(JSON.stringify(o));

// ---- graph ----
const ORDER=Object.fromEntries(TOPICS.map((t,i)=>[t.id,i]));
const prereqsOf=id=>TOPIC_BY_ID[id].prereqs;
const dependentsOf=id=>TOPICS.filter(t=>t.prereqs.includes(id)).map(t=>t.id);
const _anc={},_desc={};
function ancestorsOf(id){if(_anc[id])return _anc[id];const s=new Set();for(const p of prereqsOf(id)){s.add(p);ancestorsOf(p).forEach(x=>s.add(x))}return _anc[id]=[...s]}
function descendantsOf(id){if(_desc[id])return _desc[id];const s=new Set();for(const d of dependentsOf(id)){s.add(d);descendantsOf(d).forEach(x=>s.add(x))}return _desc[id]=[...s]}
function graphProblems(){const errs=[];const ids=new Set();
  for(const t of TOPICS){if(ids.has(t.id))errs.push("duplicate "+t.id);ids.add(t.id)}
  for(const t of TOPICS){for(const p of t.prereqs){if(!ids.has(p))errs.push(t.id+" has unknown prereq "+p);else if(ORDER[p]>=ORDER[t.id])errs.push(t.id+" prereq "+p+" is not earlier in the list (cycle/order)")}
    if(!UNITS.some(u=>u.id===t.unit))errs.push(t.id+" bad unit")}
  return errs}

// ---- state ----
function newState(){return {v:1,updatedAt:0,topics:{},xp:0,goal:50,daily:{day:0,xp:0},streak:{count:0,last:0},diagnostic:null,course:null}}
function validState(s){if(!s||typeof s!=="object"||!s.topics||typeof s.topics!=="object")return false;
  for(const k in s.topics){if(!TOPIC_BY_ID[k])return false;const r=s.topics[k];if(!r||typeof r!=="object")return false}
  return typeof s.xp==="number"&&s.daily&&s.streak&&true}
function pickNewer(local,remote){const lv=validState(local),rv=validState(remote);
  if(!rv)return {state:local,source:"local"};if(!lv)return {state:remote,source:"remote"};
  return (+remote.updatedAt||0)>(+local.updatedAt||0)?{state:remote,source:"remote"}:{state:local,source:"local"}}
function normState(s){const n=newState();if(!validState(s))return n;return {...n,...cl(s),topics:cl(s.topics)}}

const rec=(S,id)=>S.topics[id]||null;
const isMastered=(S,id)=>!!(S.topics[id]&&S.topics[id].m);
const isUnlocked=(S,id)=>prereqsOf(id).every(p=>isMastered(S,p));
const missingPrereqs=(S,id)=>prereqsOf(id).filter(p=>!isMastered(S,p));
function topicStatus(S,id,now=Date.now()){const r=S.topics[id];
  if(r&&r.m)return r.due<=dayNum(now)?"due":"mastered";
  return isUnlocked(S,id)?"available":"locked"}
const nextTopic=(S,course)=>(course&&TOPICS.find(t=>t.course===course&&!isMastered(S,t.id)&&isUnlocked(S,t.id)))||TOPICS.find(t=>!isMastered(S,t.id)&&isUnlocked(S,t.id))||null;
const courseTopics=cid=>TOPICS.filter(t=>t.course===cid);
function courseStats(S,cid){const ts=courseTopics(cid),m=ts.filter(t=>isMastered(S,t.id)).length;return {total:ts.length,mastered:m,pct:ts.length?Math.round(100*m/ts.length):0}}
const activeCourse=S=>COURSE_BY_ID[S.course]?S.course:"g7";
// today's task queue: due reviews first, then the next lessons in the active course (in graph order), then extra practice if nothing else
function buildTasks(S,now=Date.now(),{lessons=3}={}){const tasks=[],due=dueTopics(S,now),c=activeCourse(S);
  if(due.length)tasks.push({kind:"review",n:Math.min(due.length,10),total:due.length,xp:Math.min(due.length,10)*XP.reviewCorrect});
  const seen=new Set();let t=nextTopic(S,c);
  const avail=TOPICS.filter(x=>!isMastered(S,x.id)&&isUnlocked(S,x.id));
  const inC=avail.filter(x=>x.course===c),rest=avail.filter(x=>x.course!==c);
  for(const x of inC.concat(rest)){if(tasks.filter(k=>k.kind==="lesson").length>=lessons)break;if(seen.has(x.id))continue;seen.add(x.id);
    tasks.push({kind:"lesson",id:x.id,xp:PRACTICE_LEN*XP.practiceCorrect+XP.masteryBonus})}
  if(!tasks.some(k=>k.kind==="lesson")&&countMastered(S)>0)tasks.push({kind:"mix",xp:8*XP.extraCorrect});
  return tasks}
const countMastered=S=>TOPICS.filter(t=>isMastered(S,t.id)).length;

// ---- practice / mastery ----
function makePractice(topic,n=PRACTICE_LEN){const out=[];let order=[];let last="";
  let lastG=-1;
  for(let i=0;i<n;i++){if(!order.length){order=shuffle(topic.gens.map((_,j)=>j));if(order.length>1&&order[0]===lastG)order.push(order.shift())}
    let q,tries=0;do{q=topic.gens[order[0]]();tries++}while(q.q===last&&tries<10);lastG=order.shift();last=q.q;out.push(q)}
  return out}
const masteryPassed=(correct,total=PRACTICE_LEN)=>total>=PRACTICE_LEN&&correct>=PASS_CORRECT;
function addXP(S,amt,now=Date.now()){const n=cl(S),d=dayNum(now);if(!n.daily||n.daily.day!==d)n.daily={day:d,xp:0};
  n.daily.xp+=amt;n.xp+=amt;
  if(n.daily.xp>=n.goal&&n.streak.last!==d){n.streak={count:n.streak.last===d-1?n.streak.count+1:1,last:d}}
  return n}
const currentStreak=(S,now=Date.now())=>S.streak.last>=dayNum(now)-1?S.streak.count:0;
const todayXP=(S,now=Date.now())=>S.daily&&S.daily.day===dayNum(now)?S.daily.xp:0;
const goalMetToday=(S,now=Date.now())=>todayXP(S,now)>=S.goal;
function setMastered(n,id,now,src){const d=dayNum(now);const r=n.topics[id]||{};
  n.topics[id]={...r,m:1,at:now,src,idx:0,due:d+INTERVALS[0],lapses:r.lapses||0,flag:0}}
function completePractice(S,id,correct,total,now=Date.now()){
  if(!TOPIC_BY_ID[id]||!isUnlocked(S,id))return {state:S,passed:false,xpGain:0,error:"locked"};
  let n=cl(S);const r=n.topics[id]||(n.topics[id]={});r.att=(r.att||[]).concat([{c:correct,n:total,t:now}]).slice(-10);
  const passed=masteryPassed(correct,total);let gain=correct*XP.practiceCorrect;const was=!!r.m;
  if(passed&&!was){setMastered(n,id,now,"practice");gain+=XP.masteryBonus}
  n=addXP(n,gain,now);n.updatedAt=now;return {state:n,passed,xpGain:gain,newlyMastered:passed&&!was}}

// ---- spaced repetition ----
function recordReview(S,id,ok,now=Date.now(),wasDue=true){
  const n=cl(S),r=n.topics[id],d=dayNum(now);if(!r||!r.m)return {state:S,flagged:[],xpGain:0};let gain=0,flagged=[];
  if(ok){gain=wasDue?XP.reviewCorrect:XP.extraCorrect;
    if(wasDue){r.idx=Math.min((r.idx||0)+1,INTERVALS.length-1);r.due=d+INTERVALS[r.idx];r.flag=0;r.last=d}}
  else{r.idx=0;r.due=d+INTERVALS[0];r.lapses=(r.lapses||0)+1;r.last=d;r.flag=0;r.failedAt=now;
    for(const p of prereqsOf(id)){const pr=n.topics[p];if(pr&&pr.m){pr.flag=1;pr.due=Math.min(pr.due,d);flagged.push(p)}}}
  const m=addXP(n,gain,now);m.updatedAt=now;return {state:m,flagged,xpGain:gain}}
function dueTopics(S,now=Date.now()){const d=dayNum(now);
  return TOPICS.filter(t=>S.topics[t.id]&&S.topics[t.id].m&&S.topics[t.id].due<=d)
   .sort((a,b)=>(S.topics[b.id].flag||0)-(S.topics[a.id].flag||0)||S.topics[a.id].due-S.topics[b.id].due||ORDER[a.id]-ORDER[b.id]).map(t=>t.id)}
// interleave: shuffle, then greedily avoid two adjacent items from the same unit
function interleave(ids){let pool=shuffle(ids),out=[];
  while(pool.length){const lastU=out.length?TOPIC_BY_ID[out[out.length-1]].unit:null;let i=pool.findIndex(x=>TOPIC_BY_ID[x].unit!==lastU);if(i<0)i=0;out.push(pool.splice(i,1)[0])}
  return out}
// review queue: due topics first (flagged first), optionally topped up with other mastered topics to reach minFill
function buildReviewQueue(S,now=Date.now(),{max=10,minFill=0}={}){
  const due=dueTopics(S,now);let pickIds=due.slice(0,max).map(id=>({id,wasDue:true}));
  if(pickIds.length<minFill){const extra=shuffle(TOPICS.filter(t=>isMastered(S,t.id)&&!due.includes(t.id)).map(t=>t.id)).slice(0,Math.min(max,minFill)-pickIds.length);
    pickIds=pickIds.concat(extra.map(id=>({id,wasDue:false})))}
  const order=interleave(pickIds.map(x=>x.id)),by=Object.fromEntries(pickIds.map(x=>[x.id,x]));return order.map(id=>by[id])}

// ---- diagnostic placement (adaptive binary search over the part of the graph relevant to the chosen starting course) ----
// scope = the chosen course's topics plus all of their prerequisites (so a Grade 7 student is never probed on Geometry)
function dxScope(cid){const s=new Set();for(const t of courseTopics(cid)){s.add(t.id);ancestorsOf(t.id).forEach(a=>s.add(a))}return TOPICS.filter(t=>s.has(t.id)).map(t=>t.id)}
function dxInit(course,S){const dx={status:{},tested:0,course:course||null,scope:course?dxScope(course):TOPICS.map(t=>t.id)};
  if(S)for(const id of dx.scope)if(isMastered(S,id)){dx.status[id]="known";for(const a of ancestorsOf(id))dx.status[a]="known"}   // retake: don't re-test what is already mastered
  return dx}
const dxUndetermined=dx=>(dx.scope||TOPICS.map(t=>t.id)).filter(id=>!dx.status[id]);
function dxPickNext(dx){if(dx.tested>=DX_MAX_TOPICS)return null;const und=dxUndetermined(dx);if(!und.length)return null;const inS=new Set(und);
  let best=null,bs=-1;for(const id of und){const a=ancestorsOf(id).filter(x=>inS.has(x)).length,d=descendantsOf(id).filter(x=>inS.has(x)).length;
    const score=Math.min(a,d)*100+a+d;if(score>bs){bs=score;best=id}}return best}
function dxRecord(dx,id,known){const n=cl(dx);n.tested++;
  if(known){n.status[id]="known";for(const a of ancestorsOf(id))if(!n.status[a])n.status[a]="known"}
  else{n.status[id]="unknown";const sc=n.scope?new Set(n.scope):null;for(const d of descendantsOf(id))if(!n.status[d]&&(!sc||sc.has(d)))n.status[d]="unknown"}return n}
const dxTopicKnown=(correct,asked=DX_Q_PER_TOPIC)=>asked>0&&correct===asked;
function dxFinish(S,dx,now=Date.now()){const n=cl(S),d=dayNum(now);let k=0;
  for(const t of TOPICS){if(dx.status[t.id]==="known"&&!isMastered(n,t.id)){
    n.topics[t.id]={...(n.topics[t.id]||{}),m:1,at:now,src:"diagnostic",idx:1,due:d+INTERVALS[1],lapses:0,flag:0};k++}}
  n.course=dx.course||n.course;n.diagnostic={done:1,at:now,tested:dx.tested,course:dx.course||null,known:Object.values(dx.status).filter(v=>v==="known").length,unknown:Object.values(dx.status).filter(v=>v!=="known").length};
  n.updatedAt=now;return {state:n,placed:k}}
function resetState(){const n=newState();n.updatedAt=Date.now();return n}
