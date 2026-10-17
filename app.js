// ===== APP (browser UI). Depends on core.js, topics.js, engine.js (concatenated by build.py) =====
const KEY="mastery_math_v1";
const $=id=>document.getElementById(id);
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
let S;try{S=normState(JSON.parse(localStorage.getItem(KEY)))}catch(e){S=newState()}
let pushTimer=null;
function save(touch=true){if(touch)S.updatedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
  if(window.CLOUD&&CLOUD.user){clearTimeout(pushTimer);pushTimer=setTimeout(()=>CLOUD.push(S),800)}}
const commit=ns=>{S=ns;save()};

// ---------- navigation ----------
let view={name:"home"},run=null,D=null,UO={},CF=null,PICK="g7";
function go(v){view=v;render();window.scrollTo(0,0)}
function render(){renderTop();({home:vHome,course:vCourse,topic:vTopic,run:vRun,dx:vDx,result:vResult}[view.name]||vHome)()}
const cTitle=id=>COURSE_BY_ID[id]?COURSE_BY_ID[id].title:"";
function renderTop(){const now=Date.now(),st=currentStreak(S,now),c=activeCourse(S);
  $("courseBtn").textContent="📚 "+cTitle(c);
  $("xpChip").innerHTML=`⭐ <b>${S.xp}</b> XP`;$("stkChip").innerHTML=`🔥 <b>${st}</b> day${st===1?"":"s"}`;
  $("tabHome").classList.toggle("on",view.name==="home");$("tabCourse").classList.toggle("on",view.name==="course");
  const g=$("goalSel");if(g)g.value=String(S.goal)}
const STATUS_LABEL={locked:"🔒 Locked",available:"Available",mastered:"✓ Mastered",due:"⏰ Due for review"};
function dueLabel(d,now){const k=d-dayNum(now);return k<=0?"today":k===1?"tomorrow":"in "+k+" days"}

// ---------- dashboard (today's tasks) ----------
function ring(x,goal){const p=Math.min(1,goal?x/goal:0),R=46,C=2*Math.PI*R;
  return `<div class="ringw"><svg viewBox="0 0 110 110" width="132" height="132" role="img" aria-label="Daily XP ${x} of ${goal}"><circle cx="55" cy="55" r="${R}" fill="none" stroke="#e5e9f5" stroke-width="11"/>
  <circle cx="55" cy="55" r="${R}" fill="none" stroke="${p>=1?"#2f9e44":"#4c6ef5"}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 55 55)"/></svg>
  <div class="ringt"><b>${x}</b><span>/ ${goal} XP</span></div></div>`}
function taskInfo(k){
  if(k.kind==="lesson"){const t=TOPIC_BY_ID[k.id];return {icon:"📖",title:"Lesson: "+t.title,sub:cTitle(t.course)+" · "+UNIT_BY_ID()[t.unit].title,xp:k.xp}}
  if(k.kind==="review")return {icon:"⏰",title:`Review ${k.n} due topic${k.n===1?"":"s"}`,sub:k.total>k.n?`${k.total} due in total · do ${k.n} now`:"Spaced review keeps what you've mastered fresh",xp:k.xp};
  return {icon:"🔀",title:"Mixed practice",sub:"Interleaved questions from topics you've mastered",xp:k.xp}}
function doTask(i){const k=buildTasks(S,Date.now())[i];if(!k)return go({name:"home"});
  if(k.kind==="lesson")go({name:"topic",id:k.id,from:"home"});else startReview(k.kind==="mix")}
