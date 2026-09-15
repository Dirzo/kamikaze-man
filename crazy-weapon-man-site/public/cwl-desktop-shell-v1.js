(()=>{
  if(globalThis.__CWL_DESKTOP_SHELL_V1)return;
  globalThis.__CWL_DESKTOP_SHELL_V1=true;
  const BUILD='cwl-desktop-shell-v1-20260915a';
  const root=document.documentElement;
  const style=document.createElement('style');
  style.id='cwlDesktopShellStyle';
  style.textContent=`
    .top{display:none!important}
    #cwlUtilityBar{position:absolute;z-index:47;right:9px;top:9px;display:flex;gap:5px;align-items:center;pointer-events:auto;opacity:.38;transition:opacity .12s ease}
    #cwlUtilityBar:hover{opacity:.92}
    #cwlUtilityBar .btn{border:1px solid #ffffff24!important;border-radius:8px!important;background:#07101bc7!important;color:#c7d7e8!important;padding:5px 7px!important;font:850 8px/1 system-ui!important;box-shadow:none!important}
    body.cwlDesktopCombat #cwlUtilityBar{top:42px}
    #titleScreen.cwlTitleRebuilt{padding:24px!important;background:radial-gradient(circle at 66% 42%,#19314c 0,#101527 34%,#05070d 70%)!important;backdrop-filter:none!important}
    #titleScreen.cwlTitleRebuilt .cwlTitleCard{position:relative;width:min(980px,92vw);min-height:540px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:20px;align-items:center;padding:34px 38px;border:1px solid #ffffff2e;border-radius:24px;background:linear-gradient(145deg,#0b1420f2,#090b13f2);box-shadow:0 32px 120px #000c;overflow:hidden;text-align:left}
    .cwlTitleCopy{position:relative;z-index:2}.cwlTitleEyebrow{font:1000 10px/1 system-ui;letter-spacing:.25em;color:#73efff}.cwlTitleName{font:1000 clamp(48px,6vw,78px)/.85 system-ui;letter-spacing:-.065em;margin-top:11px;color:#f5f8ff;text-transform:uppercase;text-shadow:0 5px 0 #202e48,0 0 32px #69e8ff22}.cwlTitleName span{color:#fff176}.cwlTitlePitch{max-width:620px;margin-top:18px;color:#b8c9da;font:750 15px/1.45 system-ui}.cwlTitlePitch b{color:#eef8ff}.cwlTitleRule{margin-top:17px;padding:10px 12px;border-left:3px solid #fff176;background:#fff1760b;color:#ffe989;font:900 11px/1.35 system-ui;letter-spacing:.02em}.cwlTitleMeta{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:15px}.cwlTitleMeta>div{padding:8px 10px;border:1px solid #ffffff18;border-radius:10px;background:#ffffff06}.cwlTitleMeta b{display:block;font:1000 9px/1 system-ui;color:#8fdff1;letter-spacing:.11em}.cwlTitleMeta span{display:block;margin-top:4px;font:800 10px/1.25 system-ui;color:#b8c7d7}
    .cwlTitleActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:18px}.cwlTitleActions .startBtn{margin:0!important;padding:12px 19px!important;font-size:15px!important;border-radius:11px!important}.cwlTitleActions .museumBtn{margin:0!important;padding:10px 13px!important;font-size:10px!important;border-radius:9px!important}.cwlTitleHandle{margin-top:14px}.cwlTitleHandle label{display:block;font:1000 8px/1 system-ui;letter-spacing:.16em;color:#8299b0;margin-bottom:6px}.cwlTitleHandle input{width:min(310px,100%);padding:9px 10px;border-radius:9px;border:1px solid #ffffff24;background:#050a11;color:#fff;font:800 12px system-ui;outline:none}.cwlTitleBest{margin-top:12px;font:850 9px/1.3 system-ui;color:#8198b0}.cwlTitleBest b{display:block;margin-top:3px;font-size:11px;color:#fff176}.cwlTitleLicense{margin-top:8px;font:850 8px/1 system-ui;color:#74889c}
    .cwlTitleArt{position:relative;z-index:1;display:grid;place-items:center;align-self:stretch}.cwlTitleArt:before{content:"";position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#69e8ff24,#ff72d610 45%,transparent 70%);filter:blur(2px)}#cwlTitleLady{position:relative;width:min(330px,29vw);height:auto;aspect-ratio:4/5;filter:drop-shadow(0 18px 22px #000a)}.cwlTitleArtLabel{position:absolute;bottom:35px;left:50%;transform:translateX(-50%);white-space:nowrap;font:1000 8px/1 system-ui;letter-spacing:.17em;color:#8ea8bd;background:#050a11bb;border:1px solid #ffffff1c;border-radius:999px;padding:6px 9px}
    #titleScreen.cwlTitleRebuilt .titleInner,#titleScreen.cwlTitleRebuilt .titleWeaponRain{display:none!important}
  `;
  document.head.appendChild(style);

  function rebuildTitle(){
    const title=document.getElementById('titleScreen');
    if(!title||title.classList.contains('cwlTitleRebuilt'))return false;
    const start=document.getElementById('startGame'),museum=document.getElementById('openMuseum'),input=document.getElementById('playerName'),best=document.getElementById('titleBest'),license=document.getElementById('metaLicense');
    if(!start||!input)return false;
    const card=document.createElement('div');card.className='cwlTitleCard';
    card.innerHTML=`<div class="cwlTitleCopy"><div class="cwlTitleEyebrow">DESKTOP HEAVY BUILD</div><div class="cwlTitleName">CRAZY WEAPON <span>LADY</span></div><div class="cwlTitlePitch">A fast action roguelike about one bad professional habit: finding a heavier, stranger weapon and making it everyone else's problem. This build is deliberately locked to the <b>Heavy family</b> while its combat identity is developed.</div><div class="cwlTitleRule">THE RUN: crush packs, chain kills into Slaughter, chase higher DPS Heavy drops, and survive increasingly hostile workplace policy.</div><div class="cwlTitleMeta"><div><b>CONTROLS</b><span>← → move · Alt jump · Ctrl attack · A special · Shift dash</span></div><div><b>HEAVY SYSTEM</b><span>10 bases · unique passive signatures · unique active specials</span></div></div><div class="cwlTitleHandle"></div><div class="cwlTitleActions"></div><div class="cwlTitleBest"><span>LOCAL DPS CHAMPION</span></div><div class="cwlTitleLicense"></div></div><div class="cwlTitleArt"><canvas id="cwlTitleLady" width="360" height="450"></canvas><div class="cwlTitleArtLabel">CRAZY WEAPON LADY · HEAVY LOADOUT</div></div>`;
    const handle=card.querySelector('.cwlTitleHandle');const lab=document.createElement('label');lab.htmlFor='playerName';lab.textContent='LEADERBOARD HANDLE';handle.append(lab,input);
    const actions=card.querySelector('.cwlTitleActions');start.textContent='START HEAVY RUN';actions.appendChild(start);if(museum){museum.textContent='WEAPON MUSEUM';actions.appendChild(museum)}
    if(best)card.querySelector('.cwlTitleBest').appendChild(best);if(license)card.querySelector('.cwlTitleLicense').appendChild(license);
    title.replaceChildren(card);title.classList.add('cwlTitleRebuilt');root.dataset.cwlTitleShell='ready';return true;
  }

  function installUtilities(){
    const s=document.getElementById('gameStage');if(!s||document.getElementById('cwlUtilityBar'))return;
    const bar=document.createElement('div');bar.id='cwlUtilityBar';
    for(const id of ['fullscreen','sound','pause','restart']){const b=document.getElementById(id);if(b)bar.appendChild(b)}
    s.appendChild(bar);root.dataset.cwlUtilityShell='ready';
  }

  function renderTitleLady(){
    const c=document.getElementById('cwlTitleLady'),body=globalThis.CWL_HEAVY_BODY,api=globalThis.CWL_NATIVE_COMBAT;
    if(!c||!body?.drawPlayer||!body?.ready?.()||!api?.state)return false;
    const X=c.getContext('2d'),s=api.state(),w=s.weapon;if(!X||!w)return false;
    X.clearRect(0,0,c.width,c.height);X.save();X.translate(70,70);X.scale(2.05,2.05);
    const pl={x:35,y:55,w:34,h:58,vx:0,vy:0,on:true,dir:1,hp:100,max:100,dead:false,at:0,atMax:.28,inv:0};
    try{body.drawPlayer({X,W:180,H:180,G:145,zoneI:1,time:performance.now()/1000,mapScene:{},platforms:[],Z:[],pl,E:[],P:[],F:[],T:[],w,dps:0,rarity:0,chaosEvent:null,terrainMode:null})}catch(e){console.warn('CWL title Lady render skipped',e);X.restore();return false}
    X.restore();root.dataset.cwlTitleLady='rendered';return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;rebuildTitle();installUtilities();renderTitleLady();if(document.getElementById('titleScreen')?.classList.contains('cwlTitleRebuilt')&&document.getElementById('cwlUtilityBar')&&root.dataset.cwlTitleLady==='rendered'){clearInterval(timer)}else if(tries>60)clearInterval(timer)},80);
  rebuildTitle();installUtilities();renderTitleLady();
  globalThis.CWL_DESKTOP_SHELL={build:BUILD,rebuildTitle,installUtilities,renderTitleLady,state:()=>({title:root.dataset.cwlTitleShell==='ready',utility:root.dataset.cwlUtilityShell==='ready',lady:root.dataset.cwlTitleLady==='rendered'})};
})();
