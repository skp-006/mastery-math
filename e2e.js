// Headless smoke test of the BUILT public/index.html using jsdom:  npm i --no-save jsdom && node e2e.js
let JSDOM,VirtualConsole;try{({JSDOM,VirtualConsole}=require("jsdom"))}catch(e){try{({JSDOM,VirtualConsole}=require("/tmp/jsd/node_modules/jsdom"))}catch(e2){console.log("jsdom not installed (npm i --no-save jsdom) — skipping e2e");process.exit(0)}}
const fs=require("fs"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"public/index.html"),"utf8");
const errs=[];let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log("FAIL:",m)}};
const vc=new VirtualConsole();vc.on("jsdomError",e=>errs.push(String(e.message||e)));
const dom=new JSDOM(html,{virtualConsole:vc,runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true,
  beforeParse(w){w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message));
    w.import_=null}});
const w=dom.window,d=w.document,A=w.__mm;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{await sleep(200);
  ok(A&&d.getElementById("app").innerHTML.includes("placement test"),"home renders with placement-test card");
  ok(d.querySelectorAll(".node").length===24,"24 topic nodes rendered ("+d.querySelectorAll(".node").length+")");
  ok(d.getElementById("authBox").hidden===true,"auth UI hidden when Supabase placeholders are unset");
  ok(/Local mode/.test(d.getElementById("syncMsg").textContent),"local-mode message shown");
  ok(!w.CLOUD,"no cloud client created when unconfigured");
  // placement test: simulate a student who knows the first 8 topics (by oracle answering from q.answer)
  const known=new Set(["int-addsub","int-muldiv","frac-addsub","frac-muldiv","dec-ops","order-ops","expr-eval","onestep-eq"]);
  A.startDx();let guard=0;
  while(A.view.name==="dx"&&guard++<80){const D=A.D;const q=D.qs[D.qi];
    if(known.has(D.cur)){if(q.type==="mc")A.dxSubmit(q.answer);else{d.getElementById("ans").value=q.answer;A.dxSubmit()}}
    else A.dxSubmit("idk")}
  ok(A.view.name==="home"&&A.S.diagnostic&&A.S.diagnostic.done,"diagnostic finished");
  const m=Object.keys(A.S.topics).filter(k=>A.S.topics[k].m);
  ok(m.length===known.size&&m.every(k=>known.has(k)),"diagnostic placed exactly the known topics: "+m.join(","));
  ok(d.querySelectorAll(".node.mastered").length+d.querySelectorAll(".node.due").length===known.size,"map shows mastered topics");
  ok(d.querySelectorAll(".node.available").length>0&&d.querySelectorAll(".node.locked").length>0,"map shows available and locked topics");
  // locked topic page
  A.openTopic("sys-sub");ok(/Master these first/.test(d.getElementById("app").innerHTML),"locked topic shows prerequisites");
  // practice a topic, fail first then pass
  A.openTopic("twostep-eq");ok(/Worked examples/.test(d.getElementById("app").innerHTML),"lesson shows worked examples");
  const play=(nRight)=>{A.startPractice("twostep-eq");for(let i=0;i<6;i++){const q=A.run.items[A.run.i].q;const right=i<nRight;
    if(q.type==="mc")A.submit(right?q.answer:(q.answer+1)%q.choices.length);else{d.getElementById("ans").value=right?q.answer:"99999";A.submit()}
    ok(d.querySelector(".fb"),"feedback shown");A.nextQ()}};
  play(4);ok(A.view.name==="result"&&!A.view.passed&&!A.S.topics["twostep-eq"]?.m,"4/6 fails");
  ok(/Try a new set/.test(d.getElementById("app").innerHTML),"failure offers retry");
  const xp1=A.S.xp;play(5);ok(A.view.passed&&A.S.topics["twostep-eq"].m,"5/6 masters");ok(A.S.xp>xp1,"xp awarded");
  ok(/Mastered/.test(d.getElementById("app").innerHTML),"result shows mastery");
  A.go({name:"home"});ok(d.querySelector(".node.mastered"),"home shows newly mastered");
  ok(d.getElementById("stats").textContent.includes("XP"),"xp stats visible");
  // review: force due, fail one and check prereq flagging in UI state
  const S=A.S;for(const k in S.topics){S.topics[k].due=0}A.S=S;A.startReview(false);ok(A.run.items.length>0&&A.run.kind==="review","review queue built from due topics");
  const q0=A.run.items[0].q,id0=A.run.items[0].id;if(q0.type==="mc")A.submit((q0.answer+1)%q0.choices.length);else{d.getElementById("ans").value="zzz";A.submit()}
  ok(A.S.topics[id0].idx===0&&A.S.topics[id0].lapses===1,"failed review resets interval and counts lapse");
  const pre=TOPIC_PREREQS(id0);ok(pre.every(p=>A.S.topics[p].flag===1)||pre.length===0,"prereqs flagged after failed review");
  // persistence
  ok(JSON.parse(w.localStorage.getItem("mastery_math_v1")).xp===A.S.xp,"state persisted to localStorage");
  // mixed practice + every topic page renders
  A.startReview(true);ok(A.run&&A.run.items.length>0,"mixed practice builds");
  for(const t of w.eval("TOPICS")){A.S.topics[t.id]=A.S.topics[t.id]||{};A.openTopic(t.id);ok(d.getElementById("app").innerHTML.length>200,"topic page "+t.id)}
  ok(errs.length===0,"no uncaught page errors: "+errs.join("; "));
  console.log(`checked page behaviour; errors captured: ${errs.length}`);console.log(fails?`E2E FAILED (${fails})`:"E2E PASSED");process.exit(fails?1:0);
  function TOPIC_PREREQS(id){return w.eval(`TOPIC_BY_ID["${id}"].prereqs`).filter(p=>A.S.topics[p]&&A.S.topics[p].m)}
})();
