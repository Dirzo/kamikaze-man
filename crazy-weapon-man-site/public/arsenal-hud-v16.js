(()=>{
  if(globalThis.__CWM_ARSENAL_HUD_V16)return;
  globalThis.__CWM_ARSENAL_HUD_V16=true;
  const style=document.createElement('style');style.id='cwmHudV16';style.textContent=`
  :root{--cwm-accent:#8fefff;--cwm-panel:rgba(3,10,17,.91);--cwm-line:rgba(142,226,255,.26)}
  body.cwmArsenalPlaying .fsTop{top:12px!important;left:14px!important;right:14px!important;bottom:auto!important;height:auto!important;min-height:0!important;display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:18px!important;background:none!important}
  body.cwmArsenalPlaying .fsWeapon{position:relative!important;width:min(650px,50vw)!important;height:auto!important;min-height:132px!important;max-height:310px!important;grid-template-columns:88px minmax(0,1fr)!important;gap:11px!important;padding:10px 16px 11px 10px!important;border:1px solid var(--cwm-line)!important;border-radius:0!important;background:linear-gradient(115deg,color-mix(in srgb,var(--cwm-accent) 10%,#04101b),rgba(4,12,20,.95) 48%,rgba(8,16,26,.88))!important;clip-path:polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,14px 100%,0 calc(100% - 14px))!important;box-shadow:0 16px 44px #000a,inset 0 1px 0 color-mix(in srgb,var(--cwm-accent) 40%,transparent)!important;overflow:hidden!important}
  body.cwmArsenalPlaying .fsWeapon:before{content:"ARMAMENT // LIVE LOADOUT";position:absolute;top:4px;left:108px;font:1000 6px/1 system-ui;letter-spacing:.22em;color:#7890a0}
  body.cwmArsenalPlaying .fsWeapon:after{content:"SPACE // SPECIAL";position:absolute;right:9px;top:5px;font:1000 6px/1 system-ui;letter-spacing:.16em;color:var(--cwm-accent)}
  body.cwmArsenalPlaying .fsWeapon canvas{width:88px!important;height:70px!important;align-self:start!important;margin-top:12px!important;border:1px solid color-mix(in srgb,var(--cwm-accent) 42%,transparent)!important;border-radius:0!important;background:#03080d!important;box-shadow:inset 0 0 18px #000,0 0 13px color-mix(in srgb,var(--cwm-accent) 16%,transparent)!important}
  body.cwmArsenalPlaying .fsWeaponCopy{display:block!important;min-width:0!important;overflow:visible!important;padding-top:11px!important}
  body.cwmArsenalPlaying .fsLabel{display:none!important}
  body.cwmArsenalPlaying .fsWName{display:block!important;margin:0 0 5px!important;max-width:100%!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;text-wrap:balance!important;overflow-wrap:anywhere!important;line-height:1.02!important;font-weight:1000!important;letter-spacing:-.02em!important;text-transform:uppercase!important;filter:drop-shadow(0 0 7px color-mix(in srgb,var(--cwm-accent) 24%,transparent))}
  body.cwmArsenalPlaying .fsDps{display:inline-block!important;margin:0 9px 4px 0!important;font-size:21px!important;line-height:1!important;font-weight:1000!important}
  body.cwmArsenalPlaying .fsMeta{display:inline!important;font-size:8.5px!important;line-height:1.25!important;color:#c8d6e1!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
  body.cwmArsenalPlaying .fsAttrs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:4px 5px!important;margin-top:7px!important;max-height:164px!important;overflow:auto!important;padding-right:3px!important;scrollbar-width:thin!important;scrollbar-color:color-mix(in srgb,var(--cwm-accent) 42%,transparent) transparent!important}
  body.cwmArsenalPlaying .fsAttr{min-width:0!important;padding:4px 6px!important;border:1px solid rgba(255,255,255,.10)!important;background:rgba(255,255,255,.035)!important;border-radius:0!important;font-size:7.5px!important;line-height:1.18!important;color:#adbdca!important}
  body.cwmArsenalPlaying .fsAttr b{display:block!important;margin-bottom:2px!important;font-size:7px!important;line-height:1.05!important;letter-spacing:.055em!important;color:var(--cwm-accent)!important;white-space:normal!important}
  body.cwmArsenalPlaying .fsAttr span{display:block!important;white-space:normal!important;overflow-wrap:anywhere!important;color:#c5d0da!important}
  body.cwmArsenalPlaying .fsAttr.base b{color:#fff19a!important}

  body.cwmArsenalPlaying .fsVitals{position:relative!important;width:min(375px,30vw)!important;height:auto!important;min-height:166px!important;padding:15px 13px 12px 28px!important;border:1px solid rgba(151,224,250,.22)!important;border-radius:0!important;background:linear-gradient(245deg,rgba(4,13,22,.97),rgba(7,18,29,.93))!important;clip-path:polygon(18px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 18px)!important;box-shadow:0 16px 44px #000a!important;display:block!important}
  body.cwmArsenalPlaying .fsVitals:before{content:"RUN STATUS";position:absolute;top:5px;right:9px;font:1000 6px/1 system-ui;letter-spacing:.22em;color:#718795}
  body.cwmArsenalPlaying .fsVRow{display:grid!important;grid-template-columns:48px minmax(0,1fr) 58px!important;gap:7px!important;align-items:center!important;margin:4px 0!important;font:1000 8px/1 system-ui!important;color:#96a9b8!important}
  body.cwmArsenalPlaying .fsVRow span:last-child{text-align:right!important;color:#e7f2fa!important;font-size:8px!important}
  body.cwmArsenalPlaying .fsBar{height:8px!important;border-radius:0!important;overflow:hidden!important;background:#000b!important;border:1px solid rgba(255,255,255,.09)!important;clip-path:none!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(1){margin-top:9px!important;font-size:10px!important;color:#ff8b94!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(1) .fsBar{height:16px!important;border-color:rgba(255,99,116,.35)!important;box-shadow:0 0 13px rgba(255,64,86,.12)!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(1) span:last-child{font-size:10px!important;font-weight:1000!important}
  body.cwmArsenalPlaying .fsHp{background:linear-gradient(90deg,#ff314e,#ff7a84)!important;box-shadow:0 0 11px rgba(255,59,80,.55)!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(2){color:#75eaff!important;margin-top:7px!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(2) .fsBar{height:8px!important;border-color:rgba(87,222,255,.28)!important}
  body.cwmArsenalPlaying .fsMp{background:linear-gradient(90deg,#3bd5ff,#8fffd8)!important;box-shadow:0 0 9px rgba(70,227,255,.38)!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(3){margin-top:7px!important;font-size:10px!important;color:#ffe38a!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(3) .fsBar{height:14px!important;border-color:rgba(255,222,110,.32)!important;box-shadow:0 0 12px rgba(255,217,96,.10)!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(3) span:last-child{font-size:9px!important}
  body.cwmArsenalPlaying .fsXp{background:linear-gradient(90deg,#e7a62e,#ffe97c)!important;box-shadow:0 0 9px rgba(255,215,81,.32)!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(4){opacity:.80!important;font-size:7px!important;margin-top:5px!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(4) .fsBar{height:5px!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(5){position:absolute!important;left:6px!important;top:34px!important;width:18px!important;display:flex!important;flex-direction:column!important;gap:2px!important;color:#ffe782!important;border-left:2px solid #ffe782!important;padding-left:4px!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(5)>div{display:none!important}body.cwmArsenalPlaying .fsVRow:nth-child(5) span:first-child{font-size:5px!important}body.cwmArsenalPlaying .fsVRow:nth-child(5) span:last-child{font-size:13px!important;color:#fff!important;text-align:left!important}
  body.cwmArsenalPlaying #cwmSpecialInfo{margin-top:7px;padding-top:7px;border-top:1px solid rgba(120,218,246,.18);font-size:7.5px;line-height:1.24;color:#aebfcb}
  body.cwmArsenalPlaying #cwmSpecialInfo b{display:block;color:#8fffe0;font-size:9px;letter-spacing:.08em;margin-bottom:2px}
  body.cwmArsenalPlaying #cwmSpecialInfo em{font-style:normal;color:#fff19a;font-weight:1000}

  body.cwmArsenalPlaying .fsBottom{display:none!important}
  body.cwmArsenalPlaying .fsZone{top:12px!important;bottom:auto!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:min(290px,27vw)!important;height:auto!important;min-height:0!important;padding:6px 20px!important;border:1px solid rgba(123,219,248,.19)!important;border-radius:0!important;background:rgba(4,12,20,.84)!important;clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%)!important;text-align:center!important;color:#8da4b3!important;font-size:7px!important;letter-spacing:.05em!important}
  body.cwmArsenalPlaying .fsZone b{display:block!important;color:#eef9ff!important;font-size:9px!important;letter-spacing:.13em!important;text-transform:uppercase!important}
  body.cwmArsenalPlaying .fsUpgrade{top:19%!important;width:min(620px,58vw)!important;max-width:58vw!important;padding:8px 24px!important;border:1px solid color-mix(in srgb,var(--cwm-accent) 38%,transparent)!important;border-radius:0!important;background:rgba(3,10,17,.91)!important;clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,18px 100%,0 50%)!important}
  body.cwmArsenalPlaying .fsUpgrade .u1{font-size:6px!important;letter-spacing:.22em!important;color:#879ba8!important}
  body.cwmArsenalPlaying .fsUpgrade .u2{font-size:clamp(14px,1.8vw,23px)!important;line-height:1.02!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere!important}
  body.cwmArsenalPlaying .fsUpgrade .u3{font-size:9px!important;margin-top:3px!important;color:#ffe27b!important}
  @media(max-width:1050px){body.cwmArsenalPlaying .fsWeapon{width:56vw!important}.fsAttrs{grid-template-columns:1fr!important}body.cwmArsenalPlaying .fsVitals{width:31vw!important}}
  `;document.head.appendChild(style);

  const vitals=document.querySelector('.fsVitals');let info=document.getElementById('cwmSpecialInfo');
  if(vitals&&!info){info=document.createElement('div');info.id='cwmSpecialInfo';vitals.appendChild(info)}
  const name=document.getElementById('fsWName'),dps=document.getElementById('fsDps');
  function sync(){
    let col=(name?.style?.color||dps?.style?.color||'').trim()||'#8fefff';document.documentElement.style.setProperty('--cwm-accent',col);
    const s=globalThis.CWM_SPECIALS_V15?.state?.();
    if(info&&s)info.innerHTML=`<b>SPACE // ${s.name}</b><span>${s.desc}</span> <em>${s.ready?'READY':s.remaining.toFixed(1)+'s'}</em>`;
  }
  const obs=new MutationObserver(sync);if(name)obs.observe(name,{attributes:true,childList:true,subtree:true});if(dps)obs.observe(dps,{attributes:true,childList:true,subtree:true});
  sync();const timer=setInterval(sync,180);
  globalThis.CWM_ARSENAL_HUD_V16={version:'v16-full-loadout',sync,observer:obs,timer};
})();