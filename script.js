(() => {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  let W, H, DPR;

  function resize() {
    DPR = window.devicePixelRatio || 1;
    const r = cv.parentElement.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- ползунки ----------
  const sliders = [];
  for (let i = 0; i < 8; i++) {
    const el = document.getElementById('s' + i);
    const out = document.getElementById('v' + i);
    sliders.push({ el, out });
    el.addEventListener('input', () => { 
      out.textContent = (+el.value).toFixed(1); 
    });
  }
  const val = i => +sliders[i].el.value;

  // ---------- состояние ----------
  let running = false;
  const particles = [];
  const splashes = [];
  const mist = [];
  const ripples = [];
  let emitAcc = 0;
  let lastT = performance.now();

  // ---------- кнопка ----------
  const btnToggle = document.getElementById('btnToggle');
  btnToggle.addEventListener('click', () => {
    running = !running;
    if (running) {
      btnToggle.textContent = 'СТОП';
      btnToggle.classList.add('running');
    } else {
      btnToggle.textContent = 'СТАРТ';
      btnToggle.classList.remove('running');
    }
  });

  // ---------- геометрия унитаза ----------
  function toiletGeom() {
    const cx = W * 0.5;
    const rimY = H * 0.32;
    const bowlTop = rimY;
    const bowlBottom = H * 0.88;
    const rimW = Math.min(W * 0.35, 260);
    const bowlW = rimW * 0.78;
    return { cx, rimY, bowlTop, bowlBottom, rimW, bowlW };
  }

  // ---------- цвет ----------
  function streamColor(t, alpha) {
    const r = Math.round(150 - 90 * t);
    const g = Math.round(110 - 70 * t);
    const b = Math.round(50 - 30 * t);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ---------- рисование унитаза ----------
  function drawToilet() {
    const g = toiletGeom();
    const { cx, rimY, bowlBottom, rimW, bowlW } = g;

    // тень
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, bowlBottom + 16, rimW * 1.1, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.filter = 'blur(8px)';
    ctx.fill();
    ctx.restore();

    // корпус
    const bodyGrad = ctx.createLinearGradient(cx - rimW, rimY, cx + rimW, bowlBottom);
    bodyGrad.addColorStop(0, '#e8eef5');
    bodyGrad.addColorStop(0.35, '#c7d2de');
    bodyGrad.addColorStop(0.6, '#f5f9ff');
    bodyGrad.addColorStop(1, '#9aa8b8');

    ctx.beginPath();
    ctx.moveTo(cx - rimW, rimY);
    ctx.bezierCurveTo(cx - rimW * 1.15, rimY + (bowlBottom - rimY) * 0.45,
                      cx - bowlW * 1.1, bowlBottom - 40,
                      cx - bowlW * 0.72, bowlBottom);
    ctx.bezierCurveTo(cx - bowlW * 0.3, bowlBottom + 20,
                      cx + bowlW * 0.3, bowlBottom + 20,
                      cx + bowlW * 0.72, bowlBottom);
    ctx.bezierCurveTo(cx + bowlW * 1.1, bowlBottom - 40,
                      cx + rimW * 1.15, rimY + (bowlBottom - rimY) * 0.45,
                      cx + rimW, rimY);
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // блик
    ctx.save();
    ctx.clip();
    const shine = ctx.createLinearGradient(cx - rimW * 0.6, rimY, cx + rimW * 0.2, bowlBottom);
    shine.addColorStop(0, 'rgba(255,255,255,0.55)');
    shine.addColorStop(0.4, 'rgba(255,255,255,0.08)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(cx - rimW * 1.2, rimY, rimW * 1.6, bowlBottom - rimY + 30);
    ctx.restore();

    // чаша внутри
    const innerTop = rimY + 16;
    const innerBottom = bowlBottom - 22;
    const innerW = bowlW * 0.86;

    const bowlGrad = ctx.createRadialGradient(cx, innerTop + 30, 10, cx, innerBottom, innerW * 1.2);
    bowlGrad.addColorStop(0, '#dfe8f2');
    bowlGrad.addColorStop(0.55, '#b9c6d6');
    bowlGrad.addColorStop(1, '#7d8b9e');

    ctx.beginPath();
    ctx.ellipse(cx, innerTop, innerW, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = bowlGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - innerW, innerTop);
    ctx.bezierCurveTo(cx - innerW * 1.02, innerTop + (innerBottom - innerTop) * 0.5,
                      cx - innerW * 0.62, innerBottom - 10,
                      cx, innerBottom);
    ctx.bezierCurveTo(cx + innerW * 0.62, innerBottom - 10,
                      cx + innerW * 1.02, innerTop + (innerBottom - innerTop) * 0.5,
                      cx + innerW, innerTop);
    ctx.fillStyle = 'rgba(120,135,155,0.35)';
    ctx.fill();

    // вода
    const waterY = innerTop + (innerBottom - innerTop) * 0.55;
    const waterGrad = ctx.createLinearGradient(cx, waterY - 20, cx, innerBottom);
    waterGrad.addColorStop(0, 'rgba(150,210,255,0.55)');
    waterGrad.addColorStop(1, 'rgba(40,90,150,0.85)');

    ctx.beginPath();
    ctx.ellipse(cx, waterY, innerW * 0.92, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = waterGrad;
    ctx.fill();

    // блик воды
    ctx.beginPath();
    ctx.ellipse(cx - innerW * 0.3, waterY - 4, innerW * 0.32, 6, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    // ободок
    ctx.beginPath();
    ctx.ellipse(cx, rimY, rimW, 30, 0, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#eef4fb';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, rimY, rimW, 30, 0, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(140,160,185,0.9)';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, rimY, rimW - 8, 23, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,40,55,0.55)';
    ctx.fill();

    return { waterY, innerW };
  }

  // ---------- физика ----------
  function spawnParticle() {
    const g = toiletGeom();
    const force = val(0);
    const volume = val(1);
    const wet = val(2);
    const viscosity = val(3);
    const spread = val(4);
    const turb = val(5);
    const tone = val(6) / 10;
    const density = val(7);

    const startX = g.cx + (Math.random() - 0.5) * 12;
    const startY = g.rimY - 40;

    const vy = 2.5 + force * 0.9 + volume * 0.15;
    const vx = (Math.random() - 0.5) * spread * 0.8;

    const isMist = Math.random() < wet * 0.06;

    const p = {
      x: startX,
      y: startY,
      vx,
      vy,
      r: (isMist ? 1 : 2.5) + volume * 0.55 + viscosity * 0.35 + Math.random() * 1.5,
      tone,
      density: 0.35 + density * 0.06,
      turb: turb * 0.06,
      life: 1,
      mist: isMist
    };
    if (isMist) mist.push(p); else particles.push(p);
  }

  function updateParticles(dt) {
    const g = toiletGeom();
    const waterY = g.waterY;
    const grav = 0.35;

    if (running) {
      const force = val(0);
      const volume = val(1);
      const rate = 6 + force * 6 + volume * 4;
      emitAcc += rate * dt;
      while (emitAcc >= 1) {
        spawnParticle();
        emitAcc -= 1;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += grav;
      p.vx += (Math.random() - 0.5) * p.turb;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;

      if (p.y >= waterY) {
        createSplash(p.x, waterY, p);
        particles.splice(i, 1);
      } else if (p.y > H + 50) {
        particles.splice(i, 1);
      }
    }

    for (let i = mist.length - 1; i >= 0; i--) {
      const p = mist[i];
      p.vy += grav * 0.4;
      p.vx += (Math.random() - 0.5) * p.turb * 1.5;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.012;
      if (p.life <= 0 || p.y > waterY) mist.splice(i, 1);
    }

    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.vy += grav * 1.1;
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.025;
      if (s.life <= 0 || s.y > waterY + 30) splashes.splice(i, 1);
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.rad += 1;
      r.life -= 0.02;
      if (r.life <= 0) ripples.splice(i, 1);
    }
  }

  function createSplash(x, y, p) {
    const n = 2 + Math.floor(p.r * 0.6);
    for (let i = 0; i < n; i++) {
      splashes.push({
        x, y: y - 4,
        vx: (Math.random() - 0.5) * (3 + p.tone * 2),
        vy: -1 - Math.random() * 3,
        r: 0.8 + Math.random() * 2,
        tone: p.tone,
        life: 0.7 + Math.random() * 0.3
      });
    }
    ripples.push({ x, y, rad: 3, life: 0.7, tone: p.tone });
  }

  // ---------- отрисовка ----------
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W * 0.5, H * 0.9, 30, W * 0.5, H * 0.9, W * 0.8);
    bg.addColorStop(0, 'rgba(28,36,64,0.9)');
    bg.addColorStop(1, 'rgba(6,6,12,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const { waterY, innerW } = drawToilet();
    const g = toiletGeom();

    for (const r of ripples) {
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.rad, r.rad * 0.28, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220,240,255,${r.life * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.save();
    for (const p of mist) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = streamColor(p.tone, p.life * 0.35 * p.density);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    for (const p of particles) {
      const grd = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.2, p.x, p.y, p.r);
      grd.addColorStop(0, streamColor(p.tone, 0.95 * p.density));
      grd.addColorStop(1, streamColor(Math.min(1, p.tone + 0.25), 0.65 * p.density));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
    ctx.restore();

    for (const s of splashes) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = streamColor(s.tone, s.life * 0.85);
      ctx.fill();
    }

    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.35, W * 0.5, H * 0.5, H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- цикл ----------
  function loop(t) {
    const dt = Math.min(3, (t - lastT) / 16.6667);
    lastT = t;
    updateParticles(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
