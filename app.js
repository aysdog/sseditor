const S = {
  imgSrc: null, fileName: null, fmt: 'png', res: 2,
  devtype: 'browser', device: 'browser', browserTheme: 'bk',
  stageW: 1920, stageH: 1080,
  ssBGMode: 'solid', ssBGColor: '#111111',
  scale: 100, hpos: 0, vpos: 0, radius: 10, shadow: 4,
  vtilt: 0, htilt: 0, rot: 0, opacity: 100,
};

const BOOT_LINES = [
  { t: 0,   h: '<span class="d">initializing ss-editor v2.0.0...</span>' },
  { t: 160, h: '<span class="d">loading modules      </span><span class="f">............</span><span class="g"> ok</span>' },
  { t: 290, h: '<span class="d">canvas engine        </span><span class="f">............</span><span class="g"> ok</span>' },
  { t: 400, h: '<span class="d">export pipeline      </span><span class="f">............</span><span class="g"> ok</span>' },
  { t: 490, h: '<span class="d">device frames        </span><span class="f">............</span><span class="g"> ok</span>' },
  { t: 570, h: '' },
  { t: 610, h: '<span class="b">SS EDITOR</span>  — screenshot mockup tool' },
];

const bootOut   = document.getElementById('boot-out');
const bootTyped = document.getElementById('boot-typed');

(function runBoot() {
  let i = 0;
  function next() {
    if (i >= BOOT_LINES.length) { setTimeout(launch, 300); return; }
    const line = BOOT_LINES[i++];
    setTimeout(() => {
      if (line.h !== '') { const d = document.createElement('div'); d.innerHTML = line.h; bootOut.appendChild(d); }
      else bootOut.appendChild(document.createElement('br'));
      next();
    }, i === 1 ? 0 : line.t - BOOT_LINES[i - 2].t);
  }
  next();
})();

function launch() {
  const boot = document.getElementById('boot');
  boot.style.opacity = '0';
  setTimeout(() => {
    boot.style.display = 'none';
    const app = document.getElementById('app');
    app.style.display = 'flex';
    app.style.opacity = '0';
    app.style.transition = 'opacity .35s';
    requestAnimationFrame(() => {
      app.style.opacity = '1';
      setTimeout(initAll, 80);
    });
  }, 400);
}

function toggleAcc(item) {
  const body = item.querySelector('.acc-body');
  const hd = item.querySelector('.acc-hd');
  const isOpen = hd.classList.contains('open');
  body.style.display = isOpen ? 'none' : 'block';
  hd.classList.toggle('open', !isOpen);
}

function initAll() {
  initSliders();
  initSegGroups();
  initBgTabs();
  initSizeChips();
  initFileHandling();
  initInputListeners();
  document.getElementById('style-own-link').onclick = () => {
    const fs = document.getElementById('acc-frame-settings');
    const opening = fs.style.display === 'none';
    fs.style.display = opening ? 'block' : 'none';
    if (opening) {
      fs.querySelector('.acc-body').style.display = 'block';
      fs.querySelector('.acc-hd').classList.add('open');
    }
  };
  applyStageSize();
  applyAll();
}

function seg(id, cb) {
  const el = document.getElementById(id); if (!el) return;
  el.querySelectorAll('.seg-btn').forEach(btn => btn.addEventListener('click', () => {
    el.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on'); cb(btn.dataset.v);
  }));
}

function initSegGroups() {
  seg('g-devtype', v => {
    S.devtype = v;
    document.getElementById('browser-thumbs').style.display = v === 'browser' ? 'grid' : 'none';
    document.getElementById('device-thumbs').style.display  = v === 'device'  ? 'block' : 'none';
    S.device = v === 'browser' ? 'browser' : v === 'device' ? 'phone' : 'bare';
    applyDevice();
  });
  seg('g-fmt', v => S.fmt = v);
  seg('g-res', v => S.res = parseInt(v));
}

function initBgTabs() {
  document.querySelectorAll('#g-ssbg .bg-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('#g-ssbg .bg-tab').forEach(t => t.classList.remove('on'));
    tab.classList.add('on'); S.ssBGMode = tab.dataset.v;
    document.getElementById('ssbgm-solid').style.display    = S.ssBGMode === 'solid'    ? 'block' : 'none';
    document.getElementById('ssbgm-gradient').style.display = S.ssBGMode === 'gradient' ? 'block' : 'none';
    applySSBG();
  }));
}

