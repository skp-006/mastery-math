// ===== TOPICS: knowledge graph + lessons + randomized problem generators =====
// Standards tags are best-effort labels for NYS Next Generation Math Learning Standards (verify against NYSED docs).
const ASK=t=>`<b>Ask:</b> ${t}`, RULE=t=>`<b>Rule:</b> ${t}`, WORK=t=>`<b>Work:</b> ${t}`, ANS=t=>`<b>Answer:</b> ${t}`;
const addP=t=>t[0]==="-"?" - "+t.slice(1):" + "+t;
const sgn=n=>n<0?-1:1;
function addExplain(a,b){const s=a+b;
  if(sgn(a)===sgn(b))return `same signs: add the absolute values and keep the sign: ${Math.abs(a)} + ${Math.abs(b)} = ${Math.abs(s)}, so the result is ${s}`;
  const big=Math.abs(a)>Math.abs(b)?a:b;return `different signs: subtract the smaller absolute value from the larger (${Math.max(Math.abs(a),Math.abs(b))} − ${Math.min(Math.abs(a),Math.abs(b))} = ${Math.abs(s)}) and keep the sign of ${big} (the larger absolute value): ${s}`}
const RULE_ADD="Same signs: add absolute values, keep the sign. Different signs: subtract absolute values, keep the sign of the number farther from 0.";
const eqMsg=(x)=>`Check: substitute back to make sure both sides match.`;
// Unit (strand) groupings for the dashboard
const COURSES=[
 {id:"g7",title:"Grade 7",blurb:"Rational numbers, ratios, expressions, geometry and probability basics"},
 {id:"g8",title:"Grade 8",blurb:"Exponents, radicals, linear functions, transformations, bivariate data"},
 {id:"a1",title:"Algebra I",blurb:"Linear and quadratic functions, factoring, exponentials, statistics"},
 {id:"geo",title:"Geometry",blurb:"Congruence, similarity, trigonometry, circles, coordinate geometry, volume"},
 {id:"a2",title:"Algebra II",blurb:"Polynomials, complex numbers, rational/radical, exponential/log, trig, series, statistics"},
 {id:"pc",title:"Precalculus",blurb:"Functions, trig identities, vectors, matrices, polar/parametric, limits"}];
const COURSE_BY_ID=Object.fromEntries(COURSES.map(c=>[c.id,c]));
// Unit (strand) groupings; `course` says where the unit lives on the Course screen
const UNITS=[
 {id:"rn",course:"g7",title:"Rational Numbers"},{id:"rp",course:"g7",title:"Ratios & Proportions"},{id:"ee",course:"g7",title:"Expressions & Equations"},
 {id:"a1eq",course:"a1",title:"Equations"},{id:"a1lin",course:"a1",title:"Linear Functions"},{id:"a1sys",course:"a1",title:"Systems"},{id:"a1exp",course:"a1",title:"Exponents & Polynomials"}];
const UNIT_BY_ID=()=>Object.fromEntries(UNITS.map(u=>[u.id,u]));
// ---- authoring kit for the generators added in later files ----
// mk(type,q,answer,rule,work,opts): builds a question with the standard Ask/Rule/Work/Answer steps. opts.u = unit suffix shown in the final step;
// verification hints used only by test.js (js, pe, fx, jsc, jsl, inside, ineq, eqs...) ride along as extra fields.
const mk=(type,q,ans,rule,work,o={})=>{const {ask,u,...rest}=o;return {type,q:M(q),answer:String(ans),steps:[ASK(ask||"Work out the answer."),RULE(rule),WORK(M(work)),ANS(M(String(ans))+(u||""))],...rest}};
const rdn=(v,d=0)=>{const f=Math.pow(10,d);return String(Math.round((v+Math.sign(v)*1e-12)*f)/f)};
const fx=(r,v="x")=>r===0?v:"("+v+(r<0?" + "+(-r):" - "+r)+")";             // (x - r)
const lf=(a,r,v="x")=>a===1?"("+v+(r<0?" + "+(-r):" - "+r)+")":"("+cf(a,v)+(r<0?" + "+(-r):" - "+r)+")";
const quad=(a,b,c,v="x")=>polyStr([[a,v+"^2"],[b,v],[c,""]]);
const TOPICS=[];
const T=(id,unit,std,title,prereqs,intro,points,gens)=>TOPICS.push({id,unit,std,title,prereqs,lesson:{intro,points},gens});
const addUnits=(course,list)=>list.forEach(([id,title])=>UNITS.push({id,course,title}));
const nzr=(a,b)=>rnz(a,b);
function distinct(n,lo,hi){const s=new Set();while(s.size<n)s.add(ri(lo,hi));return [...s]}
function distinctNZ(n,lo,hi){const s=new Set();while(s.size<n)s.add(rnz(lo,hi));return [...s]}
const mcq=(q,correct,wrongs,rule,work,o={})=>{const ch=shuffle([correct,...wrongs]);return {type:"mc",q:M(q),choices:ch,answer:ch.indexOf(correct),
  steps:[ASK(o.ask||"Choose the best answer."),RULE(rule),WORK(M(work)),ANS(M(correct))],...o}};
