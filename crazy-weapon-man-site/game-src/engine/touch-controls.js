// Pointer ownership keeps movement and attacks independent when both thumbs are down.
export function joystickVector(dx, dy, radius) {
  const length = Math.hypot(dx, dy), scale = length > radius ? radius / length : 1;
  const x = dx * scale / radius, y = dy * scale / radius;
  const actions = [];
  if (Math.hypot(x,y) >= 0.22) {
    if (x < -0.35) actions.push('left');
    if (x > 0.35) actions.push('right');
    if (y < -0.35) actions.push('up');
    if (y > 0.35) actions.push('down');
  }
  return {x:x*radius,y:y*radius,actions};
}
export function bindTouchControls(onChange) {
  const owners = [], sources = new Map(), stick = document.getElementById('joystick');
  let stickId = null;
  const publish = () => onChange(new Set([...sources.values()].flat()));
  const capture = (el,id) => {try {el.setPointerCapture(id);} catch (_) { /* Synthetic test pointers have no browser capture. */ }};
  const paint = (x=0,y=0) => {
    if (!stick) return;
    stick.style.setProperty('--stick-x', x+'px');stick.style.setProperty('--stick-y', y+'px');
    stick.dataset.held = stickId===null?'false':'true';
  };
  const reset = () => {
    sources.clear();for(const owned of owners)owned.clear();stickId=null;paint();
    for (const b of document.querySelectorAll('[data-action]')) b.dataset.held='false';
    onChange(new Set(),true);
  };
  for (const button of document.querySelectorAll('[data-action]')) {
    const action=button.dataset.action, owned=new Set();owners.push(owned);
    button.addEventListener('pointerdown',e=>{
      e.preventDefault();owned.add(e.pointerId);capture(button,e.pointerId);
      sources.set(e.pointerId,[action]);button.dataset.held='true';publish();
    });
    const release=e=>{
      if (!owned.delete(e.pointerId)) return;
      sources.delete(e.pointerId);button.dataset.held=owned.size?'true':'false';publish();
    };
    for (const name of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(name,release);
  }
  if(stick) {
    const move=e=>{
      if(e.pointerId!==stickId)return;
      e.preventDefault();const b=stick.getBoundingClientRect(),radius=b.width*0.32;
      const v=joystickVector(e.clientX-b.left-b.width/2,e.clientY-b.top-b.height/2,radius);
      sources.set(e.pointerId,v.actions);paint(v.x,v.y);publish();
    };
    stick.addEventListener('pointerdown',e=>{
      e.preventDefault();if(stickId!==null)return;
      stickId=e.pointerId;capture(stick,stickId);move(e);
    });
    stick.addEventListener('pointermove',move);
    const release=e=>{
      if(e.pointerId!==stickId)return;
      sources.delete(stickId);stickId=null;paint();publish();
    };
    for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,release);
  }
  window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  window.addEventListener('resize',reset);
  document.getElementById('touch')?.addEventListener('contextmenu',e=>e.preventDefault());
  return {reset};
}
