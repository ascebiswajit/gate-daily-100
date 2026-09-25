(() => {
  const BANK = window.QUESTION_BANK || [];
  const MOCK = BANK.filter(q => q.mock1);
  const SUBJECTS = [...new Set(BANK.map(q => q.subject))];
  const storeKey = 'gate2027-mastery-v1';
  const defaultState = { practice: [], mockHistory: [], theme: 'dark' };
  let state = loadState();
  let currentView = 'daily';
  let practiceSet = [...BANK];
  let practiceIndex = 0;
  let practiceChecked = false;
  let mockIndex = 0;
  let mockAnswers = {};
  let mockReview = {};
  let mockRunning = false;
  let mockStartedAt = null;
  let mockTimerId = null;
  let secondsLeft = 180 * 60;

  const $ = id => document.getElementById(id);
  const els = {
    headerProgress: $('headerProgress'), masteryIndex: $('masteryIndex'), masteryBar: $('masteryBar'), masteryCaption: $('masteryCaption'), subjectCoverage: $('subjectCoverage'),
    nextActionTitle: $('nextActionTitle'), nextActionText: $('nextActionText'), themeToggle: $('themeToggle'),
    mockTimer: $('mockTimer'), mockAnswered: $('mockAnswered'), mockIntro: $('mockIntro'), examPledge: $('examPledge'), startMockBtn: $('startMockBtn'), examShell: $('examShell'),
    questionPalette: $('questionPalette'), submitMockBtn: $('submitMockBtn'), mockQNo: $('mockQNo'), mockSubject: $('mockSubject'), mockType: $('mockType'), mockMarks: $('mockMarks'), mockStem: $('mockStem'), mockAnswerArea: $('mockAnswerArea'),
    clearMockBtn: $('clearMockBtn'), reviewMockBtn: $('reviewMockBtn'), prevMockBtn: $('prevMockBtn'), saveNextBtn: $('saveNextBtn'), mockResult: $('mockResult'),
    subjectFilter: $('subjectFilter'), difficultyFilter: $('difficultyFilter'), typeFilter: $('typeFilter'), filteredCount: $('filteredCount'), resetFiltersBtn: $('resetFiltersBtn'), randomPracticeBtn: $('randomPracticeBtn'),
    practiceQNo: $('practiceQNo'), practiceSubject: $('practiceSubject'), practiceType: $('practiceType'), practiceMarks: $('practiceMarks'), practiceDifficulty: $('practiceDifficulty'), practiceStem: $('practiceStem'), practiceAnswerArea: $('practiceAnswerArea'), practiceFeedback: $('practiceFeedback'),
    prevPracticeBtn: $('prevPracticeBtn'), checkPracticeBtn: $('checkPracticeBtn'), nextPracticeBtn: $('nextPracticeBtn'),
    analyticsSummary: $('analyticsSummary'), subjectAnalytics: $('subjectAnalytics'), weakTopics: $('weakTopics'), mockHistory: $('mockHistory'), resetProgressBtn: $('resetProgressBtn')
  };

  function loadState(){ try { return {...defaultState, ...(JSON.parse(localStorage.getItem(storeKey)) || {})}; } catch { return {...defaultState}; } }
  function saveState(){ localStorage.setItem(storeKey, JSON.stringify(state)); renderGlobalStats(); }
  function escapeHTML(v){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
  function equalAnswer(q, user){
    if(user === undefined || user === null || user === '' || (Array.isArray(user) && !user.length)) return false;
    if(q.type === 'NAT'){
      const a = Number(user), b = Number(q.answer);
      if(!Number.isFinite(a)) return false;
      return Math.abs(a-b) <= Math.max(0.001, Math.abs(b)*0.001);
    }
    if(q.type === 'MSQ'){
      const ua = [...user].map(Number).sort((a,b)=>a-b);
      const ca = [...q.answer].map(Number).sort((a,b)=>a-b);
      return ua.length===ca.length && ua.every((v,i)=>v===ca[i]);
    }
    return Number(user) === Number(q.answer);
  }
  function correctText(q){
    if(q.type==='NAT') return String(q.answer);
    if(q.type==='MSQ') return q.answer.map(i => `${String.fromCharCode(65+i)}. ${q.options[i]}`).join('; ');
    return `${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}`;
  }
  function formatTime(s){ s=Math.max(0,Math.floor(s)); const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60; return [h,m,sec].map(x=>String(x).padStart(2,'0')).join(':'); }
  function attemptedPracticeIds(){ return new Set(state.practice.map(x=>x.id)); }
  function practiceStats(){
    const attempts=state.practice.length, correct=state.practice.filter(x=>x.correct).length;
    return {attempts,correct,accuracy:attempts?Math.round(correct/attempts*100):0};
  }
  function mastery(){
    const p=practiceStats();
    const unique=attemptedPracticeIds().size;
    const coverage=Math.min(100, unique/BANK.length*100);
    const latest=state.mockHistory[0];
    const mockPct=latest?Math.max(0,latest.score):null;
    if(!p.attempts && !latest) return 0;
    if(latest && p.attempts) return Math.round((p.accuracy*0.45)+(coverage*0.2)+(mockPct*0.35));
    if(latest) return Math.round(mockPct);
    return Math.round(p.accuracy*0.7 + coverage*0.3);
  }

  function showView(name){
    currentView=name;
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active-view',v.id===name));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    window.scrollTo({top:0,behavior:'smooth'});
    if(name==='practice') renderPractice();
    if(name==='analytics') renderAnalytics();
    if(name==='dashboard') renderDashboard();
  }

  function renderDashboard(){
    const m=mastery(), p=practiceStats();
    els.masteryIndex.textContent=`${m}%`; els.masteryBar.style.width=`${m}%`;
    els.masteryCaption.textContent = !p.attempts && !state.mockHistory.length ? 'Start practicing to build your baseline.' : m<50 ? 'Foundation stage — keep building topic accuracy.' : m<75 ? 'Good momentum — focus on weak subjects and timed work.' : 'Strong practice trend — keep testing under exam conditions.';
    const counts=Object.fromEntries(SUBJECTS.map(s=>[s,BANK.filter(q=>q.subject===s).length]));
    const max=Math.max(...Object.values(counts));
    els.subjectCoverage.innerHTML=SUBJECTS.map(s=>`<div class="subject-row"><span>${escapeHTML(s)}</span><div class="bar"><i style="width:${counts[s]/max*100}%"></i></div><small>${counts[s]} Q</small></div>`).join('');
    if(state.mockHistory.length){
      const last=state.mockHistory[0]; els.nextActionTitle.textContent='Review your last mock'; els.nextActionText.textContent=`Your latest score was ${last.score.toFixed(2)}/100. Open Analytics to identify where marks were lost.`;
    } else if(p.attempts){ els.nextActionTitle.textContent='Move from practice to pressure'; els.nextActionText.textContent=`You have checked ${p.attempts} practice answers at ${p.accuracy}% accuracy. Take the timed full mock next.`; }
  }

  function renderGlobalStats(){
    const unique=attemptedPracticeIds().size; els.headerProgress.textContent=`${unique} / 100 practiced`;
    renderDashboard(); if(currentView==='analytics') renderAnalytics();
  }

  function renderAnswerArea(container,q,value,mode){
    if(q.type==='NAT'){
      container.innerHTML=`<input class="nat-input" type="number" step="any" placeholder="Enter numerical answer" value="${value ?? ''}" data-answer-input />`;
      return;
    }
    const selected = q.type==='MSQ' ? new Set(Array.isArray(value)?value.map(Number):[]) : new Set(value!==undefined&&value!==null?[Number(value)]:[]);
    container.innerHTML=q.options.map((op,i)=>`<label class="option"><input type="${q.type==='MSQ'?'checkbox':'radio'}" name="${mode}-q-${q.id}" value="${i}" ${selected.has(i)?'checked':''}/><span><b>${String.fromCharCode(65+i)}.</b> ${escapeHTML(op)}</span></label>`).join('');
  }
  function readAnswer(container,q){
    if(q.type==='NAT') return container.querySelector('[data-answer-input]')?.value ?? '';
    if(q.type==='MSQ') return [...container.querySelectorAll('input:checked')].map(x=>Number(x.value));
    const x=container.querySelector('input:checked'); return x?Number(x.value):null;
  }

  // Mock
  function startMock(){
    if(!els.examPledge.checked){ alert('Please confirm you understand this is an independent practice mock.'); return; }
    mockAnswers={}; mockReview={}; mockIndex=0; mockRunning=true; mockStartedAt=Date.now(); secondsLeft=180*60;
    els.mockIntro.classList.add('hidden'); els.mockResult.classList.add('hidden'); els.examShell.classList.remove('hidden');
    renderMockQuestion(); startTimer();
  }
  function startTimer(){
    clearInterval(mockTimerId); els.mockTimer.textContent=formatTime(secondsLeft);
    mockTimerId=setInterval(()=>{ secondsLeft=Math.max(0,10800-Math.floor((Date.now()-mockStartedAt)/1000)); els.mockTimer.textContent=formatTime(secondsLeft); if(secondsLeft<=0){ clearInterval(mockTimerId); submitMock(true); } },1000);
  }
  function saveCurrentMock(){
    const q=MOCK[mockIndex]; const val=readAnswer(els.mockAnswerArea,q);
    if(val===null || val==='' || (Array.isArray(val)&&!val.length)) delete mockAnswers[q.id]; else mockAnswers[q.id]=val;
  }
  function renderPalette(){
    els.questionPalette.innerHTML=MOCK.map((q,i)=>`<button data-mock-index="${i}" class="${i===mockIndex?'is-current ':''}${mockAnswers[q.id]!==undefined?'is-answered ':''}${mockReview[q.id]?'is-review':''}">${i+1}</button>`).join('');
    els.questionPalette.querySelectorAll('button').forEach(b=>b.onclick=()=>{saveCurrentMock(); mockIndex=Number(b.dataset.mockIndex); renderMockQuestion();});
    els.mockAnswered.textContent=`${Object.keys(mockAnswers).length} / 65 answered`;
  }
  function renderMockQuestion(){
    const q=MOCK[mockIndex];
    els.mockQNo.textContent=`Question ${mockIndex+1} of 65`; els.mockSubject.textContent=q.subject; els.mockType.textContent=q.type; els.mockMarks.textContent=`${q.marks} mark${q.marks>1?'s':''}`; els.mockStem.textContent=q.stem;
    renderAnswerArea(els.mockAnswerArea,q,mockAnswers[q.id],'mock');
    els.reviewMockBtn.textContent=mockReview[q.id]?'Unmark review':'Mark for review'; els.prevMockBtn.disabled=mockIndex===0; els.saveNextBtn.textContent=mockIndex===MOCK.length-1?'Save response':'Save & Next →'; renderPalette();
  }
  function scoreMock(){
    let score=0, correct=0, wrong=0, unanswered=0; const bySubject={}; const review=[];
    MOCK.forEach(q=>{
      const ans=mockAnswers[q.id]; const answered=ans!==undefined; const ok=answered && equalAnswer(q,ans); let delta=0;
      if(!answered){unanswered++;} else if(ok){correct++; delta=q.marks; score+=delta;} else {wrong++; if(q.type==='MCQ'){delta=-(q.marks===1?1/3:2/3); score+=delta;}}
      bySubject[q.subject] ||= {marks:0,max:0,correct:0,total:0}; bySubject[q.subject].max+=q.marks; bySubject[q.subject].marks+=delta; bySubject[q.subject].total++; if(ok)bySubject[q.subject].correct++;
      review.push({q,ans,ok,answered,delta});
    });
    return {score,correct,wrong,unanswered,bySubject,review};
  }
  function submitMock(auto=false){
    if(!mockRunning)return; saveCurrentMock();
    if(!auto && !confirm(`Submit now? You have answered ${Object.keys(mockAnswers).length} of 65 questions.`)) return;
    mockRunning=false; clearInterval(mockTimerId); const result=scoreMock();
    const used=Math.round((Date.now()-mockStartedAt)/1000); const record={date:new Date().toISOString(),score:Number(result.score.toFixed(2)),correct:result.correct,wrong:result.wrong,unanswered:result.unanswered,timeUsed:used,bySubject:result.bySubject};
    state.mockHistory.unshift(record); state.mockHistory=state.mockHistory.slice(0,20); saveState();
    els.examShell.classList.add('hidden'); els.mockResult.classList.remove('hidden');
    const subjectRows=Object.entries(result.bySubject).map(([s,v])=>`<div class="analytics-row"><span>${escapeHTML(s)}</span><div class="accuracy-bar"><i style="width:${Math.max(0,Math.min(100,v.marks/v.max*100))}%"></i></div><b>${v.marks.toFixed(2)}/${v.max}</b><small>${v.correct}/${v.total} correct</small></div>`).join('');
    const reviewRows=result.review.map((r,i)=>`<div class="review-item ${!r.answered?'unanswered':r.ok?'correct':'wrong'}"><b>Q${i+1} · ${escapeHTML(r.q.subject)} · ${r.q.marks}M</b><div>${escapeHTML(r.q.stem)}</div><small>${r.ok?'Correct':!r.answered?'Unanswered':'Correct answer: '+escapeHTML(correctText(r.q))}</small><p>${escapeHTML(r.q.explanation)}</p></div>`).join('');
    els.mockResult.innerHTML=`<div class="result-wrap"><div class="score-card"><span class="eyebrow">Mock submitted</span><div class="score-big">${result.score.toFixed(2)}<small>/100</small></div><p>Time used: ${formatTime(used)}. Score follows GATE-style MCQ negative marking.</p><div class="breakdown"><div><b>${result.correct}</b><span>Correct</span></div><div><b>${result.wrong}</b><span>Wrong</span></div><div><b>${result.unanswered}</b><span>Unanswered</span></div></div><h3>Subject score</h3>${subjectRows}<div class="exam-actions"><button class="primary-btn" id="goAnalyticsFromResult">View Analytics</button><button class="ghost-btn" id="restartMock">Retake Mock</button></div></div><div class="score-card"><span class="eyebrow">Question review</span><h2>What happened</h2><div class="review-list">${reviewRows}</div></div></div>`;
    $('goAnalyticsFromResult').onclick=()=>showView('analytics'); $('restartMock').onclick=resetMockUI;
  }
  function resetMockUI(){ clearInterval(mockTimerId); mockRunning=false; mockAnswers={};mockReview={};mockIndex=0;secondsLeft=10800;els.mockTimer.textContent='03:00:00';els.mockAnswered.textContent='0 / 65 answered';els.mockResult.classList.add('hidden');els.examShell.classList.add('hidden');els.mockIntro.classList.remove('hidden');els.examPledge.checked=false; }

  // Practice
  function filterPractice(){
    practiceSet=BANK.filter(q=>(els.subjectFilter.value==='all'||q.subject===els.subjectFilter.value)&&(els.difficultyFilter.value==='all'||q.difficulty===els.difficultyFilter.value)&&(els.typeFilter.value==='all'||q.type===els.typeFilter.value));
    practiceIndex=0; practiceChecked=false; els.filteredCount.textContent=practiceSet.length; renderPractice();
  }
  function renderPractice(){
    if(!practiceSet.length){ els.practiceStem.textContent='No questions match these filters.'; els.practiceAnswerArea.innerHTML=''; return; }
    const q=practiceSet[Math.min(practiceIndex,practiceSet.length-1)]; practiceChecked=false;
    els.practiceQNo.textContent=`Bank Q${q.id} · ${practiceIndex+1}/${practiceSet.length}`; els.practiceSubject.textContent=q.subject; els.practiceType.textContent=q.type; els.practiceMarks.textContent=`${q.marks} mark${q.marks>1?'s':''}`; els.practiceDifficulty.textContent=q.difficulty; els.practiceStem.textContent=q.stem;
    renderAnswerArea(els.practiceAnswerArea,q,null,'practice'); els.practiceFeedback.className='feedback hidden'; els.practiceFeedback.innerHTML=''; els.checkPracticeBtn.disabled=false; els.prevPracticeBtn.disabled=practiceIndex===0;
  }
  function checkPractice(){
    if(!practiceSet.length||practiceChecked)return; const q=practiceSet[practiceIndex], ans=readAnswer(els.practiceAnswerArea,q);
    const has=!(ans===null||ans===''||(Array.isArray(ans)&&!ans.length)); if(!has){alert('Choose or enter an answer first.');return;}
    const ok=equalAnswer(q,ans); practiceChecked=true; state.practice.push({id:q.id,subject:q.subject,topic:q.topic,correct:ok,date:new Date().toISOString()}); if(state.practice.length>2000)state.practice=state.practice.slice(-2000); saveState();
    els.practiceFeedback.className=`feedback ${ok?'correct':'wrong'}`; els.practiceFeedback.innerHTML=`<strong>${ok?'✓ Correct':'✕ Not correct'}</strong><div>${ok?'Well done.':'Correct answer: '+escapeHTML(correctText(q))}</div><p>${escapeHTML(q.explanation)}</p>`; els.checkPracticeBtn.disabled=true;
  }

  // Analytics
  function renderAnalytics(){
    const p=practiceStats(), unique=attemptedPracticeIds().size, latest=state.mockHistory[0];
    els.analyticsSummary.innerHTML=`<div class="metric"><span>Mastery index</span><strong>${mastery()}%</strong></div><div class="metric"><span>Unique questions practiced</span><strong>${unique}/100</strong></div><div class="metric"><span>Practice accuracy</span><strong>${p.accuracy}%</strong></div><div class="metric"><span>Latest mock</span><strong>${latest?latest.score.toFixed(2):'—'}</strong></div>`;
    const by={}; SUBJECTS.forEach(s=>by[s]={a:0,c:0}); state.practice.forEach(x=>{by[x.subject] ||= {a:0,c:0};by[x.subject].a++;if(x.correct)by[x.subject].c++;});
    els.subjectAnalytics.innerHTML=SUBJECTS.map(s=>{const v=by[s],acc=v.a?Math.round(v.c/v.a*100):0;return `<div class="analytics-row"><span>${escapeHTML(s)}</span><div class="accuracy-bar"><i style="width:${acc}%"></i></div><b>${acc}%</b><small>${v.a} attempts</small></div>`}).join('');
    const topics={}; state.practice.forEach(x=>{const k=`${x.subject} — ${x.topic}`;topics[k] ||= {a:0,c:0};topics[k].a++;if(x.correct)topics[k].c++;});
    const weak=Object.entries(topics).filter(([,v])=>v.a>=1).map(([k,v])=>({k,a:v.a,acc:v.c/v.a})).sort((a,b)=>a.acc-b.acc||b.a-a.a).slice(0,7);
    els.weakTopics.innerHTML=weak.length?weak.map(x=>`<div class="weak-chip"><span>${escapeHTML(x.k)}</span><small>${Math.round(x.acc*100)}% · ${x.a} attempts</small></div>`).join(''):'<p class="muted">No practice data yet. Check a few answers first.</p>';
    if(!state.mockHistory.length){els.mockHistory.innerHTML='<p class="muted">No full mock submitted yet.</p>';} else {
      els.mockHistory.innerHTML=`<table class="history-table"><thead><tr><th>Date</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Unanswered</th><th>Time</th></tr></thead><tbody>${state.mockHistory.map(h=>`<tr><td>${new Date(h.date).toLocaleString()}</td><td><b>${Number(h.score).toFixed(2)}</b></td><td>${h.correct}</td><td>${h.wrong}</td><td>${h.unanswered}</td><td>${formatTime(h.timeUsed)}</td></tr>`).join('')}</tbody></table>`;
    }
  }

  // Event wiring
  document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
  els.startMockBtn.onclick=startMock; els.submitMockBtn.onclick=()=>submitMock(false);
  els.saveNextBtn.onclick=()=>{saveCurrentMock(); if(mockIndex<MOCK.length-1)mockIndex++; renderMockQuestion();};
  els.prevMockBtn.onclick=()=>{saveCurrentMock();if(mockIndex>0)mockIndex--;renderMockQuestion();};
  els.clearMockBtn.onclick=()=>{delete mockAnswers[MOCK[mockIndex].id];renderMockQuestion();};
  els.reviewMockBtn.onclick=()=>{saveCurrentMock(); const id=MOCK[mockIndex].id;mockReview[id]=!mockReview[id];renderMockQuestion();};
  SUBJECTS.forEach(s=>els.subjectFilter.insertAdjacentHTML('beforeend',`<option>${escapeHTML(s)}</option>`));
  [els.subjectFilter,els.difficultyFilter,els.typeFilter].forEach(x=>x.addEventListener('change',filterPractice));
  els.resetFiltersBtn.onclick=()=>{els.subjectFilter.value='all';els.difficultyFilter.value='all';els.typeFilter.value='all';filterPractice();};
  els.randomPracticeBtn.onclick=()=>{if(practiceSet.length){practiceIndex=Math.floor(Math.random()*practiceSet.length);renderPractice();}};
  els.prevPracticeBtn.onclick=()=>{if(practiceIndex>0){practiceIndex--;renderPractice();}};
  els.nextPracticeBtn.onclick=()=>{if(practiceSet.length){practiceIndex=(practiceIndex+1)%practiceSet.length;renderPractice();}};
  els.checkPracticeBtn.onclick=checkPractice;
  els.resetProgressBtn.onclick=()=>{if(confirm('Delete all locally stored practice and mock history?')){state={...defaultState,theme:state.theme};saveState();renderAnalytics();}};
  els.themeToggle.onclick=()=>{state.theme=state.theme==='light'?'dark':'light';document.documentElement.classList.toggle('light',state.theme==='light');saveState();};
  document.documentElement.classList.toggle('light',state.theme==='light');
  renderGlobalStats(); renderPractice();
})();
