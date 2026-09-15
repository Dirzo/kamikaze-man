(()=>{
  if(globalThis.__CWL_SLAYER_LOOP_V1)return;
  globalThis.__CWL_SLAYER_LOOP_V1=true;
  const BUILD='cwl-slayer-loop-v2-20260915a';
  const CHAIN_WINDOW=1.55,MAX_ENEMIES=58;
  let chain=0,best=0,lastKill=-99,lastWave=null,waveExtra=0,waveRank=0,lastBonus=0,totalBonus=0,installed=false;
  const api=()=>globalThis.CWL_NATIVE_COMBAT;
  const native=()=>{try{return api()?.state?.()||null}catch(_){return null}};
  const now=()=>Number(native()?.time)||performance.now()/1000;
  const rank=()=>Math.max(0,Number(api()?.rank?.(native()?.weapon))||0);
  const nf=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString();

  function addStyle(points){const n=Math.max(0,Math.floor(points||0));if(!n)return 0;totalBonus+=n;try{api()?.addStyle?.(n,'SLAUGHTER')}catch(_){ }return n}
  function chainBonus(c,r){const base=7+c*2.2+Math.pow(c,1.23),rarity=1+Math.min(.8,r*.038),milestone=c%10===0?1+c/20:1;return Math.round(base*rarity*milestone)}
  function flashMilestone(c,bonus){if(c<10||c%5!==0)return;const s=native(),pl=s?.pl,f=api()?.fx;if(!pl||!f)return;const col=c>=30?'#ff72d6':c>=20?'#ff9270':'#fff176';f.txt(pl.x+pl.w/2,pl.y-58,`SLAUGHTER x${c}  +${nf(bonus)}`,col,true);f.ring(pl.x+pl.w/2,pl.y+pl.h/2,col,55+Math.min(90,c*2),Math.min(7,2+Math.floor(c/10)));if(c%10===0){f.part(pl.x+pl.w/2,pl.y+10,col,Math.min(24,10+c/2),145+c*3,5);f.shake(Math.min(10,3+c*.16))}}
  function onKill(ev){const e=ev?.enemy;if(!e||e.boss)return;const t=Number(ev?.time)||now(),r=rank();chain=t-lastKill<=CHAIN_WINDOW?chain+1:1;lastKill=t;best=Math.max(best,chain);lastBonus=chainBonus(chain,r);addStyle(lastBonus);flashMilestone(chain,lastBonus);document.documentElement.dataset.cwlSlayerKill='pass'}
  function extraPacksForRank(r){if(r<4)return 0;if(r<8)return 1;if(r<14)return 2;if(r<18)return 3;if(r<22)return 3;return 4}
  function safeSpawnPack(){const s=native();if(!s?.gameStarted||s.over||s.bossMode||(s.E?.length||0)>=MAX_ENEMIES)return false;const fn=globalThis.__KM_DEBUG?.spawnPack;if(typeof fn!=='function')return false;fn();return true}
  function scheduleReinforcements(wave,r,extra){if(!extra)return;for(let i=0;i<extra;i++)setTimeout(()=>{const s=native();if(Number(s?.stageClears||0)!==wave)return;if(safeSpawnPack()&&i===0){const f=api()?.fx,col=r>=18?'#ff72d6':r>=14?'#ff9270':'#fff176';f?.txt((s.W||1200)/2,78,`WEAPON THREAT +${extra} PACK${extra===1?'':'S'}`,col,false)}},500+i*520)}
  function watchWave(){const s=native();if(!s?.gameStarted||s.over)return;const wave=Number(s.stageClears)||0;if(wave===lastWave)return;lastWave=wave;if(s.bossMode){waveExtra=0;return}waveRank=rank();waveExtra=extraPacksForRank(waveRank);scheduleReinforcements(wave,waveRank,waveExtra)}
  function decayChain(){if(chain&&now()-lastKill>=CHAIN_WINDOW){chain=0;lastBonus=0}}
  function install(){const a=api();if(!a?.on){setTimeout(install,80);return}if(installed)return;a.on('kill',onKill);installed=true;document.documentElement.dataset.cwlSlayer='ready';console.info('Crazy Weapon Lady slayer loop armed',BUILD)}
  install();setInterval(()=>{watchWave();decayChain()},120);
  globalThis.CWL_SLAYER_LOOP={build:BUILD,state:()=>({installed,chain,best,lastKill,lastBonus,totalBonus,wave:lastWave,waveRank,waveExtra,maxEnemies:MAX_ENEMIES}),extraPacksForRank};
})();
