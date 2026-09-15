(()=>{
  if(globalThis.__CWL_IDENTITY_V1)return;
  globalThis.__CWL_IDENTITY_V1=true;
  const BUILD='cwl-identity-v1-20260915b';
  const replaceText=s=>String(s??'')
    .replaceAll('CRAZY WEAPON MAN JR.','CRAZY WEAPON LADY')
    .replaceAll('Crazy Weapon Man Jr.','Crazy Weapon Lady')
    .replaceAll('CRAZY WEAPON LADY JR.','CRAZY WEAPON LADY')
    .replaceAll('Crazy Weapon Lady Jr.','Crazy Weapon Lady')
    .replaceAll('CRAZY WEAPON MAN','CRAZY WEAPON LADY')
    .replaceAll('Crazy Weapon Man','Crazy Weapon Lady');

  document.title='Crazy Weapon Lady';
  const needsPatch=s=>/Crazy Weapon (?:Man|Lady)(?: Jr\.)?|CRAZY WEAPON (?:MAN|LADY)(?: JR\.)?/.test(String(s||''));

  function patchDOM(root=document.body){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const touched=[];
    while(walker.nextNode()){
      const n=walker.currentNode;
      if(needsPatch(n.nodeValue))touched.push(n);
    }
    for(const n of touched)n.nodeValue=replaceText(n.nodeValue);
    for(const el of root.querySelectorAll?.('[aria-label],[title],[placeholder]')||[]){
      for(const a of ['aria-label','title','placeholder']){
        const v=el.getAttribute(a);if(v&&needsPatch(v))el.setAttribute(a,replaceText(v));
      }
    }
  }

  const mo=new MutationObserver(ms=>{
    for(const m of ms)for(const n of m.addedNodes){
      if(n.nodeType===Node.TEXT_NODE){if(needsPatch(n.nodeValue))n.nodeValue=replaceText(n.nodeValue)}
      else if(n.nodeType===Node.ELEMENT_NODE)patchDOM(n);
    }
  });
  if(document.body){patchDOM();mo.observe(document.body,{childList:true,subtree:true})}
  else addEventListener('DOMContentLoaded',()=>{patchDOM();mo.observe(document.body,{childList:true,subtree:true})},{once:true});

  const P=globalThis.CanvasRenderingContext2D?.prototype;
  if(P&&!P.__cwlIdentityV1){
    const f=P.fillText,s=P.strokeText;
    P.fillText=function(text,...args){return f.call(this,replaceText(text),...args)};
    P.strokeText=function(text,...args){return s.call(this,replaceText(text),...args)};
    P.__cwlIdentityV1=true;
  }

  globalThis.CWL_IDENTITY={
    build:BUILD,
    name:'Crazy Weapon Lady',
    legacyName:'Crazy Weapon Man',
    coreGameplayUnchanged:true,
    heavyOnly:true,
    artDirection:'white-haired neon weapon-obsessed action heroine'
  };
  console.info('Crazy Weapon Lady identity layer installed',globalThis.CWL_IDENTITY);
})();
