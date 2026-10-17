// ===== finalize graph (must come after all topic files) =====
const TOPIC_BY_ID=Object.fromEntries(TOPICS.map(t=>[t.id,t]));
{const ub=UNIT_BY_ID();TOPICS.forEach(t=>{t.course=ub[t.unit]?ub[t.unit].course:null})}