function startPlacementCard(){return `<div class="card"><h2>👋 Welcome! Where would you like to start?</h2>
  <p class="small">Pick a course. A short adaptive placement test finds what you already know, unlocks the right topics, and skips what you've mastered. Roughly 10–20 questions; “I don't know” is always fine.</p>
  <div class="chips">${COURSES.map(c=>`<button class="chipb ${PICK===c.id?"on":""}" onclick="PICK='${c.id}';render()">${esc(c.title)}</button>`).join("")}</div>
  <p class="small">${esc(COURSE_BY_ID[PICK].blurb)}</p>
  <button class="btn" onclick="startDx('${PICK}')">📋 Take the ${esc(cTitle(PICK))} placement test</button><button class="btn sec" onclick="skipDx('${PICK}')">Skip — start with the first lessons</button></div>`}
function vHome(){const now=Date.now();let h="";
  if(!S.diagnostic)h+=startPlacementCard();
  const tasks=buildTasks(S,now),x=todayXP(S,now),met=goalMetToday(S,now),c=activeCourse(S),cs=courseStats(S,c),due=dueTopics(S,now).length;
  h+=`<div class="dash"><div class="col">
  <div class="card goal">${ring(x,S.goal)}<div><h2>Today</h2><div class="small">${met?"✅ Daily goal reached — nice work! Keep going for bonus XP.":`${S.goal-x} XP to reach your daily goal`}</div>
   <div class="small" style="margin-top:6px">🔥 ${currentStreak(S,now)}-day streak${due?` · <b style="color:var(--o)">${due} topic${due===1?"":"s"} due for review</b>`:""}</div></div></div>`;
  if(tasks.length){const t0=taskInfo(tasks[0]);
    h+=`<div class="card upnext"><div class="eyebrow">Up next</div><div class="uptitle">${t0.icon} ${esc(t0.title)}</div><div class="small">${esc(t0.sub)} · +${t0.xp} XP</div>
     <button class="btn big" onclick="doTask(0)">▶ ${tasks[0].kind==="lesson"?"Start lesson":"Start"}</button></div>
     <div class="card"><h3 style="margin-top:0">Today's task queue</h3><ol class="tasks">${tasks.map((k,i)=>{const t=taskInfo(k);
       return `<li class="${i===0?"first":""}"><button onclick="doTask(${i})"><span class="ti">${t.icon}</span><span class="tt"><b>${esc(t.title)}</b><span class="small">${esc(t.sub)}</span></span><span class="tx">+${t.xp} XP</span></button></li>`}).join("")}</ol>
     <div class="small">Finish a task and you'll land back here with the next one ready.</div></div>`}
  else h+=`<div class="card"><div class="win">🏆 You've mastered every topic available. Come back as reviews fall due!</div></div>`;
  h+=`</div><div class="col"><div class="card"><h3 style="margin-top:0">Course progress</h3>${COURSES.map(co=>{const s=courseStats(S,co.id);
    return `<button class="cprog ${co.id===c?"cur":""}" onclick="CF='${co.id}';go({name:'course'})"><span class="cph"><b>${esc(co.title)}</b>${co.id===c?`<span class="badge available">Current</span>`:""}<span class="small">${s.pct}% · ${s.mastered}/${s.total}</span></span><span class="bar"><i style="width:${s.pct}%"></i></span></button>`}).join("")}
   <div style="margin-top:8px"><button class="btn sec sm" onclick="go({name:'course'})">🗺️ Open course map</button></div></div>
   <div class="card small">Placement: ${S.diagnostic?(S.diagnostic.skipped?"skipped.":`${S.diagnostic.known} topics placed as known${S.diagnostic.course?" ("+esc(cTitle(S.diagnostic.course))+")":""}.`):"not taken yet."} <button class="link" onclick="CF=null;go({name:'course'})">Retake placement…</button></div></div></div>`;
  $("app").innerHTML=h}

