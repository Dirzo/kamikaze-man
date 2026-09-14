(()=>{
  const VERSION='v1.1-frenzy';
  const VIEWS=['current','all','legacy'];
  const LABELS={current:'CURRENT PATCH',all:'ALL-TIME',legacy:'LEGACY'};
  const TYPE_LABEL={SWORD:'Sword',DAGGER:'Dagger',NUNCHUCKS:'Nunchucks',KATANA:'Katana',BOW:'Bow',SHURIKEN:'Shuriken',WAND:'Wand',STAFF:'Staff',HAMMER:'Hammer'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeColor=c=>/^#[0-9a-f]{6}$/i.test(String(c||''))?String(c):'#dbe8f5';
  const nf=n=>Math.round(Number(n)||0).toLocaleString();
  let activeView='current';
  let rows=[];
  let selected=null;
  let loading=false;

  const css=document.createElement('style');
  css.textContent=`
    /* Clean landing page: title, handle, actions. No explanation wall. */
    .titleScreen .titleKicker,.titleScreen .titleIntro,.titleScreen .titleRule,.titleScreen .titleBest,.titleScreen .titleControls,.titleScreen .cwmColorPick,.titleScreen .metaLicense{display:none!important}
    .titleScreen .titleInner{width:min(680px,94%);padding:30px 28px 28px!important}
    .titleScreen .gameTitle{margin:4px 0 22px!important}
    .titleScreen .handleBox{margin:0 auto 18px!important;max-width:390px!important}
    .titleScreen .startBtn,.titleScreen .museumBtn,.cwmLandingLbBtn{margin:5px!important;min-width:190px}
    .cwmLandingActions{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}
    .cwmLandingLbBtn{border:1px solid #6bdfff66;border-radius:14px;padding:15px 24px;font-weight:1000;font-size:16px;cursor:pointer;color:#eaf9ff;background:linear-gradient(90deg,#0d2230,#171329);box-shadow:0 0 24px #63dcff24}
    .cwmLandingLbBtn:hover,.cwmLandingLbBtn:focus-visible{border-color:#79e9ff;outline:none;filter:brightness(1.12)}

    .cwmLbBrowser{display:none;position:fixed;inset:0;z-index:100000;background:#02050aee;backdrop-filter:blur(10px);padding:14px;align-items:center;justify-content:center}
    .cwmLbBrowser.show{display:flex}
    .cwmLbShell{width:min(1120px,98vw);height:min(860px,94dvh);display:grid;grid-template-rows:auto 1fr;border:1px solid #ffffff30;border-radius:18px;background:linear-gradient(145deg,#0d1521,#05080d);box-shadow:0 30px 100px #000d;overflow:hidden;color:#edf7ff}
    .cwmLbHead{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px;border-bottom:1px solid #ffffff18;background:#07101bea}
    .cwmLbTitle{font:1000 20px/1 system-ui;margin-right:auto}.cwmLbStatus{font:800 9px/1 system-ui;color:#8095aa;letter-spacing:.1em}
    .cwmLbTabs{display:flex;gap:5px;flex-wrap:wrap}.cwmLbTab{border:1px solid #2d4057;background:#09111a;color:#94a9bf;border-radius:999px;padding:7px 10px;font:900 9px system-ui;cursor:pointer}.cwmLbTab.active{border-color:#fff176;color:#fff176;background:#211d08}
    .cwmLbClose{width:38px;height:38px;border-radius:10px;border:1px solid #ffffff2d;background:#0b141f;color:#fff;font-size:20px;cursor:pointer}
    .cwmLbBody{display:grid;grid-template-columns:minmax(360px,.92fr) minmax(0,1.08fr);min-height:0}
    .cwmLbListPane{min-width:0;min-height:0;border-right:1px solid #ffffff18;display:grid;grid-template-rows:auto 1fr}
    .cwmLbListHead{padding:9px 12px;color:#7f96ad;font:900 9px system-ui;letter-spacing:.12em;border-bottom:1px solid #ffffff12}
    .cwmLbList{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:7px;scrollbar-width:thin}
    .cwmLbRow{width:100%;display:grid;grid-template-columns:30px 66px minmax(0,1fr) auto;gap:9px;align-items:center;text-align:left;padding:8px;border:1px solid #213247;background:#09111a;color:#eaf5ff;border-radius:10px;margin-bottom:6px;cursor:pointer}
    .cwmLbRow:hover,.cwmLbRow:focus-visible,.cwmLbRow.selected{border-color:#66ddff;background:#0d1a26;outline:none}.cwmLbRank{text-align:center;font:1000 13px ui-monospace,monospace;color:#8298ad}.cwmLbThumb{height:44px;border:1px solid #ffffff20;border-radius:8px;background:#05090e;display:grid;place-items:center;overflow:hidden}.cwmLbThumb svg{width:100%;height:100%}.cwmLbName{font:1000 12px/1.05 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cwmLbMeta{font:800 9px/1.3 system-ui;color:#8095aa;margin-top:3px}.cwmLbDps{font:1000 12px ui-monospace,monospace;color:#fff176;white-space:nowrap}
    .cwmLbDetail{min-width:0;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:18px}.cwmLbEmpty{display:grid;place-items:center;height:100%;min-height:220px;text-align:center;color:#748ba2;font:800 12px/1.5 system-ui;padding:25px}.cwmDetailPlayer{font:900 10px system-ui;color:#8198ae;letter-spacing:.13em;text-transform:uppercase}.cwmDetailName{font:1000 clamp(25px,4vw,46px)/.95 system-ui;margin:5px 0 6px}.cwmDetailDps{font:1000 clamp(25px,4vw,40px)/1 ui-monospace,monospace;color:#7df2a7}.cwmDetailWeapon{margin:15px 0;border:1px solid #ffffff20;border-radius:14px;background:radial-gradient(circle at 50% 35%,#1d3044,#060a10 72%);min-height:210px;display:grid;place-items:center;padding:18px}.cwmDetailWeapon svg{width:min(100%,520px);height:auto}.cwmDetailMeta{font:800 10px/1.55 system-ui;color:#9db0c3}
    .cwmCalcTitle{margin-top:18px;font:1000 10px system-ui;letter-spacing:.14em;color:#8fa4ba}.cwmFormula{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0 12px}.cwmSeg{border:1px solid currentColor;border-radius:9px;padding:7px 9px;background:#ffffff07;font:1000 11px ui-monospace,monospace}.cwmSeg small{display:block;font:900 7px system-ui;letter-spacing:.1em;opacity:.7;margin-bottom:2px}.cwmOp{color:#60788f;font:1000 13px ui-monospace,monospace}.hit{color:#ff7d8d}.speed{color:#68ddff}.crit{color:#ffe36d}.fx{color:#c48cff}.total{color:#76ef9f}
    .cwmUpgradeList{display:flex;gap:6px;flex-wrap:wrap}.cwmUpgrade{border:1px solid var(--c);color:var(--c);background:#0005;border-radius:999px;padding:5px 8px;font:900 9px system-ui}.cwmUpgrade span{color:#b3c3d2;font-weight:700;margin-left:4px}
    .cwmOldBuild{margin-top:12px;border:1px dashed #ffffff25;border-radius:10px;padding:11px;color:#8ca2b8;font:800 10px/1.45 system-ui}
    @media(max-width:760px){.cwmLbBrowser{padding:0}.cwmLbShell{width:100vw;height:100dvh;border-radius:0;border:0}.cwmLbBody{grid-template-columns:1fr;grid-template-rows:minmax(230px,43%) 1fr}.cwmLbListPane{border-right:0;border-bottom:1px solid #ffffff18}.cwmLbDetail{padding:12px}.cwmLbRow{grid-template-columns:24px 52px minmax(0,1fr) auto;padding:6px}.cwmLbThumb{height:36px}.cwmLbName{font-size:11px}.cwmLbDps{font-size:10px}.cwmLbHead{padding:8px}.cwmLbTitle{font-size:16px}.cwmDetailWeapon{min-height:140px;margin:10px 0}.titleScreen .titleInner{padding:24px 14px 22px!important}.titleScreen .gameTitle{margin-bottom:16px!important}}
  `;
  document.head.appendChild(css);

  function weaponSvg(row,large=false){
    const type=String(row.type||row.build?.weapon?.type||'SWORD').toUpperCase();
    const col=safeColor(row.col||row.build?.weapon?.col);
    const w=large?420:150,h=large?210:80;
    let shape='';
    if(type==='BOW') shape=`<path d="M${w*.27} ${h*.17} Q${w*.12} ${h*.5} ${w*.27} ${h*.83}" fill="none" stroke="${col}" stroke-width="${large?16:7}"/><line x1="${w*.27}" y1="${h*.17}" x2="${w*.27}" y2="${h*.83}" stroke="#dbe8f5" stroke-width="${large?4:2}"/><line x1="${w*.25}" y1="${h*.5}" x2="${w*.83}" y2="${h*.5}" stroke="#dbe8f5" stroke-width="${large?7:3}"/><path d="M${w*.83} ${h*.5} l-${large?30:11} -${large?15:6} v${large?30:12}z" fill="${col}"/>`;
    else if(type==='HAMMER') shape=`<g transform="rotate(-8 ${w/2} ${h/2})"><rect x="${w*.22}" y="${h*.45}" width="${w*.55}" height="${large?18:7}" rx="4" fill="#8b5f3e"/><rect x="${w*.65}" y="${h*.23}" width="${w*.23}" height="${h*.54}" rx="8" fill="${col}"/><rect x="${w*.61}" y="${h*.31}" width="${w*.31}" height="${h*.38}" rx="7" fill="${col}"/></g>`;
    else if(type==='STAFF'||type==='WAND') shape=`<g transform="rotate(-12 ${w/2} ${h/2})"><rect x="${w*.2}" y="${h*.47}" width="${w*.58}" height="${large?13:5}" rx="4" fill="#8a613d"/><circle cx="${w*.8}" cy="${h*.5}" r="${large?34:13}" fill="${col}"/><circle cx="${w*.8}" cy="${h*.5}" r="${large?17:7}" fill="#fff" opacity=".78"/></g>`;
    else if(type==='SHURIKEN') shape=`<g transform="translate(${w*.52} ${h*.5})"><path d="M0 -${h*.38} L${w*.08} -${h*.08} L${w*.3} -${h*.16} L${w*.09} ${h*.05} L${w*.24} ${h*.28} L0 ${h*.11} L-${w*.24} ${h*.28} L-${w*.09} ${h*.05} L-${w*.3} -${h*.16} L-${w*.08} -${h*.08}Z" fill="${col}"/><circle r="${large?14:5}" fill="#06101a" stroke="#fff" opacity=".8"/></g>`;
    else if(type==='NUNCHUCKS') shape=`<g stroke-linecap="round"><line x1="${w*.2}" y1="${h*.7}" x2="${w*.42}" y2="${h*.42}" stroke="${col}" stroke-width="${large?20:8}"/><path d="M${w*.43} ${h*.41} Q${w*.54} ${h*.12} ${w*.65} ${h*.42}" fill="none" stroke="#d9e5ef" stroke-width="${large?5:2}" stroke-dasharray="8 6"/><line x1="${w*.66}" y1="${h*.42}" x2="${w*.84}" y2="${h*.72}" stroke="${col}" stroke-width="${large?20:8}"/></g>`;
    else {
      const bladeEnd=type==='DAGGER'?w*.72:w*.88;
      const curve=type==='KATANA'?`Q${w*.68} ${h*.42} ${bladeEnd} ${h*.27}`:`L${bladeEnd} ${h*.42}`;
      shape=`<g transform="rotate(-7 ${w/2} ${h/2})"><rect x="${w*.12}" y="${h*.48}" width="${w*.22}" height="${large?18:7}" rx="4" fill="#785338"/><rect x="${w*.31}" y="${h*.37}" width="${large?15:6}" height="${h*.28}" rx="3" fill="#d8c49c"/><path d="M${w*.34} ${h*.43} ${curve} L${bladeEnd} ${h*.57} L${w*.34} ${h*.58}Z" fill="${col}"/><path d="M${w*.4} ${h*.48} L${bladeEnd-w*.03} ${h*.49}" stroke="#fff" stroke-width="${large?5:2}" opacity=".68"/></g>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><filter id="g"><feGaussianBlur stdDeviation="${large?7:3}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#g)">${shape}</g></svg>`;
  }

  function createUi(){
    if(document.getElementById('cwmLbBrowser'))return;
    const modal=document.createElement('div');modal.id='cwmLbBrowser';modal.className='cwmLbBrowser';
    modal.innerHTML=`<div class="cwmLbShell" role="dialog" aria-modal="true" aria-label="Global DPS leaderboard"><div class="cwmLbHead"><div><div class="cwmLbTitle">GLOBAL DPS LEADERBOARD</div><div class="cwmLbStatus" id="cwmLbStatus">READY</div></div><div class="cwmLbTabs">${VIEWS.map(v=>`<button type="button" class="cwmLbTab${v==='current'?' active':''}" data-view="${v}">${LABELS[v]}</button>`).join('')}</div><button type="button" class="cwmLbClose" aria-label="Close leaderboard">×</button></div><div class="cwmLbBody"><section class="cwmLbListPane"><div class="cwmLbListHead">TOP 50 • TAP A WEAPON TO INSPECT</div><div class="cwmLbList" id="cwmLbList"></div></section><section class="cwmLbDetail" id="cwmLbDetail"><div class="cwmLbEmpty">Select a leaderboard weapon to inspect its run.</div></section></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.cwmLbClose').addEventListener('click',closeBoard);
    modal.addEventListener('click',e=>{if(e.target===modal)closeBoard()});
    modal.querySelectorAll('.cwmLbTab').forEach(b=>b.addEventListener('click',()=>{if(activeView!==b.dataset.view){activeView=b.dataset.view;selected=null;refreshTabs();loadBoard()}}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('show'))closeBoard()});
  }

  function installLanding(){
    const start=document.getElementById('startGame');
    if(!start)return;
    document.getElementById('cwmColorPick')?.remove();
    const old=document.querySelector('.cwmLandingActions');if(old)return;
    const wrap=document.createElement('div');wrap.className='cwmLandingActions';
    const lb=document.createElement('button');lb.type='button';lb.className='cwmLandingLbBtn';lb.textContent='LEADERBOARD';lb.addEventListener('click',openBoard);
    start.parentNode.insertBefore(wrap,start);wrap.appendChild(start);wrap.appendChild(lb);
    const museum=document.getElementById('openMuseum');if(museum)wrap.appendChild(museum);
    start.textContent='START RUN';
  }

  function refreshTabs(){document.querySelectorAll('.cwmLbTab').forEach(b=>b.classList.toggle('active',b.dataset.view===activeView))}
  function setStatus(s){const el=document.getElementById('cwmLbStatus');if(el)el.textContent=s}
  function openBoard(){createUi();document.getElementById('cwmLbBrowser').classList.add('show');document.body.style.overflow='hidden';loadBoard()}
  function closeBoard(){document.getElementById('cwmLbBrowser')?.classList.remove('show');document.body.style.overflow=''}

  async function loadBoard(){
    if(loading)return;loading=true;setStatus('LOADING '+LABELS[activeView]);
    const list=document.getElementById('cwmLbList'),detail=document.getElementById('cwmLbDetail');
    if(list)list.innerHTML='<div class="cwmLbEmpty">Loading leaders…</div>';
    try{
      const r=await fetch(`/api/leaderboard?limit=50&view=${encodeURIComponent(activeView)}&version=${encodeURIComponent(VERSION)}`,{cache:'no-store',headers:{accept:'application/json'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();rows=Array.isArray(j.scores)?j.scores:[];
      setStatus(`ONLINE • ${rows.length} LEADER${rows.length===1?'':'S'}`);
    }catch(e){
      console.warn('Leaderboard browser global fetch failed',e);
      try{rows=(Array.isArray(globalThis.leaderboard)?globalThis.leaderboard:[]).map((x,i)=>({...x,id:x.id||`local-${i}`,player:x.player||'LOCAL PLAYER',version:x.version||'local'}));}catch(_){rows=[]}
      setStatus(rows.length?'GLOBAL OFFLINE • LOCAL BACKUP':'LEADERBOARD OFFLINE');
    }
    renderList();
    if(rows.length){selected=rows.find(x=>String(x.id)===String(selected?.id))||rows[0];renderDetail(selected)}else if(detail)detail.innerHTML='<div class="cwmLbEmpty">No leaderboard records are available yet.</div>';
    loading=false;
  }

  function renderList(){
    const list=document.getElementById('cwmLbList');if(!list)return;
    if(!rows.length){list.innerHTML='<div class="cwmLbEmpty">No scores yet.</div>';return}
    list.innerHTML=rows.map((r,i)=>`<button type="button" class="cwmLbRow${String(selected?.id)===String(r.id)?' selected':''}" data-id="${esc(r.id)}"><div class="cwmLbRank">${i+1}</div><div class="cwmLbThumb">${weaponSvg(r,false)}</div><div><div class="cwmLbName" style="color:${safeColor(r.col)}">${esc(r.name||'Unnamed weapon')}</div><div class="cwmLbMeta">${esc(r.player||'Anonymous Lunatic')} • ${esc(r.rar||'')} ${esc(TYPE_LABEL[String(r.type||'').toUpperCase()]||r.type||'')}</div></div><div class="cwmLbDps">${nf(r.dps)}</div></button>`).join('');
    list.querySelectorAll('.cwmLbRow').forEach(b=>b.addEventListener('click',()=>{selected=rows.find(r=>String(r.id)===b.dataset.id)||null;renderList();if(selected)renderDetail(selected)}));
  }

  function renderDetail(r){
    const d=document.getElementById('cwmLbDetail');if(!d||!r)return;
    const b=r.build,formula=b?.formula,ups=Array.isArray(b?.upgrades)?b.upgrades:[];
    const formulaHtml=formula?`<div class="cwmCalcTitle">DPS CALCULATION</div><div class="cwmFormula"><div class="cwmSeg hit"><small>HIT</small>${nf(formula.hit)}</div><div class="cwmOp">×</div><div class="cwmSeg speed"><small>ATTACKS / SEC</small>${Number(formula.aps||0).toFixed(2)}</div><div class="cwmOp">×</div><div class="cwmSeg crit"><small>CRIT</small>${Number(formula.crit||1).toFixed(2)}×</div><div class="cwmOp">×</div><div class="cwmSeg fx"><small>UPGRADES</small>${Number(formula.fx||1).toFixed(2)}×</div><div class="cwmOp">=</div><div class="cwmSeg total"><small>DPS</small>${nf(formula.dps||r.dps)}</div></div>`:'';
    const upgrades=ups.length?`<div class="cwmCalcTitle">UPGRADES FEEDING THE NUMBER</div><div class="cwmUpgradeList">${ups.map(u=>`<div class="cwmUpgrade" style="--c:${safeColor(u.color)}">${esc(u.label)}<span>${esc(u.detail||'')}</span></div>`).join('')}</div>`:`<div class="cwmOldBuild">This score predates detailed build snapshots. The weapon and run are still ranked, but its exact upgrade-by-upgrade DPS breakdown was not stored.</div>`;
    d.innerHTML=`<div class="cwmDetailPlayer">#${rows.indexOf(r)+1} • ${esc(r.player||'Anonymous Lunatic')}</div><div class="cwmDetailName" style="color:${safeColor(r.col)}">${esc(r.name||'Unnamed weapon')}</div><div class="cwmDetailDps">${nf(r.dps)} DPS</div><div class="cwmDetailWeapon">${weaponSvg(r,true)}</div><div class="cwmDetailMeta">${esc(r.rar||'')} ${esc(TYPE_LABEL[String(r.type||'').toUpperCase()]||r.type||'')} • Level ${Number(r.level||1)} • ${nf(r.kills||0)} kills<br>${esc(r.zone||'Unknown zone')}${r.boss?` • Boss: ${esc(r.boss)}`:''} • ${esc(r.version||'legacy')}</div>${formulaHtml}${upgrades}`;
  }

  createUi();installLanding();
  // If another patch rewrites the title after us, re-assert the clean landing once.
  setTimeout(installLanding,400);
  globalThis.openCrazyWeaponLeaderboard=openBoard;
})();
