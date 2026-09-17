(()=>{
  if(globalThis.__CWM_PLAYER_HP_V29)return;
  globalThis.__CWM_PLAYER_HP_V29=true;
  const S={draws:0,error:null};
  const clamp=n=>Math.max(0,Math.min(1,n));
  let lag=1;
  function drawHp(){
    if(!gameStarted)return false;
    const w=curW();if(!w)return false;
    const max=Math.max(1,pl.max),hp=clamp(pl.hp/max),W=122,H=10,cx=pl.x+pl.w/2,y=pl.y-58;
    lag+=(hp-lag)*.12;lag=clamp(lag);S.draws++;
    X.save();
    X.textAlign='center';X.textBaseline='bottom';X.font='1000 8px system-ui';X.lineWidth=3;X.strokeStyle='#000';
    X.strokeText('CRAZY WEAPON MAN',cx,y-5);X.fillStyle='#fff';X.fillText('CRAZY WEAPON MAN',cx,y-5);
    X.fillStyle='rgba(2,5,9,.96)';X.fillRect(cx-W/2-3,y-2,W+6,H+4);
    X.strokeStyle=w.col||'#fff';X.lineWidth=2;X.strokeRect(cx-W/2-2,y-1,W+4,H+2);
    X.fillStyle='#611522';X.fillRect(cx-W/2,y,W*lag,H);
    const g=X.createLinearGradient(cx-W/2,y,cx+W/2,y);g.addColorStop(0,'#ff2447');g.addColorStop(1,hp<.3?'#ff6a3d':'#ff8d9a');X.fillStyle=g;X.fillRect(cx-W/2,y,W*hp,H);
    X.fillStyle='#fff';X.globalAlpha=.28;X.fillRect(cx-W/2,y,W*hp,2);X.globalAlpha=1;
    const label=`${Math.max(0,Math.ceil(pl.hp))} / ${Math.ceil(max)}`;
    X.font='1000 7px system-ui';X.textBaseline='top';X.strokeStyle='#000';X.lineWidth=3;X.strokeText(label,cx,y+H+3);X.fillStyle='#fff';X.fillText(label,cx,y+H+3);
    X.restore();
    return true;
  }
  const draw0=draw;
  draw=function(){const r=draw0();try{drawHp()}catch(e){if(!S.error)S.error=String(e)}return r};
  globalThis.CWM_PLAYER_HP_V29={state:()=>({...S}),drawHp};
  if(new URLSearchParams(location.search).get('characterV29Smoke')==='1')setTimeout(()=>{const root=document.documentElement;root.dataset.cwmPlayerHpV29=(S.draws>0&&!S.error)?'pass':'fail';root.dataset.cwmPlayerHpFrames=String(S.draws);root.dataset.cwmPlayerHpError=S.error||''},1200);
})();