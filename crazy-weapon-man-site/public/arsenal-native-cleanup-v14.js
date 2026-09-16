(()=>{
  if(globalThis.__CWM_ARSENAL_NATIVE_CLEANUP)return;
  globalThis.__CWM_ARSENAL_NATIVE_CLEANUP=true;

  // Remove old mascot/placeholder theming while keeping the underlying enemy mechanic.
  try{
    const scrap=ENEMY_TRAITS.find(t=>t.id==='rabbitlauncher');
    if(scrap){scrap.name='Scrap Launcher';scrap.tag='SCRAP DEPLOYED';scrap.desc='fires unstable municipal scrap charges that bounce across the floor'}
  }catch(_){ }

  // Keep combat text useful. Pickup rarity and leaderboard fanfare already have dedicated UI.
  if(typeof txt==='function'){
    const baseTxt=txt;
    txt=function(x,y,s,col,big=false){
      let label=String(s??'');
      if(/^(NEW LOCAL DPS RECORD!|NEW PERSONAL DPS BEST!|NEW GLOBAL DPS RECORD!)$/i.test(label))return;
      if(/^(COMMON|UNCOMMON|RARE|SUPER RARE|EPIC|HEROIC|LEGENDARY|MYTHIC|ULTRA MYTHIC|EXOTIC|ULTRA EXOTIC|RELIC|ANCIENT|TRANSCENDENT|UNHEARD OF|SUPER ULTRA RARE|FORBIDDEN|IMPOSSIBLE|CATACLYSMIC|WHAT\?!)!$/i.test(label))return;
      label=label.replace(/RABBIT IMPACT/gi,'SCRAP IMPACT').replace(/BIOHAZARD BUNNY/gi,'BIOHAZARD SCRAP');
      return baseTxt(x,y,label,col,big);
    };
  }

  if(typeof enemyCombo==='function'){
    const baseCombo=enemyCombo;
    enemyCombo=function(e){const r=baseCombo(e);if(r?.name==='BIOHAZARD BUNNY')return {...r,name:'BIOHAZARD SCRAP'};return r};
  }

  // Retire the giant smiley placeholder. Preserve platform geometry and gameplay.
  try{
    if(Z?.[0]){Z[0].bg='none';Z[0].a='#07111f';Z[0].b='#1a3048';Z[0].h='#6ee8ff'}
  }catch(_){ }

  if(typeof drawBg==='function'){
    const baseBg=drawBg;
    drawBg=function(){
      const r=baseBg();
      if(zoneI!==0)return r;
      X.save();
      // Distant municipal skyline.
      X.globalAlpha=.28;X.fillStyle='#07101c';
      const blocks=[[30,190,110,230],[155,145,85,275],[255,220,150,200],[430,125,115,295],[565,175,90,245],[680,110,155,310],[850,190,105,230],[970,135,130,285],[1115,205,120,215]];
      for(const [x,y,w,h] of blocks){X.fillRect(x,y,w,h);X.fillStyle='#8adfff';X.globalAlpha=.10;for(let wx=x+14;wx<x+w-10;wx+=24)for(let wy=y+18;wy<Math.min(G-25,y+h);wy+=34)if(((wx+wy)>>3)%3===0)X.fillRect(wx,wy,7,4);X.fillStyle='#07101c';X.globalAlpha=.28}
      // Parking-deck bands and fencing.
      X.globalAlpha=.16;X.fillStyle='#a8bdd0';for(let y=290;y<470;y+=54)X.fillRect(0,y,W,5);
      X.strokeStyle='#7ad9ef';X.lineWidth=1;X.globalAlpha=.14;for(let x=0;x<W;x+=30){X.beginPath();X.moveTo(x,330);X.lineTo(x+70,480);X.stroke()}
      // Sodium lamps with restrained pools of light.
      for(const x of [170,640,1110]){
        X.globalAlpha=.34;X.fillStyle='#1c2732';X.fillRect(x-3,185,6,310);X.fillRect(x-3,185,55,5);
        const g=X.createRadialGradient(x+48,205,3,x+48,205,120);g.addColorStop(0,'rgba(255,214,125,.23)');g.addColorStop(1,'rgba(255,214,125,0)');X.fillStyle=g;X.beginPath();X.arc(x+48,205,120,0,Math.PI*2);X.fill();
      }
      X.globalAlpha=.65;X.fillStyle='#75eaff';X.font='900 15px system-ui';X.fillText('MUNICIPAL SWORD PARKING',36,92);X.globalAlpha=.30;X.font='800 11px system-ui';X.fillText('WEAPON VALIDATION • LEVEL P1',38,111);
      X.restore();
      return r;
    };
  }

  globalThis.CWM_ARSENAL_NATIVE_CLEANUP={version:'v1.4a'};
})();
