/* Freestyle 130 v3 — additive training features; v1 mastery and v2 history are untouched. */
(() => {
  'use strict';
  const KEY = 'freestyle-130-training-v3';
  const TIMER_DRAFT = 'freestyle-130-timer-draft-v3';
  const SKILLS = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA : [];
  const byId = new Map(SKILLS.map(s => [s.id, s]));
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad = n => String(n).padStart(2, '0');
  const localDay = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const monday = date => { const d = new Date(date.getFullYear(),date.getMonth(),date.getDate()); d.setDate(d.getDate() - (d.getDay()+6)%7); return d; };
  const minLabel = mins => mins >= 60 ? `${Math.floor(mins/60)}h ${Math.round(mins%60)}m` : `${Math.round(mins * 10)/10}m`;
  const fmtTime = millis => `${pad(Math.floor(millis/60000))}:${pad(Math.floor(millis/1000)%60)}`;
  const formatStamp = date => new Date(date).toLocaleString(undefined,{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
  const idGen = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const blank = () => ({version:3,sessions:[],bests:[],challengeRuns:[],weeklyGoal:3,focusId:null,focusDay:null});
  let state = load();
  let api = { toast: () => {}, navigate: () => {}, getCompleted: () => new Set() };
  let timer = {running:false,startedAt:0,elapsed:0,skillId:null};
  let timerInterval = null;
  let challenge = {id:null,running:false,startAt:0,elapsed:0,finished:false};
  let challengeInterval = null;
  let media = [];
  let dbPromise;
  let videoUrls = [];
  const CHALLENGES = [
    {id:'toe-taps',name:'Toe-tap sprint',seconds:30,metric:'controlled touches',text:'How many clean alternating toe taps can you complete in 30 seconds?'},
    {id:'juggling',name:'Juggling endurance',seconds:60,metric:'consecutive touches',text:'Record your longest unbroken juggling sequence within 60 seconds.'},
    {id:'atw',name:'ATW clean landings',seconds:120,metric:'clean landings',text:'Count the ATW attempts you land cleanly in two minutes.'},
    {id:'crossover',name:'Crossover test',seconds:90,metric:'clean landings',text:'Count clean Crossovers in 90 seconds.'},
    {id:'balance',name:'Foot-stall balance',seconds:60,metric:'seconds held',text:'Record your longest continuous stall, in whole seconds (max 60).'},
    {id:'flow',name:'Freestyle flow',seconds:180,metric:'clean combinations',text:'Count complete combinations performed cleanly in three minutes.'}
  ];
  function cleanState(raw) {
    if(!raw || typeof raw !== 'object') return blank();
    const validAt = x => typeof x === 'string' && Number.isFinite(Date.parse(x));
    const sessions = Array.isArray(raw.sessions) ? raw.sessions.slice(0,15000).filter(s => s && typeof s.id === 'string' && byId.has(s.skillId) && validAt(s.at) && Number.isFinite(s.minutes) && s.minutes >= .1 && s.minutes <= 300 && ['practice','challenge'].includes(s.kind)).map(s=>({id:s.id.slice(0,100),skillId:s.skillId,at:s.at,minutes:Math.round(s.minutes*10)/10,kind:s.kind,note:String(s.note||'').slice(0,220)})) : [];
    const bests = Array.isArray(raw.bests) ? raw.bests.slice(0,5000).filter(b=>b && typeof b.id==='string' && byId.has(b.skillId) && validAt(b.at) && Number.isFinite(b.value) && b.value >= 0 && b.value<=1e6 && ['landings','streak','seconds','touches'].includes(b.metric)).map(b=>({id:b.id.slice(0,100),skillId:b.skillId,at:b.at,value:b.value,metric:b.metric})) : [];
    const challengeRuns = Array.isArray(raw.challengeRuns) ? raw.challengeRuns.slice(0,5000).filter(r=>r && typeof r.id==='string' && CHALLENGES.some(c=>c.id===r.challengeId) && validAt(r.at) && Number.isInteger(r.score) && r.score>=0 && r.score<=100000 && Number.isFinite(r.seconds) && r.seconds>=1 && r.seconds<=180).map(r=>({id:r.id.slice(0,100),challengeId:r.challengeId,score:r.score,seconds:r.seconds,at:r.at})) : [];
    return {version:3,sessions,bests,challengeRuns,weeklyGoal:Number.isInteger(raw.weeklyGoal) && raw.weeklyGoal >= 1 && raw.weeklyGoal <= 7 ? raw.weeklyGoal : 3,focusId:byId.has(raw.focusId)?raw.focusId:null,focusDay:/^\d{4}-\d{2}-\d{2}$/.test(raw.focusDay||'')?raw.focusDay:null};
  }
  function load(){try{return cleanState(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{return blank();}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{api.toast('Storage full or unavailable. Export your data and free space.');}}
  function skillOptions(){return SKILLS.map(s=>`<option value="${s.id}">${esc(s.name)} (${s.id})</option>`).join('');}
  function currentSkill(){return $('training-skill')?.value || 'C01';}
  function skillName(id){return byId.get(id)?.name || id;}
  function todaySessions(){return state.sessions.filter(s=>localDay(new Date(s.at))===localDay(new Date()));}
  function weeklySessions(){const start=monday(new Date());return state.sessions.filter(s=>new Date(s.at)>=start && s.minutes>=5);}
  function totalMinutes(){return state.sessions.reduce((sum,s)=>sum+s.minutes,0);}
  function notifyChange(){save();render();}
  function addSession(skillId,minutes,note='',kind='practice') {
    if(!byId.has(skillId) || !Number.isFinite(minutes) || minutes<.1 || minutes>300) {api.toast('Choose a skill and a valid duration (up to 300 minutes).');return false;}
    state.sessions.push({id:idGen(),skillId,minutes:Math.round(minutes*10)/10,at:new Date().toISOString(),note:String(note||'').slice(0,220),kind});
    notifyChange();api.toast(`Saved ${minLabel(minutes)} of ${skillName(skillId)}.`);return true;
  }
  function restoreTimer(){
    try {const d=JSON.parse(localStorage.getItem(TIMER_DRAFT)||'null');if(d&&Number.isFinite(d.elapsed)&&d.elapsed>=0&&d.elapsed<=18000000&&byId.has(d.skillId)){timer={running:false,startedAt:0,elapsed:d.elapsed,skillId:d.skillId};$('training-skill').value=d.skillId;}} catch {}
  }
  function persistTimer(){try{localStorage.setItem(TIMER_DRAFT,JSON.stringify({elapsed:elapsedMs(),skillId:timer.skillId}));}catch{}}
  function elapsedMs(){return timer.elapsed+(timer.running?Math.max(0,Date.now()-timer.startedAt):0);}
  function timerUpdate(){const ms=elapsedMs();$('training-skill').disabled=ms>0;$('training-clock').textContent=fmtTime(ms);$('timer-start').disabled=timer.running;$('timer-start').textContent=ms>0&&!timer.running?'▶ Resume':'▶ Start';$('timer-pause').disabled=!timer.running;$('timer-save').disabled=ms<6000;$('timer-status').textContent=timer.running?'Recording practice time. Pause if you take a break.':ms>0?'Paused — save your session or resume.':'Ready to train. Start the clock or log minutes manually.';}
  function pauseTimer(){if(timer.running){timer.elapsed=elapsedMs();timer.startedAt=0;timer.running=false;}persistTimer();timerUpdate();}
  function startTimer(){if(challenge.running){api.toast('Finish the timed challenge first.');return;}if(timer.running)return;if(!timer.skillId)timer.skillId=currentSkill();timer.startedAt=Date.now();timer.running=true;persistTimer();timerUpdate();}
  function resetTimer(){timer={running:false,startedAt:0,elapsed:0,skillId:null};try{localStorage.removeItem(TIMER_DRAFT);}catch{}timerUpdate();}
  function saveTimer(){pauseTimer();const mins=Math.round(timer.elapsed/6000)/10;if(mins<.1){api.toast('Time at least 6 seconds before saving.');return;}if(addSession(timer.skillId||currentSkill(),mins,$('practice-notes').value)){resetTimer();$('practice-notes').value='';}}
  function logManual(){const minutes=Number($('manual-minutes').value);if(!Number.isFinite(minutes)||minutes<1||minutes>300){api.toast('Enter 1 to 300 minutes.');return;}if(addSession(currentSkill(),minutes,$('practice-notes').value)){$('manual-minutes').value='';$('practice-notes').value='';}}
  function recommendedFocus() {
    const mastered=api.getCompleted();
    const available=SKILLS.filter(s=>!mastered.has(s.id) && s.prereqs.every(id=>mastered.has(id)));
    const candidates=available.length?available:SKILLS.filter(s=>!mastered.has(s.id));
    const priority={C:0,L:1,U:2,S:3,B:4,T:5};
    return (candidates.sort((a,b)=>a.level-b.level||priority[a.category]-priority[b.category]||a.id.localeCompare(b.id))[0]||SKILLS[0]).id;
  }
  function getFocus() {
    const day=localDay(new Date());
    if(state.focusDay!==day || !byId.has(state.focusId)){
      state.focusId=recommendedFocus();state.focusDay=day;save();
    }
    return state.focusId;
  }
  function setFocus(id){if(!byId.has(id))return;state.focusId=id;state.focusDay=localDay(new Date());save();if($('training-skill'))$('training-skill').value=id;if($('best-skill'))$('best-skill').value=id;if($('video-skill'))$('video-skill').value=id;render();}
  function quests() {
    const focusId=getFocus();const sessions=todaySessions();const todayMins=sessions.reduce((n,s)=>n+s.minutes,0);
    const focused=sessions.filter(s=>s.skillId===focusId).reduce((n,s)=>n+s.minutes,0);
    const changedToday = state.bests.some(b=>localDay(new Date(b.at))===localDay(new Date()))||state.challengeRuns.some(r=>localDay(new Date(r.at))===localDay(new Date()));
    return [{title:'Get moving',detail:'Log 5 minutes of any freestyle training',done:todayMins>=5,progress:`${minLabel(todayMins)} / 5m`},
      {title:'Focus skill',detail:`Log 10 minutes on ${skillName(focusId)}`,done:focused>=10,progress:`${minLabel(focused)} / 10m`},
      {title:'Test yourself',detail:'Record a personal-best attempt OR finish a timed challenge',done:changedToday,progress:changedToday?'Completed':'Not yet completed'}];
  }
  function renderTrain(){
    if(!$('training-total'))return;
    const week=state.sessions.filter(s=>new Date(s.at)>=monday(new Date())).reduce((n,s)=>n+s.minutes,0);
    $('training-total').textContent=minLabel(totalMinutes());$('training-week').textContent=minLabel(week);$('training-sessions').textContent=state.sessions.length;
    const n=weeklySessions().length;$('weekly-progress').textContent=`${n} / ${state.weeklyGoal}`;$('weekly-fill').style.width=`${Math.min(100,n/state.weeklyGoal*100)}%`;$('weekly-target').value=String(state.weeklyGoal);
    $('training-session-list').innerHTML=state.sessions.length?[...state.sessions].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,20).map(s=>`<div class="v3-log"><div><strong>${esc(skillName(s.skillId))}</strong><small>${esc(formatStamp(s.at))} · ${esc(s.kind==='challenge'?'Timed challenge':'Practice')}${s.note?' · '+esc(s.note):''}</small></div><span class="v3-amount">${minLabel(s.minutes)}</span><button class="v3-icon" data-remove-session="${esc(s.id)}" aria-label="Delete practice log">✕</button></div>`).join(''):'<p class="v3-empty">No sessions yet. Your first 5 minutes can be today.</p>';
    timerUpdate();
  }
  function renderQuests(){
    if(!$('quest-focus-title'))return;
    const id=getFocus();const skill=byId.get(id);const q=quests();
    $('quest-focus-select').value=id;$('quest-total').textContent=`${q.filter(x=>x.done).length} / 3`;$('quest-focus-level').textContent=`Level ${skill.level}`;
    $('quest-minutes').textContent=minLabel(todaySessions().reduce((n,s)=>n+s.minutes,0));
    $('quest-focus-title').textContent=skill.name;
    const missing=skill.prereqs.filter(id=>!api.getCompleted().has(id));
    $('quest-focus-desc').textContent=`${skill.category==='L'?'Lowers':skill.category==='C'?'Foundations':'Skill tree'} · Level ${skill.level}. ${missing.length?`Suggested prerequisites: ${missing.map(skillName).join(', ')}.`:'Prerequisites checked off or no prerequisites.'}`;
    $('daily-quests').innerHTML=q.map((x,i)=>`<div class="quest-card ${x.done?'quest-done':''}"><div class="quest-number">${x.done?'✓':pad(i+1)}</div><div><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p><small>${esc(x.progress)}</small></div></div>`).join('');
    const warm = SKILLS.find(s=>s.id==='C04') || SKILLS[0];
    const prereq = skill.prereqs.map(id=>byId.get(id)).find(s=>s && !api.getCompleted().has(s.id)) || skill.prereqs.map(id=>byId.get(id)).find(Boolean) || warm;
    const rows = [{time:'5 MIN',text:`Warm up · ${warm.name}`,id:warm.id},{time:'10 MIN',text:`Focus · ${skill.name}`,id:skill.id},{time:'5 MIN',text:`Refine · ${prereq.name}`,id:prereq.id}];
    $('routine-steps').innerHTML=rows.map(r=>`<button data-routine-skill="${r.id}" class="routine-row"><span>${r.time}</span><strong>${esc(r.text)}</strong><span>↗</span></button>`).join('');
  }
  function renderBests(){ // Integrated into the skill drawer and training page below.
    const root=$('personal-best-list');if(!root)return;
    const latest=state.bests.slice().sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,8);
    const id=$('best-skill').value,metric=$('best-metric').value;const record=bestFor(id,metric);$('best-current').textContent=`Personal best: ${record} ${metric}`;
    root.innerHTML=latest.length?latest.map(b=>`<div class="v3-log"><div><strong>${esc(skillName(b.skillId))}</strong><small>${esc(b.metric)} · ${esc(formatStamp(b.at))}</small></div><span class="v3-amount">${b.value}</span><button class="v3-icon" data-remove-best="${esc(b.id)}" aria-label="Remove personal-best entry">✕</button></div>`).join(''):'<p class="v3-empty">Record a best attempt to start tracking improvement.</p>';
  }
  function bestFor(skillId,metric){return Math.max(0,...state.bests.filter(b=>b.skillId===skillId && b.metric===metric).map(b=>b.value));}
  function setBest(){
    const skillId=$('best-skill').value,metric=$('best-metric').value,value=Number($('best-value').value);
    if(!byId.has(skillId)||!['landings','streak','seconds','touches'].includes(metric)||!Number.isFinite(value)||value<0||value>100000||!Number.isInteger(value)){api.toast('Enter a whole-number personal-best score.');return;}
    const old=bestFor(skillId,metric);state.bests.push({id:idGen(),skillId,metric,value,at:new Date().toISOString()});notifyChange();$('best-value').value='';api.toast(value>old?`New personal best: ${value} ${metric}!`:`Attempt recorded: ${value} ${metric}.`);
  }
  function renderChallenges(){
    if(!$('challenge-cards'))return;
    $('challenge-cards').innerHTML=CHALLENGES.map(c=>{
      const best=Math.max(0,...state.challengeRuns.filter(r=>r.challengeId===c.id).map(r=>r.score));
      return `<button class="challenge-card ${challenge.id===c.id?'chosen':''}" data-choose-challenge="${c.id}"><span class="challenge-duration">${c.seconds}s</span><strong>${esc(c.name)}</strong><small>Personal best: ${best} ${esc(c.metric)}</small><span class="challenge-arrow">Start challenge ↗</span></button>`;
    }).join('');
    $('challenge-history').innerHTML=state.challengeRuns.length?[...state.challengeRuns].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,12).map(r=>{const c=CHALLENGES.find(c=>c.id===r.challengeId);return `<div class="v3-log"><div><strong>${esc(c.name)}</strong><small>${esc(formatStamp(r.at))} · ${r.seconds}s played</small></div><span class="v3-amount">${r.score} ${esc(c.metric)}</span></div>`;}).join(''):'<p class="v3-empty">Choose a challenge to record your first score.</p>';
    updateChallengeClock();
  }
  const challengeElapsed=()=>challenge.elapsed+(challenge.running?Math.max(0,Date.now()-challenge.startAt):0);
  function updateChallengeClock(){
    if(!$('challenge-clock'))return;
    const def=CHALLENGES.find(c=>c.id===challenge.id);
    $('challenge-clock').textContent=fmtTime(Math.max(0,(def?def.seconds*1000:0)-challengeElapsed()));
    $('challenge-start').disabled=!def||challenge.running||challenge.finished;
    $('challenge-start').textContent=challenge.elapsed>0?'▶ Resume':'▶ Start';
    $('challenge-pause').disabled=!challenge.running;
    $('challenge-finish').disabled=!def||challenge.finished||challengeElapsed()<1000;
    $('challenge-score-panel').hidden=!challenge.finished;
    if(def&&challenge.running&&challengeElapsed()>=def.seconds*1000)finishChallenge(false);
  }
  function chooseChallenge(id){
    if(challenge.running){api.toast('Pause or finish your current challenge before switching.');return;}
    const def=CHALLENGES.find(c=>c.id===id);if(!def)return;
    challenge={id,running:false,startAt:0,elapsed:0,finished:false};$('challenge-play-title').textContent=def.name;$('challenge-instructions').textContent=def.text;renderChallenges();
    $('challenge-play').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function startChallenge(){if(!challenge.id||challenge.finished)return;if(timer.running){api.toast('Pause the practice timer first.');return;}challenge.startAt=Date.now();challenge.running=true;updateChallengeClock();}
  function pauseChallenge(){if(challenge.running){challenge.elapsed=challengeElapsed();challenge.running=false;challenge.startAt=0;}updateChallengeClock();}
  function finishChallenge(manual){if(!challenge.id||challenge.finished)return;pauseChallenge();const def=CHALLENGES.find(c=>c.id===challenge.id);challenge.elapsed=Math.min(challenge.elapsed,def.seconds*1000);if(challenge.elapsed<1000){api.toast('Start the clock before finishing.');return;}challenge.finished=true;updateChallengeClock();$('challenge-score').focus();if(!manual)api.toast('Time! Enter your score.');}
  function saveChallenge(){
    const c=CHALLENGES.find(c=>c.id===challenge.id),score=Number($('challenge-score').value);
    if(!c||!challenge.finished||!Number.isInteger(score)||score<0||score>100000||(c.id==='balance'&&score>60)){api.toast('Enter a valid whole-number result.');return;}
    const seconds=Math.max(1,Math.round(challenge.elapsed/1000));state.challengeRuns.push({id:idGen(),challengeId:c.id,score,seconds,at:new Date().toISOString()});
    const targetSkill={ 'toe-taps':'C04','juggling':'C05','atw':'L06','crossover':'L01','balance':'B01','flow':'T05' }[c.id];
    // A very short aborted attempt records the score, but not invented practice minutes.
    if(seconds>=6)state.sessions.push({id:idGen(),skillId:targetSkill,minutes:Math.round(seconds/6)/10,at:new Date().toISOString(),note:`${c.name}: ${score} ${c.metric}`,kind:'challenge'});
    challenge={id:null,running:false,startAt:0,elapsed:0,finished:false};$('challenge-score').value='';notifyChange();api.toast('Challenge score saved! Practice time logs for attempts 6+ seconds.');
  }
  function renderJourneyExtras(){
    if(!$('training-graph'))return;
    const byDay=new Map();for(const s of state.sessions){const day=localDay(new Date(s.at));byDay.set(day,(byDay.get(day)||0)+s.minutes);}
    const today=new Date();const list=[];
    for(let n=13;n>=0;n--){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-n);list.push({day:localDay(d),label:d.toLocaleDateString(undefined,{weekday:'short'}).slice(0,2),minutes:byDay.get(localDay(d))||0});}
    const max=Math.max(5,...list.map(x=>x.minutes));
    $('training-graph').innerHTML=list.map(x=>`<div class="practice-bar-col" title="${x.day} · ${minLabel(x.minutes)}"><span>${x.minutes?minLabel(x.minutes):''}</span><div class="practice-bar-shell"><div style="height:${Math.max(0,100*x.minutes/max)}%"></div></div><small>${esc(x.label)}</small></div>`).join('');
  }
  function render(){renderTrain();renderQuests();renderBests();renderChallenges();renderJourneyExtras();}
  // IndexedDB is intentionally separate from JSON exports; video blobs can be large.
  function database(){
    if(!('indexedDB' in window))return Promise.reject(Error('Video storage is not supported by this browser.'));
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('freestyle130-media-v3',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('videos'))req.result.createObjectStore('videos',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Could not open video storage.'));});
    return dbPromise;
  }
  async function videoTransaction(mode,fn){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('videos',mode);const store=tx.objectStore('videos');let value;try{const request=fn(store);request.onsuccess=()=>{value=request.result;};request.onerror=()=>reject(request.error);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage transaction was cancelled.'));}catch(error){reject(error);}});}
  async function loadVideos(){
    try{media=await videoTransaction('readonly',store=>store.getAll());media.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));renderVideos();}
    catch(error){$('video-feedback').textContent=`Local video storage unavailable: ${error.message}`;renderVideos();}
  }
  async function addVideo(){
    const file=$('video-input').files?.[0];const skillId=$('video-skill').value;
    if(!file){api.toast('Choose a video first.');return;}
    if(!file.type.startsWith('video/')){api.toast('Please select a video file.');return;}
    if(file.size>75*1024*1024){api.toast('Video exceeds 75 MB. Trim or compress it first.');return;}
    $('video-save').disabled=true;$('video-feedback').textContent='Saving video to this device…';
    try{await videoTransaction('readwrite',store=>store.put({id:idGen(),at:new Date().toISOString(),skillId,filename:file.name.slice(0,160),blob:file}));$('video-input').value='';api.toast('Video saved on this device.');$('video-feedback').textContent='Saved locally. Videos are not part of JSON backup exports; keep copies on your phone.';await loadVideos();}
    catch(error){$('video-feedback').textContent='Could not save video: '+error.message+'. Your browser may be out of storage.';}
    finally{$('video-save').disabled=false;}
  }
  async function deleteVideo(id){if(!window.confirm('Delete this saved clip from this device?'))return;try{await videoTransaction('readwrite',store=>store.delete(id));await loadVideos();api.toast('Video deleted.');}catch{api.toast('Could not delete video.');}}
  function clearVideoUrls(){videoUrls.forEach(url=>URL.revokeObjectURL(url));videoUrls=[];}
  function playerHtml(item){if(!item)return 'Choose a saved video above';const url=URL.createObjectURL(item.blob);videoUrls.push(url);return `<video controls playsinline preload="metadata" src="${url}" aria-label="${esc(skillName(item.skillId))} video"></video><small>${esc(formatStamp(item.at))} · ${esc(skillName(item.skillId))}</small>`;}
  function renderVideoPlayers(){
    clearVideoUrls();
    const before=media.find(v=>v.id===$('video-before').value),after=media.find(v=>v.id===$('video-after').value);
    $('video-before-player').innerHTML=playerHtml(before);$('video-after-player').innerHTML=playerHtml(after);
  }
  function renderVideos(){
    if(!$('video-list'))return;
    const before=$('video-before').value,after=$('video-after').value;
    const options=media.map((v,i)=>`<option value="${esc(v.id)}">${i+1}. ${esc(skillName(v.skillId))} · ${esc(formatStamp(v.at))}</option>`).join('');
    $('video-before').innerHTML='<option value="">Choose earlier clip</option>'+options;
    $('video-after').innerHTML='<option value="">Choose later clip</option>'+options;
    $('video-before').value=media.some(v=>v.id===before)?before:(media[0]?.id||'');
    $('video-after').value=media.some(v=>v.id===after)?after:(media.at(-1)?.id||'');
    $('video-list').innerHTML=media.length?[...media].reverse().map(v=>`<div class="v3-log"><div><strong>${esc(skillName(v.skillId))}</strong><small>${esc(formatStamp(v.at))} · ${esc(v.filename)} · ${(v.blob.size/1048576).toFixed(1)} MB</small></div><button class="v3-icon" data-remove-video="${esc(v.id)}" aria-label="Delete video">✕</button></div>`).join(''):'<p class="v3-empty">No clips saved yet. Record a short attempt today, then compare it with a future session.</p>';
    renderVideoPlayers();
  }
  function bind(){
    $('training-skill').innerHTML=skillOptions();$('quest-focus-select').innerHTML=skillOptions();$('video-skill').innerHTML=skillOptions();$('best-skill').innerHTML=skillOptions();
    $('training-skill').value=getFocus();restoreTimer();
    $('timer-start').addEventListener('click',startTimer);$('timer-pause').addEventListener('click',pauseTimer);$('timer-save').addEventListener('click',saveTimer);$('timer-reset').addEventListener('click',()=>{if(timer.running&& !window.confirm('Discard running timer?'))return;resetTimer();});
    $('manual-save').addEventListener('click',logManual);
    $('weekly-target').addEventListener('change',e=>{state.weeklyGoal=Number(e.target.value);notifyChange();api.toast('Weekly goal updated.');});
    $('quest-focus-select').addEventListener('change',e=>setFocus(e.target.value));
    $('quest-open-focus').addEventListener('click',()=>{api.navigate('train');$('training-skill').value=getFocus();});
    $('routine-steps').addEventListener('click',e=>{const el=e.target.closest('[data-routine-skill]');if(el){api.navigate('train');$('training-skill').value=el.dataset.routineSkill;}});
    $('training-session-list').addEventListener('click',e=>{const el=e.target.closest('[data-remove-session]');if(el&&window.confirm('Remove this practice log?')){state.sessions=state.sessions.filter(s=>s.id!==el.dataset.removeSession);notifyChange();}});
    $('best-save').addEventListener('click',setBest);$('best-skill').addEventListener('change',renderBests);$('best-metric').addEventListener('change',renderBests);
    $('personal-best-list').addEventListener('click',e=>{const el=e.target.closest('[data-remove-best]');if(el&&window.confirm('Delete this recorded best attempt?')){state.bests=state.bests.filter(b=>b.id!==el.dataset.removeBest);notifyChange();}});
    $('challenge-cards').addEventListener('click',e=>{const b=e.target.closest('[data-choose-challenge]');if(b)chooseChallenge(b.dataset.chooseChallenge);});
    $('challenge-start').addEventListener('click',startChallenge);$('challenge-pause').addEventListener('click',pauseChallenge);$('challenge-finish').addEventListener('click',()=>finishChallenge(true));$('challenge-score-save').addEventListener('click',saveChallenge);
    $('video-save').addEventListener('click',addVideo);$('video-list').addEventListener('click',e=>{const el=e.target.closest('[data-remove-video]');if(el)deleteVideo(el.dataset.removeVideo);});
    $('video-before').addEventListener('change',renderVideoPlayers);$('video-after').addEventListener('change',renderVideoPlayers);
    timerInterval=setInterval(()=>{timerUpdate();if(timer.running)persistTimer();},1000);challengeInterval=setInterval(updateChallengeClock,200);
    document.addEventListener('visibilitychange',()=>{if(document.hidden && timer.running){pauseTimer();}});
    window.addEventListener('pagehide',()=>{if(timer.running)pauseTimer();});
  }
  function init(host){api={...api,...host};bind();render();loadVideos();}
  function exportData(){return JSON.parse(JSON.stringify(state));}
  function importData(raw){state=cleanState(raw);notifyChange();}
  function getStats(){return {sessions:state.sessions.length, minutes:totalMinutes(),bestAttempts:state.bests.length, challengeRuns:state.challengeRuns.length};}
  window.FreestyleTraining={init,render,exportData,importData,setFocus, getStats};
})();
