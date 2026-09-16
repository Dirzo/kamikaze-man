(()=>{
  if(globalThis.__CWM_ARSENAL_HUD_V15)return;
  globalThis.__CWM_ARSENAL_HUD_V15=true;

  const style=document.createElement('style');
  style.id='cwmArsenalHudV15Styles';
  style.textContent=`
  :root{
    --cwm-accent:#8fefff;
    --cwm-amber:#ffd96a;
    --cwm-ink:rgba(3,9,16,.88);
    --cwm-ink2:rgba(7,18,29,.76);
    --cwm-line:rgba(161,221,244,.22);
  }

  body.cwmArsenalPlaying .fsHud{
    font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;
    text-shadow:0 2px 5px #000,0 0 12px rgba(0,0,0,.38)!important;
  }
  body.cwmArsenalPlaying .fsHud:before{
    content:"";position:absolute;inset:7px;pointer-events:none;
    border:1px solid rgba(148,210,235,.08);
    clip-path:polygon(0 0,70px 0,70px 2px,2px 2px,2px 62px,0 62px,0 0,100% 0,100% 62px,calc(100% - 2px) 62px,calc(100% - 2px) 2px,calc(100% - 70px) 2px,calc(100% - 70px) 0,100% 0,100% 100%,calc(100% - 70px) 100%,calc(100% - 70px) calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) calc(100% - 62px),100% calc(100% - 62px),100% 100%,0 100%,0 calc(100% - 62px),2px calc(100% - 62px),2px calc(100% - 2px),70px calc(100% - 2px),70px 100%,0 100%);
    box-shadow:inset 0 0 32px rgba(78,198,235,.025);
  }

  body.cwmArsenalPlaying .fsTop{
    top:14px!important;left:16px!important;right:16px!important;
    height:auto!important;min-height:0!important;
    display:flex!important;align-items:flex-start!important;justify-content:space-between!important;
    gap:18px!important;background:none!important;
  }

  body.cwmArsenalPlaying .fsWeapon{
    position:relative!important;
    width:min(430px,34vw)!important;height:92px!important;min-height:0!important;
    grid-template-columns:92px minmax(0,1fr)!important;gap:11px!important;
    padding:9px 26px 9px 10px!important;
    border:0!important;border-radius:0!important;
    background:
      linear-gradient(90deg,color-mix(in srgb,var(--cwm-accent) 11%,transparent),transparent 54%),
      linear-gradient(112deg,rgba(5,14,24,.96),rgba(9,19,31,.90) 72%,rgba(15,24,34,.72))!important;
    clip-path:polygon(0 0,calc(100% - 25px) 0,100% 25px,100% 100%,18px 100%,0 calc(100% - 18px))!important;
    box-shadow:0 13px 38px #0009!important;overflow:visible!important;
  }
  body.cwmArsenalPlaying .fsWeapon:before{
    content:"";position:absolute;left:0;top:0;width:74%;height:2px;
    background:linear-gradient(90deg,var(--cwm-accent),color-mix(in srgb,var(--cwm-accent) 26%,transparent),transparent);
    box-shadow:0 0 13px color-mix(in srgb,var(--cwm-accent) 52%,transparent);
  }
  body.cwmArsenalPlaying .fsWeapon:after{
    content:"AUTO-EQUIP";position:absolute;right:10px;bottom:-1px;
    padding:2px 7px 3px;background:var(--cwm-accent);color:#061019;
    font-size:7px;font-weight:1000;letter-spacing:.12em;
    clip-path:polygon(6px 0,100% 0,100% 100%,0 100%,0 6px);
  }
  body.cwmArsenalPlaying .fsWeapon canvas{
    width:92px!important;height:64px!important;align-self:center!important;
    border:1px solid color-mix(in srgb,var(--cwm-accent) 42%,transparent)!important;
    border-radius:0!important;
    background:
      linear-gradient(135deg,color-mix(in srgb,var(--cwm-accent) 8%,#04080d),#04080d 58%),
      #04080d!important;
    box-shadow:inset 0 0 18px #000,0 0 15px color-mix(in srgb,var(--cwm-accent) 12%,transparent)!important;
    clip-path:polygon(0 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%)!important;
  }
  body.cwmArsenalPlaying .fsWeaponCopy{
    align-self:center!important;min-width:0!important;overflow:hidden!important;
    display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;
    grid-template-areas:'label label' 'name name' 'meta dps'!important;
    column-gap:10px!important;align-items:end!important;
  }
  body.cwmArsenalPlaying .fsLabel{
    grid-area:label!important;font-size:7px!important;line-height:1!important;
    letter-spacing:.22em!important;color:#8097a8!important;font-weight:1000!important;
    margin-bottom:4px!important;
  }
  body.cwmArsenalPlaying .fsWName{
    grid-area:name!important;margin:0 0 4px!important;max-width:100%!important;
    font-size:clamp(15px,1.42vw,21px)!important;line-height:.94!important;
    font-weight:1000!important;letter-spacing:-.025em!important;text-transform:uppercase!important;
    white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
    filter:drop-shadow(0 0 9px color-mix(in srgb,var(--cwm-accent) 24%,transparent));
  }
  body.cwmArsenalPlaying .fsDps{
    grid-area:dps!important;display:block!important;margin:0!important;
    font-size:15px!important;line-height:1!important;font-weight:1000!important;
    white-space:nowrap!important;text-align:right!important;
  }
  body.cwmArsenalPlaying .fsMeta{
    grid-area:meta!important;display:block!important;min-width:0!important;
    font-size:7.5px!important;line-height:1.15!important;letter-spacing:.04em!important;
    color:#b7c6d2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
  }
  body.cwmArsenalPlaying .fsAttrs{display:none!important}

  body.cwmArsenalPlaying .fsVitals{
    position:relative!important;
    width:min(330px,27vw)!important;height:92px!important;min-height:0!important;
    padding:9px 11px 8px 25px!important;
    border:0!important;border-radius:0!important;
    background:
      linear-gradient(270deg,rgba(255,92,103,.035),transparent 55%),
      linear-gradient(248deg,rgba(5,14,24,.96),rgba(8,18,29,.91))!important;
    clip-path:polygon(25px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 25px)!important;
    box-shadow:0 13px 38px #0009!important;
    display:grid!important;grid-template-columns:1fr 1fr!important;
    grid-template-rows:1fr 1fr!important;gap:5px 11px!important;
  }
  body.cwmArsenalPlaying .fsVitals:before{
    content:"VITALS";position:absolute;top:4px;right:9px;
    color:#71899a;font-size:6px;font-weight:1000;letter-spacing:.18em;
  }
  body.cwmArsenalPlaying .fsVitals:after{
    content:"";position:absolute;right:0;top:0;width:66%;height:2px;
    background:linear-gradient(270deg,#ff6676,rgba(255,102,118,.18),transparent);
    box-shadow:0 0 12px rgba(255,102,118,.30);
  }
  body.cwmArsenalPlaying .fsVRow{
    min-width:0!important;display:grid!important;
    grid-template-columns:28px minmax(0,1fr) 44px!important;
    gap:5px!important;align-items:center!important;
    margin:0!important;font-size:7px!important;line-height:1!important;
    color:#92a5b4!important;font-weight:1000!important;
  }
  body.cwmArsenalPlaying .fsVRow:nth-child(1),body.cwmArsenalPlaying .fsVRow:nth-child(2){grid-column:span 2!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(3),body.cwmArsenalPlaying .fsVRow:nth-child(4){grid-template-columns:25px 1fr 34px!important;font-size:6px!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(5){
    position:absolute!important;left:5px;top:29px!important;width:18px!important;height:34px!important;
    display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;
    gap:2px!important;color:var(--cwm-amber)!important;border-left:2px solid var(--cwm-amber)!important;
  }
  body.cwmArsenalPlaying .fsVRow:nth-child(5)>div{display:none!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(5)>span:first-child{font-size:5px!important}
  body.cwmArsenalPlaying .fsVRow:nth-child(5)>span:last-child{font-size:13px!important;color:#fff!important}
  body.cwmArsenalPlaying .fsBar{
    height:8px!important;border-radius:0!important;overflow:hidden!important;
    background:rgba(0,0,0,.58)!important;border:1px solid rgba(255,255,255,.08)!important;
    clip-path:polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)!important;
  }
  body.cwmArsenalPlaying .fsVRow:nth-child(3) .fsBar,body.cwmArsenalPlaying .fsVRow:nth-child(4) .fsBar{height:5px!important}
  body.cwmArsenalPlaying .fsHp{background:linear-gradient(90deg,#ff3d58,#ff7f77)!important;box-shadow:0 0 10px rgba(255,71,91,.58)}
  body.cwmArsenalPlaying .fsMp{background:linear-gradient(90deg,#3a7fff,#7ee4ff)!important;box-shadow:0 0 10px rgba(83,183,255,.48)}
  body.cwmArsenalPlaying .fsXp{background:linear-gradient(90deg,#d8a63e,#ffe988)!important}
  body.cwmArsenalPlaying .fsMastery{background:linear-gradient(90deg,#70ddff,var(--cwm-accent))!important}

  body.cwmArsenalPlaying .fsZone{
    top:13px!important;bottom:auto!important;left:50%!important;right:auto!important;
    transform:translateX(-50%)!important;
    width:min(250px,25vw)!important;height:auto!important;min-height:0!important;
    padding:6px 22px 7px!important;text-align:center!important;
    border:0!important;border-radius:0!important;
    background:linear-gradient(180deg,rgba(6,16,26,.91),rgba(4,10,17,.80))!important;
    clip-path:polygon(13px 0,calc(100% - 13px) 0,100% 50%,calc(100% - 13px) 100%,13px 100%,0 50%)!important;
    box-shadow:0 8px 22px #0008!important;
    color:#9eb1c0!important;font-size:7px!important;line-height:1.25!important;
    letter-spacing:.07em!important;
  }
  body.cwmArsenalPlaying .fsZone b{
    display:block!important;color:#eaf7ff!important;font-size:10px!important;line-height:1!important;
    letter-spacing:.16em!important;text-transform:uppercase!important;
  }
  body.cwmArsenalPlaying .fsZone:before{
    content:"SECTOR";display:block;margin-bottom:3px;color:var(--cwm-accent);
    font-size:5px;font-weight:1000;letter-spacing:.27em;
  }

  body.cwmArsenalPlaying .fsUpgrade{
    top:17%!important;left:50%!important;
    width:min(570px,52vw)!important;max-width:52vw!important;
    padding:9px 42px 10px!important;
    border:0!important;border-radius:0!important;
    background:
      linear-gradient(90deg,transparent,color-mix(in srgb,var(--cwm-accent) 9%,transparent) 20%,color-mix(in srgb,var(--cwm-accent) 14%,#07111a) 50%,color-mix(in srgb,var(--cwm-accent) 9%,transparent) 80%,transparent),
      rgba(3,9,15,.86)!important;
    clip-path:polygon(26px 0,calc(100% - 26px) 0,100% 50%,calc(100% - 26px) 100%,26px 100%,0 50%)!important;
    filter:drop-shadow(0 8px 16px #000b)!important;
  }
  body.cwmArsenalPlaying .fsUpgrade:before,body.cwmArsenalPlaying .fsUpgrade:after{
    content:"";position:absolute;top:50%;width:58px;height:1px;background:var(--cwm-accent);
    box-shadow:0 0 10px color-mix(in srgb,var(--cwm-accent) 60%,transparent);
  }
  body.cwmArsenalPlaying .fsUpgrade:before{left:7px}body.cwmArsenalPlaying .fsUpgrade:after{right:7px}
  body.cwmArsenalPlaying .fsUpgrade .u1{
    font-size:6px!important;letter-spacing:.3em!important;color:#95a9b8!important;line-height:1!important;
  }
  body.cwmArsenalPlaying .fsUpgrade .u2{
    font-size:clamp(17px,2vw,27px)!important;line-height:.96!important;margin-top:4px!important;
    white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-transform:uppercase!important;
  }
  body.cwmArsenalPlaying .fsUpgrade .u3{
    font-size:9px!important;line-height:1!important;margin-top:4px!important;color:var(--cwm-amber)!important;
    letter-spacing:.08em!important;
  }

  body.cwmArsenalPlaying .bossHud{top:58px!important;width:min(720px,60%)!important}
  body.cwmArsenalPlaying .directorStamp{top:48px!important;left:16px!important;font-size:7px!important}
  body.cwmArsenalPlaying .synergyBadge{top:48px!important;transform:scale(.68)!important}

  @media(max-width:920px){
    body.cwmArsenalPlaying .fsWeapon{width:40vw!important;grid-template-columns:70px minmax(0,1fr)!important;height:80px!important;padding-right:18px!important}
    body.cwmArsenalPlaying .fsWeapon canvas{width:70px!important;height:52px!important}
    body.cwmArsenalPlaying .fsWName{font-size:14px!important}
    body.cwmArsenalPlaying .fsMeta{display:none!important}
    body.cwmArsenalPlaying .fsVitals{width:29vw!important;height:80px!important;padding-left:21px!important}
    body.cwmArsenalPlaying .fsVRow{font-size:6px!important;grid-template-columns:24px 1fr 38px!important}
    body.cwmArsenalPlaying .fsZone{width:24vw!important;padding-left:10px!important;padding-right:10px!important}
    body.cwmArsenalPlaying .fsUpgrade{width:58vw!important;max-width:58vw!important}
  }
  `;
  document.head.appendChild(style);

  const name=document.getElementById('fsWName');
  const dps=document.getElementById('fsDps');
  const label=document.querySelector('.fsLabel');
  if(label)label.textContent='ARMAMENT // LIVE LOADOUT';

  function syncAccent(){
    let col=(name?.style?.color||dps?.style?.color||'').trim();
    if(!col)col='#8fefff';
    document.documentElement.style.setProperty('--cwm-accent',col);
  }
  const observer=new MutationObserver(syncAccent);
  if(name)observer.observe(name,{attributes:true,attributeFilter:['style'],childList:true,subtree:true});
  if(dps)observer.observe(dps,{attributes:true,attributeFilter:['style'],childList:true,subtree:true});
  syncAccent();
  const timer=setInterval(syncAccent,650);

  globalThis.CWM_ARSENAL_HUD_V15={version:'v15-concept-a',syncAccent,observer,timer};
})();