// ---------- course screen (full map: course → unit → topic) ----------
function vCourse(){const now=Date.now(),act=activeCourse(S);if(!CF)CF=act;const cf=CF,list=cf==="all"?COURSES:COURSES.filter(c=>c.id===cf);let h="";
  h+=`<div class="card"><h2>🗺️ Course map</h2><div class="chips">${COURSES.map(c=>`<button class="chipb ${cf===c.id?"on":""}" onclick="CF='${c.id}';render()">${esc(c.title)} <span class="small">${courseStats(S,c.id).pct}%</span></button>`).join("")}<button class="chipb ${cf==="all"?"on":""}" onclick="CF='all';render()">All courses</button></div>
  <div class="legend"><span class="badge locked">🔒 Locked</span> needs prerequisites · <span class="badge available">Available</span> · <span class="badge mastered">✓ Mastered</span> · <span class="badge due">⏰ Due</span></div></div>`;
  for(const co of list){const s=courseStats(S,co.id),us=UNITS.filter(u=>u.course===co.id);
    h+=`<div class="card"><div class="ch2"><div><h2 style="margin:0">${esc(co.title)}</h2><div class="small">${esc(co.blurb)}</div></div>
     <div class="chbtns">${co.id===act?`<span class="badge available">Current course</span>`:`<button class="btn sec sm" onclick="setCourse('${co.id}')">Make current</button>`}<button class="btn sec sm" onclick="startDx('${co.id}')">📋 Placement test</button></div></div>
     <div class="small" style="margin-top:6px">${s.pct}% mastered · ${s.mastered} of ${s.total} topics</div><div class="bar"><i style="width:${s.pct}%"></i></div>`;
    for(const u of us){const ts=TOPICS.filter(t=>t.unit===u.id);if(!ts.length)continue;const m=ts.filter(t=>isMastered(S,t.id)).length;
      const act2=ts.some(t=>{const st=topicStatus(S,t.id,now);return st==="available"||st==="due"});const open=u.id in UO?UO[u.id]:(cf!=="all"&&act2);
      h+=`<details class="unitd" ${open?"open":""} ontoggle="UO['${u.id}']=this.open"><summary><span class="un">${esc(u.title)}</span><span class="small">${m}/${ts.length}</span><span class="bar mini"><i style="width:${Math.round(100*m/ts.length)}%"></i></span></summary><div class="grid">`;
      for(const t of ts){const st=topicStatus(S,t.id,now),r=S.topics[t.id],last=r&&r.att&&r.att.length?r.att[r.att.length-1]:null;
        const meta=st==="locked"?"Needs: "+missingPrereqs(S,t.id).map(p=>TOPIC_BY_ID[p].title).join(", "):st==="due"||st==="mastered"?(r.flag?"⚑ flagged: a later topic was missed · ":"")+"next review "+dueLabel(r.due,now):(last?`Last set: ${last.c}/${last.n} (need ${PASS_CORRECT})`:"Not started");
        h+=`<button class="node ${st}" onclick="go({name:'topic',id:'${t.id}',from:'course'})"><span class="badge ${st}">${STATUS_LABEL[st]}</span><span class="t">${esc(t.title)}</span><div class="m">${esc(t.std)} · ${esc(meta)}</div></button>`}
      h+=`</div></details>`}
    h+=`</div>`}
  $("app").innerHTML=h}
function setCourse(id){S.course=id;save();render()}