function initSizeChips() {
  document.querySelectorAll('#size-chips .sz-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const w = parseInt(chip.dataset.w), h = parseInt(chip.dataset.h);
      document.querySelectorAll('#size-chips .sz-chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
      if (w === 0) { document.getElementById('size-custom').style.display = 'flex'; return; }
      document.getElementById('size-custom').style.display = 'none';
      S.stageW = w; S.stageH = h; applyStageSize();
    });
  });
}

function applyCustomSize() {
  S.stageW = Math.max(400, Math.min(7680, parseInt(document.getElementById('inp-cw').value) || 1920));
  S.stageH = Math.max(300, Math.min(4320, parseInt(document.getElementById('inp-ch').value) || 1080));
  applyStageSize();
}

function applyStageSize() {
  const stage = document.getElementById('ss-stage');
  const ci    = document.getElementById('canvas-inner');
  const maxW  = (ci.clientWidth  || 1200) - 80;
  const maxH  = (ci.clientHeight || 700)  - 80;
  const fit   = Math.min(maxW / S.stageW, maxH / S.stageH, 1);
  stage.style.width           = S.stageW + 'px';
  stage.style.height          = S.stageH + 'px';
  stage.style.transform       = `scale(${fit})`;
  stage.style.transformOrigin = 'center center';
  document.getElementById('hdr-size-badge').textContent = S.stageW + ' × ' + S.stageH;
}

function fillSl(el) {
  if (!el) return;
  const min = parseFloat(el.min) || 0, max = parseFloat(el.max) || 100;
  const pct = ((parseFloat(el.value) - min) / (max - min)) * 100;
  let c = '#e0e0e0';
  if (el.classList.contains('sl-grey')) c = '#888';
  if (el.classList.contains('sl-dark')) c = '#4a4a4a';
  el.style.background = `linear-gradient(to right,${c} ${pct}%,#2a2a2a ${pct}%)`;
}

function initSliders() {
  const defs = [
    ['sl-ssbg-ang', 'ssbg-ang-v', () => applySSBG()],
    ['sl-scale',    'lv-scale',   v => { S.scale   = v; applyTransform(); }],
    ['sl-hpos',     'lv-hpos',    v => { S.hpos    = v; applyTransform(); }],
    ['sl-vpos',     'lv-vpos',    v => { S.vpos    = v; applyTransform(); }],
    ['sl-rad',      'lv-rad',     v => { S.radius  = v; applyRadius(); }],
    ['sl-shadow',   'lv-shadow',  v => { S.shadow  = v; applyShadow(); }],
    ['sl-vtilt',    'lv-vtilt',   v => { S.vtilt   = v; applyTransform(); }],
    ['sl-htilt',    'lv-htilt',   v => { S.htilt   = v; applyTransform(); }],
    ['sl-rot',      'lv-rot',     v => { S.rot     = v; applyTransform(); }],
    ['sl-op',       'lv-op',      v => { S.opacity = v; applyOpacity(); }],
  ];
  defs.forEach(([sid, lid, fn]) => {
    const sl = document.getElementById(sid); if (!sl) return;
    const lv = document.getElementById(lid);
    sl.addEventListener('input', () => {
      const v = parseFloat(sl.value);
      if (lv) lv.textContent = v;
      fillSl(sl); fn(v);
    });
    fillSl(sl);
  });
}

function resetSl(sid, lid, def, fn) {
  const sl = document.getElementById(sid); if (!sl) return;
  const lv = document.getElementById(lid);
  sl.value = def; if (lv) lv.textContent = def; fillSl(sl);
  const fns = { applyTransform, applyRadius, applyShadow, applyOpacity, applySSBG };
  if (fns[fn]) fns[fn]();
}

function initInputListeners() {
  document.getElementById('inp-url').addEventListener('input', e => {
    document.getElementById('browser-url-txt').textContent = e.target.value;
  });
  document.getElementById('inp-ttl').addEventListener('input', e => {
    document.getElementById('terminal-title').textContent = e.target.value;
  });
}

