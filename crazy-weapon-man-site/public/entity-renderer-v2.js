(()=>{
  if(globalThis.__CWM_V2_ENTITY_RENDERER)return;
  globalThis.__CWM_V2_ENTITY_RENDERER=true;
  const BUILD='v2-entities-sewer-alpha1';
  const SEWER=1;
  const prev=globalThis.__CWM_RENDER_HOOK||{};
  const INK='#090d14', INK2='#151b27', WHITE='#f7f5ff', SKIN='#f0cfca', HAIR='#f3edf8', HAIR_SH='#cfc7df';
  const GREEN='#92ff37', GREEN2='#45d33d', MAG='#ff45c8', CYAN='#62ecff', PURPLE='#9a45ff', GOLD='#ffd34e', ORANGE='#ff8a3d', RED='#ff4965';
  const SEWER_TYPES=new Set(['crawler','wizard','shieldbro','blinker','bombchicken']);

  function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
  function rr(X,x,y,w,h,r,fill,stroke=INK,lw=3){X.beginPath();X.roundRect(x,y,w,h,r);X.fillStyle=fill;X.fill();if(stroke){X.strokeStyle=stroke;X.lineWidth=lw;X.stroke()}}
  function ln(X,x1,y1,x2,y2,c=INK,w=4){X.beginPath();X.moveTo(x1,y1);X.lineTo(x2,y2);X.strokeStyle=c;X.lineWidth=w;X.lineCap='round';X.stroke()}
  function ellipse(X,x,y,rx,ry,fill,stroke=INK,lw=3,rot=0){X.beginPath();X.ellipse(x,y,rx,ry,rot,0,Math.PI*2);X.fillStyle=fill;X.fill();if(stroke){X.strokeStyle=stroke;X.lineWidth=lw;X.stroke()}}
  function poly(X,pts,fill,stroke=INK,lw=3){X.beginPath();X.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)X.lineTo(pts[i][0],pts[i][1]);X.closePath();X.fillStyle=fill;X.fill();if(stroke){X.strokeStyle=stroke;X.lineWidth=lw;X.stroke()}}
  function shadow(X,x,y,rx,ry,a=.34){X.save();X.globalAlpha=a;ellipse(X,x,y,rx,ry,'#000',null,0);X.restore()}
  function glow(X,c,b=14){X.shadowColor=c;X.shadowBlur=b}
  function eye(X,x,y,rx,ry,iris=MAG,pupil=INK){ellipse(X,x,y,rx,ry,WHITE,INK,2.5);ellipse(X,x+.7,y+.2,rx*.48,ry*.54,iris,null,0);ellipse(X,x+1.2,y+.1,rx*.18,ry*.28,pupil,null,0);ellipse(X,x-.6,y-1.3,rx*.12,ry*.14,'#fff',null,0)}
  function toothMouth(X,x,y,w,h,open=1){ellipse(X,x,y,w,h,INK,INK,2);X.fillStyle='#ff6f9b';X.beginPath();X.ellipse(x,y+h*.35,w*.58,h*.38,0,0,Math.PI);X.fill();X.fillStyle='#fff8dc';for(let i=-2;i<=2;i++){const tx=x+i*w*.27;poly(X,[[tx-2,y-h*.78],[tx+2,y-h*.78],[tx,y-h*.12]],'#fff8dc',null,0)}}
  function hazardStripe(X,x,y,w,h){X.save();X.beginPath();X.rect(x,y,w,h);X.clip();X.fillStyle='#f6b832';X.fillRect(x,y,w,h);X.strokeStyle='#181b24';X.lineWidth=6;for(let q=x-30;q<x+w+30;q+=18){X.beginPath();X.moveTo(q,y+h);X.lineTo(q+18,y);X.stroke()}X.restore()}
  function statusAura(X,e){
    const cx=0,cy=0;
    if(e.__cwmFire?.t>0){X.save();X.globalAlpha=.8;for(let i=0;i<4;i++){const a=i*1.7+performance.now()/280;X.fillStyle='#ff703f';poly(X,[[cx+Math.cos(a)*18,cy+12],[cx+Math.cos(a)*12-4,cy-4],[cx+Math.cos(a)*12+4,cy-4]],'#ff703f',null,0)}X.restore()}
    if(e.__cwmPoison?.t>0){X.save();X.globalAlpha=.72;for(let i=0;i<4;i++){const a=i*1.5+performance.now()/520;ellipse(X,Math.cos(a)*20,-5+Math.sin(a)*14,3+(i%2),3+(i%2),GREEN,null,0)}X.restore()}
  }
  function baseEnemyTransform(ctx,e,scale=1){
    const X=ctx.X;X.save();X.translate(e.x+e.w/2,e.y+e.h/2);
    const hit=clamp((e.hitT||0)/.22,0,1),dead=e.dead?1-clamp((e.death||0)/.38,0,1):0;
    if(e.dead){X.rotate((e.dir||1)*dead*.9);X.globalAlpha=1-dead*.8;X.scale(1,1-dead*.45)}else{X.scale((e.dir||1),1)}
    X.translate(-(e.hitDir||0)*hit*7,0);X.scale(scale*(1+hit*.11),scale*(1-hit*.10));
    return X;
  }
  function enemyAfter(X,e,col){
    statusAura(X,e);
    if(e.elite){X.save();X.globalAlpha=.72;X.strokeStyle=RED;X.lineWidth=2.5;X.shadowColor=RED;X.shadowBlur=10;X.beginPath();X.arc(0,0,Math.max(e.w,e.h)*.66,0,Math.PI*2);X.stroke();X.restore()}
    X.restore();
    if(e.elite||e.hp<e.max){X.fillStyle='#080b10';X.fillRect(e.x,e.y-12,e.w,6);X.fillStyle=e.elite?RED:col;X.fillRect(e.x,e.y-12,e.w*clamp(e.hp/e.max,0,1),6)}
  }

  function googly(ctx,e){
    const {X,time}=ctx;if(e.state==='spawn')return false;const s=e.elite?1.12:1;shadow(X,e.x+e.w/2,e.y+e.h-2,e.w*.48,7,.36);baseEnemyTransform(ctx,e,s);
    const bounce=Math.sin(time*7+(e.anim||0));X.translate(0,bounce*1.4);X.scale(1-bounce*.025,1+bounce*.025);
    glow(X,GREEN,12);ellipse(X,0,4,e.w*.52,e.h*.39,e.elite?'#79ea36':GREEN2,INK,4);X.shadowBlur=0;
    X.fillStyle='#bfff64';X.globalAlpha=.55;X.beginPath();X.ellipse(-7,-5,e.w*.23,e.h*.13,-.4,0,Math.PI*2);X.fill();X.globalAlpha=1;
    eye(X,-8,-7,7,8,'#b9ff45');eye(X,7,-8,6,7,MAG);
    toothMouth(X,1,8,8.7,6.8,1);
    X.fillStyle='#ff71ac';X.beginPath();X.ellipse(2,13,4,7,.15,0,Math.PI*2);X.fill();
    for(const dx of [-15,15,-5,6]){X.fillStyle=GREEN;X.beginPath();X.moveTo(dx-3,17);X.quadraticCurveTo(dx,29+(dx%3),dx+4,17);X.fill()}
    enemyAfter(X,e,GREEN);
    return true;
  }

  function splorker(ctx,e){
    const {X,time}=ctx;if(e.state==='spawn')return false;shadow(X,e.x+e.w/2,e.y+e.h-1,e.w*.46,7,.36);baseEnemyTransform(ctx,e,e.elite?1.08:1);
    const wind=e.state==='wind',cast=e.state==='cast',atk=wind||cast;
    ellipse(X,-2,7,20,24,e.elite?'#53624d':'#4c5c46',INK,4,.05);ellipse(X,-13,25,10,6,'#2f3932',INK,3);ellipse(X,11,25,10,6,'#2f3932',INK,3);
    glow(X,GREEN,10);rr(X,-20,-25,19,31,7,'#4c5d65',INK,4);rr(X,-16,-21,11,22,5,GREEN,INK,2);X.shadowBlur=0;X.globalAlpha=.55;X.fillStyle='#e5ff98';X.fillRect(-13,-18,3,14);X.globalAlpha=1;
    ellipse(X,6,-13,17,15,'#7a7b63',INK,4);poly(X,[[14,-20],[22,-25],[18,-15]],'#9ca46b',INK,2);eye(X,9,-16,5,5,GREEN);eye(X,17,-13,4,4,'#ff8d36');
    const kick=atk?Math.sin(time*18)*2:0;X.save();X.translate(20+kick,-2);glow(X,MAG,atk?16:5);ellipse(X,0,0,14,12,'#5d3157',INK,4);ellipse(X,3,0,9,7,INK,'#f66bd1',2);if(atk){X.globalAlpha=.72;ellipse(X,16+Math.sin(time*22)*4,0,6,6,GREEN,null,0)}X.restore();X.shadowBlur=0;
    ln(X,-2,-2,14,3,'#5b5148',7);
    enemyAfter(X,e,GREEN);
    return true;
  }

  function blockjaw(ctx,e){
    const {X,time}=ctx;if(e.state==='spawn')return false;shadow(X,e.x+e.w/2,e.y+e.h-1,e.w*.55,8,.4);baseEnemyTransform(ctx,e,e.elite?1.08:1);
    const wind=e.state==='wind'||e.state==='lunge';
    rr(X,-22,20,16,17,6,'#303745',INK,4);rr(X,7,20,16,17,6,'#303745',INK,4);
    glow(X,PURPLE,wind?12:4);rr(X,-28,-26,52,53,10,'#363e50',INK,5);X.shadowBlur=0;rr(X,-21,-20,37,21,7,'#4d586c',INK,3);hazardStripe(X,-18,-17,30,8);
    rr(X,-12,-12,24,10,4,'#121722',INK,2);X.fillStyle=wind?RED:MAG;X.shadowColor=wind?RED:MAG;X.shadowBlur=10;X.fillRect(3,-9,6,4);X.shadowBlur=0;
    poly(X,[[-17,2],[15,2],[21,13],[9,20],[-14,18],[-22,11]],'#272e3b',INK,4);X.fillStyle='#d8d0b8';for(let i=-10;i<=8;i+=6)poly(X,[[i,5],[i+4,5],[i+2,11]],'#e8ddc7',null,0);
    X.save();X.translate(30,0);glow(X,ORANGE,wind?14:4);rr(X,-7,-31,26,60,7,'#454e5f',INK,5);hazardStripe(X,-3,-23,17,10);X.fillStyle='#d36a3e';X.beginPath();X.arc(7,14,5,0,Math.PI*2);X.fill();X.restore();X.shadowBlur=0;
    rr(X,-39,-10,15,26,6,'#454e5f',INK,4);
    if(wind){X.save();X.globalAlpha=.6;X.strokeStyle=ORANGE;X.lineWidth=6;X.shadowColor=ORANGE;X.shadowBlur=10;X.beginPath();X.arc(24,2,38,-1.1,1.1);X.stroke();X.restore()}
    enemyAfter(X,e,ORANGE);
    return true;
  }

  function glitchIntern(ctx,e){
    const {X,time}=ctx;if(e.state==='spawn')return false;shadow(X,e.x+e.w/2,e.y+e.h-2,e.w*.40,6,.24);baseEnemyTransform(ctx,e,e.elite?1.08:1);
    const teleport=e.state==='blinkwind',attack=e.state==='lunge';
    X.save();for(let i=0;i<3;i++){X.globalAlpha=.16/(i+1);X.fillStyle=i%2?MAG:CYAN;X.fillRect(-24-i*6+(Math.sin(time*18+i)*4),-22+i*7,48+i*8,5)}X.restore();
    glow(X,PURPLE,15);ellipse(X,0,0,20,20,'#171424',INK,4);X.shadowBlur=0;
    X.strokeStyle=MAG;X.lineWidth=4;X.beginPath();X.arc(0,0,25,time*2,time*2+4.7);X.stroke();X.strokeStyle=CYAN;X.lineWidth=2;X.beginPath();X.arc(0,0,31,-time*2,-time*2+3.9);X.stroke();
    eye(X,-6,-2,5,7,teleport?CYAN:MAG);eye(X,7,0,5,6,attack?RED:GREEN);toothMouth(X,1,10,8,5.5,1);
    ln(X,-15,10,-24,20,'#33294b',6);ln(X,15,10,24,18,'#33294b',6);
    if(teleport){X.save();X.globalAlpha=.6;for(let i=0;i<4;i++){X.fillStyle=i%2?MAG:CYAN;X.fillRect(-38+i*15,-30+i*8,16,4)}X.restore()}
    enemyAfter(X,e,PURPLE);
    return true;
  }

  function bombChicken(ctx,e){
    const {X,time}=ctx;if(e.state==='spawn')return false;shadow(X,e.x+e.w/2,e.y+e.h-1,e.w*.45,6,.32);baseEnemyTransform(ctx,e,e.elite?1.08:1);
    const armed=e.state==='bomb';
    ellipse(X,-3,4,19,17,'#77825c',INK,4,-.1);X.fillStyle='#9dad6b';X.globalAlpha=.55;X.beginPath();X.ellipse(-8,-1,9,6,-.3,0,Math.PI*2);X.fill();X.globalAlpha=1;
    ellipse(X,10,-11,10,10,'#b7b276',INK,3);poly(X,[[18,-11],[31,-7],[18,-3]],ORANGE,INK,2);poly(X,[[5,-20],[10,-29],[13,-19],[17,-27],[18,-16]],RED,INK,2);eye(X,12,-13,4,4,armed?RED:MAG);
    ln(X,-8,18,-12,29,'#9c713e',3);ln(X,6,18,10,29,'#9c713e',3);ln(X,-17,29,-7,29,ORANGE,3);ln(X,5,29,16,29,ORANGE,3);
    X.save();X.translate(-20,-8);glow(X,armed?RED:GREEN,armed?14:6);ellipse(X,0,0,11,14,'#303945',INK,4);rr(X,-5,-18,10,7,2,'#717c88',INK,2);X.fillStyle=armed?(Math.floor(time*14)%2?RED:GOLD):GREEN;X.beginPath();X.arc(0,0,4,0,Math.PI*2);X.fill();X.restore();X.shadowBlur=0;
    if(armed){X.save();X.globalAlpha=.5+.3*Math.sin(time*18);X.strokeStyle=RED;X.lineWidth=4;X.beginPath();X.arc(-20,-8,20+Math.sin(time*10)*4,0,Math.PI*2);X.stroke();X.restore()}
    enemyAfter(X,e,armed?RED:GREEN);
    return true;
  }

  function drawEnemy(ctx){
    if(ctx.zoneI!==SEWER||!ctx.e||ctx.e.boss||!SEWER_TYPES.has(ctx.e.type))return typeof prev.drawEnemy==='function'?prev.drawEnemy(ctx):false;
    try{
      let ok=false;
      if(ctx.e.type==='crawler')ok=googly(ctx,ctx.e);
      else if(ctx.e.type==='wizard')ok=splorker(ctx,ctx.e);
      else if(ctx.e.type==='shieldbro')ok=blockjaw(ctx,ctx.e);
      else if(ctx.e.type==='blinker')ok=glitchIntern(ctx,ctx.e);
      else if(ctx.e.type==='bombchicken')ok=bombChicken(ctx,ctx.e);
      if(ok)globalThis.__CWM_V2_ENTITY_LAST={kind:'enemy',type:ctx.e.type,zone:ctx.zoneI,at:Date.now()};
      return ok;
    }catch(err){console.warn('v2 enemy render failed',ctx.e?.type,err);return false}
  }

  function hair(X,scale,mad,time){
    X.save();X.scale(scale,scale);X.fillStyle=HAIR_SH;poly(X,[[-15,-4],[-24,-16],[-13,-13],[-19,-28],[-7,-20],[-3,-35],[3,-21],[12,-32],[11,-17],[24,-22],[16,-8],[25,-5],[13,0],[-14,0]],HAIR_SH,INK,3);X.fillStyle=HAIR;poly(X,[[-13,-5],[-21,-15],[-10,-12],[-15,-25],[-5,-18],[-1,-31],[5,-18],[13,-27],[12,-15],[22,-18],[14,-6],[21,-4],[11,0],[-12,0]],HAIR,INK,2);if(mad>.25){X.globalAlpha=.35+.35*mad;X.fillStyle=mad>.72?MAG:GREEN;for(let i=0;i<3;i++){const x=-9+i*9;poly(X,[[x,-8],[x+3,-21-mad*12-Math.sin(time*8+i)*3],[x+6,-8]],X.fillStyle,null,0)}}X.restore()
  }
  function playerWeapon(X,w,atk,rar,time){
    const col=w?.element?.col||w?.col||GREEN;const type=w?.type||'sword';const sc=1+Math.min(.55,rar*.045);glow(X,col,10+rar*1.2);
    if(type==='hammer'){
      ln(X,-4,0,35*sc,0,'#6c5141',7);rr(X,25*sc,-16,34*sc,31,6,'#343b49',INK,4);hazardStripe(X,30*sc,-10,23*sc,8);
    }else if(type==='bow'){
      X.strokeStyle=col;X.lineWidth=5;X.beginPath();X.arc(24,0,28*sc,-1.2,1.2);X.stroke();ln(X,31,-26,31,26,'#f2e9cf',2);ln(X,5,0,48,0,'#d9f8ff',3);
    }else if(type==='staff'||type==='wand'){
      ln(X,-2,10,48*sc,-24*sc,'#685147',7);glow(X,col,18);ellipse(X,50*sc,-26*sc,10+rar,col,INK,3);X.shadowBlur=0;
    }else if(type==='shuriken'){
      X.save();X.translate(30,0);X.rotate(time*12);for(let i=0;i<4;i++){X.rotate(Math.PI/2);poly(X,[[0,0],[19*sc,0],[7*sc,7*sc]],col,INK,2)}ellipse(X,0,0,4,4,WHITE,INK,1);X.restore();
    }else if(type==='nunchucks'){
      ln(X,0,0,28*sc,0,col,7);ln(X,28*sc,0,42*sc,12+Math.sin(time*14)*8,'#d9dde6',2);ln(X,42*sc,12+Math.sin(time*14)*8,64*sc,17,col,7);
    }else{
      const kat=type==='katana',dag=type==='dagger';const len=(dag?38:kat?74:68)*sc;ln(X,-5,0,12,0,'#6e4f39',6);if(kat)ln(X,6,-8,6,8,GOLD,4);X.strokeStyle=col;X.lineWidth=dag?7:9;X.beginPath();X.moveTo(10,0);if(kat)X.quadraticCurveTo(len*.65,-6,len,-13);else X.lineTo(len,0);X.stroke();X.strokeStyle=WHITE;X.lineWidth=2;X.beginPath();X.moveTo(16,-2);if(kat)X.quadraticCurveTo(len*.65,-8,len-4,-14);else X.lineTo(len-3,-2);X.stroke();
    }
    X.shadowBlur=0;
  }

  function drawPlayer(ctx){
    const {X,pl,time,w,dps,rarity}=ctx;if(!pl)return false;
    try{
      const rar=Number(rarity)||0,atk=(pl.at||0)>0?1-clamp((pl.at||0)/Math.max(.01,pl.atMax||.2),0,1):0;
      const run=pl.on?Math.min(1,Math.abs(pl.vx||0)/220):0,bob=Math.abs(Math.sin(time*12))*2*run;
      const mad=clamp((Math.log10(Math.max(10,Number(dps)||10))-1.45)/2.55,0,1);const hscale=1+mad*.58;
      shadow(X,pl.x+pl.w/2,pl.y+pl.h+2,22+mad*5,6,.34);
      X.save();X.translate(pl.x+pl.w/2,pl.y+pl.h/2+bob);X.scale((pl.dir||1)*1.02,1.02);if(pl.inv>0&&Math.floor(time*18)%2===0)X.globalAlpha=.52;
      X.save();X.translate(-13,-4);glow(X,GREEN,8);rr(X,-10,-23,14,29,6,'#303a47',INK,3);rr(X,-7,-19,8,20,4,GREEN,INK,2);X.shadowBlur=0;X.restore();
      const stride=Math.sin(time*12)*(run*8);ln(X,-7,8,-9+stride*.35,23,'#252a36',7);ln(X,7,8,9-stride*.35,23,'#252a36',7);rr(X,-18+stride*.25,19,16,10,4,'#242a34',INK,3);rr(X,3-stride*.25,19,16,10,4,'#242a34',INK,3);X.fillStyle=GREEN;X.fillRect(-16+stride*.25,24,12,3);X.fillRect(5-stride*.25,24,12,3);
      rr(X,-13,-13,26,28,8,'#202532',INK,4);X.fillStyle='#343b49';X.fillRect(-7,-10,14,20);X.strokeStyle=GREEN;X.lineWidth=2;X.beginPath();X.moveTo(-8,-10);X.lineTo(-3,10);X.moveTo(8,-10);X.lineTo(3,10);X.stroke();rr(X,-18,-11,7,11,3,'#2e3542',INK,2);rr(X,11,-11,7,11,3,'#2e3542',INK,2);ln(X,-6,-6,-15,5,SKIN,6);
      X.save();X.translate(0,-25);X.rotate(mad*.035*Math.sin(time*8));X.scale(hscale,hscale);ellipse(X,0,1,11,11,SKIN,INK,3);hair(X,1,mad,time);const wild=mad*.85;eye(X,-4,-1,3.2+wild,4+wild,MAG);eye(X,4.5,0,3.1+wild*.8,3.8+wild,GREEN);ln(X,-8,-7,-2,-8-wild*2,INK,2);ln(X,2,-7,8,-6-wild,INK,2);toothMouth(X,1,6,5.7+mad*4,3.7+mad*3,1);if(mad>.45){X.fillStyle='#ff6fa4';X.beginPath();X.ellipse(1,10,3+mad*2,2.4+mad*1.2,.1,0,Math.PI*2);X.fill()}X.restore();
      let ang=.05;if(atk){const t=w?.type;if(t==='hammer')ang=-2.05+atk*2.9;else if(t==='katana'||t==='sword')ang=-2.0+atk*3.15;else if(t==='nunchucks')ang=-1.4+atk*4.8;else ang=-.55+atk*.9}const ax=11+Math.cos(ang)*10,ay=-5+Math.sin(ang)*10;ln(X,7,-5,ax,ay,SKIN,6);X.save();X.translate(ax,ay);X.rotate(ang);playerWeapon(X,w,atk,rar,time);X.restore();
      if(w?.element){X.save();X.globalAlpha=.18+.08*Math.sin(time*9);X.strokeStyle=w.element.col;X.lineWidth=2.5;X.shadowColor=w.element.col;X.shadowBlur=12;X.beginPath();X.arc(0,-8,28+mad*10+Math.sin(time*6)*2,0,Math.PI*2);X.stroke();X.restore()}
      if(mad>.2){X.save();X.globalAlpha=.12+.18*mad;X.strokeStyle=mad>.72?MAG:GREEN;X.lineWidth=3;for(let i=0;i<2+Math.floor(mad*3);i++){X.beginPath();X.arc(0,-17,29+i*8,time*(.5+i*.06),time*(.5+i*.06)+4.2);X.stroke()}X.restore()}
      X.restore();globalThis.__CWM_V2_ENTITY_LAST={kind:'player',zone:ctx.zoneI,at:Date.now(),mad};return true;
    }catch(err){console.warn('v2 player render failed',err);return false}
  }

  globalThis.__CWM_RENDER_HOOK={...prev,drawEnemy,drawPlayer};
  globalThis.CWM_V2_ENTITIES={build:BUILD,sewerTypes:[...SEWER_TYPES],player:true};
  console.info('CWM v2 entity renderer armed',globalThis.CWM_V2_ENTITIES);
})();