// ---------- topic page: lesson ----------
function openTopic(id){go({name:"topic",id,from:view.name==="course"?"course":(view.name==="topic"&&view.from)||"home"})}
function vTopic(){const t=TOPIC_BY_ID[view.id],st=topicStatus(S,t.id),now=Date.now();let h=`<div class="card"><button class="link" onclick="go({name:'${view.from==="course"?"course":"home"}'})">← ${view.from==="course"?"Course map":"Dashboard"}</button><h2>${esc(t.title)} <span class="badge ${st}">${STATUS_LABEL[st]}</span></h2><div class="small">${esc(cTitle(t.course))} · ${esc(UNITS.find(u=>u.id===t.unit).title)} · standard ${esc(t.std)}</div>`;
  if(st==="locked"){const m=missingPrereqs(S,t.id);h+=`<p>🔒 Master these first:</p><div>${m.map(p=>`<button class="btn sec" onclick="openTopic('${p}')">${esc(TOPIC_BY_ID[p].title)} ${isUnlocked(S,p)?"":"🔒"}</button>`).join("")}</div></div>`;$("app").innerHTML=h;return}
  const g0=t.gens[0](),g1=t.gens[1]?t.gens[1]():t.gens[0]();
  h+=`<p>${esc(t.lesson.intro)}</p><h3>Key ideas</h3><ul class="pts">${t.lesson.points.map(p=>`<li>${esc(p)}</li>`).join("")}</ul><h3>Worked examples</h3>`;
  for(const q of [g0,g1])h+=`<div class="ex"><div class="q">${q.q}</div><div class="steps"><ol>${q.steps.map(s=>`<li>${s}</li>`).join("")}</ol></div></div>`;
  h+=`<p>${st==="due"||st==="mastered"?`You've mastered this. Next review ${dueLabel(S.topics[t.id].due,now)}.`:`Practice: <b>${PRACTICE_LEN} questions — get ${PASS_CORRECT} right to master this topic.</b>`}</p>
  <button class="btn" onclick="startPractice('${t.id}')">${isMastered(S,t.id)?"Practice again":"Start practice"}</button></div>`;
  $("app").innerHTML=h}

// ---------- shared question runner (practice + review) ----------
function startPractice(id){run={kind:"practice",id,items:makePractice(TOPIC_BY_ID[id]).map(q=>({id,q})),i:0,answered:false,xp:0,flagged:[]};go({name:"run"})}
function startReview(mix){const queue=buildReviewQueue(S,Date.now(),mix?{max:10,minFill:8}:{max:10});
  if(!queue.length){alert("Nothing to review yet — master a topic first.");return}
  run={kind:"review",mix,items:queue.map(x=>({id:x.id,wasDue:x.wasDue,q:pick(TOPIC_BY_ID[x.id].gens)()})),i:0,answered:false,xp:0,flagged:[]};go({name:"run"})}
const HINT={expr:"Type like (x+2)(x-3), 3sqrt(2), 5pi, x^2/(x-1). Use ^ for powers.",eq:"Type an equation, e.g. y = 2x + 3",set:"List all solutions separated by commas, e.g. -3, 2 (or 'none')",list:"Type the numbers separated by commas, e.g. <3, -2>",cplx:"Type like 3 + 4i or -2i",interval:"Interval notation, e.g. (-inf, 3] or [2, 5) U (7, inf)",num:"Type a number or fraction, e.g. -3/4",poly:"Type like 2x^2 - 5x + 3 (use ^ for exponents, no parentheses). For equations of a line write y = …",ineq:"Type like x > 3 or x <= -2",pair:"Type an ordered pair like (3, -2)"};
function qHTML(q,idx,total,{showDots=true,idk=false}={}){let h=`<div class="q">${q.q}</div>`;
  if(q.type==="mc")h+=q.choices.map((c,i)=>`<button class="ch" onclick="submit(${i})">${esc(c)}</button>`).join("");
  else h+=`<input id="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" placeholder="Your answer" onkeydown="if(event.key==='Enter'){event.stopPropagation();submit()}"><div class="small">${HINT[q.type]||""}</div><button class="btn" onclick="submit()">Check</button>`;
  return h}
function feedbackHTML(q,res){const ok=res.ok;return `<div class="fb ${ok?"ok":"no"}">${ok?"✅ Correct!":"❌ Not quite. Correct answer: <b>"+esc(showAns(q))+"</b>"}${res.note?`<div class="small">${esc(res.note)}</div>`:""}</div>
  <details class="steps" ${ok?"":"open"}><summary><b>Worked solution</b></summary><ol>${q.steps.map(s=>`<li>${s}</li>`).join("")}</ol></details>`}
function vRun(){const it=run.items[run.i],q=it.q;let h=`<div class="card">`;
  h+=run.kind==="practice"?`<span class="tag">${esc(TOPIC_BY_ID[run.id].title)}</span> <span class="small">need ${PASS_CORRECT} of ${PRACTICE_LEN}</span>`:`<span class="tag rv">${run.mix?"🔀 Mixed practice":"⏰ Review"}: ${esc(TOPIC_BY_ID[it.id].title)}</span> <span class="small">${it.wasDue===false?"not due — extra practice":"due"}</span>`;
  h+=`<div class="dots" style="margin-top:8px">${run.items.map((x,i)=>`<i class="${x.ok===true?"ok":x.ok===false?"no":""} ${i===run.i?"cur":""}"></i>`).join("")}</div>`;
  h+=qHTML(q);
  if(run.answered){h+=feedbackHTML(q,run.last.res);h+=`<button class="btn" id="nextBtn" onclick="nextQ()">${run.i===run.items.length-1?"Finish":"Next"} →</button>`}
  h+=`<div style="margin-top:10px"><button class="link" onclick="quitRun()">Quit</button></div></div>`;
  $("app").innerHTML=h;
  if(run.answered){if(q.type==="mc")document.querySelectorAll(".ch").forEach((b,j)=>{b.disabled=true;if(j===q.answer)b.classList.add("good");else if(j===run.last.input)b.classList.add("bad")});
    else{const a=$("ans");a.value=run.last.input;a.disabled=true}const nb=$("nextBtn");if(nb)nb.focus()}
  else{const a=$("ans");if(a)a.focus()}}
function submit(idx){if(view.name==="dx")return dxSubmit(idx);if(!run||run.answered)return;const it=run.items[run.i],q=it.q;
  let input=q.type==="mc"?idx:($("ans")?$("ans").value:"");if(q.type!=="mc"&&!String(input).trim())return;
  const res=check(q,input);run.answered=true;run.last={res,input};it.ok=res.ok;
  if(run.kind==="review"){const r=recordReview(S,it.id,res.ok,Date.now(),it.wasDue!==false);S=r.state;save(false);run.xp+=r.xpGain;
    if(!res.ok)r.flagged.forEach(p=>{if(!run.flagged.includes(p))run.flagged.push(p)})}
  render()}
function nextQ(){if(!run||!run.answered)return;
  if(run.i<run.items.length-1){run.i++;run.answered=false;run.last=null;render();return}
  if(run.kind==="practice"){const correct=run.items.filter(x=>x.ok).length,before=new Set(TOPICS.filter(t=>isUnlocked(S,t.id)).map(t=>t.id));
    const r=completePractice(S,run.id,correct,run.items.length,Date.now());commit(r.state);
    const unlocked=TOPICS.filter(t=>isUnlocked(S,t.id)&&!before.has(t.id)&&!isMastered(S,t.id)).map(t=>t.id);
    go({name:"result",kind:"practice",id:run.id,correct,total:run.items.length,passed:r.passed,newly:r.newlyMastered,xp:r.xpGain,unlocked})}
  else{const correct=run.items.filter(x=>x.ok).length;const v={name:"result",kind:"review",mix:run.mix,correct,total:run.items.length,xp:run.xp,flagged:run.flagged.slice(),wrong:run.items.filter(x=>!x.ok).map(x=>x.id)};save();go(v)}}
function quitRun(){if(confirm("Quit this set? Practice progress in an unfinished set isn't saved."))go({name:"home"})}
function nextTaskBtns(){const t=buildTasks(S,Date.now())[0];return (t?`<button class="btn" onclick="doTask(0)">Next task: ${esc(taskInfo(t).title)} →</button>`:"")+`<button class="btn sec" onclick="go({name:'home'})">Dashboard</button>`}
function vResult(){const v=view;let h=`<div class="card">`;
  if(v.kind==="practice"){const t=TOPIC_BY_ID[v.id];
    h+=`<h2>${v.correct} / ${v.total} correct</h2>`;
    if(v.newly)h+=`<div class="win">🎉 Mastered: ${esc(t.title)}! (+${v.xp} XP incl. mastery bonus)</div>`;
    else if(v.passed)h+=`<div class="win">✅ Passed again (+${v.xp} XP).</div>`;
    else h+=`<p>You need ${PASS_CORRECT} of ${PRACTICE_LEN} to master this topic. Re-read the lesson, then try a fresh set of new problems. (+${v.xp} XP for effort)</p>`;
    if(v.unlocked.length)h+=`<p>🔓 Unlocked: ${v.unlocked.map(id=>`<button class="btn sec sm" onclick="openTopic('${id}')">${esc(TOPIC_BY_ID[id].title)}</button>`).join("")}</p>`;
    h+=v.passed?nextTaskBtns():`<button class="btn" onclick="startPractice('${v.id}')">Try a new set</button><button class="btn sec" onclick="openTopic('${v.id}')">Review lesson</button><button class="btn sec" onclick="go({name:'home'})">Dashboard</button>`}
  else{h+=`<h2>${v.mix?"Mixed practice":"Review"} done: ${v.correct} / ${v.total}</h2><p>+${v.xp} XP</p>`;
    if(v.wrong.length)h+=`<p>Missed: ${v.wrong.map(id=>esc(TOPIC_BY_ID[id].title)).join(", ")}. These come back for review tomorrow.</p>`;
    if(v.flagged.length)h+=`<div class="win">⚑ To shore up the foundations, these prerequisite topics were flagged for review now: ${v.flagged.map(id=>esc(TOPIC_BY_ID[id].title)).join(", ")}.</div>`;
    h+=nextTaskBtns()}
  $("app").innerHTML=h+`</div>`}

// ---------- placement test ----------
function skipDx(c){S.diagnostic={done:1,skipped:1,at:Date.now(),tested:0,known:0,unknown:0};if(c)S.course=c;save();render()}
function startDx(c){c=c||activeCourse(S);D={dx:dxInit(c,S),cur:null,qs:[],qi:0,right:0,answered:false};view={name:"dx"};dxNextTopic()}
function dxNextTopic(){const id=dxPickNext(D.dx);if(!id)return dxDone();D.cur=id;D.qs=makePractice(TOPIC_BY_ID[id],DX_Q_PER_TOPIC);D.qi=0;D.right=0;render();window.scrollTo(0,0)}
function vDx(){if(!D)return go({name:"home"});const q=D.qs[D.qi],known=Object.keys(D.dx.status).length,total=D.dx.scope.length;
  $("app").innerHTML=`<div class="card"><h2>📋 Placement test · ${esc(cTitle(D.dx.course))}</h2><div class="small">Mapped ${known} of ${total} topics · answer what you can; “I don't know” is fine — it just helps place you correctly.</div><div class="bar"><i style="width:${Math.round(100*known/total)}%"></i></div>
  ${qHTML(q)}<div><button class="btn sec sm" onclick="dxSubmit('idk')">I don't know</button></div><div style="margin-top:10px"><button class="link" onclick="D=null;go({name:'home'})">Cancel test</button></div></div>`;
  const a=$("ans");if(a)a.focus()}