function initFileHandling() {
  document.getElementById('file-in').addEventListener('change', e => {
    if (e.target.files[0]) loadImg(e.target.files[0]);
  });
  document.addEventListener('paste', e => {
    for (const it of e.clipboardData.items)
      if (it.type.startsWith('image')) { loadImg(it.getAsFile()); break; }
  });
  const ci = document.getElementById('canvas-inner');
  ci.addEventListener('dragover', e => e.preventDefault());
  ci.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image')) loadImg(f);
  });
}

function loadImg(file) {
  const r = new FileReader();
  r.onload = e => {
    S.imgSrc   = e.target.result;
    S.fileName = file.name;
    if (S.devtype === 'code') S.devtype = 'browser';
    ['frame-img-browser','frame-img-terminal','frame-img-phone','frame-img-tablet','frame-img-bare'].forEach(id => {
      document.getElementById(id).src = S.imgSrc;
    });
    document.getElementById('hdr-file').textContent       = file.name;
    document.getElementById('empty-state').style.display  = 'none';
    document.getElementById('mockup').style.display       = 'inline-flex';
    document.getElementById('cnv-bar').style.display      = 'flex';
    applyAll();
  };
  r.readAsDataURL(file);
}

function pickBrowserTheme(theme, el) {
  document.querySelectorAll('#browser-thumbs .frame-thumb').forEach(t => t.classList.remove('on'));
  el.classList.add('on'); S.browserTheme = theme;
  const bar = document.getElementById('browser-bar');
  bar.style.background = ({ bk:'#1c1c1e', bk2:'#000', wt:'#e8e8e8', wt2:'#fff' })[theme] || '#1c1c1e';
  bar.className = 'browser-bar ' + (theme.startsWith('wt') ? 'wt' : 'bk');
}

function pickDevice(dev, el) {
  document.querySelectorAll('#device-thumbs .frame-thumb').forEach(t => t.classList.remove('on'));
  el.classList.add('on'); S.device = dev;
  document.getElementById('opts-terminal').style.display = dev === 'terminal' ? 'block' : 'none';
  applyDevice();
}

function applyFrameToggles() {
  const ctrl    = document.getElementById('tog-controls').checked;
  const urlbar  = document.getElementById('tog-urlbar').checked;
  const urltext = document.getElementById('tog-urltext').checked;
  document.getElementById('browser-dots').style.display       = ctrl   ? 'flex'      : 'none';
  document.getElementById('browser-acts').style.display       = ctrl   ? 'flex'      : 'none';
  document.getElementById('browser-addr').style.display       = urlbar ? 'flex'      : 'none';
  document.getElementById('browser-url-txt').style.visibility = urltext ? 'visible'  : 'hidden';
  document.getElementById('url-row').style.display            = urlbar ? 'flex'      : 'none';
}

function applyAll() {
  applyDevice(); applySSBG(); applyRadius(); applyTransform();
  applyShadow(); applyOpacity(); applyFrameToggles();
}

function applyDevice() {
  ['browser','terminal','phone','tablet','bare','code'].forEach(f => {
    const el = document.getElementById('frm-' + f); if (el) el.style.display = 'none';
  });
  if (S.devtype === 'code') {
    const fc = document.getElementById('frm-code'); if (fc) fc.style.display = 'block'; return;
  }
  const show = S.devtype === 'none' ? 'bare' : S.devtype === 'browser' ? 'browser' : S.device;
  const el = document.getElementById('frm-' + show);
  if (el) el.style.display = ['phone','tablet'].includes(show) ? 'flex' : 'block';
}

function applySSBG() {
  let bg = '#111111';
  if (S.ssBGMode === 'solid') {
    bg = S.ssBGColor;
  } else if (S.ssBGMode === 'gradient') {
    const c1 = document.getElementById('ssbg-c1').value;
    const c2 = document.getElementById('ssbg-c2').value;
    const a  = document.getElementById('sl-ssbg-ang').value;
    bg = `linear-gradient(${a}deg,${c1},${c2})`;
  } else if (S.ssBGMode === 'none') {
    bg = 'transparent';
  }
  document.getElementById('ss-stage').style.background = bg;
}

