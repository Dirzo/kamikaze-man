(()=>{
  if(globalThis.__CWM_SPRITE_INTEGRATION_V5)return;
  globalThis.__CWM_SPRITE_INTEGRATION_V5=true;
  const BUILD='v5-integrated-cast-weapons-20260914a';
  const SEWER=1;
  const H={crawler:58,wizard:78,shieldbro:94,blinker:62,bombchicken:70};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function ellipse(X,x,y,rx,ry){X.moveTo(x+rx,y);X.ellipse(x,y,Math.max(2,rx),Math.max(2,ry),0,0,Math.PI*2)}
  function rr(X,x,y,w,h,r){X.roundRect(x,y,w,h,r)}
  function stateEnemy(e){
    const hit=(e.hitT||0)>.025;
    if(e.type==='crawler')return e.dead?'death':hit?'hit':Math.abs(e.vx||0)>18?'move':'idle';
    if(e.type==='wizard')return e.dead?'death':hit?'hit':e.state==='cast'?'cast':e.state==='wind'?'wind':'idle';
    if(e.type==='shieldbro')return e.dead?'death':hit?'hit':(e.state==='wind'||e.state==='lunge'||e.state==='bash')?'attack':Math.abs(e.vx||0)>18?'move':'idle';
    if(e.type==='blinker')return e.dead?'death':hit?'hit':e.state==='blinkwind'?'teleport':(e.state==='lunge'||e.state==='attack')?'attack':'idle';
    if(e.type==='bombchicken')return e.dead?'death':hit?'hit':(e.state==='bomb'||e.state==='attack')?'attack':Math.abs(e.vx||0)>18?'move':'idle';
    return'idle';
  }
  function generousEnemyMask(X,e,bh){
    const cx=e.x+e.w/2,bt=e.y+e.h+2,dir=e.dir||1,s=stateEnemy(e);
    X.beginPath();
    if(e.type==='crawler'){
      ellipse(X,cx,bt-bh*.34,bh*.82,bh*.47);
      rr(X,cx-bh*.80,bt-bh*.40,bh*1.60,bh*.43,bh*.18);
    }else if(e.type==='wizard'){
      ellipse(X,cx-dir*bh*.10,bt-bh*.50,bh*.66,bh*.56);
      ellipse(X,cx+dir*bh*.52,bt-bh*.48,bh*.48,bh*.38);
      ellipse(X,cx-dir*bh*.40,bt-bh*.70,bh*.34,bh*.31);
      if(s==='cast')rr(X,cx-dir*bh*.15,bt-bh*.78,bh*1.48,bh*.70,bh*.20);
    }else if(e.type==='shieldbro'){
      ellipse(X,cx+dir*bh*.05,bt-bh*.50,bh*.62,bh*.57);
      ellipse(X,cx-dir*bh*.48,bt-bh*.48,bh*.38,bh*.49);
      rr(X,cx-bh*.76,bt-bh*.92,bh*1.53,bh*.82,bh*.18);
    }else if(e.type==='blinker'){
      ellipse(X,cx,bt-bh*.51,bh*.63,bh*.60);
      rr(X,cx-dir*bh*.67,bt-bh*.79,bh*1.35,bh*.56,bh*.18);
      if(s==='teleport'||s==='attack')ellipse(X,cx-dir*bh*.38,bt-bh*.52,bh*.42,bh*.34);
    }else if(e.type==='bombchicken'){
      ellipse(X,cx-dir*bh*.06,bt-bh*.44,bh*.59,bh*.50);
      ellipse(X,cx+dir*bh*.28,bt-bh*.76,bh*.35,bh*.31);
      rr(X,cx-bh*.63,bt-bh*.86,bh*1.32,bh*.78,bh*.20);
      if(s==='attack')rr(X,cx-dir*bh*.15,bt-bh*.66,bh*1.20,bh*.52,bh*.16);
    }else return false;
    rr(X,e.x-18,e.y-20,e.w+36,20,6);
    X.clip();return true;
  }

  function playerState(p){
    if(p.hp<=0)return'death';
    if((p.at||0)>0){if(!p.on)return'attack_air';return(Math.floor(performance.now()/120)&1)?'attack_ground_b':'attack_ground_a'}
    if((p.dashT||0)>0)return'run';
    if(!p.on)return(p.vy||0)<0?'jump_rise':'fall';
    if(Math.abs(p.vx||0)>45)return'run';
    if((p.inv||0)>.12&&(p.hp||0)<(p.max||1)*.98)return'hit';
    return'idle';
  }
  function frenzyScale(d){d=Math.max(1,Number(d)||1);if(d<1000)return 1;return 1+Math.min(4,Math.max(0,Math.floor(Math.log10(d))-2))*.045}
  const SOCKET={
    idle:{x:.21,y:.46,a:-.08,s:.78},run:{x:.19,y:.46,a:.02,s:.78},jump_rise:{x:.20,y:.46,a:-.14,s:.74},fall:{x:.21,y:.47,a:.08,s:.72},land:{x:.24,y:.42,a:-.12,s:.78},
    attack_ground_a:{x:.33,y:.47,a:-.38,s:1.00},attack_ground_b:{x:.34,y:.44,a:.31,s:1.02},attack_air:{x:.27,y:.48,a:-.50,s:.94},skill:{x:.31,y:.46,a:-.03,s:1.06},hit:{x:.17,y:.47,a:.18,s:.68},death:{x:.14,y:.24,a:.30,s:.62},victory:{x:.20,y:.49,a:-.56,s:.80}
  };
  function rarityColor(w){return w?.element?.col||w?.col||({Training:'#dce7f2',Common:'#dce7f2',Uncommon:'#77e58a',Rare:'#6ec7ff',Epic:'#b376ff',Legendary:'#ffd44d'}[w?.rarity]||'#ff65d6')}
  function line(X,x1,y1,x2,y2,col,w){X.strokeStyle=col;X.lineWidth=w;X.lineCap='round';X.beginPath();X.moveTo(x1,y1);X.lineTo(x2,y2);X.stroke()}
  function star(X,r1,r2,n=4){X.beginPath();for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i%2?r2:r1,x=Math.cos(a)*r,y=Math.sin(a)*r;i?X.lineTo(x,y):X.moveTo(x,y)}X.closePath()}
  function weapon(X,w,key,cx,bt,th,dir){
    if(!w)return;
    const s=SOCKET[key]||SOCKET.idle,col=rarityColor(w),ink='#0a0d16',type=w.type||'sword';
    const px=cx+dir*th*s.x,py=bt-th*s.y,sc=th*s.s/82;
    X.save();X.translate(px,py);if(dir<0)X.scale(-1,1);X.rotate(s.a);X.shadowColor=col;X.shadowBlur=(key.startsWith('attack')||key==='skill')?18:9;X.lineJoin='round';X.lineCap='round';
    if(type==='sword'||type==='katana'||type==='dagger'){
      const L=(type==='dagger'?43:type==='katana'?76:66)*sc,B=(type==='dagger'?7:10)*sc;
      X.strokeStyle=ink;X.lineWidth=5*sc;X.fillStyle='#e8fbff';X.beginPath();X.moveTo(0,-B*.48);X.lineTo(L,-B*.25);X.lineTo(L+12*sc,0);X.lineTo(L,B*.25);X.lineTo(0,B*.48);X.closePath();X.fill();X.stroke();
      X.fillStyle=col;X.fillRect(-8*sc,-12*sc,11*sc,24*sc);X.strokeRect(-8*sc,-12*sc,11*sc,24*sc);line(X,-10*sc,0,-24*sc,0,ink,8*sc);
    }else if(type==='hammer'){
      line(X,-18*sc,20*sc,34*sc,-28*sc,ink,10*sc);line(X,-18*sc,20*sc,34*sc,-28*sc,'#805f45',5*sc);X.translate(34*sc,-28*sc);X.rotate(.12);X.strokeStyle=ink;X.lineWidth=5*sc;X.fillStyle=col;X.beginPath();X.roundRect(-24*sc,-19*sc,48*sc,38*sc,8*sc);X.fill();X.stroke();
    }else if(type==='bow'){
      X.strokeStyle=col;X.lineWidth=6*sc;X.beginPath();X.arc(15*sc,0,39*sc,-1.12,1.12);X.stroke();line(X,32*sc,-35*sc,32*sc,35*sc,'#f1fbff',2*sc);line(X,31*sc,0,78*sc,0,col,3*sc);
    }else if(type==='staff'||type==='wand'){
      const L=(type==='wand'?45:74)*sc;line(X,-12*sc,18*sc,L,-16*sc,ink,9*sc);line(X,-12*sc,18*sc,L,-16*sc,'#684a70',5*sc);X.translate(L,-16*sc);X.fillStyle=col;X.strokeStyle=ink;X.lineWidth=4*sc;X.beginPath();X.arc(0,0,(type==='wand'?10:15)*sc,0,Math.PI*2);X.fill();X.stroke();
    }else if(type==='nunchucks'){
      line(X,-18*sc,-12*sc,0,4*sc,col,9*sc);line(X,30*sc,18*sc,50*sc,34*sc,col,9*sc);X.strokeStyle='#e7edf7';X.lineWidth=2*sc;X.setLineDash([4*sc,4*sc]);X.beginPath();X.moveTo(0,4*sc);X.quadraticCurveTo(21*sc,4*sc,30*sc,18*sc);X.stroke();X.setLineDash([]);
    }else if(type==='shuriken'){
      X.fillStyle=col;X.strokeStyle=ink;X.lineWidth=4*sc;for(let i=0;i<3;i++){X.save();X.translate(i*20*sc,(i-1)*9*sc);X.rotate(performance.now()/230+i*.8);star(X,13*sc,4*sc,4);X.fill();X.stroke();X.restore()}
    }else{
      X.fillStyle=col;X.strokeStyle=ink;X.lineWidth=4*sc;X.beginPath();X.roundRect(-8*sc,-8*sc,58*sc,16*sc,5*sc);X.fill();X.stroke();
    }
    X.fillStyle='#151b29';X.strokeStyle='#0a0d16';X.lineWidth=3*sc;X.beginPath();X.arc(0,0,7*sc,0,Math.PI*2);X.fill();X.stroke();
    X.restore();
  }
  function attackArc(X,key,cx,bt,th,dir,col){
    if(!key.startsWith('attack')&&key!=='skill')return;
    X.save();X.globalAlpha=key==='skill'?.24:.16;X.strokeStyle=col;X.lineWidth=8;X.shadowColor=col;X.shadowBlur=18;X.beginPath();X.arc(cx+dir*th*.33,bt-th*.45,th*(key==='skill'?.66:.50),dir>0?-1.15:Math.PI+.15,dir>0?.85:Math.PI-.85,dir<0);X.stroke();X.restore();
  }
  function groundLight(X,cx,bt,w,alpha=.10){X.save();const g=X.createRadialGradient(cx,bt-2,2,cx,bt-2,w);g.addColorStop(0,'rgba(158,255,70,.88)');g.addColorStop(.45,'rgba(90,230,55,.30)');g.addColorStop(1,'rgba(0,0,0,0)');X.globalAlpha=alpha;X.fillStyle=g;X.fillRect(cx-w,bt-w*.3,w*2,w*.6);X.restore()}
  function shadow(X,cx,bt,w,a=.23){X.save();X.globalAlpha=a;X.filter='blur(1.5px)';X.fillStyle='#02040a';X.beginPath();X.ellipse(cx,bt+1,w*.42,Math.max(3,w*.075),0,0,Math.PI*2);X.fill();X.restore()}

  function install(){
    const current=globalThis.__CWM_RENDER_HOOK||{};
    if(!current.drawPlayer||!current.drawEnemy){setTimeout(install,50);return}
    if(current.__cwmIntegrationV5)return;
    const prev=current;
    function drawEnemy(ctx){
      const e=ctx.e;
      if(ctx.zoneI!==SEWER||!e||e.boss||!H[e.type])return typeof prev.drawEnemy==='function'?prev.drawEnemy(ctx):false;
      const X=ctx.X,bh=H[e.type]*(e.elite?1.15:1),cx=e.x+e.w/2,bt=e.y+e.h+2;
      groundLight(X,cx,bt,bh*.84,e.type==='blinker'?.06:.09);shadow(X,cx,bt,bh*.76,e.type==='blinker'?.15:.22);
      X.save();generousEnemyMask(X,e,bh);const handled=prev.drawEnemy(ctx);X.restore();return handled;
    }
    function drawPlayer(ctx){
      if(!ctx.pl)return typeof prev.drawPlayer==='function'?prev.drawPlayer(ctx):false;
      const X=ctx.X,p=ctx.pl,key=playerState(p),th=90*frenzyScale(ctx.dps),cx=p.x+p.w/2,bt=p.y+p.h+2,dir=p.dir||1,col=rarityColor(ctx.w);
      groundLight(X,cx,bt,th*.80,.09);shadow(X,cx,bt,th*.69,.24);
      const handled=prev.drawPlayer(ctx);
      weapon(X,ctx.w,key,cx,bt,th,dir);attackArc(X,key,cx,bt,th,dir,col);
      return handled;
    }
    globalThis.__CWM_RENDER_HOOK={...prev,__cwmIntegrationV5:true,drawEnemy,drawPlayer};
    globalThis.CWM_V2_INTEGRATION={build:BUILD,playerClip:false,enemyClip:'generous-per-type',weaponSockets:true,grounding:true,zone:'Disco Sewer of Compliance'};
    console.info('CWM v5 cast integration installed',globalThis.CWM_V2_INTEGRATION);
  }
  install();
})();