function dxSubmit(idx){if(!D)return;const q=D.qs[D.qi];let ok=false;
  if(idx!=="idk"){const input=q.type==="mc"?idx:($("ans")?$("ans").value:"");if(q.type!=="mc"&&!String(input).trim())return;ok=check(q,input).ok}
  if(ok)D.right++;D.qi++;
  if(!ok||D.qi>=D.qs.length){D.dx=dxRecord(D.dx,D.cur,dxTopicKnown(D.right,D.qs.length));dxNextTopic()}else render()}
function dxDone(){const r=dxFinish(S,D.dx,Date.now());commit(r.state);const summary={placed:r.placed,tested:D.dx.tested};D=null;
  view={name:"home"};render();alert(`Placement complete: ${summary.placed} topic${summary.placed===1?"":"s"} marked as known (they'll come back for review in a few days). Your dashboard is updated.`)}

// ---------- settings ----------
function setGoal(n){S.goal=n;save();render()}
function resetAll(){if(confirm("Reset ALL progress on this account/device? This can't be undone.")){S=resetState();save();go({name:"home"})}}
function toggleMenu(open){const m=$("menu");if(open===undefined)open=m.hidden;if(open)m.style.top=(document.querySelector("header").getBoundingClientRect().bottom+6)+"px";m.hidden=!open;$("menuBack").hidden=!open;$("menuBtn").setAttribute("aria-expanded",open)}
document.addEventListener("keydown",e=>{if(e.key==="Escape")toggleMenu(false);
  if(e.key==="Enter"&&view.name==="run"&&run&&run.answered){const b=$("nextBtn");if(b&&document.activeElement!==b)nextQ()}});