function setSSBGPreset(c, el) {
  S.ssBGColor = c;
  document.getElementById('ssbg-color').value = c;
  document.querySelectorAll('.cp').forEach(p => p.classList.remove('on'));
  if (el) el.classList.add('on');
  document.querySelectorAll('#g-ssbg .bg-tab').forEach(t => t.classList.remove('on'));
  document.querySelector('#g-ssbg [data-v="solid"]').classList.add('on');
  document.getElementById('ssbgm-solid').style.display    = 'block';
  document.getElementById('ssbgm-gradient').style.display = 'none';
  S.ssBGMode = 'solid';
  applySSBG();
}

function setSSBGCustom(c) {
  S.ssBGColor = c;
  document.querySelectorAll('.cp').forEach(p => p.classList.remove('on'));
  const btn = document.querySelector('.cp-custom');
  if (btn) { btn.classList.add('on'); btn.style.background = c; }
  applySSBG();
}
  applySSBG();

function pickGradPreset(el) {
  document.querySelectorAll('.grad-swatch').forEach(s => s.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('ssbg-c1').value = el.dataset.c1;
  document.getElementById('ssbg-c2').value = el.dataset.c2;
  const ang = document.getElementById('sl-ssbg-ang');
  ang.value = el.dataset.a;
  document.getElementById('ssbg-ang-v').textContent = el.dataset.a;
  fillSl(ang);
  applySSBG();
}

function clearGradPreset() {
  document.querySelectorAll('.grad-swatch').forEach(s => s.classList.remove('on'));
}

function applyRadius() {
  const r = S.radius;
  const b  = document.getElementById('frm-browser');     if (b)  b.style.borderRadius  = `${r}px ${r}px ${Math.max(r-2,2)}px ${Math.max(r-2,2)}px`;
  const t  = document.getElementById('frm-terminal');    if (t)  t.style.borderRadius  = `${r}px`;
  const p  = document.getElementById('frm-phone');       if (p)  p.style.borderRadius  = `${Math.max(r*3,28)}px`;
  const tb = document.getElementById('frm-tablet');      if (tb) tb.style.borderRadius = `${Math.max(r,10)}px`;
  const bi = document.getElementById('frame-img-bare');  if (bi) bi.style.borderRadius = `${r}px`;
  const fc = document.getElementById('frm-code');        if (fc) fc.style.borderRadius = `${r}px`;
}

function applyTransform() {
  const m = document.getElementById('mockup'); if (!m) return;
  const persp = (S.vtilt || S.htilt) ? `perspective(1200px) rotateX(${S.vtilt}deg) rotateY(${S.htilt}deg)` : '';
  m.style.transform = `${persp} rotate(${S.rot}deg) scale(${S.scale/100}) translate(${S.hpos}px,${S.vpos}px)`;
}

function applyShadow() {
  const sh = S.shadow === 0 ? 'none'
    : `0 ${S.shadow*4}px ${S.shadow*12}px rgba(0,0,0,${Math.min(.3+S.shadow*.07,.95)})`;
  ['frm-browser','frm-terminal','frm-phone','frm-tablet','frm-code'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.boxShadow = sh;
  });
  const bi = document.getElementById('frame-img-bare'); if (bi) bi.style.boxShadow = sh;
}

function applyOpacity() {
  const m = document.getElementById('mockup');
  if (m) m.style.opacity = S.opacity / 100;
}

function scaleStep(d) {
  const sl = document.getElementById('sl-scale');
  const lv = document.getElementById('lv-scale');
  S.scale = Math.max(20, Math.min(150, S.scale + d));
  sl.value = S.scale; lv.textContent = S.scale; fillSl(sl); applyTransform();
}

function scaleFit() {
  S.scale = 100;
  const sl = document.getElementById('sl-scale');
  const lv = document.getElementById('lv-scale');
  sl.value = 100; lv.textContent = 100; fillSl(sl); applyTransform();
}

new ResizeObserver(() => applyStageSize()).observe(document.getElementById('canvas-inner'));

function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r];
  const [tl, tr, br, bl] = r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y,         x + w, y + tr,     tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h,     x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x,       y + h,   x, y + h - bl,     bl);
  ctx.lineTo(x,      y + tl);
  ctx.arcTo(x,       y,       x + tl, y,          tl);
  ctx.closePath();
}

