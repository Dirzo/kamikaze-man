(()=>{
  if(globalThis.__CWM_ARSENAL_VISUAL_V14)return;
  globalThis.__CWM_ARSENAL_VISUAL_V14=true;
  const state={draws:0,elementDraws:0,modelDraws:0,lastElement:'',lastModel:''};
  const NEW=new Set(['ice','plasma','void','wind','radiant','whiteout','meltdown','singularity','blowback','solar-flare']);

  function modelAccent(w,x,y){
    const m=w?.__arsenalModel?.name||'';
    if(!m||typeof X==='undefined')return;
    state.modelDraws++;state.lastModel=m;
    const col=w.element?.col||w.col||'#fff';
    X.save();X.translate(x,y);X.strokeStyle=col;X.fillStyle=col;X.globalAlpha=.62;X.shadowColor=col;X.shadowBlur=10;X.lineWidth=2;
    if(/Greatsword|Nodachi|Longbow|Siege Bow|Utility Pole|Pile Driver|Siege Hammer/.test(m)){
      X.beginPath();X.moveTo(-22,0);X.lineTo(28,0);X.stroke();X.fillRect(22,-4,10,8);
    }else if(/Saber|Needle|Stiletto|Quarterly Cutter|Spark Baton/.test(m)){
      X.beginPath();X.moveTo(-12,0);X.lineTo(30,0);X.stroke();X.beginPath();X.arc(30,0,2.5,0,Math.PI*2);X.fill();
    }else if(/Saw|Disc|Shuriken|Star|Complaint/.test(m)){
      for(let i=0;i<6;i++){X.rotate(Math.PI/3);X.beginPath();X.moveTo(12,0);X.lineTo(24,0);X.stroke()}
    }else if(/Staff|Scepter|Wand|Rod|Pole|Rebar/.test(m)){
      X.beginPath();X.arc(18,0,9,0,Math.PI*2);X.stroke();X.beginPath();X.arc(18,0,3,0,Math.PI*2);X.fill();
    }else if(/Hammer|Maul|Crusher|Bonk|Opinion|Driver/.test(m)){
      X.fillRect(12,-8,22,16);X.clearRect(16,-4,14,8);X.strokeRect(12,-8,22,16);
    }else if(/Nunchucks|Bonk|Yo-Yo|Necklace|Chain/.test(m)){
      X.beginPath();X.moveTo(-6,-5);X.lineTo(10,5);X.lineTo(25,-4);X.stroke();X.beginPath();X.arc(27,-5,4,0,Math.PI*2);X.fill();
    }
    X.restore();
  }

  function elementAura(w,x,y){
    const e=w?.element;if(!e||!NEW.has(e.id)||typeof X==='undefined')return;
    state.elementDraws++;state.lastElement=e.id;
    const t=typeof time==='number'?time:performance.now()/1000;
    X.save();X.translate(x,y);X.strokeStyle=e.col;X.fillStyle=e.col;X.shadowColor=e.col;X.shadowBlur=18;X.lineWidth=2;X.globalAlpha=e.polarity==='negative'?.88:.70;
    if(e.family==='ice'){
      for(let i=0;i<6;i++){X.rotate(Math.PI/3);X.beginPath();X.moveTo(10,0);X.lineTo(22+Math.sin(t*5+i)*3,0);X.stroke()}
    }else if(e.family==='plasma'){
      X.beginPath();X.arc(0,0,12+Math.sin(t*9)*2,0,Math.PI*2);X.stroke();X.globalAlpha*=.6;X.beginPath();X.arc(0,0,21+Math.cos(t*7)*2,0,Math.PI*2);X.stroke();
      for(let i=0;i<4;i++){const a=t*4+i*Math.PI/2;X.beginPath();X.moveTo(Math.cos(a)*13,Math.sin(a)*13);X.lineTo(Math.cos(a+.3)*27,Math.sin(a+.3)*20);X.stroke()}
    }else if(e.family==='void'){
      X.globalAlpha=.35;X.fillStyle='#090311';X.beginPath();X.arc(0,0,13,0,Math.PI*2);X.fill();X.globalAlpha=.85;X.strokeStyle=e.col;for(let i=0;i<3;i++){const a=t*2+i*Math.PI*2/3;X.beginPath();X.arc(Math.cos(a)*20,Math.sin(a)*9,3+i*.6,0,Math.PI*2);X.stroke()}
    }else if(e.family==='wind'){
      for(let i=0;i<3;i++){X.beginPath();X.arc(0,0,13+i*6,-1.3+t*.35,.7+t*.35);X.stroke()}
    }else if(e.family==='radiant'){
      for(let i=0;i<8;i++){X.rotate(Math.PI/4);X.beginPath();X.moveTo(9,0);X.lineTo(25+Math.sin(t*7)*3,0);X.stroke()}X.globalAlpha=.25;X.fillStyle='#fff';X.beginPath();X.arc(0,0,11,0,Math.PI*2);X.fill();
    }
    X.restore();
  }

  if(typeof weaponAura==='function'){
    const base=weaponAura;
    weaponAura=function(w,x,y){const r=base(w,x,y);try{modelAccent(w,x,y);elementAura(w,x,y);state.draws++}catch(e){console.warn('Arsenal visual fallback',e)}return r};
  }

  globalThis.CWM_ARSENAL_VISUAL={state};
})();