// ===== Cloud sync (Supabase Auth + Postgres) — only active when SUPABASE_URL / SUPABASE_KEY are filled in =====
function cloudConfigured(){return typeof SUPABASE_URL==="string"&&/^https:\/\/[^\s"]+$/.test(SUPABASE_URL)&&typeof SUPABASE_KEY==="string"&&SUPABASE_KEY.length>20&&SUPABASE_KEY!=="SUPABASE_KEY"}
function setSyncMsg(t){const e=$("syncMsg");if(e)e.textContent=t}
async function loadSupabase(){for(const u of["https://esm.sh/@supabase/supabase-js@2","https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"]){try{const m=await import(u);if(m.createClient)return m}catch(e){}}return null}
async function initCloud(){
  if(!cloudConfigured()){$("authBox").hidden=true;setSyncMsg("Local mode: progress is saved in this browser only. (Cloud login is switched off until Supabase is configured.)");return}
  if(!navigator.onLine)setSyncMsg("Offline — progress saved on this device.");
  const m=await loadSupabase();if(!m){setSyncMsg("Cloud sync unavailable (offline?) — progress saved on this device.");return}
  const sb=m.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:"mastery-math-auth"}});
  window.CLOUD={user:null,sb,
    push:async st=>{if(!CLOUD.user)return;const{error}=await sb.from("progress").upsert({user_id:CLOUD.user.id,state:st,updated_at:st.updatedAt||0});
      setSyncMsg(error?"⚠️ Sync failed ("+(error.message||"offline")+") — will retry on next answer.":"☁️ Synced "+new Date().toLocaleTimeString())},
    pull:async()=>{const{data,error}=await sb.from("progress").select("state,updated_at").eq("user_id",CLOUD.user.id).maybeSingle();if(error)throw error;
      if(!data)return null;const s=data.state;if(s&&typeof s==="object")s.updatedAt=+data.updated_at||s.updatedAt||0;return s}};
  let lastUid=null;
  sb.auth.onAuthStateChange((ev,session)=>{const u=session&&session.user||null;CLOUD.user=u;renderAuth();
    if(u)cleanAuthUrl();
    if(ev==="PASSWORD_RECOVERY"){toggleMenu(true);$("pwSetBox").open=true;setSyncMsg("Choose a new password below.")}
    if(!u){lastUid=null;return}if(u.id===lastUid)return;lastUid=u.id;setTimeout(syncOnLogin,0)});
  authErrorFromUrl();
  window.addEventListener("online",()=>CLOUD.user&&CLOUD.push(S));
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&CLOUD.user)syncOnLogin()});
}
function cleanAuthUrl(){const h=location.hash,qs=new URLSearchParams(location.search);
  if(/access_token|refresh_token|error_description|type=/.test(h)||qs.has("code")||qs.has("error")){
    ["code","error","error_code","error_description"].forEach(k=>qs.delete(k));const q=qs.toString();history.replaceState(null,"",location.pathname+(q?"?"+q:""))}}
