(()=>{
 const base='https://gate2026.iitg.ac.in/doc/download/', archive='https://gate2026.iitg.ac.in/download.html', old='https://gate.iitb.ac.in/G21/prev_qp.php';
 const drive=id=>`https://drive.google.com/file/d/${id}/view`;
 const item=(label,paper,key)=>({label,paper,key});
 const papers=[
 {year:2026,source:'https://gate2026.iitg.ac.in/QPs-answer-keys.html',host:'Official · IIT Guwahati',sessions:[item('CS-1 · Forenoon',base+'2026/QPs/CS1.pdf',base+'2026/Keys/CS1_Keys.pdf'),item('CS-2 · Afternoon',base+'2026/QPs/CS2.pdf',base+'2026/Keys/CS2_Keys.pdf')]},
 {year:2025,source:archive,host:'Official · IIT Guwahati archive',sessions:[item('CS-1',base+'2025/CS12025.pdf',base+'2025_Key/CS1_Keys.pdf'),item('CS-2',base+'2025/CS22025.pdf',base+'2025_Key/CS2_Keys.pdf')]},
 {year:2024,source:archive,host:'Official · IIT Guwahati archive',sessions:[item('CS-1',base+'2024/CS124S5.pdf',base+'2024/CS1FinalAnswerKey.pdf'),item('CS-2',base+'2024/CS224S6.pdf',base+'2024/CS2FinalAnswerKey.pdf')]},
 {year:2023,source:archive,host:'Official · IIT Guwahati archive',sessions:[item('CS',base+'2023/cs_2023.pdf',base+'Answer_keys2023/CS_ANS_GATE2023.pdf')]},
 {year:2022,source:archive,host:'Official · IIT Guwahati archive',sessions:[item('CS',base+'2022/cs_2022.pdf',base+'Answer_keys2022/cs_2022.pdf')]},
 {year:2021,source:'https://gate.iitb.ac.in/G21/21_Final_QP.php',host:'Official · IIT Bombay / Google Drive',sessions:[item('CS-1',drive('1OeFHhzXUa9IqBUw-dOfFWG3p26khwcle'),drive('1p4nF5fT5-6svoSQtjMxtAcNEYO68ZH_Y')),item('CS-2',drive('1uFhc0hPPMYUKKLT8EiYlWN52KplHnKUN'),drive('1ZADD3mRJEchcwp6Av2xKn4sBT9JtxSXn'))]},
 {year:2020,source:old,host:'Official · IIT Bombay archive / Google Drive',sessions:[item('CS',drive('1aY4vbSqrBjJzYBahBq6dKBU3G5jWYiLX'),drive('1EFhHXxyYCOC0XeAXKmtCQJZ2I6n9XREk'))]},
 {year:2019,source:old,host:'Official · IIT Bombay archive / Google Drive',sessions:[item('CS',drive('150P7u2AvVuafV7JI_eGB5YDOcpgwPl1s'),drive('1VtB4NwlBAdX7QQnjYLGrXz39l1yxYnfv'))]},
 {year:2018,source:old,host:'Official · IIT Bombay archive / Google Drive',sessions:[item('CS',drive('1CboGjdOkvPzijQk8IXzsE6LdJst-xv9M'),drive('1IqzR1oBuWFssrnPt7O61dxmKUQeT06gK'))]},
 {year:2017,source:'https://byjus.com/gate/2017-answer-key/',host:'Archived copies · Gate Exam Info / BYJU’S',note:'CS-2 included. The original 2017 host is unavailable; these links are third-party copies of the paper and key.',sessions:[item('CS-2','https://www.gateexam.info/docs/papers/CS/CS-2017-2.pdf','https://cdn1.byjus.com/wp-content/uploads/2021/06/GATE-Computer-Science-Previous-year-paper-2017-Answer-keys.pdf')]}
 ];
 window.PAPER_ARCHIVE=papers;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 papers.forEach(p=>$('paperYear').insertAdjacentHTML('beforeend',`<option value="${p.year}">${p.year}</option>`));
 function renderPapers(){$('paperArchive').innerHTML=papers.filter(p=>$('paperYear').value==='all'||String(p.year)===$('paperYear').value).map(p=>`<article class="card paper-card"><header><h2>${p.year}</h2><span class="pill">${p.sessions.length} ${p.sessions.length===1?'paper':'papers'}</span></header>${p.sessions.map(s=>`<div class="paper-session"><h3>${s.label}</h3><div class="paper-links"><a class="primary-btn" href="${s.paper}" target="_blank" rel="noopener noreferrer" aria-label="${p.year} ${s.label} question paper PDF">Question paper ↗</a><a class="secondary-btn" href="${s.key}" target="_blank" rel="noopener noreferrer" aria-label="${p.year} ${s.label} answer key PDF">Answer key ↗</a></div></div>`).join('')}<p class="paper-source">${p.host} · <a href="${p.source}" target="_blank" rel="noopener noreferrer">Source</a></p>${p.note?`<p class="daily-caption muted">${p.note}</p>`:''}</article>`).join('');}
 $('paperYear').onchange=renderPapers;renderPapers();
 const subjects=[
 ['Engineering Mathematics','Logic, sets and relations, algebraic structures, graphs, counting, linear algebra, calculus, probability and statistics.'],
 ['Programming & Data Structures','C, recursion, arrays, stacks, queues, linked lists, trees, binary search trees, heaps and graphs.'],
 ['Algorithms','Complexity, searching, sorting, hashing, greedy methods, dynamic programming, divide and conquer, graph traversal and shortest paths.'],
 ['Digital Logic','Boolean algebra and minimization, combinational and sequential circuits, number representation and arithmetic.'],
 ['Computer Organization & Architecture','Instructions, addressing modes, ALU and control, memory hierarchy, I/O, pipelining and hazards.'],
 ['Operating Systems','Processes, threads, synchronization, deadlocks, scheduling, memory, virtual memory and file systems.'],
 ['Databases','ER and relational models, algebra and calculus, SQL, constraints, normalization, indexes, transactions and concurrency.'],
 ['Computer Networks','Layering, switching, link control, routing, IPv4, fragmentation, CIDR, NAT, TCP, sockets, DNS and HTTP.'],
 ['Theory of Computation','Regular languages, finite automata, grammars, pushdown automata, pumping lemmas, Turing machines and undecidability.'],
 ['Compiler Design','Lexical analysis, parsing, syntax-directed translation, runtime environments, intermediate code, optimization and data flow.'],
 ['General Aptitude','Keep a daily practice slot for verbal, quantitative, analytical and spatial reasoning.']
 ];
 let done={};try{done=JSON.parse(localStorage.getItem('gate-prep-checklist-v1'))||{}}catch{}
 $('prepSubjects').innerHTML=subjects.map(([name,topics],i)=>`<article class="card"><span class="eyebrow">${String(i+1).padStart(2,'0')} · SUBJECT</span><h2>${esc(name)}</h2><p>${esc(topics)}</p><div class="prep-checks">${['Concepts','PYQs','Revision'].map((stage,j)=>`<label><input type="checkbox" data-prep="${i}-${j}" ${done[`${i}-${j}`]?'checked':''}>${stage}</label>`).join('')}</div></article>`).join('');
 function progress(){$('prepProgress').textContent=`${Object.values(done).filter(Boolean).length} / 33 milestones`;}
 document.querySelectorAll('[data-prep]').forEach(input=>input.onchange=()=>{done[input.dataset.prep]=input.checked;try{localStorage.setItem('gate-prep-checklist-v1',JSON.stringify(done))}catch{}progress()});progress();
})();
