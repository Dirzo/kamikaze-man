(()=>{
  if(globalThis.__CWM_ATTACK_SPEED_V28)return;
  globalThis.__CWM_ATTACK_SPEED_V28=true;
  const SCALE=1.15;
  const before={};
  const after={};
  for(const type of Object.keys(WM)){
    before[type]=Number(WM[type].cd);
    WM[type].cd=Number((WM[type].cd*SCALE).toFixed(4));
    after[type]=WM[type].cd;
  }
  globalThis.CWM_ATTACK_SPEED_V28={
    scale:SCALE,
    before:{...before},
    after:{...after},
    state:()=>({scale:SCALE,before:{...before},after:{...after}})
  };
  if(new URLSearchParams(location.search).get('runtimeV28Smoke')==='1'){
    setTimeout(()=>{
      const ratios=Object.keys(before).map(k=>after[k]/before[k]);
      const ok=ratios.length>=6&&ratios.every(r=>r>1.145&&r<1.155);
      document.documentElement.dataset.cwmAttackV28=ok?'pass':'fail';
      document.documentElement.dataset.cwmAttackCooldowns=Object.keys(after).map(k=>`${k}:${after[k]}`).join(',');
    },250);
  }
})();