async function captureStage(scale) {
  const stage  = document.getElementById('ss-stage');
  const mockup = document.getElementById('mockup');

  const frameIds = ['frm-browser','frm-terminal','frm-phone','frm-tablet','frm-bare','frm-code'];
  let frameEl = null;
  for (const id of frameIds) {
    const el = document.getElementById(id);
    if (el && el.style.display !== 'none') { frameEl = el; break; }
  }

  const cv  = document.createElement('canvas');
  cv.width  = S.stageW * scale;
  cv.height = S.stageH * scale;
  const ctx = cv.getContext('2d');
  ctx.scale(scale, scale);

  if (S.ssBGMode === 'solid') {
    ctx.fillStyle = S.ssBGColor || '#111';
    ctx.fillRect(0, 0, S.stageW, S.stageH);
  } else if (S.ssBGMode === 'gradient') {
    const c1  = document.getElementById('ssbg-c1').value;
    const c2  = document.getElementById('ssbg-c2').value;
    const ang = parseFloat(document.getElementById('sl-ssbg-ang').value) * Math.PI / 180;
    const cx2 = S.stageW/2, cy2 = S.stageH/2;
    const dx  = Math.cos(ang), dy = Math.sin(ang);
    const len = Math.abs(S.stageW*dx)+Math.abs(S.stageH*dy);
    const grd = ctx.createLinearGradient(cx2-dx*len/2,cy2-dy*len/2,cx2+dx*len/2,cy2+dy*len/2);
    grd.addColorStop(0,c1); grd.addColorStop(1,c2);
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,S.stageW,S.stageH);
  }

  if (!S.imgSrc || !frameEl) return cv;

  if (S.imgSrc === 'code') {
    const mockup  = document.getElementById('mockup');
    const savedMT = mockup ? mockup.style.transform : '';
    if (mockup) mockup.style.transform = 'none';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const frameCv = await html2canvas(frameEl, {
      backgroundColor: null, scale, useCORS: true, allowTaint: true, logging: false,
    });
    if (mockup) mockup.style.transform = savedMT;
    const sc = S.scale / 100;
    const cx = S.stageW / 2 + S.hpos;
    const cy = S.stageH / 2 + S.vpos;
    const fw = frameCv.width  / scale;
    const fh = frameCv.height / scale;
    const fx = cx - fw / 2;
    const fy = cy - fh / 2;
    ctx.save();
    ctx.globalAlpha = S.opacity / 100;
    ctx.translate(cx, cy);
    ctx.rotate(S.rot * Math.PI / 180);
    ctx.scale(sc, sc);
    ctx.translate(-cx, -cy);
    if (S.shadow > 0) {
      ctx.shadowColor   = `rgba(0,0,0,${Math.min(0.3+S.shadow*0.07,0.95)})`;
      ctx.shadowBlur    = S.shadow * 12;
      ctx.shadowOffsetY = S.shadow * 4;
    }
    ctx.drawImage(frameCv, fx * scale, fy * scale, frameCv.width, frameCv.height);
    ctx.restore();
    return cv;
  }

  const userImg = await new Promise((res,rej) => {
    const i = new Image(); i.onload = ()=>res(i); i.onerror = rej; i.src = S.imgSrc;
  });

  const savedMT = mockup ? mockup.style.transform : '';
  if (mockup) mockup.style.transform = 'none';
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const frameNatW = frameEl.offsetWidth;
  const frameNatH = frameEl.offsetHeight;
  const imgEl     = frameEl.querySelector('img');
  const imgNatX   = imgEl ? imgEl.offsetLeft   : 0;
  const imgNatY   = imgEl ? imgEl.offsetTop    : 0;
  const imgNatW   = imgEl ? imgEl.offsetWidth  : frameNatW;
  const imgNatH   = imgEl ? imgEl.offsetHeight : frameNatH;

  if (mockup) mockup.style.transform = savedMT;

  const sc = S.scale / 100;
  const cx = S.stageW / 2 + S.hpos;
  const cy = S.stageH / 2 + S.vpos;
  const fx = cx - frameNatW / 2;
  const fy = cy - frameNatH / 2;
  const r  = S.radius;

  ctx.save();
  ctx.globalAlpha = S.opacity / 100;
  ctx.translate(cx, cy);
  ctx.rotate(S.rot * Math.PI / 180);
  ctx.scale(sc, sc);
  ctx.translate(-cx, -cy);

  if (S.shadow > 0) {
    ctx.shadowColor   = `rgba(0,0,0,${Math.min(0.3+S.shadow*0.07,0.95)})`;
    ctx.shadowBlur    = S.shadow * 12;
    ctx.shadowOffsetY = S.shadow * 4;
  }

  const frameBg = getComputedStyle(frameEl).backgroundColor;
  ctx.fillStyle = frameBg || '#1c1c1e';
  roundRect(ctx, fx, fy, frameNatW, frameNatH, r);
  ctx.fill();

  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(fx + imgNatX, fy + imgNatY, imgNatW, imgNatH);
  ctx.clip();
  ctx.drawImage(userImg, fx + imgNatX, fy + imgNatY, imgNatW, imgNatH);
  ctx.restore();

  const barEl = frameEl.querySelector('.browser-bar, .terminal-bar');
  const barH  = barEl ? barEl.offsetHeight : 38;

  if (S.devtype === 'browser') {
    const barColor = getComputedStyle(barEl || frameEl).backgroundColor;
    ctx.fillStyle  = barColor;
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, frameNatW, barH);
    ctx.clip();
    roundRect(ctx, fx, fy, frameNatW, frameNatH, r);
    ctx.fill();
    ctx.restore();

    const dotsEl = frameEl.querySelector('#browser-dots');
    if (dotsEl && dotsEl.style.display !== 'none') {
      const dotY = fy + barH / 2;
      [['#ff5f57',14],['#febc2e',32],['#28c840',50]].forEach(([fill,ox]) => {
        ctx.beginPath(); ctx.arc(fx+ox, dotY, 5.5, 0, Math.PI*2);
        ctx.fillStyle = fill; ctx.fill();
      });
    }
    const addrEl = frameEl.querySelector('#browser-addr');
    if (addrEl && addrEl.style.display !== 'none') {
      const urlW = frameNatW * 0.45;
      const urlX = fx + frameNatW/2 - urlW/2;
      const urlY = fy + 6;
      const urlH = barH - 12;
      const isDark = !S.browserTheme.startsWith('wt');
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
      roundRect(ctx, urlX, urlY, urlW, urlH, 4);
      ctx.fill();
      const urlTextEl = frameEl.querySelector('#browser-url-txt');
      if (urlTextEl && urlTextEl.style.visibility !== 'hidden') {
        ctx.fillStyle    = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
        ctx.font         = `${Math.max(urlH*0.55,9)}px Inter,sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(urlTextEl.textContent, urlX+urlW/2, urlY+urlH/2, urlW-10);
      }
    }

  } else if (S.devtype === 'device' && S.device === 'terminal') {
    const dotY = fy + barH / 2;
    [['#ff5f57',14],['#febc2e',32],['#28c840',50]].forEach(([fill,ox]) => {
      ctx.beginPath(); ctx.arc(fx+ox, dotY, 5.5, 0, Math.PI*2);
      ctx.fillStyle = fill; ctx.fill();
    });
    const titleEl = frameEl.querySelector('#terminal-title');
    if (titleEl) {
      ctx.fillStyle    = 'rgba(255,255,255,0.5)';
      ctx.font         = '11px Inter,sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(titleEl.textContent, fx + frameNatW/2, fy + barH/2);
    }
  }

  ctx.restore();
  return cv;
}

async function ensureH2C() {
  if (window.html2canvas) return;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function doExport() {
  if (!S.imgSrc) { toast('upload a screenshot first'); return; }
  toast('rendering…');
  if (S.imgSrc === 'code') await ensureH2C();
  try {
    const cv   = await captureStage(S.res);
    const mime = { png:'image/png', jpg:'image/jpeg', webp:'image/webp' };
    const base = S.fileName ? S.fileName.replace(/\.[^.]+$/, '') : 'screenshot';
    const a    = document.createElement('a');
    a.download = `${base}.${S.fmt}`;
    a.href     = cv.toDataURL(mime[S.fmt], 0.95);
    a.click();
    toast('exported ✓');
  } catch(e) { toast('export failed'); console.error(e); }
}

async function doCopy() {
  if (!S.imgSrc) { toast('upload first'); return; }
  toast('copying…');
  if (S.imgSrc === 'code') await ensureH2C();
  try {
    const cv = await captureStage(2);
    cv.toBlob(async b => {
      try { await navigator.clipboard.write([new ClipboardItem({'image/png': b})]); toast('copied ⎘'); }
      catch { toast('clipboard not available'); }
    });
  } catch(e) { toast('capture failed'); console.error(e); }
}

function doReset() {
  S.imgSrc = null; S.fileName = null; S.devtype = 'browser';
  document.getElementById('file-in').value = '';
  ['frame-img-browser','frame-img-terminal','frame-img-phone','frame-img-tablet','frame-img-bare'].forEach(id => {
    document.getElementById(id).src = '';
  });
  const fc = document.getElementById('frm-code'); if (fc) fc.style.display = 'none';
  document.getElementById('hdr-file').textContent      = 'no file loaded';
  document.getElementById('empty-state').style.display = 'flex';
  document.getElementById('mockup').style.display      = 'none';
  document.getElementById('cnv-bar').style.display     = 'none';
  toast('reset');
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}

const CODE_THEMES = {
  dark:     { bg: '#0d0d0d', bar: '#111111', text: '#abb2bf' },
  midnight: { bg: '#080c18', bar: '#0c1020', text: '#8bacd8' },
  light:    { bg: '#f8f8f8', bar: '#efefef', text: '#24292e' },
  monokai:  { bg: '#272822', bar: '#1e1f1c', text: '#f8f8f2' },
};

const KW = {
  js:   /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|null|undefined|true|false|void|delete|yield)\b/g,
  ts:   /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|null|undefined|true|false|void|delete|yield|interface|type|enum|implements|declare|namespace|readonly|abstract|public|private|protected)\b/g,
  py:   /\b(def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|pass|break|continue|and|or|not|in|is|lambda|yield|global|nonlocal|True|False|None|async|await)\b/g,
  bash: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|cd|ls|grep|sed|awk|cat|rm|mv|cp|mkdir|export|source|local|readonly|shift|set|unset)\b/g,
  go:   /\b(func|var|const|type|struct|interface|map|chan|go|defer|return|if|else|for|range|switch|case|break|continue|fallthrough|import|package|select|nil|true|false|iota)\b/g,
  rust: /\b(fn|let|mut|const|struct|enum|impl|trait|use|mod|pub|priv|return|if|else|for|while|loop|match|break|continue|self|Self|super|crate|true|false|None|Some|Ok|Err|async|await)\b/g,
};

function detectLang(code) {
  const fn = (document.getElementById('inp-code-filename')?.value || '').toLowerCase();
  if (/\.tsx?$/.test(fn) || /^(import |export |const |let |function |class )/.test(code.trim())) return 'js';
  if (/\.py$/.test(fn)   || /^(def |class |import |from |@)/.test(code.trim()))                  return 'py';
  if (/\.sh$/.test(fn)   || /^(#!\/|echo |if \[)/.test(code.trim()))                             return 'bash';
  if (/\.go$/.test(fn)   || /^(package |func )/.test(code.trim()))                               return 'go';
  if (/\.rs$/.test(fn)   || /^(fn |impl |struct )/.test(code.trim()))                            return 'rust';
  if (/\.html?$/.test(fn)|| /<\w/.test(code))   return 'html';
  if (/\.json$/.test(fn) || /^\s*[{[]/.test(code)) return 'json';
  return 'js';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function tokenizeLine(raw, lang) {
  if (lang === 'html') {
    return escHtml(raw)
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tok-tag">$2</span>')
      .replace(/\s([\w-]+)=/g, ' <span class="tok-attr">$1</span>=')
      .replace(/&lt;!--.*?--&gt;/g, m => `<span class="tok-cmt">${m}</span>`);
  }
  if (lang === 'json') {
    return escHtml(raw)
      .replace(/"([^"]+)"(\s*:)/g,     '<span class="tok-fn">"$1"</span>$2')
      .replace(/(:)\s*"([^"]*)"/g,     '$1 <span class="tok-str">"$2"</span>')
      .replace(/(:)\s*(-?\d+\.?\d*)/g, '$1 <span class="tok-num">$2</span>')
      .replace(/(:)\s*(true|false|null)/g, '$1 <span class="tok-kw">$2</span>');
  }

  const cmtRe = (lang === 'py' || lang === 'bash') ? /(#.*)$/ : /(\/\/.*)$/;
  const cmtM  = raw.match(cmtRe);
  let cmtSuffix = '';
  let src = raw;
  if (cmtM) { cmtSuffix = `<span class="tok-cmt">${escHtml(cmtM[1])}</span>`; src = raw.slice(0, cmtM.index); }

  let r = escHtml(src);
  r = r.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, m => `\x00s${m}\x01`);
  r = r.replace(/\b(-?\d+\.?\d*)\b/g, m => `\x00n${m}\x01`);
  r = r.replace(new RegExp((KW[lang] || KW.js).source, 'g'), m => `\x00k${m}\x01`);
  r = r.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, m => `\x00c${m}\x01`);
  r = r.replace(/\b([a-z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, m => `\x00f${m}\x01`);
  r = r
    .replace(/\x00s([\s\S]*?)\x01/g, '<span class="tok-str">$1</span>')
    .replace(/\x00n([\s\S]*?)\x01/g, '<span class="tok-num">$1</span>')
    .replace(/\x00k([\s\S]*?)\x01/g, '<span class="tok-kw">$1</span>')
    .replace(/\x00c([\s\S]*?)\x01/g, '<span class="tok-cls">$1</span>')
    .replace(/\x00f([\s\S]*?)\x01/g, '<span class="tok-fn">$1</span>');
  return r + cmtSuffix;
}

function renderCodeSnippet() {
  const code = document.getElementById('code-input').value;
  if (!code.trim()) return;
  let lang = document.getElementById('code-lang').value;
  if (lang === 'auto') lang = detectLang(code);
  const lineNos  = document.getElementById('tog-lineno').checked;
  const showFn   = document.getElementById('tog-filename').checked;
  const filename = document.getElementById('inp-code-filename').value;

  document.getElementById('code-frame-filename').textContent    = filename;
  document.getElementById('code-frame-filename').style.display  = showFn ? '' : 'none';

  const lines = code.split('\n');
  while (lines.length > 1 && lines[lines.length - 1].trim() === '') lines.pop();
  let lnHtml = '', codeHtml = '';
  lines.forEach((ln, i) => {
    lnHtml   += (i + 1) + '\n';
    codeHtml += tokenizeLine(ln, lang) + '\n';
  });

  document.getElementById('code-frame-body').innerHTML =
    `<pre class="code-pre">${lineNos ? `<span class="ln-col">${lnHtml}</span>` : ''}<span class="code-col">${codeHtml}</span></pre>`;

  applyCodeTheme();
}

function applyCodeTheme() {
  const theme = document.getElementById('code-theme').value;
  const t     = CODE_THEMES[theme];
  const stage = document.getElementById('ss-stage');
  const frame = document.getElementById('frm-code');
  const bar   = document.getElementById('code-frame-bar');
  const body  = document.getElementById('code-frame-body');

  ['dark','midnight','light','monokai'].forEach(n => {
    stage.classList.remove('code-theme-' + n);
    frame?.classList.remove('code-theme-' + n);
  });
  stage.classList.add('code-theme-' + theme);
  frame?.classList.add('code-theme-' + theme);
  if (bar)   bar.style.background    = t.bar;
  if (body)  { body.style.background = t.bg; body.style.color = t.text; }
  if (frame) frame.style.background  = t.bg;
}

function useCodeSnippet() {
  const code = document.getElementById('code-input').value;
  if (!code.trim()) { toast('paste some code first'); return; }
  S.imgSrc   = 'code';
  S.fileName = document.getElementById('inp-code-filename').value || 'code';
  S.devtype  = 'code';
  renderCodeSnippet();
  document.getElementById('empty-state').style.display  = 'none';
  document.getElementById('mockup').style.display       = 'inline-flex';
  document.getElementById('cnv-bar').style.display      = 'flex';
  document.getElementById('hdr-file').textContent       = S.fileName;
  applyDevice(); applySSBG(); applyRadius(); applyShadow(); applyOpacity(); applyTransform();
  toast('code loaded ✓');
}