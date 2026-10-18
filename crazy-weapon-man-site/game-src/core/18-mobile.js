  const isTouchDevice = () =>
    (navigator.maxTouchPoints || 0) > 0 || ('ontouchstart' in window && window.innerWidth < 1000);
  if (isTouchDevice()) document.body.classList.add('touchDevice');
  function syncMobileViewport() {
    if (!document.body.classList.contains('touchDevice')) return;
    let vv = window.visualViewport,
      w = Math.round(vv?.width || window.innerWidth),
      h = Math.round(vv?.height || window.innerHeight);
    document.documentElement.style.setProperty('--cwm-vw', w + 'px');
    document.documentElement.style.setProperty('--cwm-vh', h + 'px');
  }
  syncMobileViewport();
  window.addEventListener('resize', () => requestAnimationFrame(syncMobileViewport), { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(syncMobileViewport, 80), { passive: true });
  if (window.visualViewport)
    window.visualViewport.addEventListener('resize', () => requestAnimationFrame(syncMobileViewport), {
      passive: true
    });
  function mobilePressButton(el, down) {
    if (el) el.classList.toggle('active', down);
  }
  function bindMobileTap(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(
      'pointerdown',
      e => {
        e.preventDefault();
        e.stopPropagation();
        mobilePressButton(el, true);
        try {
          audioInit();
        } catch (_) {}
        fn();
      },
      { passive: false }
    );
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      el.addEventListener(
        ev,
        e => {
          e.preventDefault();
          e.stopPropagation();
          mobilePressButton(el, false);
        },
        { passive: false }
      )
    );
  }

  const mPause = document.getElementById('mPause');
  if (mPause)
    mPause.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      paused = !paused;
      mPause.textContent = paused ? '▶' : 'Ⅱ';
      document.getElementById('pause').textContent = paused ? 'Resume' : 'Pause';
    });
  const mSound = document.getElementById('mSound');
  if (mSound)
    mSound.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      try {
        document.getElementById('sound').click();
        mSound.textContent = SND.on ? 'SND' : 'MUTE';
      } catch (_) {
        SND.on = false;
        mSound.textContent = 'NO SND';
      }
    });
  const mFull = document.getElementById('mFull');
  if (mFull)
    mFull.addEventListener('click', async e => {
      e.preventDefault();
      e.stopPropagation();
      let st = document.getElementById('gameStage');
      try {
        if (!document.fullscreenElement) {
          await st.requestFullscreen();
        } else await document.exitFullscreen();
      } catch (_) {
        st.classList.toggle('fullscreenSim');
      }
    });

  // Dynamic thumb controls. Left half = virtual joystick wherever the thumb lands.
  // Right half = hold-to-attack wherever the thumb lands; quick double-tap triggers the weapon skill.
  // Quick hard left/right joystick flick triggers ground/air dash. No persistent gameplay buttons.
  const stageEl = document.getElementById('gameStage'),
    mStick = document.getElementById('mStick'),
    mKnob = document.getElementById('mStickKnob'),
    mAttackOrb = document.getElementById('mAttackOrb');
  let leftPointer = null,
    rightPointer = null,
    leftBaseX = 0,
    leftBaseY = 0,
    leftJumpLatch = false,
    leftDropLatch = false,
    leftDashLatch = false,
    leftDownAt = 0,
    attackTimer = null,
    rightDownAt = 0,
    lastRightTap = 0,
    rightSkillTap = false;
  const isMobileUI = t => !!(t && t.closest && t.closest('.titleScreen,.boonScreen'));
  function stagePoint(e) {
    let r = stageEl.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  }
  function clearMoveKeys() {
    K.delete('arrowleft');
    K.delete('arrowright');
    K.delete('arrowdown');
  }
  function setStickVisual(x, y, dx = 0, dy = 0) {
    if (!mStick || !mKnob) return;
    mStick.style.left = x + 'px';
    mStick.style.top = y + 'px';
    mStick.classList.add('show');
    mKnob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function updateJoystick(e) {
    if (e.pointerId !== leftPointer) return;
    let p = stagePoint(e),
      rawX = p.x - leftBaseX,
      rawY = p.y - leftBaseY,
      dx = rawX,
      dy = rawY,
      max = 44,
      len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    setStickVisual(leftBaseX, leftBaseY, dx, dy);
    K.delete('arrowleft');
    K.delete('arrowright');
    if (dx < -11) K.add('arrowleft');
    else if (dx > 11) K.add('arrowright');
    if (dy < -27) {
      if (!leftJumpLatch) {
        jump();
        leftJumpLatch = true;
      }
    } else if (dy > -15) leftJumpLatch = false;
    if (dy > 30) {
      if (!leftDropLatch) {
        drop();
        leftDropLatch = true;
      }
    } else if (dy < 18) leftDropLatch = false;
    let age = performance.now() - leftDownAt;
    if (Math.abs(rawX) > 48 && Math.abs(rawX) > Math.abs(rawY) * 1.25 && age < 260 && !leftDashLatch) {
      pl.dir = Math.sign(rawX) || pl.dir;
      dash();
      leftDashLatch = true;
      txt(pl.x + 17, pl.y - 38, pl.on ? 'FLICK DASH' : 'FLICK AIR DASH', '#8ee8ff', false);
    }
    if (Math.abs(rawX) < 22) leftDashLatch = false;
  }
  function endLeft() {
    leftPointer = null;
    leftJumpLatch = false;
    leftDropLatch = false;
    leftDashLatch = false;
    clearMoveKeys();
    if (mStick) {
      mStick.classList.remove('show');
      if (mKnob) mKnob.style.transform = 'translate(0,0)';
    }
  }
  function showAttack(x, y) {
    if (!mAttackOrb) return;
    mAttackOrb.style.left = x + 'px';
    mAttackOrb.style.top = y + 'px';
    mAttackOrb.classList.add('show');
  }
  function beginAttack() {
    try {
      audioInit();
    } catch (_) {}
    if (attackTimer) {
      clearInterval(attackTimer);
      attackTimer = null;
    }
    attack();
  }
  function endAttack() {
    let now = performance.now(),
      quick = now - rightDownAt < 210;
    rightPointer = null;
    if (attackTimer) {
      clearInterval(attackTimer);
      attackTimer = null;
    }
    K.delete('control');
    if (mAttackOrb) mAttackOrb.classList.remove('show');
    if (quick && !rightSkillTap) lastRightTap = now;
    rightSkillTap = false;
  }
  if (stageEl) {
    stageEl.addEventListener(
      'pointerdown',
      e => {
        if (
          !document.body.classList.contains('touchDevice') ||
          isMobileUI(e.target) ||
          e.pointerType === 'mouse'
        )
          return;
        e.preventDefault();
        let p = stagePoint(e),
          now = performance.now();
        try {
          stageEl.setPointerCapture(e.pointerId);
        } catch (_) {}
        if (p.x < p.w * 0.5 && leftPointer === null) {
          leftPointer = e.pointerId;
          leftBaseX = p.x;
          leftBaseY = p.y;
          leftDownAt = now;
          leftDashLatch = false;
          setStickVisual(p.x, p.y, 0, 0);
          updateJoystick(e);
        } else if (p.x >= p.w * 0.5 && rightPointer === null) {
          rightPointer = e.pointerId;
          rightDownAt = now;
          rightSkillTap = lastRightTap > 0 && now - lastRightTap < 310;
          showAttack(p.x, p.y);
          if (rightSkillTap) {
            lastRightTap = 0;
            skill();
            txt(pl.x + 17, pl.y - 44, 'DOUBLE TAP SKILL!', '#d9a7ff', false);
          }
          K.add('control');
          beginAttack();
        }
      },
      { passive: false }
    );
    stageEl.addEventListener(
      'pointermove',
      e => {
        if (!document.body.classList.contains('touchDevice')) return;
        if (e.pointerId === leftPointer) {
          e.preventDefault();
          updateJoystick(e);
        } else if (e.pointerId === rightPointer) {
          e.preventDefault();
          let p = stagePoint(e);
          showAttack(p.x, p.y);
        }
      },
      { passive: false }
    );
    const finish = e => {
      if (e.pointerId === leftPointer) endLeft();
      if (e.pointerId === rightPointer) endAttack();
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev =>
      stageEl.addEventListener(ev, finish, { passive: false })
    );
    stageEl.addEventListener(
      'touchmove',
      e => {
        if (document.body.classList.contains('touchDevice')) e.preventDefault();
      },
      { passive: false }
    );
    stageEl.addEventListener('contextmenu', e => {
      if (document.body.classList.contains('touchDevice')) e.preventDefault();
    });
  }

