(()=>{
  if(globalThis.__CWM_ARSENAL_PRESENTATION_V14)return;
  globalThis.__CWM_ARSENAL_PRESENTATION_V14=true;
  const css=document.createElement('style');
  css.textContent=`
    body.cwmArsenalPlaying{background:#02050a!important}
    body.cwmArsenalPlaying .wrap{max-width:none!important;padding:8px 10px!important}
    body.cwmArsenalPlaying .grid{grid-template-columns:minmax(0,1fr)!important;gap:0!important}
    body.cwmArsenalPlaying .side,
    body.cwmArsenalPlaying .banner,
    body.cwmArsenalPlaying .styleHud,
    body.cwmArsenalPlaying .touch,
    body.cwmArsenalPlaying .shardHud,
    body.cwmArsenalPlaying .augmentHud,
    body.cwmArsenalPlaying .weaponForgeHud,
    body.cwmArsenalPlaying .forgeHud,
    body.cwmArsenalPlaying .weaponEquippedHud,
    body.cwmArsenalPlaying .equipToast,
    body.cwmArsenalPlaying .pickupToast,
    body.cwmArsenalPlaying .killChainHud,
    body.cwmArsenalPlaying .waveIntro{display:none!important}
    body.cwmArsenalPlaying .top{margin-bottom:6px!important;opacity:.78}
    body.cwmArsenalPlaying .stage{border-radius:12px!important;border-color:#31516c!important;box-shadow:0 18px 80px #000c,0 0 0 1px #69e8ff12 inset!important}
    body.cwmArsenalPlaying .fsHud{display:block!important}
    body.cwmArsenalPlaying .fsTop{top:10px!important;left:10px!important;right:10px!important;align-items:flex-start!important}
    body.cwmArsenalPlaying .fsWeapon{width:min(360px,34vw)!important;padding:7px 9px!important;grid-template-columns:60px minmax(0,1fr)!important;gap:8px!important;border-radius:10px!important;background:#04101bd9!important;border-color:#72eaff35!important;overflow:hidden!important}
    body.cwmArsenalPlaying .fsWeapon canvas{width:60px!important;height:42px!important;border-radius:7px!important}
    body.cwmArsenalPlaying .fsWeaponCopy{min-width:0!important;overflow:hidden!important}
    body.cwmArsenalPlaying .fsLabel{font-size:7px!important;letter-spacing:.14em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    body.cwmArsenalPlaying .fsWName{font-size:12px!important;line-height:1.04!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    body.cwmArsenalPlaying .fsDps{font-size:17px!important;margin-top:1px!important;color:#fff275!important}
    body.cwmArsenalPlaying .fsMeta,body.cwmArsenalPlaying .fsAttrs{font-size:8px!important;line-height:1.18!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    body.cwmArsenalPlaying .fsVitals{width:min(240px,23vw)!important;padding:7px 8px!important;border-radius:10px!important;background:#04101bd9!important;border-color:#72eaff35!important}
    body.cwmArsenalPlaying .fsVRow{grid-template-columns:32px 1fr 50px!important;gap:5px!important;font-size:8px!important;margin:2px 0!important}
    body.cwmArsenalPlaying .fsBar{height:6px!important}
    body.cwmArsenalPlaying .fsBottom{display:none!important}
    body.cwmArsenalPlaying .fsZone{right:auto!important;left:12px!important;bottom:10px!important;text-align:left!important;padding:5px 8px!important;border-radius:8px!important;background:#04101bbd!important;border:1px solid #72eaff25!important;font-size:8px!important;max-width:260px!important}
    body.cwmArsenalPlaying .fsUpgrade{top:13%!important;width:min(440px,48vw)!important;max-width:48vw!important;padding:6px 10px!important;border:1px solid #ffffff2d!important;border-radius:10px!important;background:#06111de5!important;filter:drop-shadow(0 7px 18px #000)!important}
    body.cwmArsenalPlaying .fsUpgrade .u1{font-size:7px!important;letter-spacing:.16em!important;color:#9fb3c9!important}
    body.cwmArsenalPlaying .fsUpgrade .u2{font-size:clamp(14px,1.65vw,22px)!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    body.cwmArsenalPlaying .fsUpgrade .u3{font-size:10px!important;margin-top:2px!important}
    body.cwmArsenalPlaying .directorStamp{font-size:8px!important;opacity:.68!important;max-width:300px!important}
    body.cwmArsenalPlaying .synergyBadge{transform:scale(.72)!important;transform-origin:center top!important}
    body.cwmArsenalPlaying .msg{display:none!important}
    body.cwmArsenalPlaying canvas#game{background:#07111f!important}
  `;
  document.head.appendChild(css);

  function isHidden(sel){
    const nodes=[...document.querySelectorAll(sel)];
    return !nodes.length||nodes.every(el=>getComputedStyle(el).display==='none'||el.hidden);
  }
  function sync(){
    const title=document.getElementById('titleScreen');
    const active=!!title?.classList.contains('hidden');
    document.body?.classList.toggle('cwmArsenalPlaying',active);
    const root=document.documentElement;
    root.dataset.cwmArsenalPresentation=active?'combat':'title';
    if(active){
      requestAnimationFrame(()=>{
        root.dataset.cwmLegacyShards=isHidden('.shardHud,.weaponForgeHud,.forgeHud')?'hidden':'visible';
        root.dataset.cwmLegacyAugments=isHidden('.augmentHud')?'hidden':'visible';
        root.dataset.cwmLegacySide=isHidden('.side')?'hidden':'visible';
      });
    }
  }
  const mo=new MutationObserver(sync);
  const boot=()=>{const title=document.getElementById('titleScreen');if(title)mo.observe(title,{attributes:true,attributeFilter:['class']});sync()};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
  globalThis.CWM_ARSENAL_PRESENTATION={version:'v1.4b',sync};
})();
