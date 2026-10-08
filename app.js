(() => {
  'use strict';
  const CATEGORIES = {
    C: { name: 'Foundations', description: 'Ball control & juggling', glyph: '◈', tint: '#f9c573' },
    L: { name: 'Lowers', description: 'Aerial leg tricks', glyph: '↗', tint: '#c2f66b' },
    U: { name: 'Uppers', description: 'Head, shoulders & chest', glyph: '◎', tint: '#a6a4ff' },
    S: { name: 'Sitdowns', description: 'Seated juggling & tricks', glyph: '⌁', tint: '#ffb981' },
    B: { name: 'Stalls & blocks', description: 'Catch, balance & control', glyph: '⬡', tint: '#7de4d9' },
    T: { name: 'Transitions', description: 'Flow & combinations', glyph: '⤨', tint: '#ffa9c2' }
  };
  const LEVEL_NAMES = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'];
  const STORAGE_KEY = 'freestyle-130-progress-v1';
  const skillById = new Map(SKILL_DATA.map(s => [s.id, s]));
  const allIds = new Set(SKILL_DATA.map(s => s.id));
  let completed = loadProgress();
  let category = 'L';
  let screen = 'map';
  let selectedId = null;
  let zoom = 1;
  let toastTimer = null;
  let mapNodes = new Map();
  const $ = id => document.getElementById(id);
  const percent = (a, b) => b ? Math.round(a / b * 100) : 0;
  const countDone = () => SKILL_DATA.filter(s => completed.has(s.id)).length;
  const remaining = s => s.prereqs.filter(id => !completed.has(id));
  const status = s => completed.has(s.id) ? 'done' : remaining(s).length ? 'locked' : 'ready';
  const byCategory = cat => SKILL_DATA.filter(s => s.category === cat);
  const dependencies = id => SKILL_DATA.filter(s => s.prereqs.includes(id));
  const safeText = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const statusLabel = {done:'Mastered',ready:'Ready to learn',locked:'Prerequisites missing'};

  function loadProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const ids = Array.isArray(value) ? value : value.completed;
      return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string' && allIds.has(id)) : []);
    } catch { return new Set(); }
  }
  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({version:1,completed:[...completed],savedAt:new Date().toISOString()}));
      $('saved-indicator').textContent = '● Saved on this device';
    } catch { $('saved-indicator').textContent = '● Saving unavailable'; }
  }
  function showToast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  function toggleSkill(id, force) {
    const skill = skillById.get(id);
    if (!skill) return;
    const previousReady = new Set(SKILL_DATA.filter(s => status(s) === 'ready').map(s => s.id));
    const shouldComplete = force === undefined ? !completed.has(id) : Boolean(force);
    if (shouldComplete) completed.add(id); else completed.delete(id);
    saveProgress();
    renderSummary();
    renderMap(false);
    renderLibrary();
    renderProgress();
    if (selectedId) renderDrawer(selectedId);
    const newlyReady = SKILL_DATA.filter(s => status(s) === 'ready' && !previousReady.has(s.id));
    showToast(shouldComplete ? `Mastered: ${skill.name}${newlyReady.length ? ` · ${newlyReady.length} new skill${newlyReady.length===1?'':'s'} ready` : ''}` : `Unmarked: ${skill.name}`);
  }
  function initNavigation() {
    document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.screen)));
    $('sidebar-branches').innerHTML = Object.entries(CATEGORIES).map(([id, c]) => `<button class="branch-side" data-category="${id}"><span class="side-glyph" style="--accent:${c.tint}">${c.glyph}</span><span>${c.name}</span><span class="side-counter" id="side-count-${id}"></span></button>`).join('');
    $('branch-tabs').innerHTML = Object.entries(CATEGORIES).map(([id, c]) => `<button class="branch-tab" data-category="${id}"><span class="tab-glyph">${c.glyph}</span>${c.name}<span class="tab-count">${byCategory(id).length}</span></button>`).join('');
    document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {category=button.dataset.category;navigate('map');renderMap(true); }));
    $('library-category').innerHTML = `<option value="all">All disciplines</option>`+Object.entries(CATEGORIES).map(([id,c])=>`<option value="${id}">${c.name}</option>`).join('');
    ['skill-search','library-category','library-level','library-status'].forEach(id => $(id).addEventListener(id==='skill-search'?'input':'change',renderLibrary));
    $('zoom-out').addEventListener('click',()=>setZoom(zoom-.15));
    $('zoom-in').addEventListener('click',()=>setZoom(zoom+.15));
    $('reset-map').addEventListener('click',()=>{setZoom(1);$('map-scroll').scrollTo({top:0,left:0,behavior:'smooth'});});
    $('drawer-close').addEventListener('click',closeDrawer);
    $('drawer-backdrop').addEventListener('click',closeDrawer);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
    $('drawer-content').addEventListener('click',event=>{
      const jump = event.target.closest('[data-jump]');
      if(jump){openSkill(jump.dataset.jump);return;}
      const master = event.target.closest('[data-master]');
      if(master)toggleSkill(master.dataset.master);
    });
    $('library-grid').addEventListener('click',event=>{
      const button=event.target.closest('[data-open]'); if(button)openSkill(button.dataset.open);
    });
    $('next-skills').addEventListener('click',event=>{
      const button=event.target.closest('[data-open]');if(button)openSkill(button.dataset.open);
    });
    $('discipline-stats').addEventListener('click',event=>{
      const button=event.target.closest('[data-category]');if(button){category=button.dataset.category;navigate('map');renderMap(true);}
    });
    $('export-progress').addEventListener('click',exportProgress);
    $('import-file').addEventListener('change',importProgress);
    $('clear-progress').addEventListener('click',()=>{
      if(!completed.size){showToast('No skills marked yet.');return;}
      if(window.confirm('Reset all marked skills? This cannot be undone unless you exported a backup.')){
        completed.clear();saveProgress();renderAll();showToast('Progress reset.');
      }
    });
  }
  function navigate(to) {
    if(!['map','library','progress'].includes(to))return;
    screen=to;
    document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===`screen-${to}`));
    document.querySelectorAll('[data-screen]').forEach(el=>{
      const active=el.dataset.screen===to;
      el.classList.toggle('active',active);
      if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    });
    closeDrawer();
    if(to==='map')requestAnimationFrame(()=>{if(!$('map-world').children.length)renderMap(true);});
    window.scrollTo({top:0,behavior:'instant'});
  }
  function renderSummary(){
    const mastered=countDone(),ready=SKILL_DATA.filter(s=>status(s)==='ready').length;
    $('hero-done').innerHTML = `${mastered}<span class="dimmed">/130</span>`;
    $('hero-ready').textContent=ready;$('hero-percent').textContent=`${percent(mastered,130)}%`;
    $('level-tag').textContent=`LEVEL ${Math.min(5,1+Math.floor(mastered/26))}`;
    for(const [id] of Object.entries(CATEGORIES)){
      const done=byCategory(id).filter(s=>completed.has(s.id)).length;
      $(`side-count-${id}`).textContent=`${done}/${byCategory(id).length}`;
    }
  }
  function setZoom(value){
    zoom = Math.max(.7, Math.min(1.3, Math.round(value*100)/100));
    const world=$('map-world'),holder=$('map-scale-holder');
    world.style.transform=`scale(${zoom})`;
    holder.style.width=`${Math.ceil(Number(world.dataset.width||0)*zoom)}px`;
    holder.style.height=`${Math.ceil(Number(world.dataset.height||0)*zoom)}px`;
    $('zoom-reading').textContent=`${Math.round(zoom*100)}%`;
    $('zoom-in').disabled=zoom>=1.3;$('zoom-out').disabled=zoom<=.7;
  }
  function renderMap(resetScroll){
    for(const tab of document.querySelectorAll('.branch-tab,.branch-side'))tab.classList.toggle('active',tab.dataset.category===category);
    const c=CATEGORIES[category];
    $('map-context-icon').textContent=c.glyph;$('map-context-icon').style.color=c.tint;
    $('map-context-title').textContent=c.name;$('map-context-subtitle').textContent=c.description+` · ${byCategory(category).length} challenges`;
    const arr=byCategory(category),levels=[1,2,3,4,5],nodes=new Map();
    const leftPad=60, colWidth=242, cardWidth=204, topPad=108, rowHeight=104;
    const stageCounts=levels.map(n=>arr.filter(s=>s.level===n).length);
    const height=Math.max(...stageCounts)*rowHeight+topPad+54;
    const width=levels.length*colWidth+leftPad+30;
    let html='';
    levels.forEach(lv=>{
      const x=leftPad+(lv-1)*colWidth;
      html+=`<div class="stage-heading" style="left:${x}px;top:22px"><span>0${lv} / ${LEVEL_NAMES[lv-1].toUpperCase()}</span><i></i></div>`;
      arr.filter(s=>s.level===lv).forEach((s,i)=>{
        const y=topPad+i*rowHeight;
        nodes.set(s.id,{x,y,w:cardWidth,h:80});
        const st=status(s),extra=selectedId===s.id?' selected':'';
        html+=`<button class="skill-node ${st}${extra}" data-node="${s.id}" style="left:${x}px;top:${y}px;width:${cardWidth}px;--skill-accent:${c.tint}" aria-label="${safeText(s.name)}, ${statusLabel[st]}"><span class="node-top"><span class="node-id">${s.id}</span><span class="node-state">${st==='done'?'✓':st==='ready'?'↗':'⌁'}</span></span><strong>${safeText(s.name)}</strong><span class="node-bottom">${st==='done'?'MASTERED':st==='ready'?'READY TO LEARN':`${remaining(s).length} TO UNLOCK`}</span></button>`;
      });
    });
    $('map-world').dataset.width=String(width);$('map-world').dataset.height=String(height);
    $('map-world').style.width=`${width}px`;$('map-world').style.height=`${height}px`;
    const edges=[];
    for(const s of arr){
      for(const prereq of s.prereqs){
        if(!nodes.has(prereq))continue;
        const from=nodes.get(prereq),to=nodes.get(s.id), isSame=from.x===to.x;
        let d;
        if(isSame){
          const sx=from.x+from.w/2,sy=from.y+from.h;
          const tx=to.x+to.w/2,ty=to.y;
          d=`M ${sx} ${sy} C ${sx+48} ${sy+26}, ${tx+48} ${ty-26}, ${tx} ${ty}`;
        }else{
          const sx=from.x+from.w,sy=from.y+from.h/2;
          const tx=to.x,ty=to.y+to.h/2;
          const k=Math.max(30,(tx-sx)*.48);
          d=`M ${sx} ${sy} C ${sx+k} ${sy}, ${tx-k} ${ty}, ${tx} ${ty}`;
        }
        const active=selectedId&&(s.id===selectedId||prereq===selectedId);
        edges.push(`<path d="${d}" class="edge ${active?'edge-active':''}" data-from="${prereq}" data-to="${s.id}"/>`);
      }
    }
    $('map-edges').setAttribute('width',String(width));$('map-edges').setAttribute('height',String(height));
    $('map-edges').setAttribute('viewBox',`0 0 ${width} ${height}`);$('map-edges').innerHTML=edges.join('');
    $('map-nodes').innerHTML=html;
    mapNodes=nodes;
    $('map-nodes').querySelectorAll('[data-node]').forEach(btn=>btn.addEventListener('click',()=>openSkill(btn.dataset.node)));
    setZoom(zoom);
    if(resetScroll)$('map-scroll').scrollTo({left:0,top:0,behavior:'instant'});
  }
  function renderLibrary(){
    const query=$('skill-search').value.trim().toLowerCase(), cat=$('library-category').value, lv=$('library-level').value,st=$('library-status').value;
    const arr=SKILL_DATA.filter(s=>(cat==='all'||s.category===cat)&&(lv==='all'||s.level===Number(lv))&&(st==='all'||status(s)===st)&&(!query||`${s.id} ${s.name} ${CATEGORIES[s.category].name}`.toLowerCase().includes(query)));
    $('results-count').textContent=`${arr.length} result${arr.length===1?'':'s'}`;
    $('results-title').textContent=query?`Results for “${query}”`:'Explore all tricks';
    $('library-grid').innerHTML=arr.length?arr.map(s=>{
      const stat=status(s),c=CATEGORIES[s.category];
      return `<button class="library-card" data-open="${s.id}" style="--skill-accent:${c.tint}"><span class="lib-top"><span class="lib-id">${s.id}</span><span class="lib-status ${stat}">${stat==='done'?'✓ Mastered':stat==='ready'?'↗ Ready':'⌁ Locked'}</span></span><strong>${safeText(s.name)}</strong><span class="lib-meta">${c.glyph} ${c.name} <span>·</span> LVL ${s.level} ${LEVEL_NAMES[s.level-1]}</span><span class="lib-bottom">${stat==='locked'?`${remaining(s).length} prerequisites missing`:stat==='done'?'Skill completed':'Ready to practise'} <span>↗</span></span></button>`;
    }).join(''):`<div class="empty-state">No skills match those filters. Try a different search.</div>`;
  }
  function renderProgress(){
    const done=countDone();
    $('big-progress').textContent=done;
    $('progress-track-fill').style.width=`${percent(done,130)}%`;
    $('progress-summary').textContent=done===0?'Your freestyle journey starts here.':`${percent(done,130)}% completed · ${130-done} challenges still ahead.`;
    $('discipline-stats').innerHTML=Object.entries(CATEGORIES).map(([id,c])=>{
      const arr=byCategory(id),n=arr.filter(s=>completed.has(s.id)).length;
      return `<button class="discipline-stat" data-category="${id}" style="--skill-accent:${c.tint}"><span class="stat-top"><span class="stat-glyph">${c.glyph}</span><span class="stat-count">${n}<small> / ${arr.length}</small></span></span><strong>${c.name}</strong><div class="mini-track"><div style="width:${percent(n,arr.length)}%"></div></div><span class="stat-foot">${percent(n,arr.length)}% complete <span>↗</span></span></button>`;
    }).join('');
    const ready=SKILL_DATA.filter(s=>status(s)==='ready').sort((a,b)=>a.level-b.level||a.id.localeCompare(b.id)).slice(0,8);
    $('next-skills').innerHTML=ready.length?ready.map(s=>`<button class="next-item" data-open="${s.id}"><span class="next-icon" style="color:${CATEGORIES[s.category].tint}">${CATEGORIES[s.category].glyph}</span><span><strong>${safeText(s.name)}</strong><small>${CATEGORIES[s.category].name} · Level ${s.level}</small></span><span class="next-arrow">↗</span></button>`).join(''):`<div class="empty-state">All challenges mastered! Incredible work.</div>`;
  }
  function renderDrawer(id){
    const s=skillById.get(id);if(!s)return;
    const c=CATEGORIES[s.category],st=status(s),downstream=dependencies(s.id),prereqs=s.prereqs.map(x=>skillById.get(x)).filter(Boolean);
    $('drawer-content').innerHTML=`<div class="drawer-accent" style="--skill-accent:${c.tint}"><span>${c.glyph} ${c.name.toUpperCase()}</span><span>${s.id}</span></div>
    <h2>${safeText(s.name)}</h2><div class="detail-meta"><span>LEVEL ${s.level} · ${LEVEL_NAMES[s.level-1].toUpperCase()}</span><span class="detail-status ${st}">${statusLabel[st]}</span></div>
    <p class="detail-copy">${st==='done'?'You have marked this trick as mastered.':st==='ready'?'You have checked off the suggested prerequisites. This trick is ready for practice.':`Complete ${remaining(s).length} suggested prerequisite${remaining(s).length===1?'':'s'} to unlock this challenge.`} Your technique and consistency matter more than the level number.</p>
    <button class="master-btn ${st==='done'?'is-done':''}" data-master="${s.id}">${st==='done'?'✓ Marked mastered — undo':`✓ Mark as mastered`}</button>
    <div class="drawer-section"><h3>PREREQUISITES <span>${prereqs.length}</span></h3>${prereqs.length?prereqs.map(p=>`<button class="related-skill" data-jump="${p.id}"><span class="related-mark ${completed.has(p.id)?'complete':''}">${completed.has(p.id)?'✓':'○'}</span><span><strong>${safeText(p.name)}</strong><small>${p.id} · ${CATEGORIES[p.category].name}</small></span><span>↗</span></button>`).join(''):`<p class="drawer-empty">Starting skill — no prerequisites.</p>`}</div>
    <div class="drawer-section"><h3>UNLOCKS NEXT <span>${downstream.length}</span></h3>${downstream.length?downstream.slice(0,14).map(p=>`<button class="related-skill" data-jump="${p.id}"><span class="related-mark ${completed.has(p.id)?'complete':''}">${completed.has(p.id)?'✓':'→'}</span><span><strong>${safeText(p.name)}</strong><small>${p.id} · LVL ${p.level}</small></span><span>↗</span></button>`).join(''):'<p class="drawer-empty">End of this progression branch.</p>'}</div>`;
    $('drawer-content').scrollTop=0;
  }
  function openSkill(id){
    if(!skillById.has(id))return;
    selectedId=id;
    renderDrawer(id);
    $('skill-drawer').classList.add('open');$('skill-drawer').setAttribute('aria-hidden','false');
    $('drawer-backdrop').hidden=false;document.body.classList.add('drawer-open');
    if(screen==='map'){
      // If a related skill is on another branch, switch branches to show its position.
      const skill=skillById.get(id);
      if(skill.category!==category){category=skill.category;renderMap(false);}
      else highlightEdges();
      const pos=mapNodes.get(id);
      if(pos){
        const scroll=$('map-scroll');
        const x=(pos.x+pos.w/2)*zoom-scroll.clientWidth/2;
        const y=(pos.y+pos.h/2)*zoom-scroll.clientHeight/2;
        scroll.scrollTo({left:Math.max(0,x),top:Math.max(0,y),behavior:'smooth'});
      }
    }
    $('drawer-close').focus({preventScroll:true});
  }
  function highlightEdges(){
    $('map-nodes').querySelectorAll('[data-node]').forEach(el=>el.classList.toggle('selected',el.dataset.node===selectedId));
    $('map-edges').querySelectorAll('.edge').forEach(el=>el.classList.toggle('edge-active',el.dataset.from===selectedId||el.dataset.to===selectedId));
  }
  function closeDrawer(){
    if(!$('skill-drawer').classList.contains('open'))return;
    $('skill-drawer').classList.remove('open');$('skill-drawer').setAttribute('aria-hidden','true');
    $('drawer-backdrop').hidden=true;document.body.classList.remove('drawer-open');
    selectedId=null;highlightEdges();
  }
  function exportProgress(){
    const data={app:'Freestyle 130',version:1,exportedAt:new Date().toISOString(),completed:[...completed]};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='freestyle-130-progress.json';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast('Progress exported as JSON backup.');
  }
  async function importProgress(event){
    const file=event.target.files?.[0];if(!file)return;
    try{
      if(file.size>2_000_000)throw Error('File is too large.');
      const data=JSON.parse(await file.text());
      if(!Array.isArray(data.completed))throw Error('Invalid progress backup.');
      const ids=data.completed.filter(x=>typeof x==='string'&&allIds.has(x));
      if(!window.confirm(`Import ${ids.length} mastered skills? This will replace progress on this device.`))return;
      completed=new Set(ids);saveProgress();renderAll();showToast(`Imported ${ids.length} mastered skills.`);
    }catch(err){showToast(`Could not import: ${err.message}`);}
    finally{event.target.value='';}
  }
  function renderAll(){renderSummary();renderMap(false);renderLibrary();renderProgress();}
  function init(){
    initNavigation();renderAll();
    if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')){
      window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
    }
  }
  init();
})();
