(()=>{
  if(globalThis.CWL_DIRECTOR_TRANSFORM_V1)return;
  const BUILD='cwl-director-transform-v1-20260915a';
  const replacement=`function wavePlan(index=stageClears){
    const __CWL_DYNAMIC_EARLY_WAVES=true;
    let po=pool(),goal=stageGoal(),final=index>=goal-1;
    let primary=po[Math.min(index,po.length-1)]||po.at(-1)||'crawler';
    let mode=index===0?WAVE_MODES[0]:index===1?{id:'cross-training',name:'CROSS-TRAINING',desc:'The new threat arrives with a smaller reminder of the last lesson.'}:final?WAVE_MODES[5]:index===2?WAVE_MODES[2]:index===3?WAVE_MODES[3]:WAVE_MODES[4],parts=[];
    let primaryCount=clamp(3+Math.floor(index*.78)+Math.floor(zoneI/4),3,final?7:6);
    parts.push({type:primary,count:primaryCount,role:'NEW THREAT'});
    if(index===1&&po.length>1){let recall=po[0];if(recall!==primary)parts.push({type:recall,count:2,role:'RECALL'});}
    if(index>=2){let prev=po[Math.max(0,index-1)%po.length];if(prev!==primary)parts.push({type:prev,count:final?3:Math.min(2+Math.floor(index/3),3),role:'SUPPORT'});}
    if(index>=2){let older=po[Math.max(0,index-2)%po.length];if(older!==primary&&!parts.some(x=>x.type===older))parts.push({type:older,count:final?2:(index===2?1:1+Math.floor(index/5)),role:index===2?'FLANK PREVIEW':'FLANK'});}
    if(index>=4&&!final&&Math.random()<.62){let learned=po.slice(0,Math.min(po.length,index+1)).filter(t=>!parts.some(x=>x.type===t));if(learned.length)parts.push({type:pick(learned),count:2,role:'WILDCARD'});}
    if(final){let learned=po.slice(0,Math.min(po.length,index+1)).filter(t=>!parts.some(x=>x.type===t));if(learned.length)parts.push({type:pick(learned),count:2,role:'FINAL SUPPORT'});}
    let pressure=rarityWavePressure(),room=Math.max(0,34-parts.reduce((n,x)=>n+x.count,0)),extra=Math.min(pressure.extra,room);
    if(extra>0){let primaryExtra=Math.ceil(extra*.48),remain=extra-primaryExtra;parts[0].count+=primaryExtra;if(parts.length===1){parts[0].count+=remain}else{let i=1;while(remain>0){parts[i].count++;remain--;i++;if(i>=parts.length)i=1}}}
    let count=parts.reduce((n,x)=>n+x.count,0),eliteCount=final?Math.min(4,2+Math.floor(zoneI/3)):index>=4?2:index>=2?1:0,scale=1+index*.105+zoneI*.026;
    return{index,final,primary,parts,count,eliteCount,scale,mode,rarityPressure:{...pressure,extra}};
  }`;

  function transform(input){
    let html=String(input||'');
    const report={build:BUILD,ok:false,patched:0,warnings:[],at:Date.now()};
    const start=html.indexOf('function wavePlan(index=stageClears)');
    const end=start>=0?html.indexOf('function showWaveIntro',start):-1;
    if(start<0||end<0||end<=start){report.warnings.push('wavePlan boundary not found');globalThis.__CWL_DIRECTOR_TRANSFORM_LAST=report;console.warn('CWL director transform degraded',report);return html}
    const original=html.slice(start,end);
    if(!original.includes('rarityWavePressure')||!original.includes('parts.push')){report.warnings.push('wavePlan shape changed');globalThis.__CWL_DIRECTOR_TRANSFORM_LAST=report;console.warn('CWL director transform degraded',report);return html}
    html=html.slice(0,start)+replacement+'\n'+html.slice(end);
    report.patched=1;report.ok=true;globalThis.__CWL_DIRECTOR_TRANSFORM_LAST=report;console.info('CWL director transform applied',report);return html;
  }
  globalThis.CWL_DIRECTOR_TRANSFORM_V1={build:BUILD,transform};
})();