TOPICS.push(
// ---------------- Grade 7: Rational numbers ----------------
{id:"int-addsub",unit:"rn",grade:7,std:"7.NS.1",title:"Add & subtract integers",prereqs:[],
 lesson:{intro:"Integers are the whole numbers and their negatives. Think of a number line: adding moves right (if positive) or left (if negative).",
  points:["Same signs: add the absolute values and keep the sign. (−4) + (−3) = −7.","Different signs: subtract the smaller absolute value from the larger and keep the sign of the bigger one. (−9) + 5 = −4.","Subtracting is adding the opposite: a − b = a + (−b). So 3 − (−2) = 3 + 2 = 5."]},
 gens:[
 ()=>{const a=rnz(-15,15),b=rnz(-15,15),s=a+b;return {type:"num",js:`${a}+${b}`,q:M(`Compute: ${P(a)} + ${P(b)}`),answer:String(s),
   steps:[ASK(M(`Add ${P(a)} and ${P(b)}.`)),RULE(RULE_ADD),WORK(M(addExplain(a,b))),ANS(M(s))]}},
 ()=>{const a=rnz(-15,15),b=rnz(-15,15),s=a-b;return {type:"num",js:`${a}-(${b})`,q:M(`Compute: ${P(a)} - ${P(b)}`),answer:String(s),
   steps:[ASK(M(`Subtract ${P(b)} from ${P(a)}.`)),RULE("Subtracting a number is the same as adding its opposite: a − b = a + (−b)."),
   WORK(M(`${P(a)} - ${P(b)} = ${P(a)} + ${P(-b)}; ${addExplain(a,-b)}`)),ANS(M(s))]}},
 ()=>{const a=rnz(-12,12),b=rnz(-12,12),c=rnz(-12,12),s=a+b-c;return {type:"num",js:`${a}+(${b})-(${c})`,q:M(`Compute: ${P(a)} + ${P(b)} - ${P(c)}`),answer:String(s),
   steps:[ASK("Evaluate left to right, one step at a time."),RULE("Work left to right. Rewrite subtraction as adding the opposite."),
   WORK(M(`${P(a)} + ${P(b)} = ${a+b}; then ${a+b} - ${P(c)} = ${a+b} + ${P(-c)} = ${s}`)),ANS(M(s))]}},
 ()=>{const t=rnz(-10,5),d=ri(3,12),e=ri(2,14),s=t-d+e;return {type:"num",js:`${t}-${d}+${e}`,q:M(`The temperature is ${t}°F in the morning. It drops ${d}° by noon and then rises ${e}° by evening. What is the evening temperature (°F)?`),answer:String(s),
   steps:[ASK("Find the final temperature after a drop and a rise."),RULE("A drop is subtracting; a rise is adding."),WORK(M(`${t} - ${d} = ${t-d}; then ${t-d} + ${e} = ${s}`)),ANS(M(s)+"°F")]}}]},

{id:"int-muldiv",unit:"rn",grade:7,std:"7.NS.2",title:"Multiply & divide integers",prereqs:["int-addsub"],
 lesson:{intro:"Multiplication is repeated addition, and division undoes multiplication. The sign of the answer depends only on the signs of the factors.",
  points:["Same signs → positive product or quotient: (−6)(−3) = 18 and −20 ÷ −4 = 5.","Different signs → negative: (−6)(3) = −18 and 20 ÷ (−4) = −5.","With several factors, count the negatives: an even count gives a positive result, an odd count gives a negative one."]},
 gens:[
 ()=>{const a=rnz(-12,12),b=rnz(-12,12),p=a*b;return {type:"num",js:`${a}*(${b})`,q:M(`Compute: ${P(a)} × ${P(b)}`),answer:String(p),
   steps:[ASK(M(`Multiply ${P(a)} by ${P(b)}.`)),RULE("Same signs give a positive product; different signs give a negative product."),WORK(M(`|${a}| × |${b}| = ${Math.abs(p)}; the signs are ${sgn(a)===sgn(b)?"the same, so positive":"different, so negative"}`)),ANS(M(p))]}},
 ()=>{const b=rnz(-12,12),qq=rnz(-12,12),a=b*qq;return {type:"num",js:`${a}/(${b})`,q:M(`Compute: ${P(a)} ÷ ${P(b)}`),answer:String(qq),
   steps:[ASK(M(`Divide ${P(a)} by ${P(b)}.`)),RULE("Same signs give a positive quotient; different signs give a negative quotient."),WORK(M(`|${a}| ÷ |${b}| = ${Math.abs(qq)}; signs ${sgn(a)===sgn(b)?"match, so positive":"differ, so negative"}`)),ANS(M(qq))]}},
 ()=>{const a=rnz(-5,5),b=rnz(-5,5),c=rnz(-5,5),p=a*b*c;return {type:"num",js:`${a}*(${b})*(${c})`,q:M(`Compute: ${P(a)} × ${P(b)} × ${P(c)}`),answer:String(p),
   steps:[ASK("Multiply three integers."),RULE("Multiply two at a time, left to right, applying the sign rule each time."),WORK(M(`${P(a)} × ${P(b)} = ${a*b}; then ${P(a*b)} × ${P(c)} = ${p}`)),ANS(M(p))]}},
 ()=>{const n=ri(3,9),x=ri(2,9),p=-n*x;return {type:"num",js:`${n}*(-${x})`,q:M(`A game deducts ${x} points for each wrong answer. After ${n} wrong answers, what is the total change in score?`),answer:String(p),
   steps:[ASK("Find the total change in score."),RULE("Repeated deductions: multiply the number of times by the (negative) change."),WORK(M(`${n} × (-${x}) = ${p}`)),ANS(M(p)+" points")]}}]},

{id:"frac-addsub",unit:"rn",grade:7,std:"7.NS.1",title:"Add & subtract fractions",prereqs:["int-addsub"],
 lesson:{intro:"To add or subtract fractions, the pieces must be the same size, so you need a common denominator.",
  points:["Same denominator: add or subtract the numerators and keep the denominator.","Unlike denominators: rewrite with the least common denominator (LCD), then combine the numerators.","Always reduce the answer to lowest terms. Type fractions like 3/4 (negatives like -3/4)."]},
 gens:[
 ()=>{const d=ri(3,12),a=ri(1,d-1),b=ri(1,d-1),n=a+b;return {type:"num",js:`${a}/${d}+${b}/${d}`,q:M(`Compute: ${a}/${d} + ${b}/${d}`),answer:frs(n,d),
   steps:[ASK("Add two fractions with the same denominator."),RULE("Keep the denominator and add the numerators."),WORK(`${a} + ${b} = ${n}, so the sum is ${n}/${d}; reduce: ${frs(n,d)}`),ANS(frs(n,d))]}},
 ()=>{let d1,d2;do{d1=ri(2,9);d2=ri(2,9)}while(d1===d2);const a=ri(1,d1-1),b=ri(1,d2-1),L=lcm(d1,d2),n=a*(L/d1)+b*(L/d2);
   return {type:"num",js:`${a}/${d1}+${b}/${d2}`,q:M(`Compute: ${a}/${d1} + ${b}/${d2}`),answer:frs(n,L),
   steps:[ASK("Add fractions with different denominators."),RULE(`Find the LCD of ${d1} and ${d2}, which is ${L}, and rewrite both fractions.`),
   WORK(`${a}/${d1} = ${a*(L/d1)}/${L} and ${b}/${d2} = ${b*(L/d2)}/${L}; sum = ${n}/${L}; reduce: ${frs(n,L)}`),ANS(frs(n,L))]}},
 ()=>{let d1,d2;do{d1=ri(2,9);d2=ri(2,9)}while(d1===d2);const a=ri(1,d1-1),b=ri(1,d2-1),L=lcm(d1,d2),n=a*(L/d1)-b*(L/d2);if(n===0)return TOPICS[2].gens[2]();
   return {type:"num",js:`${a}/${d1}-${b}/${d2}`,q:M(`Compute: ${a}/${d1} - ${b}/${d2}`),answer:frs(n,L),
   steps:[ASK("Subtract fractions with different denominators; the result may be negative."),RULE(`Rewrite with the LCD ${L}, then subtract numerators.`),
   WORK(`${a*(L/d1)}/${L} − ${b*(L/d2)}/${L} = ${M(n)}/${L}; reduce: ${M(frs(n,L))}`),ANS(M(frs(n,L)))]}},
 ()=>{let d1,d2;do{d1=ri(2,9);d2=ri(2,9)}while(d1===d2);const a=-ri(1,d1-1),b=ri(1,d2-1),L=lcm(d1,d2),n=a*(L/d1)+b*(L/d2);if(n===0)return TOPICS[2].gens[3]();
   return {type:"num",js:`(${a})/${d1}+${b}/${d2}`,q:M(`Compute: ${PF(a,d1)} + ${b}/${d2}`),answer:frs(n,L),
   steps:[ASK("Add a negative fraction and a positive fraction."),RULE(`Use the LCD ${L}, then add numerators using integer sign rules.`),
   WORK(`${M(a*(L/d1))}/${L} + ${b*(L/d2)}/${L} = ${M(n)}/${L}; reduce: ${M(frs(n,L))}`),ANS(M(frs(n,L)))]}}]},

{id:"frac-muldiv",unit:"rn",grade:7,std:"7.NS.2",title:"Multiply & divide fractions",prereqs:["frac-addsub","int-muldiv"],
 lesson:{intro:"Multiplying fractions is easy: no common denominator needed. Dividing by a fraction means multiplying by its reciprocal.",
  points:["Multiply: (a/b) × (c/d) = ac/bd. Simplify by cancelling common factors.","Divide: (a/b) ÷ (c/d) = (a/b) × (d/c) — flip the second fraction (reciprocal).","Signs follow the integer rules: same signs → positive, different → negative."]},
 gens:[
 ()=>{const a=ri(1,7),b=ri(2,9),c=ri(1,7),d=ri(2,9);return {type:"num",js:`(${a}/${b})*(${c}/${d})`,q:M(`Compute: ${a}/${b} * ${c}/${d}`),answer:frs(a*c,b*d),
   steps:[ASK("Multiply two fractions."),RULE("Multiply numerators together and denominators together."),WORK(`(${a}×${c})/(${b}×${d}) = ${a*c}/${b*d}; reduce: ${frs(a*c,b*d)}`),ANS(frs(a*c,b*d))]}},
 ()=>{const a=ri(1,7),b=ri(2,9),c=ri(1,7),d=ri(2,9);return {type:"num",js:`(${a}/${b})/(${c}/${d})`,q:M(`Compute: ${a}/${b} ÷ ${c}/${d}`),answer:frs(a*d,b*c),
   steps:[ASK("Divide by a fraction."),RULE("Dividing by c/d is the same as multiplying by its reciprocal d/c."),WORK(`${a}/${b} × ${d}/${c} = ${a*d}/${b*c}; reduce: ${frs(a*d,b*c)}`),ANS(frs(a*d,b*c))]}},
 ()=>{const a=rnz(-7,7),b=ri(2,9),c=rnz(-7,7),d=ri(2,9),n=a*c,den=b*d;return {type:"num",js:`(${a}/${b})*(${c}/${d})`,q:M(`Compute: ${PF(a,b)} * ${PF(c,d)}`),answer:frs(n,den),
   steps:[ASK("Multiply two signed fractions."),RULE("Multiply numerators and denominators; the sign is positive if the signs match, otherwise negative."),WORK(`(${M(P(a))}×${M(P(c))})/(${b}×${d}) = ${M(n)}/${den}; reduce: ${M(frs(n,den))}`),ANS(M(frs(n,den)))]}},
 ()=>{const d=ri(2,6),a=ri(1,d-1),k=ri(2,8),w=d*k;return {type:"num",js:`(${a}/${d})*${w}`,q:M(`What is ${a}/${d} of ${w}?`),answer:String(a*k),
   steps:[ASK(`Find ${a}/${d} of ${w}.`),RULE('"Of" means multiply. Divide by the denominator, then multiply by the numerator.'),WORK(`${w} ÷ ${d} = ${k}; ${k} × ${a} = ${a*k}`),ANS(a*k)]}},
 ()=>{const a=rnz(-6,6),b=ri(2,8),c=rnz(-6,6),d=ri(2,8),n=a*d,den=b*c;return {type:"num",js:`(${a}/${b})/(${c}/${d})`,q:M(`Compute: ${PF(a,b)} ÷ ${PF(c,d)}`),answer:frs(n,den),
   steps:[ASK("Divide two signed fractions."),RULE("Multiply by the reciprocal of the second fraction; apply sign rules."),WORK(`${M(PF(a,b))} × ${d}/${M(P(c))} = ${M(n)}/${M(den)}; reduce: ${M(frs(n,den))}`),ANS(M(frs(n,den)))]}}]},

{id:"dec-ops",unit:"rn",grade:7,std:"7.NS.3",title:"Operations with decimals",prereqs:["int-muldiv"],
 lesson:{intro:"Decimals are fractions with denominators 10, 100, … Line up place values when adding and subtracting; count decimal places when multiplying.",
  points:["Add/subtract: line up the decimal points (pad with zeros).","Multiply: multiply as whole numbers, then put as many decimal places in the product as the factors have in total.","Divide: multiply both numbers by a power of 10 so the divisor is a whole number."]},
 gens:[
 ()=>{const pa=ri(1,2),pb=ri(1,2),ai=ri(11,999),bi=ri(11,999),sum=ai*Math.pow(10,2-pa)+bi*Math.pow(10,2-pb);
   return {type:"num",js:`${ai/Math.pow(10,pa)}+${bi/Math.pow(10,pb)}`,q:`Compute: ${decStr(ai,pa)} + ${decStr(bi,pb)}`,answer:decTrim(sum,2),
   steps:[ASK("Add two decimals."),RULE("Line up the decimal points and add digit by digit, padding with zeros."),WORK(`${decStr(ai*Math.pow(10,2-pa),2)} + ${decStr(bi*Math.pow(10,2-pb),2)} = ${decStr(sum,2)}`),ANS(decTrim(sum,2))]}},
 ()=>{const ai=ri(100,999),bi=ri(100,999),d=ai-bi;return {type:"num",js:`${ai/100}-${bi/100}`,q:M(`Compute: ${decStr(ai,2)} - ${decStr(bi,2)}`),answer:decTrim(d,2),
   steps:[ASK("Subtract decimals (the result can be negative)."),RULE("Line up decimal points and subtract the smaller from the larger; the sign comes from which is bigger."),WORK(M(`${decStr(ai,2)} - ${decStr(bi,2)} = ${decTrim(d,2)}`)),ANS(M(decTrim(d,2)))]}},
 ()=>{const ai=ri(12,99),bi=ri(12,99),p=ai*bi;return {type:"num",js:`${ai/10}*${bi/10}`,q:`Compute: ${decStr(ai,1)} × ${decStr(bi,1)}`,answer:decTrim(p,2),
   steps:[ASK("Multiply two decimals."),RULE("Multiply as whole numbers, then place the decimal point so the product has the total number of decimal places."),WORK(`${ai} × ${bi} = ${p}; 1 + 1 = 2 decimal places → ${decStr(p,2)}`),ANS(decTrim(p,2))]}},
 ()=>{const bi=ri(2,9),qi=ri(11,99),ai=bi*qi;return {type:"num",js:`${ai/100}/${bi/10}`,q:`Compute: ${decStr(ai,2)} ÷ ${decStr(bi,1)}`,answer:decTrim(qi,1),
   steps:[ASK("Divide by a decimal."),RULE("Multiply both numbers by the same power of 10 so the divisor becomes a whole number."),WORK(`Multiply both numbers by 100: ${ai} ÷ ${bi*10} = ${decTrim(qi,1)}`),ANS(decTrim(qi,1))]}},
 ()=>{const nb=ri(2,5),pb=ri(150,450),np=ri(2,6),pp=ri(40,120),tot=nb*pb+np*pp;return {type:"num",js:`${nb}*${pb/100}+${np}*${pp/100}`,q:`Notebooks cost $${decStr(pb,2)} each and pencils cost $${decStr(pp,2)} each. What is the total cost, in dollars, of ${nb} notebooks and ${np} pencils?`,answer:decTrim(tot,2),
   steps:[ASK("Find the total cost."),RULE("Multiply each price by its quantity, then add."),WORK(`${nb} × ${decStr(pb,2)} = ${decStr(nb*pb,2)}; ${np} × ${decStr(pp,2)} = ${decStr(np*pp,2)}; total ${decStr(tot,2)}`),ANS("$"+decStr(tot,2))]}}]},

{id:"order-ops",unit:"rn",grade:7,std:"7.NS.3",title:"Order of operations",prereqs:["int-muldiv"],
 lesson:{intro:"A fixed order makes every expression mean exactly one thing.",
  points:["1) Parentheses, 2) Exponents, 3) Multiplication and Division (left to right), 4) Addition and Subtraction (left to right).","Exponent applies only to what is right next to it: −3² = −9 but (−3)² = 9.","Do one step at a time and rewrite the expression after each step."]},
 gens:[
 ()=>{const a=ri(2,12),b=ri(2,9),c=ri(2,9),d=ri(1,15);return {type:"num",js:`${a}+${b}*${c}-${d}`,q:M(`Evaluate: ${a} + ${b} * ${c} - ${d}`),answer:String(a+b*c-d),
   steps:[ASK("Evaluate using the order of operations."),RULE("Multiply before adding or subtracting."),WORK(M(`${b} * ${c} = ${b*c}; then ${a} + ${b*c} - ${d} = ${a+b*c-d}`)),ANS(M(a+b*c-d))]}},
 ()=>{const a=ri(2,9),b=ri(2,9),c=ri(2,7),d=ri(1,12);return {type:"num",js:`(${a}+${b})*${c}-${d}`,q:M(`Evaluate: (${a} + ${b}) * ${c} - ${d}`),answer:String((a+b)*c-d),
   steps:[ASK("Evaluate; parentheses come first."),RULE("Parentheses → multiply → subtract."),WORK(M(`(${a} + ${b}) = ${a+b}; ${a+b} * ${c} = ${(a+b)*c}; ${(a+b)*c} - ${d} = ${(a+b)*c-d}`)),ANS(M((a+b)*c-d))]}},
 ()=>{const k=pick([-6,-5,-4,-3,-2,2,3,4,5,6]),b=ri(3,12),c=b-k,k2=k*k,ds=[1,2,3,4,6,9,12,18].filter(x=>k2%x===0),d=pick(ds),a=ri(-9,12),r=a+k2/d;
   return {type:"num",js:`${a}+(${b}-(${c}))**2/${d}`,q:M(`Evaluate: ${a} + (${b} - ${P(c)})^2 ÷ ${d}`),answer:String(r),
   steps:[ASK("Evaluate; work inside parentheses, then the exponent, then divide, then add."),RULE("P → E → MD → AS."),WORK(M(`${b} - ${P(c)} = ${k}; ${P(k)}^2 = ${k2}; ${k2} ÷ ${d} = ${k2/d}; ${a} + ${k2/d} = ${r}`)),ANS(M(r))]}},
 ()=>{const a=ri(10,30),b=ri(2,6),c=ri(1,9),d=ri(1,9),r=a-b*(c-d);return {type:"num",js:`${a}-${b}*(${c}-${d})`,q:M(`Evaluate: ${a} - ${b} * (${c} - ${d})`),answer:String(r),
   steps:[ASK("Evaluate carefully; the minus sign comes after the multiplication."),RULE("Parentheses first, then multiplication, then subtraction."),WORK(M(`${c} - ${d} = ${c-d}; ${b} * ${P(c-d)} = ${b*(c-d)}; ${a} - ${P(b*(c-d))} = ${r}`)),ANS(M(r))]}}]},

// ---------------- Grade 7: Ratios & proportions ----------------
{id:"ratio-unit",unit:"rp",grade:7,std:"7.RP.1",title:"Ratios & unit rates",prereqs:["dec-ops","frac-muldiv"],
 lesson:{intro:"A ratio compares two quantities. A unit rate compares to 1 of something, such as miles per hour or dollars per item.",
  points:["Unit rate = first quantity ÷ second quantity (per 1 unit).","Equivalent ratios: multiply or divide both parts by the same number.","To compare deals, compare their unit rates (price per item)."]},
 gens:[
 ()=>{const r=ri(12,75),h=ri(2,9);return {type:"num",js:`${r*h}/${h}`,q:`A car travels ${r*h} miles in ${h} hours at a constant speed. What is its speed in miles per hour?`,answer:String(r),
   steps:[ASK("Find the unit rate in miles per hour."),RULE("Unit rate = distance ÷ time."),WORK(`${r*h} ÷ ${h} = ${r}`),ANS(`${r} mph`)]}},
 ()=>{const pc=ri(1,40)*5+50,n=ri(3,12);return {type:"num",js:`${pc*n/100}/${n}`,q:`${n} pens cost $${decStr(pc*n,2)} in total. How many dollars does one pen cost?`,answer:decTrim(pc,2),
   steps:[ASK("Find the price of one pen."),RULE("Unit price = total cost ÷ number of items."),WORK(`${decStr(pc*n,2)} ÷ ${n} = ${decStr(pc,2)}`),ANS("$"+decStr(pc,2))]}},
 ()=>{const a=ri(2,7),b=ri(2,9),k=ri(2,8);if(a===b)return TOPICS[6].gens[2]();return {type:"num",js:`${b*k}`,q:`The ratio of cats to dogs is ${a}:${b}. If there are ${a*k} cats, how many dogs are there?`,answer:String(b*k),
   steps:[ASK("Find the number of dogs."),RULE("Equivalent ratios: multiply both parts by the same factor."),WORK(`${a} × ${k} = ${a*k}, so the factor is ${k}; dogs = ${b} × ${k} = ${b*k}`),ANS(b*k)]}},
 ()=>{const a=ri(1,5),b=ri(2,6),c=ri(1,5),d=ri(2,6),n=a*d,den=b*c;return {type:"num",js:`(${a}/${b})/(${c}/${d})`,q:`A hiker walks ${a}/${b} of a mile in ${c}/${d} of an hour. What is the speed in miles per hour?`,answer:frs(n,den),
   steps:[ASK("Find the unit rate: distance ÷ time, both fractions."),RULE("Dividing by a fraction means multiplying by its reciprocal."),WORK(`${a}/${b} ÷ ${c}/${d} = ${a}/${b} × ${d}/${c} = ${n}/${den} = ${frs(n,den)}`),ANS(frs(n,den)+" mph")]}},
 ()=>{const n1=ri(3,8),n2=ri(3,12),p1=ri(100,500),p2=ri(100,700);const u1=p1/n1,u2=p2/n2;if(Math.abs(u1-u2)<1e-6)return TOPICS[6].gens[4]();
   const ch=["Deal A","Deal B"];return {type:"mc",choices:ch,answer:u1<u2?0:1,q:`Deal A: ${n1} pens for $${decStr(p1,2)}. Deal B: ${n2} pens for $${decStr(p2,2)}. Which deal has the lower price per pen?`,
   steps:[ASK("Compare the price per pen."),RULE("Unit price = price ÷ quantity; the smaller unit price is the better buy."),WORK(`A: ${decStr(p1,2)} ÷ ${n1} ≈ $${(u1/100).toFixed(3)}; B: ${decStr(p2,2)} ÷ ${n2} ≈ $${(u2/100).toFixed(3)}`),ANS(u1<u2?"Deal A":"Deal B")]}}]},

{id:"prop-solve",unit:"rp",grade:7,std:"7.RP.2",title:"Proportions",prereqs:["ratio-unit"],
 lesson:{intro:"A proportion says two ratios are equal. Solve it by finding the scale factor or by cross-multiplying.",
  points:["a/b = c/d means ad = bc (cross-multiply).","Proportional relationships: y = kx, where k is the constant of proportionality (the unit rate).","Always check that your answer makes the ratios equal."]},
 gens:[
 ()=>{const b=ri(2,9),a=ri(1,9),k=ri(2,9),x=a*k;return {type:"num",eqs:[`${a}/${b}=x/${b*k}`],q:M(`Solve for x: ${a}/${b} = x/${b*k}`),answer:String(x),
   steps:[ASK("Find x so the ratios are equal."),RULE("Cross-multiply, or use the scale factor from the denominators."),WORK(`${b} × ${k} = ${b*k}, so the scale factor is ${k}; x = ${a} × ${k} = ${x}`),ANS(`x = ${x}`)]}},
 ()=>{const c=ri(2,6),s=ri(2,6),k=ri(2,6);if(s===c)return TOPICS[7].gens[1]();return {type:"num",js:`${c*k}`,q:`A recipe uses ${c} cups of flour for ${s} servings. How many cups are needed for ${s*k} servings?`,answer:String(c*k),
   steps:[ASK("Scale the recipe."),RULE("Set up the proportion cups/servings = x/new servings."),WORK(`${c}/${s} = x/${s*k}; scale factor = ${k}; x = ${c} × ${k} = ${c*k}`),ANS(`${c*k} cups`)]}},
 ()=>{const a=ri(2,9),b=ri(2,9),k=ri(2,6);if(a===b)return TOPICS[7].gens[2]();const c=a*k,d=b*k;
   return {type:"num",eqs:[`${a}/x=${c}/${d}`],q:M(`Solve for x: ${a}/x = ${c}/${d}`),answer:String(a*d/c),
   steps:[ASK("The unknown is in a denominator."),RULE("Cross-multiply: a·d = c·x."),WORK(`${a} × ${d} = ${c} × x → ${a*d} = ${c}x → x = ${a*d} ÷ ${c} = ${a*d/c}`),ANS(`x = ${a*d/c}`)]}},
 ()=>{const sc=ri(2,9),cm=ri(2,12);return {type:"num",js:`${sc*cm}`,q:`On a map, 1 cm represents ${sc} km. Two towns are ${cm} cm apart on the map. How many km apart are they really?`,answer:String(sc*cm),
   steps:[ASK("Convert map distance to real distance."),RULE("Set up 1 cm / sc km = map cm / x km, or multiply by the scale."),WORK(`${cm} × ${sc} = ${sc*cm}`),ANS(`${sc*cm} km`)]}},
 ()=>{const k=ri(2,9),x=ri(2,9),y=k*x;return {type:"num",js:`${y}/${x}`,q:`In a proportional relationship y = kx, y = ${y} when x = ${x}. What is the constant of proportionality k?`,answer:String(k),
   steps:[ASK("Find k in y = kx."),RULE("k = y ÷ x."),WORK(`${y} ÷ ${x} = ${k}`),ANS(`k = ${k}`)]}}]},

{id:"percent",unit:"rp",grade:7,std:"7.RP.3",title:"Percents",prereqs:["prop-solve","dec-ops"],
 lesson:{intro:"Percent means “per 100”. Percent problems are proportions: part/whole = percent/100.",
  points:["p% of n = (p/100) × n.","Percent change = (new − old) ÷ old × 100.","If part = p% of whole, then whole = part ÷ (p/100). Discount: multiply by (100 − p)/100."]},
 gens:[
 ()=>{const p=pick([5,10,15,20,25,30,40,50,60,75,80]),n=20*ri(1,25),a=p*n/100;return {type:"num",js:`${p}/100*${n}`,q:`What is ${p}% of ${n}?`,answer:String(a),
   steps:[ASK(`Find ${p}% of ${n}.`),RULE("Convert the percent to a fraction/decimal and multiply."),WORK(`${p}% = ${p}/100; ${p}/100 × ${n} = ${a}`),ANS(a)]}},
 ()=>{const p=pick([10,15,20,25,30,40,50]),pr=20*ri(2,15),s=pr*(100-p)/100;return {type:"num",js:`${pr}*(100-${p})/100`,q:`A jacket costs $${pr}. It is on sale for ${p}% off. What is the sale price in dollars?`,answer:String(s),
   steps:[ASK("Find the sale price."),RULE("Sale price = original − discount, or original × (100 − p)%."),WORK(`Discount = ${p}% of ${pr} = ${pr*p/100}; sale = ${pr} − ${pr*p/100} = ${s}`),ANS("$"+s)]}},
 ()=>{const o=pick([20,25,40,50,80,100,200]),p=pick([10,20,25,50]),up=Math.random()<.5,nw=o*(100+(up?p:-p))/100;if(!Number.isInteger(nw))return TOPICS[8].gens[2]();
   return {type:"num",js:`${p}`,q:`A value changes from ${o} to ${nw}. What is the percent ${up?"increase":"decrease"}? (Enter just the number.)`,answer:String(p),
   steps:[ASK(`Find the percent ${up?"increase":"decrease"}.`),RULE("Percent change = |new − old| ÷ old × 100."),WORK(`|${nw} − ${o}| = ${Math.abs(nw-o)}; ${Math.abs(nw-o)} ÷ ${o} = ${Math.abs(nw-o)/o}; × 100 = ${p}%`),ANS(p+"%")]}},
 ()=>{const p=pick([10,20,25,40,50,60,75]),w=20*ri(2,30),pt=p*w/100;return {type:"num",js:`${pt}/(${p}/100)`,q:`${pt} is ${p}% of what number?`,answer:String(w),
   steps:[ASK("Find the whole."),RULE("whole = part ÷ (percent/100)."),WORK(`${pt} ÷ ${p/100} = ${w}`),ANS(w)]}},
 ()=>{const b=20*ri(2,12),t=pick([15,20]),tip=b*t/100;return {type:"num",js:`${b}*${t}/100`,q:`Your restaurant bill is $${b}. How many dollars is a ${t}% tip?`,answer:String(tip),
   steps:[ASK("Find the tip amount."),RULE("Tip = rate × bill."),WORK(`${t}% × ${b} = ${t/100} × ${b} = ${tip}`),ANS("$"+tip)]}}]},

// ---------------- Grade 7: Expressions & equations ----------------
{id:"expr-eval",unit:"ee",grade:7,std:"6.EE.2",title:"Evaluate expressions",prereqs:["order-ops"],
 lesson:{intro:"An expression uses numbers, variables and operations. To evaluate, substitute the given numbers, then follow the order of operations.",
  points:["Replace each variable with its value, putting negatives in parentheses.","3x means 3 × x. x² means x · x.","Then use order of operations."]},
 gens:[
 ()=>{const a=ri(2,6),b=ri(2,6),x=rnz(-6,8),y=rnz(-6,8),r=a*x-b*y;return {type:"num",js:`${a}*(${x})-${b}*(${y})`,q:M(`Evaluate ${a}x - ${b}y when x = ${x} and y = ${y}.`),answer:String(r),
   steps:[ASK("Substitute and compute."),RULE("Replace x and y, using parentheses for negatives."),WORK(M(`${a}(${x}) - ${b}(${y}) = ${a*x} - ${P(b*y)} = ${r}`)),ANS(M(r))]}},
 ()=>{const x=rnz(-6,6),a=ri(2,5),r=x*x+a*x;return {type:"num",js:`(${x})**2+${a}*(${x})`,q:M(`Evaluate x^2 + ${a}x when x = ${x}.`),answer:String(r),
   steps:[ASK("Substitute x and compute."),RULE("Exponent first, then multiply, then add."),WORK(M(`(${x})^2 + ${a}(${x}) = ${x*x} + ${P(a*x)} = ${r}`)),ANS(M(r))]}},
 ()=>{const a=ri(2,6),x=rnz(-5,9),b=ri(1,9),c=rnz(-8,8),r=a*(x-b)+c;return {type:"num",js:`${a}*((${x})-${b})+(${c})`,q:M(`Evaluate ${a}(x - ${b}) + ${P(c)} when x = ${x}.`),answer:String(r),
   steps:[ASK("Substitute and compute."),RULE("Parentheses first, then multiply, then add."),WORK(M(`${a}(${x} - ${b}) + ${P(c)} = ${a}(${x-b}) + ${P(c)} = ${a*(x-b)} + ${P(c)} = ${r}`)),ANS(M(r))]}},
 ()=>{const z=ri(2,6),s=ri(-9,9),x=ri(-4,9),y=s*z-x;return {type:"num",js:`((${x})+(${y}))/${z}`,q:M(`Evaluate (x + y) ÷ ${z} when x = ${x} and y = ${y}.`),answer:String(s),
   steps:[ASK("Substitute, then add before dividing."),RULE("The sum in parentheses is computed first."),WORK(M(`(${P(x)} + ${P(y)}) ÷ ${z} = ${x+y} ÷ ${z} = ${s}`)),ANS(M(s))]}}]},

{id:"expr-simplify",unit:"ee",grade:7,std:"7.EE.1",title:"Simplify expressions",prereqs:["expr-eval"],
 lesson:{intro:"Simplifying means rewriting an expression in a shorter, equivalent form by combining like terms and using the distributive property.",
  points:["Like terms have the same variable part: 3x and −5x combine to −2x; 4 and 9 combine to 13.","Distributive property: a(b + c) = ab + ac. The sign travels with the number: −2(x − 3) = −2x + 6.","Type answers like 2x + 7 or 4x - 12 (no parentheses)."]},
 gens:[
 ()=>{let a,b,c,d;do{a=rnz(-8,9);b=rnz(-9,9);c=rnz(-8,9);d=rnz(-9,9)}while(a+c===0||b+d===0);const terms=shuffle([[a,"x"],[b,""],[c,"x"],[d,""]]);
   return {type:"poly",q:M(`Simplify: ${polyStr(terms)}`),answer:lin(a+c,b+d),
   steps:[ASK("Combine like terms."),RULE("Add the x-terms together and the constants together."),WORK(M(`x-terms: ${a} + ${P(c)} = ${a+c}; constants: ${b} + ${P(d)} = ${b+d}`)),ANS(M(lin(a+c,b+d)))]}},
 ()=>{const k=pick([-9,-8,-7,-6,-5,-4,-3,-2,2,3,4,5,6,7,8,9]),b=rnz(-9,9),m=pick([1,-1]);return {type:"poly",q:M(`Expand: ${k}(${lin(m,b)})`),answer:lin(k*m,k*b),
   steps:[ASK("Distribute the number outside the parentheses."),RULE("a(b + c) = ab + ac; multiply each term inside by the outside number."),WORK(M(`${k} × ${m===1?"x":"(-x)"} = ${k*m}x; ${k} × ${P(b)} = ${k*b}`)),ANS(M(lin(k*m,k*b)))]}},
 ()=>{const k=rnz(-6,6),m=rnz(-5,5),b=rnz(-8,8),c=rnz(-6,6),d=rnz(-9,9);if(k*m+c===0||k*b+d===0)return TOPICS[10].gens[2]();
   return {type:"poly",q:M(`Simplify: ${k}(${lin(m,b)})${addP(polyStr([[c,"x"],[d,""]]))}`),answer:lin(k*m+c,k*b+d),
   steps:[ASK("Distribute, then combine like terms."),RULE("Distribute first, then add like terms."),WORK(M(`${k}(${lin(m,b)}) = ${lin(k*m,k*b)}; add ${polyStr([[c,"x"],[d,""]])}: x-terms ${k*m} + ${P(c)} = ${k*m+c}, constants ${k*b} + ${P(d)} = ${k*b+d}`)),ANS(M(lin(k*m+c,k*b+d)))]}},
 ()=>{let a,b,c,d;do{a=rnz(-7,8);b=rnz(-7,8);c=rnz(-7,8);d=rnz(-7,8)}while(a+c===0||b+d===0);const terms=shuffle([[a,"a"],[b,"b"],[c,"a"],[d,"b"]]);
   return {type:"poly",q:M(`Simplify: ${polyStr(terms)}`),answer:polyStr([[a+c,"a"],[b+d,"b"]]),
   steps:[ASK("Combine like terms (a-terms with a-terms, b-terms with b-terms)."),RULE("Only terms with the same variable can be combined."),WORK(M(`a: ${a} + ${P(c)} = ${a+c}; b: ${b} + ${P(d)} = ${b+d}`)),ANS(M(polyStr([[a+c,"a"],[b+d,"b"]])))]}}]},

{id:"onestep-eq",unit:"ee",grade:7,std:"6.EE.7",title:"One-step equations",prereqs:["expr-eval"],
 lesson:{intro:"To solve an equation, undo the operation on the variable using the inverse operation, and do the same to both sides.",
  points:["x + a = b → subtract a from both sides.","ax = b → divide both sides by a. x/a = b → multiply both sides by a.","Check by substituting your answer back in."]},
 gens:[
 ()=>{const a=ri(2,20),x=rnz(-15,20),b=x+a;return {type:"num",eqs:[`x+${a}=${b}`],q:M(`Solve: x + ${a} = ${b}`),answer:String(x),
   steps:[ASK("Find x."),RULE("Subtract the same number from both sides."),WORK(M(`x + ${a} - ${a} = ${b} - ${a} → x = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const a=ri(2,20),x=rnz(-15,20),b=x-a;return {type:"num",eqs:[`x-${a}=(${b})`],q:M(`Solve: x - ${a} = ${b}`),answer:String(x),
   steps:[ASK("Find x."),RULE("Add the same number to both sides."),WORK(M(`x - ${a} + ${a} = ${b} + ${a} → x = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const a=rnz(-9,9),x=rnz(-12,12);if(Math.abs(a)<2)return TOPICS[11].gens[2]();const b=a*x;return {type:"num",eqs:[`${a}*x=(${b})`],q:M(`Solve: ${a}x = ${b}`),answer:String(x),
   steps:[ASK("Find x."),RULE("Divide both sides by the coefficient."),WORK(M(`${a}x ÷ ${P(a)} = ${P(b)} ÷ ${P(a)} → x = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const a=ri(2,9),b=rnz(-12,12),x=a*b;return {type:"num",eqs:[`x/${a}=(${b})`],q:M(`Solve: x/${a} = ${b}`),answer:String(x),
   steps:[ASK("Find x."),RULE("Multiply both sides by the number dividing x."),WORK(M(`(x/${a}) × ${a} = ${P(b)} × ${a} → x = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const a=ri(2,9),b=rnz(-20,20);if(b%a===0)return TOPICS[11].gens[4]();return {type:"num",eqs:[`${a}*x=(${b})`],q:M(`Solve: ${a}x = ${b}  (give a fraction in lowest terms)`),answer:frs(b,a),
   steps:[ASK("Find x; the answer is not a whole number."),RULE("Divide both sides by the coefficient and reduce."),WORK(M(`x = ${b}/${a} = ${frs(b,a)}`)),ANS(M(`x = ${frs(b,a)}`))]}}]},

{id:"twostep-eq",unit:"ee",grade:7,std:"7.EE.4a",title:"Two-step equations",prereqs:["onestep-eq"],
 lesson:{intro:"Undo operations in reverse order of operations: first undo addition/subtraction, then undo multiplication/division.",
  points:["For ax + b = c: subtract b from both sides, then divide by a.","For x/a + b = c: subtract b, then multiply by a.","Keep the equation balanced — whatever you do to one side, do to the other."]},
 gens:[
 ()=>{const a=rnz(-8,9),x=rnz(-10,12),b=rnz(-15,15);if(Math.abs(a)<2)return TOPICS[12].gens[0]();const c=a*x+b;return {type:"num",eqs:[`${a}*x+(${b})=(${c})`],q:M(`Solve: ${lin(a,b)} = ${c}`),answer:String(x),
   steps:[ASK("Find x."),RULE("Undo the constant first, then the coefficient."),WORK(M(`${lin(a,b)} = ${c} → ${a}x = ${c} - ${P(b)} = ${c-b} → x = ${c-b} ÷ ${P(a)} = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const a=ri(2,9),x=rnz(-10,12),b=ri(1,15),c=a*x-b;return {type:"num",eqs:[`${a}*x-${b}=(${c})`],q:M(`Solve: ${a}x - ${b} = ${c}`),answer:String(x),
   steps:[ASK("Find x."),RULE("Add the constant to both sides, then divide."),WORK(M(`${a}x = ${c} + ${b} = ${c+b} → x = ${c+b} ÷ ${a} = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const a=ri(2,8),y=rnz(-9,9),b=rnz(-10,10),c=y+b;return {type:"num",eqs:[`x/${a}+(${b})=(${c})`],q:M(`Solve: x/${a} + ${P(b)} = ${c}`),answer:String(y*a),
   steps:[ASK("Find x."),RULE("Subtract the constant, then multiply by the divisor."),WORK(M(`x/${a} = ${c} - ${P(b)} = ${y} → x = ${y} × ${a} = ${y*a}`)),ANS(M(`x = ${y*a}`))]}},
 ()=>{const a=ri(2,9),x=rnz(-9,10),c=rnz(-20,20),b=c+a*x;return {type:"num",eqs:[`${b}-${a}*x=(${c})`],q:M(`Solve: ${b} - ${a}x = ${c}`),answer:String(x),
   steps:[ASK("Find x."),RULE("Subtract the constant, then divide by the negative coefficient."),WORK(M(`-${a}x = ${c} - ${P(b)} = ${c-b} → x = ${c-b} ÷ (-${a}) = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const f=ri(10,40),r=ri(3,15),m=ri(2,12),t=f+r*m;return {type:"num",eqs:[`${f}+${r}*x=${t}`],q:`A gym charges a $${f} sign-up fee plus $${r} per month. Your total so far is $${t}. For how many months have you been a member?`,answer:String(m),
   steps:[ASK("Let x be the number of months."),RULE("Write the equation: fee + rate × months = total."),WORK(`${f} + ${r}x = ${t} → ${r}x = ${t-f} → x = ${m}`),ANS(`${m} months`)]}}]},

{id:"ineq",unit:"ee",grade:7,std:"7.EE.4b",title:"Two-step inequalities",prereqs:["twostep-eq"],
 lesson:{intro:"An inequality has many solutions. Solve it like an equation, with one big rule: flip the inequality sign when you multiply or divide by a negative number.",
  points:["Solve with inverse operations just like an equation.","Multiplying/dividing by a negative reverses the sign: −2x < 6 → x > −3.","Write answers like x > 3 or x <= -2 (≤ and ≥ also work)."]},
 gens:[
 ()=>{const a=ri(2,8),x=ri(-8,9),b=rnz(-12,12),op=pick(["<",">","<=",">="]),c=a*x+b;return {type:"ineq",ineq:`${a}*x+(${b})${op}(${c})`,q:M(`Solve: ${lin(a,b)} ${op==="<="?"≤":op===">="?"≥":op} ${c}`),answer:`x ${op} ${x}`,
   steps:[ASK("Solve the inequality."),RULE("Same steps as an equation; the sign stays since we divide by a positive number."),WORK(M(`${a}x ${op} ${c} - ${P(b)} = ${c-b} → x ${op} ${x}`)),ANS(M(`x ${op} ${x}`))]}},
 ()=>{const a=ri(2,8),x=ri(-8,9),b=rnz(-12,12),op=pick(["<",">","<=",">="]),c=-a*x+b,flip={"<":">",">":"<","<=":">=",">=":"<="}[op];
   return {type:"ineq",ineq:`${-a}*x+(${b})${op}(${c})`,q:M(`Solve: ${lin(-a,b)} ${op==="<="?"≤":op===">="?"≥":op} ${c}`),answer:`x ${flip} ${x}`,
   steps:[ASK("Solve; the coefficient of x is negative."),RULE("When you divide both sides by a negative number, flip the inequality sign."),WORK(M(`-${a}x ${op} ${c-b}; divide by -${a} and flip: x ${flip} ${x}`)),ANS(M(`x ${flip} ${x}`))]}},
 ()=>{const a=ri(2,9),x=ri(-9,9),op=pick(["<",">","<=",">="]),neg=Math.random()<.5,A=neg?-a:a,c=A*x,flip={"<":">",">":"<","<=":">=",">=":"<="}[op];const o2=neg?flip:op;
   return {type:"ineq",ineq:`${A}*x${op}(${c})`,q:M(`Solve: ${A}x ${op==="<="?"≤":op===">="?"≥":op} ${c}`),answer:`x ${o2} ${x}`,
   steps:[ASK("Solve the one-step inequality."),RULE(neg?"Dividing by a negative flips the sign.":"Dividing by a positive keeps the sign."),WORK(M(`x ${o2} ${c} ÷ ${P(A)} = ${x}`)),ANS(M(`x ${o2} ${x}`))]}},
 ()=>{const fee=ri(2,9),cost=ri(3,9),k=ri(2,8),budget=fee+cost*k;
   return {type:"ineq",ineq:`${fee}+${cost}*x<=${budget}`,q:`You have $${budget}. A service fee is $${fee} and each ticket costs $${cost}. Write an inequality for the number of tickets x you can buy. (Solve it and write your answer as x <= …)`,answer:`x <= ${(budget-fee)/cost}`,
   steps:[ASK("Write and solve: fee + cost × x ≤ budget."),RULE("Subtract the fee, then divide by the ticket price."),WORK(`${fee} + ${cost}x ≤ ${budget} → ${cost}x ≤ ${budget-fee} → x ≤ ${(budget-fee)/cost}`),ANS(`x ≤ ${(budget-fee)/cost}`)]}}]},

// ---------------- Algebra I: Equations ----------------
{id:"multistep-eq",unit:"a1eq",grade:8,std:"A.REI.3",title:"Multi-step equations",prereqs:["twostep-eq","expr-simplify"],
 lesson:{intro:"When the variable is on both sides or the equation has parentheses, simplify each side first, then collect variable terms on one side.",
  points:["Distribute and combine like terms on each side.","Move variable terms to one side and constants to the other using inverse operations.","Finish like a two-step equation and check your answer in the ORIGINAL equation."]},
 gens:[
 ()=>{let a,c,x=rnz(-9,10),b=rnz(-12,12);do{a=rnz(-8,9);c=rnz(-8,9)}while(a===c);const d=a*x+b-c*x;return {type:"num",eqs:[`${a}*x+(${b})=${c}*x+(${d})`],q:M(`Solve: ${lin(a,b)} = ${lin(c,d)}`),answer:String(x),
   steps:[ASK("Find x; x appears on both sides."),RULE("Move the x-terms to one side and the constants to the other."),WORK(M(`${lin(a,b)} = ${lin(c,d)} → ${cf(a-c,"x")} = ${d-b} → x = ${d-b} ÷ ${P(a-c)} = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const a=rnz(-7,8),x=rnz(-9,10),b=rnz(-8,8);if(Math.abs(a)<2)return TOPICS[14].gens[1]();const c=a*(x+b);return {type:"num",eqs:[`${a}*(x+(${b}))=(${c})`],q:M(`Solve: ${a}(x ${b<0?"- "+(-b):"+ "+b}) = ${c}`),answer:String(x),
   steps:[ASK("Find x; there are parentheses."),RULE("Distribute first, or divide both sides by the outside number."),WORK(M(`${a}(x ${b<0?"- "+(-b):"+ "+b}) = ${c} → x ${b<0?"- "+(-b):"+ "+b} = ${c} ÷ ${P(a)} = ${x+b} → x = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{let a=rnz(-6,7),c=rnz(-6,7),b=rnz(-8,8),x=rnz(-8,9);while(a*1===0||a+c===0)c=rnz(-6,7);const d=a*(x+b)+c*x;return {type:"num",eqs:[`${a}*(x+(${b}))+${c}*x=(${d})`],q:M(`Solve: ${a}(x ${b<0?"- "+(-b):"+ "+b}) ${c<0?"- "+cf(-c,"x"):"+ "+cf(c,"x")} = ${d}`),answer:String(x),
   steps:[ASK("Find x."),RULE("Distribute, combine like terms, then solve."),WORK(M(`${polyStr([[a,"x"],[a*b,""],[c,"x"]])} = ${d} → ${cf(a+c,"x")} = ${d-a*b} → x = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const c=pick([2,3,-2,-3,4]),m=pick([-3,-2,2,3,4,5]);if(m===1)return TOPICS[14].gens[0]();const a=c*m,x=rnz(-8,9),b=rnz(-6,6),d=m*(x+b)-x;
   return {type:"num",eqs:[`${a}*(x+(${b}))=${c}*(x+(${d}))`],q:M(`Solve: ${a}(x ${b<0?"- "+(-b):"+ "+b}) = ${c}(x ${d<0?"- "+(-d):"+ "+d})`),answer:String(x),
   steps:[ASK("Find x; both sides have parentheses."),RULE("Distribute on both sides, collect x-terms, then solve."),WORK(M(`${polyStr([[a,"x"],[a*b,""]])} = ${polyStr([[c,"x"],[c*d,""]])} → ${cf(a-c,"x")} = ${c*d-a*b} → x = ${x}`)),ANS(M(`x = ${x}`))]}}]},

{id:"literal-eq",unit:"a1eq",grade:8,std:"A.CED.4",title:"Rearranging equations",prereqs:["multistep-eq"],
 lesson:{intro:"Solving for a variable in an equation with two variables works exactly like solving a number equation — you just keep the other variable as a “number”.",
  points:["Isolate the target variable using inverse operations on both sides.","Example: 3x + y = 7 → y = −3x + 7.","Type the answer as y = … (or x = … when asked for x)."]},
 gens:[
 ()=>{const a=rnz(-9,9),c=rnz(-12,12);return {type:"poly",lhs:"y",q:M(`Solve for y: ${polyStr([[a,"x"],[1,"y"]])} = ${c}`),answer:polyStr([[-a,"x"],[c,""]]),
   steps:[ASK("Isolate y."),RULE("Subtract the x-term from both sides."),WORK(M(`y = ${c} - ${pcf(a,"x")} = ${polyStr([[-a,"x"],[c,""]])}`)),ANS(M(`y = ${polyStr([[-a,"x"],[c,""]])}`))]}},
 ()=>{const a=rnz(-7,7),c=rnz(-12,12);return {type:"poly",lhs:"y",q:M(`Solve for y: ${polyStr([[1,"y"],[-a,"x"]])} = ${c}`),answer:polyStr([[a,"x"],[c,""]]),
   steps:[ASK("Isolate y."),RULE("Add the x-term to both sides."),WORK(M(`y = ${c} + ${pcf(a,"x")} = ${polyStr([[a,"x"],[c,""]])}`)),ANS(M(`y = ${polyStr([[a,"x"],[c,""]])}`))]}},
 ()=>{const b=ri(2,5),m=rnz(-5,5),k=rnz(-6,6),a=-m*b,c=k*b;return {type:"poly",lhs:"y",q:M(`Solve for y: ${polyStr([[a,"x"],[b,"y"]])} = ${c}`),answer:polyStr([[m,"x"],[k,""]]),
   steps:[ASK("Isolate y."),RULE("Move the x-term, then divide every term by the coefficient of y."),WORK(M(`${b}y = ${c} - ${pcf(a,"x")} → y = ${polyStr([[m,"x"],[k,""]])}`)),ANS(M(`y = ${polyStr([[m,"x"],[k,""]])}`))]}},
 ()=>{const b=rnz(-8,8),c=rnz(-9,9);return {type:"poly",lhs:"x",q:M(`Solve for x: ${polyStr([[1,"x"],[b,"y"]])} = ${c}`),answer:polyStr([[-b,"y"],[c,""]]),
   steps:[ASK("Isolate x."),RULE("Subtract the y-term from both sides."),WORK(M(`x = ${c} - ${pcf(b,"y")} = ${polyStr([[-b,"y"],[c,""]])}`)),ANS(M(`x = ${polyStr([[-b,"y"],[c,""]])}`))]}}]},

// ---------------- Algebra I: Linear functions ----------------
{id:"slope",unit:"a1lin",grade:8,std:"8.EE.6",title:"Slope",prereqs:["frac-muldiv"],
 lesson:{intro:"Slope measures steepness: how much y changes for each 1 unit change in x.",
  points:["slope m = (y₂ − y₁) ÷ (x₂ − x₁) = rise ÷ run.","Positive slope rises left-to-right; negative falls; horizontal lines have slope 0; vertical lines have undefined slope.","Reduce the fraction. Type slopes like -3/2."]},
 gens:[
 ()=>{let x1=ri(-6,6),x2,y1=ri(-6,6),y2;do{x2=ri(-6,6)}while(x2===x1);y2=ri(-6,6);return {type:"num",js:`((${y2})-(${y1}))/((${x2})-(${x1}))`,q:M(`Find the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`),answer:frs(y2-y1,x2-x1),
   steps:[ASK("Find the slope between the two points."),RULE("m = (y₂ − y₁) ÷ (x₂ − x₁)."),WORK(M(`(${y2} - ${P(y1)}) ÷ (${x2} - ${P(x1)}) = ${y2-y1}/${x2-x1} = ${frs(y2-y1,x2-x1)}`)),ANS(M(frs(y2-y1,x2-x1)))]}},
 ()=>{const m=rnz(-4,4),dx=ri(1,3),x0=ri(-3,3),y0=ri(-5,5);const xs=[x0,x0+dx,x0+2*dx],ys=xs.map((_,i)=>y0+m*dx*i);
   return {type:"num",js:`${m}`,q:M(`The table shows a linear relationship: x = ${xs.join(", ")} and y = ${ys.join(", ")}. What is the slope?`),answer:String(m),
   steps:[ASK("Find the rate of change between table rows."),RULE("slope = change in y ÷ change in x."),WORK(M(`Change in y = ${ys[1]} - ${P(ys[0])} = ${ys[1]-ys[0]}; change in x = ${dx}; ${ys[1]-ys[0]} ÷ ${dx} = ${m}`)),ANS(M(m))]}},
 ()=>{const m=frs(ri(1,5)*pick([-1,1]),ri(2,5)),[n,d]=m.includes("/")?m.split("/").map(Number):[+m,1],k=ri(1,4),x1=ri(-5,5),y1=ri(-5,5),x2=x1+d*k,y2=y1+n*k;
   return {type:"num",js:`${n}/${d}`,q:M(`A line passes through (${x1}, ${y1}) and (${x2}, ${y2}). What is its slope?`),answer:frs(n,d),
   steps:[ASK("Find the slope."),RULE("m = rise ÷ run."),WORK(M(`rise = ${y2} - ${P(y1)} = ${y2-y1}; run = ${x2} - ${P(x1)} = ${x2-x1}; m = ${y2-y1}/${x2-x1} = ${frs(n,d)}`)),ANS(M(frs(n,d)))]}},
 ()=>{const kind=pick(["vertical","horizontal"]),a=ri(-5,5),b=ri(-5,5),c=ri(-5,5);const pts=kind==="vertical"?[[a,b],[a,c===b?c+1:c]]:[[a,b],[a+(c===0?1:c),b]];
   return {type:"mc",choices:["0","undefined","1","−1"],answer:kind==="vertical"?1:0,q:M(`What is the slope of the line through (${pts[0][0]}, ${pts[0][1]}) and (${pts[1][0]}, ${pts[1][1]})?`),
   steps:[ASK("Find the slope of this special line."),RULE("Horizontal line: rise = 0 → slope 0. Vertical line: run = 0 → slope undefined (cannot divide by 0)."),WORK(M(`rise = ${pts[1][1]-pts[0][1]}, run = ${pts[1][0]-pts[0][0]}`)),ANS(kind==="vertical"?"undefined":"0")]}}]},

{id:"func-eval",unit:"a1lin",grade:8,std:"F.IF.2",title:"Function notation",prereqs:["expr-eval","twostep-eq"],
 lesson:{intro:"f(x) is the output of function f for input x. f(3) means “replace x with 3”.",
  points:["f(a) = substitute x = a and compute.","To find x when f(x) = c, set the rule equal to c and solve.","f(x) is just another name for y."]},
 gens:[
 ()=>{const m=rnz(-6,6),b=rnz(-10,10),a=rnz(-5,8);return {type:"num",js:`${m}*(${a})+(${b})`,q:M(`If f(x) = ${lin(m,b)}, find f(${a}).`),answer:String(m*a+b),
   steps:[ASK(`Find the output when x = ${a}.`),RULE("Replace x by the input."),WORK(M(`f(${a}) = ${m}(${a}) + ${P(b)} = ${m*a} + ${P(b)} = ${m*a+b}`)),ANS(M(m*a+b))]}},
 ()=>{const a=rnz(-3,3),b=rnz(-8,8),k=rnz(-4,4),r=a*k*k+b;return {type:"num",js:`${a}*(${k})**2+(${b})`,q:M(`If g(x) = ${polyStr([[a,"x^2"],[b,""]])}, find g(${k}).`),answer:String(r),
   steps:[ASK(`Find g(${k}).`),RULE("Substitute, apply the exponent first, then multiply and add."),WORK(M(`g(${k}) = ${a} * ${P(k)}^2 + ${P(b)} = ${a} * ${k*k} + ${P(b)} = ${a*k*k} + ${P(b)} = ${r}`)),ANS(M(r))]}},
 ()=>{const m=rnz(-6,6),b=rnz(-10,10),x=rnz(-7,8);if(Math.abs(m)<2)return TOPICS[17].gens[2]();const c=m*x+b;return {type:"num",eqs:[`${m}*x+(${b})=(${c})`],q:M(`If f(x) = ${lin(m,b)}, for what x is f(x) = ${c}?`),answer:String(x),
   steps:[ASK("Find the input that gives this output."),RULE("Set the rule equal to the output and solve."),WORK(M(`${lin(m,b)} = ${c} → ${m}x = ${c-b} → x = ${x}`)),ANS(M(`x = ${x}`))]}},
 ()=>{const m=rnz(-5,5),b=rnz(-8,8),a=rnz(-4,4),c=rnz(-4,4),r=(m*a+b)+(m*c+b);return {type:"num",js:`(${m}*(${a})+(${b}))+(${m}*(${c})+(${b}))`,q:M(`If f(x) = ${lin(m,b)}, find f(${a}) + f(${c}).`),answer:String(r),
   steps:[ASK(`Compute each output, then add.`),RULE("Evaluate each function value separately."),WORK(M(`f(${a}) = ${m*a+b}; f(${c}) = ${m*c+b}; sum = ${r}`)),ANS(M(r))]}}]},

{id:"slope-int",unit:"a1lin",grade:8,std:"A.CED.2",title:"Writing linear equations",prereqs:["slope","multistep-eq","func-eval"],
 lesson:{intro:"Slope-intercept form is y = mx + b, where m is the slope and b is the y-intercept (where the line crosses the y-axis, at x = 0).",
  points:["Read m and b straight from y = mx + b.","Given m and a point (x₁, y₁): b = y₁ − m·x₁.","Given two points: find m first, then b. Type equations like y = 2x - 3."]},
 gens:[
 ()=>{const m=rnz(-9,9),b=rnz(-12,12),which=pick(["slope","y-intercept"]);return {type:"num",js:`${which==="slope"?m:b}`,q:M(`What is the ${which} of the line y = ${lin(m,b)}?`),answer:String(which==="slope"?m:b),
   steps:[ASK(`Identify the ${which}.`),RULE("In y = mx + b, m is the slope and b is the y-intercept."),WORK(M(`m = ${m}, b = ${b}`)),ANS(M(which==="slope"?m:b))]}},
 ()=>{const m=rnz(-8,8),b=rnz(-10,10);return {type:"poly",lhs:"y",q:M(`Write the equation of the line with slope ${m} and y-intercept ${b} in the form y = mx + b.`),answer:lin(m,b),
   steps:[ASK("Build the equation from m and b."),RULE("Substitute m and b into y = mx + b."),WORK(M(`m = ${m}, b = ${b}`)),ANS(M(`y = ${lin(m,b)}`))]}},
 ()=>{const m=rnz(-5,5),b=rnz(-9,9),x1=rnz(-4,4);if(m===0)return TOPICS[18].gens[2]();return {type:"poly",lhs:"y",q:M(`Write the equation of the line with slope ${m} through the point (${x1}, ${m*x1+b}).`),answer:lin(m,b),
   steps:[ASK("Find the equation in y = mx + b form."),RULE("Substitute the point and m to find b: b = y − m·x."),WORK(M(`b = ${m*x1+b} - ${P(m)} * ${P(x1)} = ${m*x1+b} - ${P(m*x1)} = ${b}`)),ANS(M(`y = ${lin(m,b)}`))]}},
 ()=>{const m=rnz(-4,4),b=rnz(-8,8),x1=rnz(-4,0),x2=x1+ri(1,4);if(m===0)return TOPICS[18].gens[3]();const y1=m*x1+b,y2=m*x2+b;return {type:"poly",lhs:"y",q:M(`Write the equation of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`),answer:lin(m,b),
   steps:[ASK("Find slope, then intercept."),RULE("m = Δy ÷ Δx, then b = y₁ − m·x₁."),WORK(M(`m = (${y2} - ${P(y1)}) ÷ (${x2} - ${P(x1)}) = ${m}; b = ${y1} - ${P(m)} * ${P(x1)} = ${b}`)),ANS(M(`y = ${lin(m,b)}`))]}},
 ()=>{const f=ri(5,40),r=ri(2,12);return {type:"poly",lhs:"y",q:`A taxi charges a $${f} flat fee plus $${r} per mile. Write the total cost y (in dollars) for x miles in the form y = mx + b.`,answer:lin(r,f),
   steps:[ASK("Translate the story into y = mx + b."),RULE("The per-unit rate is the slope m; the flat fee is the intercept b."),WORK(`m = ${r}, b = ${f}`),ANS(`y = ${lin(r,f)}`)]}}]},

// ---------------- Algebra I: Systems ----------------
{id:"sys-sub",unit:"a1sys",grade:8,std:"A.REI.6",title:"Systems by substitution",prereqs:["multistep-eq","slope-int"],
 lesson:{intro:"A system of equations asks for the point (x, y) that satisfies every equation. Substitution replaces one variable using an equation already solved for it.",
  points:["Pick an equation with y = … (or x = …) and substitute into the other equation.","Solve the resulting one-variable equation, then substitute back to find the other variable.","Write the solution as an ordered pair (x, y) and check it in both equations."]},
 gens:[
 ()=>{const x=ri(-5,6),y=ri(-6,6),m=rnz(-4,4),b=y-m*x,a=rnz(-4,4),c=rnz(-4,4);if(a+c*m===0)return TOPICS[19].gens[0]();const d=a*x+c*y;
   const e2=polyStr([[a,"x"],[c,"y"]]);return {type:"pair",eqs:[`y=${m}*x+(${b})`,`${a}*x+(${c})*y=(${d})`],q:M(`Solve the system:<br>y = ${lin(m,b)}<br>${e2} = ${d}`),answer:`(${x}, ${y})`,
   steps:[ASK("Find (x, y) that satisfies both equations."),RULE("Substitute the expression for y into the second equation."),WORK(M(`${polyStr([[a,"x"]])} + ${P(c)}(${lin(m,b)}) = ${d} → ${cf(a+c*m,"x")} = ${d-c*b} → x = ${x}; y = ${m}(${P(x)}) + ${P(b)} = ${y}`)),ANS(M(`(${x}, ${y})`))]}},
 ()=>{const x=ri(-5,6),y=ri(-6,8);let m1=rnz(-4,4),m2;do{m2=rnz(-4,4)}while(m2===m1);const b1=y-m1*x,b2=y-m2*x;return {type:"pair",eqs:[`y=${m1}*x+(${b1})`,`y=${m2}*x+(${b2})`],q:M(`Solve the system:<br>y = ${lin(m1,b1)}<br>y = ${lin(m2,b2)}`),answer:`(${x}, ${y})`,
   steps:[ASK("Both equations say y = …; set the right sides equal."),RULE("If y equals two expressions, the expressions equal each other."),WORK(M(`${lin(m1,b1)} = ${lin(m2,b2)} → ${m1-m2}x = ${b2-b1} → x = ${x}; y = ${m1}(${P(x)}) + ${P(b1)} = ${y}`)),ANS(M(`(${x}, ${y})`))]}},
 ()=>{const x=ri(-6,6),y=ri(-5,5),m=rnz(-3,3),b=x-m*y,a=rnz(-4,4),c=rnz(-4,4);if(a*m+c===0)return TOPICS[19].gens[2]();const d=a*x+c*y;return {type:"pair",eqs:[`x=${m}*y+(${b})`,`${a}*x+(${c})*y=(${d})`],q:M(`Solve the system:<br>x = ${polyStr([[m,"y"],[b,""]])}<br>${polyStr([[a,"x"],[c,"y"]])} = ${d}`),answer:`(${x}, ${y})`,
   steps:[ASK("Find (x, y)."),RULE("Substitute the expression for x into the second equation."),WORK(M(`${a}(${polyStr([[m,"y"],[b,""]])})${addP(polyStr([[c,"y"]]))} = ${d} → ${cf(a*m+c,"y")} = ${d-a*b} → y = ${y}; x = ${m}(${y}) + ${P(b)} = ${x}`)),ANS(M(`(${x}, ${y})`))]}}]},

{id:"sys-elim",unit:"a1sys",grade:8,std:"A.REI.6",title:"Systems by elimination",prereqs:["sys-sub"],
 lesson:{intro:"Elimination adds or subtracts the equations to make one variable disappear.",
  points:["Line up both equations as ax + by = c.","If needed, multiply one or both equations so a variable has opposite coefficients, then add the equations.","Solve for one variable, substitute back for the other, and check."]},
 gens:[
 ()=>{const x=ri(-6,6),y=ri(-6,6),a=rnz(-5,5),b=rnz(-5,5),c=rnz(-5,5),d=rnz(-5,5);if(a===0||b===0)return TOPICS[20].gens[0]();
   const e1=[a,b,a*x+b*y],e2=[c,-b,c*x-b*y];if(a+c===0)return TOPICS[20].gens[0]();return {type:"pair",eqs:[`${e1[0]}*x+(${e1[1]})*y=(${e1[2]})`,`${e2[0]}*x+(${e2[1]})*y=(${e2[2]})`],q:M(`Solve the system:<br>${polyStr([[e1[0],"x"],[e1[1],"y"]])} = ${e1[2]}<br>${polyStr([[e2[0],"x"],[e2[1],"y"]])} = ${e2[2]}`),answer:`(${x}, ${y})`,
   steps:[ASK("Find (x, y)."),RULE("The y-coefficients are opposites, so add the equations to eliminate y."),WORK(M(`Add: ${cf(a+c,"x")} = ${e1[2]+e2[2]} → x = ${x}; substitute: ${cf(b,"y")} = ${e1[2]-a*x} → y = ${y}`)),ANS(M(`(${x}, ${y})`))]}},
 ()=>{const x=ri(-6,6),y=ri(-6,6),a=rnz(-4,4),b=rnz(-4,4);const c1=rnz(-4,4),c2=rnz(-4,4);
   const A=[a,b,a*x+b*y],B=[c1,c2,c1*x+c2*y];if(a*c2-b*c1===0)return TOPICS[20].gens[1]();
   // eliminate x: multiply eq1 by c1 and eq2 by a
   return {type:"pair",eqs:[`${A[0]}*x+(${A[1]})*y=(${A[2]})`,`${B[0]}*x+(${B[1]})*y=(${B[2]})`],q:M(`Solve the system:<br>${polyStr([[A[0],"x"],[A[1],"y"]])} = ${A[2]}<br>${polyStr([[B[0],"x"],[B[1],"y"]])} = ${B[2]}`),answer:`(${x}, ${y})`,
   steps:[ASK("Find (x, y)."),RULE("Multiply the equations by numbers that make one variable's coefficients opposites (here, eliminate x), then add."),
   WORK(M(`Multiply eq. 1 by ${P(B[0])}, eq. 2 by ${P(-A[0])}, add: ${cf(A[1]*B[0]-A[0]*B[1],"y")} = ${A[2]*B[0]-A[0]*B[2]} → y = ${y}; substitute: ${cf(A[0],"x")} = ${A[2]-A[1]*y} → x = ${x}`)),ANS(M(`(${x}, ${y})`))]}},
 ()=>{const x=ri(1,12),y=ri(1,12);return {type:"pair",eqs:[`x+y=${x+y}`,`x-y=(${x-y})`],q:M(`Two numbers x and y have sum ${x+y} and difference ${x-y} (x − y). Solve:<br>x + y = ${x+y}<br>x - y = ${x-y}`),answer:`(${x}, ${y})`,
   steps:[ASK("Find (x, y)."),RULE("Add the equations: the y terms cancel."),WORK(M(`2x = ${x+y} + ${P(x-y)} = ${2*x} → x = ${x}; y = ${x+y} - ${x} = ${y}`)),ANS(M(`(${x}, ${y})`))]}}]},

// ---------------- Algebra I: Exponents & polynomials ----------------
{id:"exp-prod",unit:"a1exp",grade:8,std:"8.EE.1",title:"Exponent rules",prereqs:["expr-simplify"],
 lesson:{intro:"An exponent counts repeated multiplication: x⁴ = x·x·x·x. Rules for exponents save you from writing out every factor.",
  points:["Product rule: xᵃ · xᵇ = xᵃ⁺ᵇ (add exponents).","Quotient rule: xᵃ ÷ xᵇ = xᵃ⁻ᵇ (subtract exponents).","Power rule: (xᵃ)ᵇ = xᵃᵇ and (cx)ᵃ = cᵃxᵃ. Type exponents as x^5."]},
 gens:[
 ()=>{const a=ri(2,9),b=ri(2,9);return {type:"poly",q:M(`Simplify: x^${a} · x^${b}`),answer:`x^${a+b}`,
   steps:[ASK("Multiply powers with the same base."),RULE("Product rule: add the exponents."),WORK(`${a} + ${b} = ${a+b}`),ANS(M(`x^${a+b}`))]}},
 ()=>{const b=ri(2,6),a=b+ri(1,7),c=ri(2,9),k=ri(2,9);return {type:"poly",q:M(`Simplify: ${c*k}x^${a} ÷ ${c}x^${b}`),answer:`${k===1?"":k}x^${a-b}`,
   steps:[ASK("Divide monomials."),RULE("Divide the coefficients and subtract the exponents."),WORK(`${c*k} ÷ ${c} = ${k}; ${a} − ${b} = ${a-b}`),ANS(M(`${k}x^${a-b}`))]}},
 ()=>{const a=ri(2,6),b=ri(2,5);return {type:"poly",q:M(`Simplify: (x^${a})^${b}`),answer:`x^${a*b}`,
   steps:[ASK("Raise a power to a power."),RULE("Power rule: multiply the exponents."),WORK(`${a} × ${b} = ${a*b}`),ANS(M(`x^${a*b}`))]}},
 ()=>{const c=ri(2,6),d=ri(2,6),a=ri(1,6),b=ri(1,6);return {type:"poly",q:M(`Simplify: (${c}x^${a})(${d}x^${b})`),answer:`${c*d}x^${a+b}`,
   steps:[ASK("Multiply monomials."),RULE("Multiply the coefficients and add the exponents of x."),WORK(`${c} × ${d} = ${c*d}; ${a} + ${b} = ${a+b}`),ANS(M(`${c*d}x^${a+b}`))]}},
 ()=>{const c=ri(2,4),a=ri(1,5),b=ri(2,3);return {type:"poly",q:M(`Simplify: (${c}x^${a})^${b}`),answer:`${Math.pow(c,b)}x^${a*b}`,
   steps:[ASK("Raise a monomial to a power."),RULE("Raise the coefficient to the power and multiply the exponents."),WORK(`${c}^${b} = ${Math.pow(c,b)}; ${a} × ${b} = ${a*b}`),ANS(M(`${Math.pow(c,b)}x^${a*b}`))]}},
 ()=>{const a=ri(1,5),b=ri(1,5),c=ri(1,5),d=ri(1,5);return {type:"poly",q:M(`Simplify: (x^${a}y^${b})(x^${c}y^${d})`),answer:`x^${a+c}y^${b+d}`,
   steps:[ASK("Multiply, grouping each variable."),RULE("Add exponents of the same base separately for x and for y."),WORK(`x: ${a} + ${c} = ${a+c}; y: ${b} + ${d} = ${b+d}`),ANS(M(`x^${a+c}y^${b+d}`))]}}]},

{id:"exp-neg-zero",unit:"a1exp",grade:8,std:"8.EE.1",title:"Zero & negative exponents",prereqs:["exp-prod","frac-muldiv"],
 lesson:{intro:"Extending the quotient rule gives meaning to zero and negative exponents.",
  points:["Zero exponent: a⁰ = 1 for any a ≠ 0.","Negative exponent: a⁻ⁿ = 1/aⁿ (it flips to the denominator, it does not make the number negative).","Combine with product/quotient rules: 3⁻² · 3⁴ = 3² = 9. Type fractions like 1/8."]},
 gens:[
 ()=>{const a=ri(2,12)*pick([1,-1]);return {type:"num",js:"1",q:M(`Evaluate: ${P(a)}^0`),answer:"1",
   steps:[ASK("Evaluate a number to the zero power."),RULE("Any nonzero number to the power 0 equals 1."),WORK(M(`${P(a)}^0 = 1`)),ANS("1")]}},
 ()=>{const a=ri(2,6),n=ri(1,4);const v=Math.pow(a,n);return {type:"num",js:`1/${v}`,q:M(`Evaluate: ${a}^-${n}`),answer:`1/${v}`,
   steps:[ASK("Evaluate a negative exponent."),RULE("a^(−n) = 1 ÷ aⁿ."),WORK(M(`${a}^-${n} = 1/${a}^${n} = 1/${v}`)),ANS(`1/${v}`)]}},
 ()=>{const a=ri(2,4),n=ri(1,3),neg=(-a);const v=Math.pow(neg,n*2);return {type:"num",js:`1/${v}`,q:M(`Evaluate: (${neg})^-${n*2}`),answer:`1/${v}`,
   steps:[ASK("Evaluate a negative base with a negative even exponent."),RULE("Flip to the denominator: (−a)^(−n) = 1/(−a)ⁿ; an even power of a negative is positive."),WORK(M(`(${neg})^${n*2} = ${v}, so the result is 1/${v}`)),ANS(`1/${v}`)]}},
 ()=>{const a=ri(2,5),p=ri(1,3),q=ri(p+1,p+4),r=q-p;return {type:"num",js:`${a}**${-p}*${a}**${q}`,q:M(`Evaluate: ${a}^-${p} · ${a}^${q}`),answer:String(Math.pow(a,r)),
   steps:[ASK("Use the product rule, then evaluate."),RULE("Add the exponents: −p + q."),WORK(M(`${a}^(${-p}+${q}) = ${a}^${r} = ${Math.pow(a,r)}`)),ANS(M(Math.pow(a,r)))]}},
 ()=>{const a=ri(2,4),p=ri(1,3),q=p+ri(1,3);const v=Math.pow(a,q-p);return {type:"num",js:`${a}**${p}/${a}**${q}`,q:M(`Evaluate: ${a}^${p} ÷ ${a}^${q}`),answer:`1/${v}`,
   steps:[ASK("Use the quotient rule."),RULE("Subtract the exponents: p − q (it will be negative)."),WORK(M(`${a}^(${p}-${q}) = ${a}^-${q-p} = 1/${v}`)),ANS(`1/${v}`)]}}]},

{id:"poly-add",unit:"a1exp",grade:8,std:"A.APR.1",title:"Add & subtract polynomials",prereqs:["expr-simplify","exp-prod"],
 lesson:{intro:"A polynomial is a sum of terms like 3x², −5x and 7. You can add and subtract them by combining like terms (same variable and same exponent).",
  points:["Combine only terms with the same variable part: x² with x², x with x.","To subtract, distribute the negative sign: −(2x − 3) = −2x + 3.","Write the answer from highest to lowest power: 3x^2 - 5x + 2."]},
 gens:[
 ()=>{let a,b,c,d,e,f;do{[a,b,c,d,e,f]=[rnz(-6,7),ri(-8,8),ri(-9,9),rnz(-6,7),ri(-8,8),ri(-9,9)]}while(a+d===0);
   const p1=[[a,"x^2"],[b,"x"],[c,""]],p2=[[d,"x^2"],[e,"x"],[f,""]],r=[[a+d,"x^2"],[b+e,"x"],[c+f,""]];return {type:"poly",q:M(`Add: (${polyStr(p1)}) + (${polyStr(p2)})`),answer:polyStr(r),
   steps:[ASK("Add the polynomials."),RULE("Combine like terms."),WORK(M(`x²: ${a} + ${P(d)} = ${a+d}; x: ${b} + ${P(e)} = ${b+e}; constants: ${c} + ${P(f)} = ${c+f}`)),ANS(M(polyStr(r)))]}},
 ()=>{let a,b,c,d,e,f;do{[a,b,c,d,e,f]=[rnz(-6,7),ri(-8,8),ri(-9,9),rnz(-6,7),ri(-8,8),ri(-9,9)]}while(a-d===0);
   const p1=[[a,"x^2"],[b,"x"],[c,""]],p2=[[d,"x^2"],[e,"x"],[f,""]],r=[[a-d,"x^2"],[b-e,"x"],[c-f,""]];return {type:"poly",q:M(`Subtract: (${polyStr(p1)}) - (${polyStr(p2)})`),answer:polyStr(r),
   steps:[ASK("Subtract the second polynomial from the first."),RULE("Distribute the negative: subtract every term of the second polynomial."),WORK(M(`x²: ${a} - ${P(d)} = ${a-d}; x: ${b} - ${P(e)} = ${b-e}; constants: ${c} - ${P(f)} = ${c-f}`)),ANS(M(polyStr(r)))]}},
 ()=>{let a,b,c,d;do{[a,b,c,d]=[rnz(-7,8),rnz(-7,8),rnz(-7,8),rnz(-7,8)]}while(a+c===0||b+d===0);
   const p1=[[a,"x^3"],[b,"x"]],p2=[[c,"x^3"],[d,"x"]],r=[[a+c,"x^3"],[b+d,"x"]];return {type:"poly",q:M(`Add: (${polyStr(p1)}) + (${polyStr(p2)})`),answer:polyStr(r),
   steps:[ASK("Add the polynomials."),RULE("Only like terms (same power) combine."),WORK(M(`x³: ${a} + ${P(c)} = ${a+c}; x: ${b} + ${P(d)} = ${b+d}`)),ANS(M(polyStr(r)))]}},
 ()=>{let a,b,c,d,e;do{[a,b,c,d,e]=[rnz(-5,6),rnz(-8,8),rnz(-9,9),rnz(-5,6),rnz(-7,7)]}while(a+d===0||b===0);
   const p1=[[a,"x^2"],[b,"x"]],p2=[[d,"x^2"],[e,"x"],[c,""]],r=[[a+d,"x^2"],[b+e,"x"],[c,""]];return {type:"poly",q:M(`Add: (${polyStr(p1)}) + (${polyStr(p2)})`),answer:polyStr(r),
   steps:[ASK("Add the polynomials (one has no constant term)."),RULE("Line up like terms; a missing term counts as 0."),WORK(M(`x²: ${a} + ${P(d)} = ${a+d}; x: ${b} + ${P(e)} = ${b+e}; constant: 0 + ${P(c)} = ${c}`)),ANS(M(polyStr(r)))]}}]}
);