function authErrorFromUrl(){const p=new URLSearchParams(location.hash.slice(1)+"&"+location.search.slice(1));const d=p.get("error_description");
  if(d){setSyncMsg("❌ Sign-in failed: "+d.replace(/\+/g," "));cleanAuthUrl()}}
async function setPassword(){if(!window.CLOUD)return;const p=$("newPass").value,p2=$("newPass2").value;
  if(p.length<8)return setSyncMsg("Password must be at least 8 characters.");if(p!==p2)return setSyncMsg("Passwords don't match.");
  setSyncMsg("Saving password…");const{error}=await CLOUD.sb.auth.updateUser({password:p});
  if(error)return setSyncMsg("❌ "+error.message);$("newPass").value=$("newPass2").value="";$("pwSetBox").open=false;setSyncMsg("✅ Password saved.")}
// On login: the local copy is only merged with the cloud copy if it is anonymous or belongs to the same user (shared-device safety).
async function syncOnLogin(){setSyncMsg("Loading cloud progress…");const uid=CLOUD.user.id;
  try{const remote=await CLOUD.pull();
    if(S.owner&&S.owner!==uid){S=remote&&validState(remote)?normState(remote):newState();S.owner=uid;save(false);render();setSyncMsg("☁️ Loaded this account's progress.");if(!remote)await CLOUD.push(S);return}
    const r=pickNewer(S,remote);
    if(r.source==="remote"){S=normState(r.state);S.owner=uid;save(false);render();setSyncMsg("☁️ Loaded newer progress from cloud.")}
    else{S.owner=uid;save(false);await CLOUD.push(S)}}
  catch(e){setSyncMsg("⚠️ Couldn't reach cloud ("+(e.message||e)+"); using this device's progress.")}}
