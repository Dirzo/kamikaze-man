(()=>{
  if(globalThis.__CWL_HEAVY_SILHOUETTE_V1)return;
  globalThis.__CWL_HEAVY_SILHOUETTE_V1=true;
  const BUILD='cwl-heavy-silhouette-v1-20260915a';
  const state={build:BUILD,installed:false,draws:0,last:null,error:null};
  const TAU=Math.PI*2;
  function line(X,a,b,c,d,col,w=3){X.strokeStyle=col;X.lineWidth=w;X.lineCap='round';X.beginPath();X.moveTo(a,b);X.lineTo(c,d);X.stroke()}
  function poly(X,p,fill,stroke='#071019',lw=3){X.beginPath();p.forEach((q,i)=>i?X.lineTo(q[0],q[1]):X.moveTo(q[0],q[1]));X.closePath();X.fillStyle=fill;X.fill();if(stroke){X.strokeStyle=stroke;X.lineWidth=lw;X.stroke()}}
  function bolt(X,x,y){X.fillStyle='#d9e2ea';X.strokeStyle='#10161d';X.lineWidth=1.3;X.beginPath();X.arc(x,y,2.7,0,TAU);X.fill();X.stroke()}
  function accent(X,w,opt){
    const HA=globalThis.CWM_HEAVY_ART,VF=globalThis.CWM_WEAPON_VISUAL;if(!HA?.subtype||!VF?.describe)return;
    const s=w?.heavyBaseId||HA.subtype(w),d=VF.describe(w),c=d?.emissive||w?.col||'#ffd65a',sc=Number(opt?.scale)||1;
    X.save();X.scale(sc,sc);X.lineJoin='round';X.lineCap='round';
    if(s==='industrial_maul'){
      poly(X,[[58,-49],[82,-43],[96,-31],[92,-19],[78,-8],[58,-5]],'#2a313b','#071019',4);
      poly(X,[[72,-40],[87,-34],[89,-27],[78,-19],[69,-20]],c,'#071019',2);
      line(X,7,-54,57,-54,'#1a2029',6);line(X,10,1,57,1,'#1a2029',6);bolt(X,58,-39);bolt(X,58,-14);
      X.globalAlpha=.58;X.strokeStyle=c;X.lineWidth=2;X.beginPath();X.moveTo(18,-46);X.lineTo(45,-9);X.moveTo(28,-49);X.lineTo(55,-12);X.stroke();X.globalAlpha=1;
    }else if(s==='siege_hammer'){
      poly(X,[[61,-54],[82,-47],[91,-34],[84,-20],[65,-9],[59,-15]],'#272e38','#071019',4);bolt(X,64,-41);bolt(X,67,-21);
      X.fillStyle=c;X.fillRect(74,-38,8,14);
    }else if(s==='pile_driver'){
      poly(X,[[18,-58],[36,-51],[39,31],[31,48],[18,45]],'#252c36','#071019',4);line(X,29,-43,29,29,c,3);bolt(X,29,-35);bolt(X,29,-5);bolt(X,29,24);
      X.globalAlpha=.5;X.fillStyle=c;X.fillRect(21,35,16,7);X.globalAlpha=1;
    }else if(s==='welded_cleaver'){
      X.fillStyle='#202630';X.strokeStyle='#071019';X.lineWidth=2;for(let x=50;x<92;x+=12)poly(X,[[x,16],[x+6,31],[x+12,14]],'#252c35','#071019',2);
      line(X,31,-10,84,-22,c,2);bolt(X,47,-5);bolt(X,68,-11);
    }else if(s==='junk_cannon'){
      poly(X,[[88,-14],[108,-9],[116,0],[108,9],[88,14]],'#202731','#071019',3);X.fillStyle=c;X.fillRect(103,-4,10,8);
    }else if(s==='scrap_mortar'){
      poly(X,[[54,-35],[75,-36],[84,-28],[78,-20],[58,-18]],'#232a34','#071019',3);bolt(X,63,-28);
    }else if(s==='rotary_reclaimer'){
      X.strokeStyle=c;X.lineWidth=2;X.globalAlpha=.62;for(let y=-12;y<=12;y+=8){X.beginPath();X.moveTo(52,y);X.lineTo(101,y);X.stroke()}X.globalAlpha=1;
    }else if(s==='landfill_lobber'){
      poly(X,[[73,-21],[98,-18],[108,-7],[104,10],[88,20],[74,14]],'#252c36','#071019',3);bolt(X,84,-9);bolt(X,90,8);
    }else if(s==='pressure_propeller'){
      X.strokeStyle=c;X.lineWidth=3;X.globalAlpha=.7;X.beginPath();X.arc(70,0,31,0,TAU);X.stroke();X.globalAlpha=1;
    }else if(s==='siege_toaster'){
      poly(X,[[56,-27],[75,-21],[82,-7],[80,17],[62,25],[57,17]],'#272e37','#071019',3);X.fillStyle=c;X.fillRect(66,2,8,10);
    }
    X.restore();state.draws++;state.last=s;
  }
  function install(){
    const VF=globalThis.CWM_WEAPON_VISUAL,HA=globalThis.CWM_HEAVY_ART;
    if(!VF?.draw||!VF?.family||!HA?.subtype){setTimeout(install,80);return}
    if(VF.draw.__cwlHeavySilhouette){state.installed=true;return}
    const base=VF.draw.bind(VF);
    function draw(X,w,opt={}){const out=base(X,w,opt);if(VF.family(w)==='heavy')try{accent(X,w,opt)}catch(e){state.error=String(e?.message||e)}return out}
    draw.__cwlHeavySilhouette=true;draw.__cwlHeavySilhouetteBase=base;VF.draw=draw;state.installed=true;document.documentElement.dataset.cwlHeavySilhouette='ready';console.info('CWL Heavy silhouette accents installed',BUILD);
  }
  install();const timer=setInterval(()=>{try{install();if(state.installed)document.documentElement.dataset.cwlHeavySilhouette='ready'}catch(e){state.error=String(e?.message||e)}},700);addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  globalThis.CWL_HEAVY_SILHOUETTE={build:BUILD,state,accent,reinstall:install};
})();
