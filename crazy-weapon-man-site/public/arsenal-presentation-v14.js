(()=>{
  if(globalThis.__CWM_ARSENAL_PRESENTATION_V14)return;
  globalThis.__CWM_ARSENAL_PRESENTATION_V14=true;
  const css=document.createElement('style');
  css.textContent=`
    body.cwmArsenalPlaying{background:#02050a!important}
    body.cwmArsenalPlaying .wrap{max-width:none!important;padding:8px 10px!important}
    body.cwmArsenalPlaying .grid{grid-template-columns:minmax(0,1fr)!important;gap:0!important}
    body.cwmArsenalPlaying .side{display:none!important}
    body.cwmArsenalPlaying .banner{display:none!important}
    body.cwmArsenalPlaying .styleHud{display:none!important}
    body.cwmArsenalPlaying .touch{display:none!important}
    body.cwmArsenalPlaying .top{margin-bottom:6px!important;opacity:.78}
    body.cwmArsenalPlaying .stage{border-radius:12px!important;border-color:#31516c!important;box-shadow:0 18px 80px #000c,0 0 0 1px #69e8ff12 inset!important}
    body.cwmArsenalPlaying .fsHud{display:block!important}
    body.cwmArsenalPlaying .fsTop{top:10px!important;left:10px!important;right:10px!important;align-items:flex-start!important}
    body.cwmArsenalPlaying .fsWeapon{width:min(390px,38vw)!important;padding:8px 10px!important;grid-template-columns:68px 1fr!important;gap:9px!important;border-radius:11px!important;background:#04101be0!important;border-color:#72eaff35!important}
    body.cwmArsenalPlaying .fsWeapon canvas{width:68px!important;height:46px!important;border-radius:8px!important}
    body.cwmArsenalPlaying .fsLabel{font-size:8px!important;letter-spacing:.16em!important}
    body.cwmArsenalPlaying .fsWName{font-size:14px!important;line-height:1.08!important}
    body.cwmArsenalPlaying .fsDps{font-size:19px!important;margin-top:1px!important;color:#fff275!important}
    body.cwmArsenalPlaying .fsMeta,body.cwmArsenalPlaying .fsAttrs{font-size:9px!important;line-height:1.25!important}
    body.cwmArsenalPlaying .fsVitals{width:min(250px,25vw)!important;padding:8px 9px!important;border-radius:11px!important;background:#04101be0!important;border-color:#72eaff35!important}
    body.cwmArsenalPlaying .fsVRow{grid-template-columns:34px 1fr 52px!important;gap:5px!important;font-size:9px!important;margin:2px 0!important}
    body.cwmArsenalPlaying .fsBar{height:7px!important}
    body.cwmArsenalPlaying .fsBottom{display:none!important}
    body.cwmArsenalPlaying .fsZone{right:auto!important;left:12px!important;bottom:10px!important;text-align:left!important;padding:6px 9px!important;border-radius:9px!important;background:#04101bc9!important;border:1px solid #72eaff25!important;font-size:9px!important;max-width:280px!important}
    body.cwmArsenalPlaying .fsUpgrade{top:15%!important;width:min(500px,58vw)!important;max-width:58vw!important;padding:7px 11px!important;border:1px solid #ffffff2d!important;border-radius:11px!important;background:#06111de8!important;filter:drop-shadow(0 7px 18px #000)!important}
    body.cwmArsenalPlaying .fsUpgrade .u1{font-size:8px!important;letter-spacing:.18em!important;color:#9fb3c9!important}
    body.cwmArsenalPlaying .fsUpgrade .u2{font-size:clamp(16px,2vw,26px)!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    body.cwmArsenalPlaying .fsUpgrade .u3{font-size:11px!important;margin-top:3px!important}
    body.cwmArsenalPlaying .directorStamp{font-size:9px!important;opacity:.72!important;max-width:330px!important}
    body.cwmArsenalPlaying .synergyBadge{transform:scale(.78)!important;transform-origin:center top!important}
    body.cwmArsenalPlaying canvas#game{background:#07111f!important}
  `;
  document.head.appendChild(css);

  function sync(){
    const title=document.getElementById('titleScreen');
    const active=!!title?.classList.contains('hidden');
    document.body?.classList.toggle('cwmArsenalPlaying',active);
    document.documentElement.dataset.cwmArsenalPresentation=active?'combat':'title';
  }
  const mo=new MutationObserver(sync);
  const boot=()=>{const title=document.getElementById('titleScreen');if(title)mo.observe(title,{attributes:true,attributeFilter:['class']});sync()};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
  globalThis.CWM_ARSENAL_PRESENTATION={version:'v1.4a',sync};
})();
