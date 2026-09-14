(()=>{
  const GAME_VERSION='v1.1-frenzy';
  const REAL_FETCH=globalThis.fetch.bind(globalThis);
  const rowsById=new Map();
  let lastView='current';
  let boardRefreshTimer=0;
  let boardRefreshBusy=false;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nf=n=>Math.round(Number(n)||0).toLocaleString();
  const safeColor=c=>/^#[0-9a-f]{6}$/i.test(String(c||''))?c:'#dfe9f5';
  const TYPE_LABEL={SWORD:'Sword',DAGGER:'Dagger',NUNCHUCKS:'Nunchucks',KATANA:'Katana',BOW:'Bow',SHURIKEN:'Shuriken',WAND:'Wand',STAFF:'Staff',HAMMER:'Hammer'};
  const GROUP={
    hit:{name:'HIT',color:'#ff7a8a'},
    speed:{name:'SPEED',color:'#62ddff'},
    crit:{name:'CRIT',color:'#ffe66d'},
    fx:{name:'UPGRADES',color:'#c18bff'},
    total:{name:'DPS',color:'#75f2a6'}
  };
  const MATERIAL_COLORS={diamond:'#9dfbff',obsidian:'#af89ff',bone:'#f3dfb8',glass:'#dcfbff',void:'#b481ff',meat:'#ff7b94',gold:'#ffdc62',rubber:'#efff6e',nuclear:'#caff5f',frozen:'#9deeff',living:'#ff7bab',plasma:'#67eaff'};

  function procMultiplier(w){
    let proc=1;
    if(w.mod==='multishot')proc*=1.28;
    if(w.mod==='pierce')proc*=1.12;
    if(w.mod==='echo'||w.mod==='echoes')proc*=1.28;
    if(w.mod==='nova')proc*=1.15;
    if(w.cap)proc*=1.18+(typeof rarityRank==='function'?rarityRank(w):0)*.035;
    if(w.material){
      if(w.material.code==='diamond'||w.material.code==='rubber')proc*=1.13;
      if(w.material.code==='nuclear'||w.material.code==='void'||w.material.code==='plasma')proc*=1.11;
      if(w.material.code==='living')proc*=1.09;
    }
    const has=code=>Array.isArray(w.traits)&&w.traits.some(t=>(t?.code||t)===code);
    if(has('rhythmic'))proc*=1.13;
    if(has('recursive'))proc*=1.12;
    if(has('sentient'))proc*=1.09;
    if(has('hex'))proc*=1.08;
    if(has('unstable'))proc*=1.10;
    if(has('explosive'))proc*=1.11;
    if(has('haunted'))proc*=1.08;
    if(has('jazzhands'))proc*=1.07;
    if(has('assbackwards'))proc*=1.03;
    if(has('bouncy'))proc*=1.06;
    if(w.synergy)proc*=1.14;
    return proc;
  }

  function upgradeList(w){
    const out=[];
    const push=(group,label,detail,color)=>out.push({group,label:String(label||''),detail:String(detail||''),color:safeColor(color)});
    push('hit',w.rar||'Rarity',`Base rarity multiplier ×${Number(w.m||1).toFixed(2)}`,w.col);
    if(w.mod&&w.mod!=='none')push('fx',String(w.mod).replace(/[-_]/g,' ').toUpperCase(),'Weapon modifier','#c18bff');
    if(w.material)push('fx',(w.material.name||w.material.code||'Material').toUpperCase(),'Weapon material',MATERIAL_COLORS[w.material.code]||w.col);
    for(const t of w.traits||[]){
      const code=t?.code||String(t||'');
      const label=t?.name||code.replace(/[-_]/g,' ').toUpperCase();
      const group=code==='speedy'?'speed':code==='precision'||code==='crit'?'crit':['rhythmic','recursive','sentient','hex','unstable','explosive','haunted','jazzhands','assbackwards','bouncy'].includes(code)?'fx':'hit';
      push(group,label,'Weapon trait',GROUP[group].color);
    }
    if(w.synergy)push('fx',w.synergy.name||'SYNERGY','Trait synergy','#ff9ee7');
    if(w.cap)push('fx',w.capName||'CAPSTONE','Rarity capstone','#ffffff');
    try{
      for(const slot of ['head','body','feet']){
        const a=pl?.armors?.[slot];
        if(!a)continue;
        if(Number(a.damage)>0)push('hit',`${slot.toUpperCase()}: ${a.name||a.rar||'ARMOR'}`,`+${Math.round(Number(a.damage)*100)}% damage`,a.col||GROUP.hit.color);
        if(Number(a.speed)>0)push('speed',`${slot.toUpperCase()}: ${a.name||a.rar||'ARMOR'}`,`+${Math.round(Number(a.speed)*100)}% speed`,a.col||GROUP.speed.color);
        if(Number(a.crit)>0)push('crit',`${slot.toUpperCase()}: ${a.name||a.rar||'ARMOR'}`,`+${Math.round(Number(a.crit)*100)}% crit`,a.col||GROUP.crit.color);
      }
    }catch(_){/* armor is optional metadata */}
    return out.slice(0,24);
  }

  function captureBuild(w){
    if(!w||typeof w!=='object')return null;
    try{
      const coeff={sword:1.04,dagger:.78,nunchucks:.70,katana:1.16,bow:.92,shuriken:.76,wand:.84,staff:1.28,hammer:1.42}[w.type]||1;
      const hit=baseD(Math.max(pl.lv,w.lv||pl.lv))*Number(w.m||1)*weaponDamageMult(w)*combatScale(w)*coeff;
      const cc=Math.min(.88,pl.crit+weaponCritBonus(w));
      const crit=1+cc*.92;
      const aps=1/heldAttackCooldown(w);
      const fx=procMultiplier(w);
      const dps=hit*crit*aps*fx;
      return {
        weapon:{
          name:String(w.name||'').slice(0,180),type:String(w.type||'').slice(0,20),rar:String(w.rar||'').slice(0,32),
          col:safeColor(w.col),lv:Number(w.lv||pl.lv||1),m:Number(w.m||1),p:Number(w.p||0),crit:Number(w.crit||0),
          mod:String(w.mod||'none').slice(0,40),cap:!!w.cap,capName:String(w.capName||'').slice(0,80),intensity:Number(w.intensity||0),
          material:w.material?{code:String(w.material.code||'').slice(0,32),name:String(w.material.name||'').slice(0,80)}:null,
          traits:(w.traits||[]).slice(0,12).map(t=>({code:String(t?.code||t||'').slice(0,32),name:String(t?.name||t?.code||t||'').slice(0,80)})),
          synergy:w.synergy?{name:String(w.synergy.name||'SYNERGY').slice(0,80)}:null
        },
        formula:{hit:+hit.toFixed(3),aps:+aps.toFixed(4),crit:+crit.toFixed(4),critChance:+cc.toFixed(4),fx:+fx.toFixed(4),dps:Math.round(dps)},
        upgrades:upgradeList(w)
      };
    }catch(e){
      console.warn('Weapon build snapshot failed',e);
      return null;
    }
  }

  // Enrich leaderboard submissions without changing the score logic.
  globalThis.fetch=async function(input,init){
    try{
      const method=String(init?.method||'GET').toUpperCase();
      const url=typeof input==='string'?input:(input?.url||'');
      if(method==='POST'&&/\/api\/leaderboard(?:\?|$)/.test(url)&&typeof init?.body==='string'){
        const body=JSON.parse(init.body);
        if(!body.weapon_build&&typeof curW==='function'){
          const w=curW();
          if(w&&String(body.weapon_name||'')===String(w.name||'')){
            const build=captureBuild(w);
            if(build)init={...init,body:JSON.stringify({...body,weapon_build:build})};
          }
        }
      }
    }catch(_){/* never block a score because metadata failed */}
    return REAL_FETCH(input,init);
  };

  const css=document.createElement('style');
  css.textContent=`
    .lbrow.cwmInspectRow{appearance:none;width:100%;text-align:left;color:inherit;grid-template-columns:24px 68px minmax(0,1fr) auto;cursor:pointer;transition:border-color .12s,background .12s,transform .12s}
    .lbrow.cwmInspectRow:hover,.lbrow.cwmInspectRow:focus-visible{border-color:#6edfff;background:#0e1824;outline:none;transform:translateY(-1px)}
    .cwmWeaponThumb{width:66px;height:43px;border:1px solid #ffffff22;border-radius:8px;background:#050a10;overflow:hidden;display:grid;place-items:center}
    .cwmWeaponThumb svg{display:block;width:100%;height:100%}.cwmInspectHint{font-size:8px;color:#62778e;margin-top:2px;letter-spacing:.07em;text-transform:uppercase}
    .cwmLbModal{display:none;position:fixed;inset:0;z-index:10050;background:#010409e8;backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:14px}.cwmLbModal.show{display:flex}
    .cwmLbCard{width:min(940px,96vw);max-height:92dvh;overflow:auto;border:1px solid #ffffff31;border-radius:18px;background:linear-gradient(155deg,#111b29,#060a10);box-shadow:0 30px 100px #000;padding:16px;color:#eef7ff}
    .cwmLbTop{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.cwmLbClose{border:1px solid #ffffff31;background:#0c1520;color:#fff;border-radius:10px;width:40px;height:40px;font-size:20px;cursor:pointer}
    .cwmLbPlayer{font:900 11px system-ui;color:#9fb5cb;letter-spacing:.12em;text-transform:uppercase}.cwmLbWeaponName{font:1000 clamp(22px,4vw,42px)/.95 system-ui;margin-top:4px;max-width:760px}.cwmLbDps{font:1000 clamp(24px,4vw,38px)/1 ui-monospace,monospace;color:#75f2a6;margin-top:7px}
    .cwmLbGrid{display:grid;grid-template-columns:minmax(250px,.8fr) minmax(320px,1.35fr);gap:14px;margin-top:14px}.cwmLbPortrait{min-height:220px;border:1px solid #ffffff20;border-radius:14px;background:radial-gradient(circle at 50% 40%,#1b2a3d,#060a10 70%);display:grid;place-items:center;padding:14px}.cwmLbPortrait svg{width:100%;height:auto;max-height:280px}
    .cwmLbMeta{margin-top:9px;font:800 10px/1.45 system-ui;color:#9fb4ca}.cwmFormula{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:4px 0 12px}.cwmFormulaSeg{padding:8px 10px;border-radius:10px;border:1px solid currentColor;background:#ffffff08;font:1000 12px/1.05 ui-monospace,monospace}.cwmFormulaSeg small{display:block;font:900 8px/1 system-ui;letter-spacing:.12em;margin-bottom:3px;opacity:.72}.cwmFormulaOp{font:1000 15px ui-monospace,monospace;color:#70859b}.cwmFormulaSeg.hit{color:${GROUP.hit.color}}.cwmFormulaSeg.speed{color:${GROUP.speed.color}}.cwmFormulaSeg.crit{color:${GROUP.crit.color}}.cwmFormulaSeg.fx{color:${GROUP.fx.color}}.cwmFormulaSeg.total{color:${GROUP.total.color}}
    .cwmUpgradeGroups{display:grid;gap:10px}.cwmUpgradeGroup{border:1px solid #ffffff16;border-radius:12px;background:#ffffff05;padding:9px}.cwmUpgradeGroup h4{margin:0 0 7px;font:1000 9px system-ui;letter-spacing:.14em}.cwmUpgradeChips{display:flex;gap:6px;flex-wrap:wrap}.cwmUpgradeChip{border:1px solid var(--chip);color:var(--chip);background:#0005;border-radius:999px;padding:5px 8px;font:900 9px system-ui}.cwmUpgradeChip span{color:#b8c9da;font-weight:700;margin-left:4px}
    .cwmLegacyBuild{border:1px dashed #ffffff27;border-radius:12px;padding:12px;color:#9fb4ca;font:800 11px/1.45 system-ui}
    .cwmBuildLegend{font:800 9px/1.4 system-ui;color:#8197ad;margin-top:7px}
    @media(max-width:700px){.lbrow.cwmInspectRow{grid-template-columns:20px 54px minmax(0,1fr) auto;padding:6px}.cwmWeaponThumb{width:52px;height:36px}.cwmLbGrid{grid-template-columns:1fr}.cwmLbPortrait{min-height:150px}.cwmLbCard{padding:12px}.cwmFormula{gap:4px}.cwmFormulaSeg{padding:6px 7px;font-size:10px}.cwmFormulaOp{font-size:12px}}
  `;
  document.head.appendChild(css);

  function weaponSvg(row,large=false){
    const type=String(row.type||row.build?.weapon?.type||'SWORD').toUpperCase();
    const col=safeColor(row.col||row.build?.weapon?.col);
    const build=row.build?.weapon||{};
    const q=Math.min(8,Math.max(0,['Common','Uncommon','Magic','Rare','Super Rare','Epic','Heroic','Legendary','Mythic','Ultra Mythic','Exotic','Ultra Exotic','Relic','Ancient','Transcendent','Unheard Of','Super Ultra Rare','Forbidden','Impossible','Cataclysmic','WHAT?!'].indexOf(row.rar)));
    const glow=Math.max(2,4+q*.8);
    let shape='';
    if(type==='SWORD')shape=`<g transform="rotate(-7 80 50)"><rect x="18" y="46" width="37" height="8" rx="4" fill="#74543c"/><rect x="49" y="35" width="7" height="30" rx="3" fill="#d7c7a8"/><path d="M55 43 L135 45 L151 50 L135 55 L55 57 Z" fill="${col}"/><path d="M67 48 L134 50" stroke="#fff" stroke-width="2" opacity=".8"/></g>`;
    else if(type==='DAGGER')shape=`<g transform="rotate(-7 80 50)"><rect x="24" y="46" width="28" height="8" rx="4" fill="#74543c"/><rect x="49" y="38" width="6" height="24" rx="3" fill="#d7c7a8"/><path d="M55 43 L119 46 L138 50 L119 54 L55 57 Z" fill="${col}"/></g>`;
    else if(type==='KATANA')shape=`<g transform="rotate(-8 80 50)"><rect x="18" y="53" width="31" height="8" rx="4" fill="#5f3c2f"/><rect x="46" y="42" width="6" height="27" rx="3" fill="#e2c78d"/><path d="M52 53 Q106 49 150 30" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round"/><path d="M57 50 Q108 46 145 31" fill="none" stroke="#fff8dc" stroke-width="2" opacity=".85"/></g>`;
    else if(type==='NUNCHUCKS')shape=`<g><path d="M34 34 L70 46" stroke="${col}" stroke-width="11" stroke-linecap="round"/><path d="M91 55 L128 68" stroke="${col}" stroke-width="11" stroke-linecap="round"/><path d="M70 46 Q80 70 91 55" fill="none" stroke="#d7dde5" stroke-width="3"/></g>`;
    else if(type==='BOW')shape=`<g><path d="M93 19 Q127 50 93 81" fill="none" stroke="${col}" stroke-width="7"/><path d="M93 19 L93 81" stroke="#e5edf5" stroke-width="2"/><path d="M93 50 L142 50" stroke="#f7fbff" stroke-width="3"/><path d="M142 50 l-10 -5 v10z" fill="#fff"/></g>`;
    else if(type==='SHURIKEN')shape=`<g transform="translate(84 50)"><path d="M0 0 L50 -5 L20 13 Z M0 0 L5 50 L-13 20 Z M0 0 L-50 5 L-20 -13 Z M0 0 L-5 -50 L13 -20 Z" fill="${col}"/><circle r="7" fill="#f7fbff"/></g>`;
    else if(type==='WAND')shape=`<g transform="rotate(-24 82 50)"><rect x="31" y="46" width="88" height="8" rx="4" fill="#78615b"/><circle cx="126" cy="50" r="15" fill="${col}"/><circle cx="126" cy="50" r="23" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/></g>`;
    else if(type==='STAFF')shape=`<g transform="rotate(-28 82 50)"><rect x="21" y="45" width="118" height="10" rx="5" fill="#755b48"/><circle cx="143" cy="50" r="17" fill="${col}"/><circle cx="143" cy="50" r="27" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/></g>`;
    else shape=`<g><rect x="24" y="46" width="70" height="10" rx="5" fill="#6f5442"/><rect x="88" y="28" width="62" height="45" rx="5" fill="${col}"/><rect x="94" y="34" width="50" height="33" rx="3" fill="none" stroke="#fff0b7" stroke-width="2"/></g>`;
    const mat=build.material?.code;
    const matCol=mat?(MATERIAL_COLORS[mat]||col):null;
    const traitCount=Math.min(6,Array.isArray(build.traits)?build.traits.length:0);
    const orbit=matCol?`<circle cx="80" cy="50" r="39" fill="none" stroke="${matCol}" stroke-width="2" stroke-dasharray="4 6" opacity=".85"/>`:'';
    const dots=Array.from({length:traitCount},(_,i)=>{const a=i*Math.PI*2/Math.max(1,traitCount)-Math.PI/2;const x=80+Math.cos(a)*43,y=50+Math.sin(a)*33;return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${i%2?col:'#fff'}" opacity=".9"/>`}).join('');
    const label=large?`<text x="8" y="15" fill="#dce8f5" font-size="8" font-weight="900" letter-spacing="1">${esc(row.rar||'WEAPON').toUpperCase()}</text>`:'';
    return `<svg viewBox="0 0 160 100" role="img" aria-label="${esc(row.name||'weapon')} weapon picture"><defs><filter id="g${String(row.id||'x').replace(/[^a-z0-9]/gi,'').slice(0,8)}"><feGaussianBlur stdDeviation="${large?glow:Math.max(1,glow*.45)}"/></filter></defs><rect width="160" height="100" rx="10" fill="#07101a"/><ellipse cx="82" cy="52" rx="62" ry="32" fill="${col}" opacity=".08" filter="url(#g${String(row.id||'x').replace(/[^a-z0-9]/gi,'').slice(0,8)})"/>${orbit}${shape}${dots}${label}</svg>`;
  }

  function formulaHtml(f){
    if(!f)return '<div class="cwmLegacyBuild">Detailed DPS calculation was not stored for this older score. The score and player name are preserved; new and refreshed records include the full build breakdown.</div>';
    return `<div class="cwmFormula"><div class="cwmFormulaSeg hit"><small>HIT</small>${nf(f.hit)}</div><div class="cwmFormulaOp">×</div><div class="cwmFormulaSeg speed"><small>ATTACK RATE</small>${Number(f.aps||0).toFixed(2)}/s</div><div class="cwmFormulaOp">×</div><div class="cwmFormulaSeg crit"><small>CRIT</small>×${Number(f.crit||1).toFixed(2)}</div><div class="cwmFormulaOp">×</div><div class="cwmFormulaSeg fx"><small>UPGRADES / FX</small>×${Number(f.fx||1).toFixed(2)}</div><div class="cwmFormulaOp">=</div><div class="cwmFormulaSeg total"><small>DPS</small>${nf(f.dps)}</div></div>`;
  }

  function upgradesHtml(build){
    const ups=Array.isArray(build?.upgrades)?build.upgrades:[];
    if(!ups.length)return '';
    return ['hit','speed','crit','fx'].map(group=>{
      const items=ups.filter(x=>x.group===group);
      if(!items.length)return '';
      return `<div class="cwmUpgradeGroup"><h4 style="color:${GROUP[group].color}">${GROUP[group].name} SOURCES</h4><div class="cwmUpgradeChips">${items.map(x=>`<div class="cwmUpgradeChip" style="--chip:${safeColor(x.color||GROUP[group].color)}" title="${esc(x.detail||'')}">${esc(x.label)}${x.detail?`<span>${esc(x.detail)}</span>`:''}</div>`).join('')}</div></div>`;
    }).join('');
  }

  function openDetail(id){
    const row=rowsById.get(String(id));
    if(!row)return;
    let modal=document.getElementById('cwmLbModal');
    if(!modal){
      modal=document.createElement('div');modal.id='cwmLbModal';modal.className='cwmLbModal';modal.innerHTML='<div class="cwmLbCard"></div>';document.body.appendChild(modal);
      modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-cwm-close]'))modal.classList.remove('show')});
      document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('show')});
    }
    const b=row.build;
    const type=TYPE_LABEL[String(row.type||'').toUpperCase()]||row.type||'Weapon';
    const formula=b?.formula||null;
    modal.querySelector('.cwmLbCard').innerHTML=`<div class="cwmLbTop"><div><div class="cwmLbPlayer">#${row._rank||'?'} • ${esc(row.player||'Anonymous Lunatic')} • ${esc(row.version||'legacy')}</div><div class="cwmLbWeaponName" style="color:${safeColor(row.col)}">${esc(row.name)}</div><div class="cwmLbDps">${nf(row.dps)} DPS</div></div><button type="button" class="cwmLbClose" data-cwm-close aria-label="Close">×</button></div><div class="cwmLbGrid"><div><div class="cwmLbPortrait">${weaponSvg(row,true)}</div><div class="cwmLbMeta">${esc(row.rar)} ${esc(type)} • Level ${Number(row.level||1)}<br>${Number(row.kills||0).toLocaleString()} kills • ${esc(row.zone||'Unknown zone')}${row.boss?` • Boss ${esc(row.boss)}`:''}<br>${row.when?esc(new Date(row.when+'Z').toLocaleString()):''}</div></div><div><div style="font:1000 10px system-ui;letter-spacing:.14em;color:#9fb4ca;margin-bottom:7px">DPS CALCULATION</div>${formulaHtml(formula)}<div class="cwmBuildLegend">Color key: <span style="color:${GROUP.hit.color}">hit damage</span> • <span style="color:${GROUP.speed.color}">attack speed</span> • <span style="color:${GROUP.crit.color}">crit</span> • <span style="color:${GROUP.fx.color}">weapon upgrades/effects</span>.</div><div class="cwmUpgradeGroups" style="margin-top:12px">${upgradesHtml(b)}</div></div></div>`;
    modal.classList.add('show');
  }

  function renderRows(rows){
    const board=document.getElementById('leaderboard');
    if(!board||!rows.length)return;
    rows.forEach((r,i)=>{r._rank=i+1;rowsById.set(String(r.id),r)});
    board.innerHTML=rows.map((r,i)=>`<button type="button" class="lbrow cwmInspectRow" data-cwm-score-id="${esc(r.id)}"><div class="lbrank">${i+1}</div><div class="cwmWeaponThumb">${weaponSvg(r,false)}</div><div><div class="lbname" style="color:${safeColor(r.col)}">${esc(r.name)}</div><div class="lbmeta">${esc(r.player||'Anonymous Lunatic')} • ${esc(r.rar)} ${esc(TYPE_LABEL[String(r.type||'').toUpperCase()]||r.type||'')}</div><div class="cwmInspectHint">tap for weapon + DPS breakdown</div></div><div class="lbdps">${nf(r.dps)} DPS</div></button>`).join('');
  }

  function activeView(){
    const v=document.querySelector('.lbTab.active')?.dataset?.lbview;
    return ['current','all','legacy'].includes(v)?v:'current';
  }
  async function refreshBoard(force=false){
    if(boardRefreshBusy)return;
    const board=document.getElementById('leaderboard');
    if(!board)return;
    const view=activeView();
    if(!force&&board.dataset.cwmInspectView===view&&board.querySelector('.cwmInspectRow'))return;
    boardRefreshBusy=true;
    try{
      const r=await REAL_FETCH(`/api/leaderboard?limit=10&view=${encodeURIComponent(view)}&version=${encodeURIComponent(GAME_VERSION)}`,{cache:'no-store',headers:{accept:'application/json'}});
      if(!r.ok)return;
      const j=await r.json();
      const rows=Array.isArray(j.scores)?j.scores:[];
      if(rows.length){renderRows(rows);board.dataset.cwmInspectView=view;lastView=view}
    }catch(e){console.warn('Interactive leaderboard refresh failed',e)}finally{boardRefreshBusy=false}
  }
  function scheduleRefresh(force=false){clearTimeout(boardRefreshTimer);boardRefreshTimer=setTimeout(()=>refreshBoard(force),80)}

  document.addEventListener('click',e=>{
    const row=e.target.closest?.('[data-cwm-score-id]');
    if(row){e.preventDefault();e.stopPropagation();openDetail(row.dataset.cwmScoreId);return}
    if(e.target.closest?.('.lbTab'))scheduleRefresh(true);
  });

  function colorizedFormula(build,compact=false){
    const f=build?.formula;
    if(!f)return '';
    const part=(cls,label,val)=>`<span style="color:${GROUP[cls].color}">${compact?'':`<small style="opacity:.7">${label}</small>`}${val}</span>`;
    return `${part('hit','HIT ',nf(f.hit))}<span style="color:#71869a"> × </span>${part('speed','RATE ',Number(f.aps||0).toFixed(2)+'/s')}<span style="color:#71869a"> × </span>${part('crit','CRIT ','×'+Number(f.crit||1).toFixed(2))}<span style="color:#71869a"> × </span>${part('fx','UPGRADES ','×'+Number(f.fx||1).toFixed(2))}`;
  }

  function liveUiLoop(){
    try{
      if(typeof gameStarted!=='undefined'&&gameStarted&&typeof curW==='function'){
        const build=captureBuild(curW());
        if(build){
          const calc=document.getElementById('cwmDpsCalc');
          if(calc)calc.innerHTML=`DPS = ${colorizedFormula(build,false)} <span style="color:#71869a"> = </span><b style="color:${GROUP.total.color}">${nf(build.formula.dps)}</b>`;
          const mini=document.querySelector('#cwmMiniHud .calc');
          if(mini)mini.innerHTML=colorizedFormula(build,true);
          const pause=document.getElementById('cwmPauseFormula');
          if(pause)pause.innerHTML=`<b>DPS FORMULA</b><br>${colorizedFormula(build,false)} <span style="color:#71869a"> = </span><b style="color:${GROUP.total.color}">${nf(build.formula.dps)} DPS</b>`;
        }
      }
      const board=document.getElementById('leaderboard');
      if(board&&(!board.querySelector('.cwmInspectRow')||activeView()!==lastView))scheduleRefresh();
    }catch(_){/* UI enhancement should never affect gameplay */}
    requestAnimationFrame(liveUiLoop);
  }

  // Observe original leaderboard re-renders and re-apply the richer rows.
  const wait=setInterval(()=>{
    const board=document.getElementById('leaderboard');
    if(!board)return;
    clearInterval(wait);
    new MutationObserver(()=>{if(!boardRefreshBusy&&!board.querySelector('.cwmInspectRow'))scheduleRefresh()}).observe(board,{childList:true});
    scheduleRefresh(true);
  },100);
  requestAnimationFrame(liveUiLoop);
})();