function renderAuth(){const u=window.CLOUD&&CLOUD.user;$("authOut").hidden=!!u;$("authIn").hidden=!u;if(u)$("authWho").textContent=u.email;
  const b=$("authBadge");b.textContent=u?"Signed in":window.CLOUD?"Signed out":"Local";b.classList.toggle("on",!!u)}
async function authDo(kind){if(!window.CLOUD)return setSyncMsg("Cloud sync not available right now.");
  const e=$("authEmail").value.trim(),p=$("authPass").value,sb=CLOUD.sb,here=location.origin+location.pathname;let r;
  if(!e)return setSyncMsg("Enter your email.");
  if(kind==="reset"){r=await sb.auth.resetPasswordForEmail(e,{redirectTo:here});return setSyncMsg(r.error?"❌ "+r.error.message:"📧 Password reset email sent.")}
  if(!p)return setSyncMsg("Enter your password.");if(kind==="up"&&p.length<8)return setSyncMsg("Choose a password with at least 8 characters.");
  r=kind==="up"?await sb.auth.signUp({email:e,password:p,options:{emailRedirectTo:here}}):await sb.auth.signInWithPassword({email:e,password:p});
  if(r.error)return setSyncMsg("❌ "+r.error.message);$("authPass").value="";
  if(kind==="up"&&!r.data.session)setSyncMsg("📧 Account created. Check your email and tap the confirmation link, then sign in.")}
async function signOutCloud(){if(!window.CLOUD)return;try{clearTimeout(pushTimer);await CLOUD.push(S)}catch(e){}
  await CLOUD.sb.auth.signOut();S=newState();save(false);render();setSyncMsg("Signed out. This device's copy was cleared; sign in to load your progress.")}

// test/debug hook (harmless in production)
window.__mm={get S(){return S},set S(v){S=v},go,render,doTask,setCourse,startPractice,startReview,startDx,openTopic,submit,nextQ,dxSubmit,get run(){return run},get D(){return D},get view(){return view}};
renderAuth();render();initCloud();
