// Kakao-Reise · Kapitel 1 · Der erste Samen
// Reines HTML/SVG/JavaScript, keine Bibliothek, kein Server nötig.
(() => {
  const I = window.INHALT;
  // „Maya Munay“ immer in einer Zeile (Wunsch Yilmaz): geschütztes Leerzeichen in allen Texten; die Stimmen finden ihre Sätze trotzdem
  (function mayaMunayZusammen() {
    const NB = 'Maya\u00a0Munay', tausche = o => { for (const k in o) { if (typeof o[k] === 'string') o[k] = o[k].replace(/Maya Munay/g, NB); else if (o[k] && typeof o[k] === 'object') tausche(o[k]); } };
    tausche(I);
    const S = window.STIMMEN; if (S) for (const k of Object.keys(S)) if (k.includes('Maya Munay')) S[k.replace(/Maya Munay/g, NB)] = S[k];
  })();
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const SCHNELL = /schnell/.test(location.search); // zum Testen: index.html?schnell
  const RUHIG = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const warte = ms => new Promise(r => setTimeout(r, SCHNELL ? ms / 10 : ms));

  const buehne = $('#buehne'), baum = $('#baum'), dialog = $('#dialog');

  // ---------- Bühne an Fenstergröße anpassen ----------
  let massstab = 1, BREITE = 1600, O = 0;   // Bühnenbreite passt sich breiten Handys an (O = halber Zuwachs)
  // ?panorama: zeigt die ganze Welt (2600 × 900) ohne Figuren und Knöpfe – nur als Vorlage für das gemalte Weltbild
  const PANORAMA = /panorama/.test(location.search);
  if (PANORAMA) document.body.classList.add('panorama');
  // Breite Handys (quer) zeigen mehr vom Wald statt schwarzer Ränder: Bühne 1600–2560 px breit, immer 900 hoch
  function skaliere() {
    if (PANORAMA) return;
    const ziel = innerHeight > 0 ? 900 * innerWidth / innerHeight : 1600;
    BREITE = Math.round(Math.max(1600, Math.min(2560, ziel))); O = (BREITE - 1600) / 2;   // bis fast zur ganzen Weltbreite (2600)
    buehne.style.width = BREITE + 'px';
    massstab = Math.min(innerWidth / BREITE, innerHeight / 900);
    buehne.style.transform = `translate(-50%, -50%) scale(${massstab})`;
    document.body.classList.toggle('handy', massstab < .62);   // kleine Bildschirme: größere Schrift
    if (window.KAMERA) { const K = window.KAMERA; K.min = -500 + O; K.max = 500 - O; K.o = O; K.breite = BREITE;
      K.ziel = Math.max(K.min, Math.min(K.max, K.ziel)); K.x = Math.max(K.min, Math.min(K.max, K.x)); }
  }

  // Gemalte Figuren (Kakaobaum, Kolibri) nutzen, sobald sie geladen sind
  if (!PANORAMA && !/svg/.test(location.search)) {
    const fb = new Image(); fb.onload = () => { buehne.classList.add('mit-figuren'); $('#baumgesicht').hidden = false; }; fb.src = 'bilder/platzhalter/figuren/baum5.webp';
  }
  // Wellen und wiegende Kronen kosten Rechenleistung: kurz die Bildrate messen, auf schwachen Geräten abschalten
  if (!PANORAMA) {
    let n = 0, t0 = 0;
    const miss = t => { if (!t0) t0 = t; n++; if (t - t0 < 3000) requestAnimationFrame(miss); else if ((t - t0) / n > 30) buehne.classList.add('sparsam'); };
    setTimeout(() => requestAnimationFrame(miss), 2500);
  }
  // ?flach: Vergleich ohne Tiefen-Paket (Luftperspektive, Blätter vorn, Lichtstrahlen, Bildrand)
  if (/flach/.test(location.search)) {
    document.body.classList.add('flach');
    $$('.gemalt img, .gemalt image').forEach(b => { for (const a of ['src', 'href']) if (b.getAttribute(a)) b.setAttribute(a, b.getAttribute(a).replace('welt-tief.jpg', 'welt.jpg')); });
  }
  // Gemaltes Weltbild nutzen, sobald es geladen ist (?svg zeigt die gezeichnete Landschaft)
  if (!PANORAMA && !/svg/.test(location.search)) {
    const wb = $('.gemalt img'), an = () => buehne.classList.add('mit-weltbild');
    if (wb.complete && wb.naturalWidth) an(); else wb.addEventListener('load', an);
  }

  // ---------- Kamera und Parallax ----------
  // Die Welt ist breiter als der Bildschirm (−500 … 2100). Umschauen: Maus an den Rand, Pfeiltasten,
  // mit dem Finger/der Maus ziehen oder die Pfeil-Knöpfe. Jede Ebene wandert nach ihrer Tiefe (data-kamera).
  const ebenen = $$('[data-tiefe]').map(el => ({ el, t: PANORAMA ? 0 : +el.dataset.tiefe, k: PANORAMA ? 1 : +(el.dataset.kamera ?? 1) }));
  // Start ganz links beim großen Baum – er spricht zuerst, so schwenkt der Blick nicht gleich von rechts nach links
  const KAM = { x: -500, ziel: -500, min: -500, max: 500, o: 0, breite: 1600 };
  window.KAMERA = KAM;
  addEventListener('resize', skaliere); skaliere();
  const klemme = x => Math.max(KAM.min, Math.min(KAM.max, x));
  const kameraZu = x => { KAM.ziel = klemme(x); };
  const umschauErlaubt = () => $('#titel').classList.contains('weg') && $('#erzaehlbild').hidden && $('#buch').hidden && $('#ende').hidden
    && $('#wunschfenster').hidden && $('#froschkonzert').hidden && $('#urkunde').hidden;
  const ziel = { x: 0, y: 0 }, ist = { x: 0, y: 0 };
  let rand = 0, zieh = null, gezogen = false;
  const aufBuehne = e => { const r = buehne.getBoundingClientRect(); return { x: (e.clientX - r.left) / massstab, y: (e.clientY - r.top) / massstab }; };
  addEventListener('pointermove', e => {
    ziel.x = (e.clientX / innerWidth - .5) * 2; ziel.y = (e.clientY / innerHeight - .5) * 2;
    const { x, y } = aufBuehne(e);
    rand = (e.pointerType === 'mouse' && y > 0 && y < 900 && !zieh && !e.target.closest?.('#tasche, #ablage, .flieger')) ? (x < 110 && x > -40 ? -(1 - x / 110) : x > BREITE - 110 && x < BREITE + 40 ? (x - (BREITE - 110)) / 110 : 0) : 0;
    if (zieh) { const dx = (e.clientX - zieh.x0) / massstab; if (Math.abs(dx) > 8) gezogen = true; if (gezogen) KAM.ziel = KAM.x = klemme(zieh.kam - dx); }
  });
  buehne.addEventListener('pointerleave', () => { rand = 0; });
  buehne.addEventListener('pointerdown', e => {
    gezogen = false;   // jeder neue Tipper beginnt ungezogen – sonst blieben Klicks nach einem Wisch hängen
    if (!umschauErlaubt() || e.target.closest('button, input, #dialog, #tasche, .wissenskarte, .papier-karte, #urkunde')) return;
    zieh = { x0: e.clientX, kam: KAM.x };
  });
  addEventListener('pointerup', () => { zieh = null; });
  addEventListener('keydown', e => {
    if (!umschauErlaubt() || e.target.closest?.('input')) return;
    if (e.key === 'ArrowLeft') kameraZu(KAM.ziel - 320);
    if (e.key === 'ArrowRight') kameraZu(KAM.ziel + 320);
  });
  const pfeilL = $('#pfeil-links'), pfeilR = $('#pfeil-rechts');
  pfeilL.onclick = () => kameraZu(KAM.ziel - 500);
  pfeilR.onclick = () => kameraZu(KAM.ziel + 500);
  function schleife(zeit) {
    const frei = umschauErlaubt();
    if (frei && rand) KAM.ziel = klemme(KAM.ziel + rand * 13);
    KAM.x += (KAM.ziel - KAM.x) * .07;
    const sx = RUHIG ? 0 : Math.sin(zeit / 4200) * .18, sy = RUHIG ? 0 : Math.cos(zeit / 5600) * .1;
    const k = RUHIG ? 0 : 1;
    ist.x += ((ziel.x * k + sx) - ist.x) * .05;
    ist.y += ((ziel.y * k + sy) - ist.y) * .05;
    for (const { el, t, k: kk } of ebenen) el.style.transform = `translate3d(${(-(KAM.x - O) * kk - ist.x * t * 24).toFixed(1)}px, ${(-ist.y * t * 10).toFixed(1)}px, 0)`;
    const l = !frei || KAM.x < KAM.min + 20, r = !frei || KAM.x > KAM.max - 20;
    if (pfeilL.hidden !== l) pfeilL.hidden = l;
    if (pfeilR.hidden !== r) pfeilR.hidden = r;
    platziereBlase();
    // Kapitel-Fenster weicht der Seite aus, die gerade ins Bild kommt: Blick wandert nach rechts → Fenster links, und umgekehrt.
    // So deckt es nie zu, wohin man gerade schaut (z. B. die Kokospalme ganz rechts, Tukan und Faultier ganz links).
    const kf = document.getElementById('kapitel-fertig');
    if (kf && !kf.hidden && Math.abs(KAM.ziel - KAM.x) > 25) { const r = KAM.ziel < KAM.x; if (kf.classList.contains('rechts') !== r) kf.classList.toggle('rechts', r); }
    requestAnimationFrame(schleife);
  }
  requestAnimationFrame(schleife);

  // Blätter ganz vorn werden durchsichtig, wenn man darauf zeigt (Maus) oder darauf tippt (Finger) – so bleibt die ganze Welt sichtbar.
  // Treffer nach der echten Blattform (Alpha), nicht nach dem Rechteck; weg erst, wenn der Zeiger das Rechteck verlässt (kein Flackern am Rand).
  const vornBlaetter = $$('.vorn-gemalt img'), blattMaske = new Map();
  vornBlaetter.forEach(img => {
    const mach = () => { try {
      const c = document.createElement('canvas'); c.width = 80; c.height = Math.max(1, Math.round(80 * img.naturalHeight / img.naturalWidth));
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, c.width, c.height);
      blattMaske.set(img, { d: x.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height });
    } catch (_) { /* als Datei geöffnet: dann zählt das Rechteck */ } };
    if (img.complete && img.naturalWidth) mach(); else img.addEventListener('load', mach);
  });
  const imRechteck = (img, e) => { const r = img.getBoundingClientRect(); return r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom ? r : null; };
  function blattTreffer(img, e) {
    const r = imRechteck(img, e); if (!r) return false;
    const m = blattMaske.get(img); if (!m) return true;
    const px = Math.floor((e.clientX - r.left) / r.width * m.w), py = Math.floor((e.clientY - r.top) / r.height * m.h);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = px + dx, y = py + dy; if (x >= 0 && y >= 0 && x < m.w && y < m.h && m.d[(y * m.w + x) * 4 + 3] > 40) return true;
    }
    return false;
  }
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    for (const img of vornBlaetter) {
      const an = img.classList.contains('durchsicht');
      if (!an && blattTreffer(img, e)) img.classList.add('durchsicht');
      else if (an && !imRechteck(img, e)) img.classList.remove('durchsicht');
    }
  });
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    for (const img of vornBlaetter) if (blattTreffer(img, e)) {
      img.classList.add('durchsicht'); clearTimeout(img.uhr); img.uhr = setTimeout(() => img.classList.remove('durchsicht'), 5000);
    }
  });

  // (Blätter vorn stehen nur noch an Stellen, hinter denen nie etwas liegt – darum kein automatisches Freimachen mehr)

  // Name unter dem Mauszeiger (wie in klassischen Abenteuerspielen)
  const zname = $('#zeiger-name');
  buehne.addEventListener('pointermove', e => {
    const z = e.pointerType === 'mouse' && e.target.closest('.ueber, .versteck, #ablage, .ding-in-tasche');   // nur mit Maus
    if (!z) { zname.classList.remove('da'); return; }
    const { x, y } = aufBuehne(e);
    zname.textContent = z.getAttribute('aria-label');
    zname.style.left = x + 'px'; zname.style.top = (y - 34) + 'px';
    zname.classList.add('da');
  });
  buehne.addEventListener('pointerleave', () => zname.classList.remove('da'));

  addEventListener('pointerdown', () => { buehne.dataset.eingabe = 'zeiger'; }, true);
  addEventListener('keydown', () => { buehne.dataset.eingabe = 'tasten'; }, true);

  // ---------- Zeichnen: wiederkehrende Formen ----------
  let saat = 7;
  const zufall = () => { saat |= 0; saat = saat + 0x6D2B79F5 | 0; let t = Math.imul(saat ^ saat >>> 15, 1 | saat); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const zw = (a, b) => a + zufall() * (b - a);
  const wahl = arr => arr[Math.floor(zufall() * arr.length)];
  function el(name, attr, eltern) {
    const e = document.createElementNS(NS, name);
    for (const k in attr) e.setAttribute(k, attr[k]);
    if (eltern) eltern.append(e);
    return e;
  }

  // Baumkronen: erst Schatten, dann Grundfarbe, dann Licht von rechts oben (Sonne)
  function kronen(g, { x0, x1, y0, y1, n, r0, r1, farben, licht, schatten }) {
    const k = [];
    for (let i = 0; i < n; i++) k.push([zw(x0, x1), zw(y0, y1), zw(r0, r1), wahl(farben)]);
    k.sort((a, b) => a[1] - b[1]);
    if (schatten) for (const [x, y, r] of k) el('circle', { cx: (x - r * .12).toFixed(1), cy: (y + r * .24).toFixed(1), r: (r * .96).toFixed(1), fill: schatten }, g);
    for (const [x, y, r, f] of k) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), fill: f }, g);
    if (licht) for (const [x, y, r] of k) if (zufall() < .55) el('ellipse', { cx: (x + r * .34).toFixed(1), cy: (y - r * .42).toFixed(1), rx: (r * .36).toFixed(1), ry: (r * .24).toFixed(1), fill: licht, opacity: .5, transform: `rotate(-25 ${(x + r * .34).toFixed(1)} ${(y - r * .42).toFixed(1)})` }, g);
  }
  // Riesenbäume in der Ferne
  for (const x of [-170, 170, 520, 790, 1140, 1460, 1760]) {
    const top = zw(370, 430), g = $('#riesen');
    el('path', { d: `M${x} 580 C${x - 4} ${(580 + top) / 2} ${x + 6} ${top + 30} ${x + 2} ${top}`, stroke: '#3C6E5E', 'stroke-width': 6, fill: 'none' }, g);
    kronen(g, { x0: x - 60, x1: x + 60, y0: top - 20, y1: top + 14, n: 8, r0: 22, r1: 40, farben: ['#5A9A84', '#64A48C'], licht: '#9CCBAE', schatten: '#457E6C' });
  }
  kronen($('#kronen-hinten'), { x0: -280, x1: 1880, y0: 470, y1: 548, n: 96, r0: 34, r1: 72, farben: ['#5E9C86', '#6AA890', '#538F7A'], licht: '#A3D0B0', schatten: '#3E7466' });
  kronen($('#kronen-vorn'), { x0: -280, x1: 1880, y0: 548, y1: 592, n: 74, r0: 22, r1: 46, farben: ['#3F8050', '#4C8E56', '#3A744A'], licht: '#8FC86A', schatten: '#2C5E40' });
  const KRONE = { farben: ['#3E7A44', '#4C8A4C', '#5A9A50', '#346E40'], licht: '#A3D364', schatten: '#244E34' };
  kronen($('#schattenkrone'), { x0: 420, x1: 1220, y0: 40, y1: 260, n: 80, r0: 40, r1: 90, ...KRONE });
  kronen($('#schattenkrone'), { x0: 480, x1: 1160, y0: 220, y1: 310, n: 28, r0: 26, r1: 52, farben: ['#346E40', '#3E7A44'], licht: '#8CC25A' });
  kronen($('#ceibakrone'), { x0: -640, x1: -110, y0: -40, y1: 170, n: 54, r0: 50, r1: 100, ...KRONE });

  // Lianen, die aus den Kronen hängen
  for (const [x, y0, y1] of [[470, 250, 470], [560, 280, 520], [720, 300, 430], [890, 290, 560], [1080, 270, 500], [1190, 230, 420], [-520, 150, 520], [-360, 160, 380], [-180, 120, 450]]) {
    const g = el('g', { class: 'liane' }, $('#lianen'));
    g.style.animationDelay = `${-zw(0, 6)}s`;
    el('path', { d: `M${x} ${y0} C${x + 14} ${(y0 + y1) / 2} ${x - 12} ${y1 - 40} ${x + 4} ${y1}`, stroke: '#4E6B3A', 'stroke-width': 3 }, g);
    for (let t = y0 + 30; t < y1; t += zw(28, 46)) el('ellipse', { cx: x + zw(-6, 8), cy: t, rx: 7, ry: 3.5, fill: wahl(['#5E9A44', '#79B24E']), transform: `rotate(${zw(-40, 40).toFixed(0)} ${x} ${t})` }, g);
  }
  // Palmkrone auf der Anhöhe
  for (let i = 0; i < 12; i++) {
    const w = -175 + i * 15 + zw(-6, 6), L = zw(110, 150), g = el('g', { transform: `rotate(${w.toFixed(0)})` }, $('#palmkrone'));
    el('path', { d: `M0 0 C${L * .3} -16 ${L * .7} -10 ${L} 18 C${L * .65} 4 ${L * .3} 6 0 7Z`, fill: wahl(['#4E8E45', '#6FAE52', '#3E7A3C']) }, g);
    el('path', { d: `M4 3 C${L * .35} -6 ${L * .7} -2 ${L - 6} 15`, stroke: '#2E5A2E', 'stroke-width': 1.5, fill: 'none' }, g);
  }
  for (let i = 0; i < 9; i++) el('circle', { cx: zw(-14, 14).toFixed(0), cy: zw(6, 26).toFixed(0), r: 6, fill: wahl(['#8A4A2A', '#A05A32']) }, $('#palmkrone'));

  for (let i = 0; i < 46; i++) { // trockenes Gras im Sonnenfeld
    const x = zw(70, 540), y = zw(690, 790);
    el('path', { d: `M${x} ${y} l-5 -${zw(10, 18)} M${x} ${y} l1 -${zw(14, 22)} M${x} ${y} l7 -${zw(9, 15)}` }, $('#trockengras'));
  }
  for (let i = 0; i < 80; i++) { // vom Wind gebogenes Gras am Hang und auf der Anhöhe
    const x = zw(1260, 2200), y = (x < 1500 ? 560 - (x - 1260) * 0.18 : 494) + zw(10, 150);
    el('path', { d: `M${x} ${y} q5 -10 ${zw(12, 20)} -${zw(10, 16)} M${x + 4} ${y} q6 -8 ${zw(14, 22)} -${zw(6, 12)}` }, $('#hanggras'));
  }

  // Wolken: weich gemalt, Licht von oben, bläulicher Schatten
  // hoch = große Haufenwolke, die sich in zwei weiteren Stufen auftürmt
  function wolke(g, w, hoch = 0) {
    const teile = [];
    const reihe = (n, breite, dy, rf) => {
      for (let i = 0; i < n; i++) {
        const r = ((1 - Math.abs(i - (n - 1) / 2) / (n / 2)) * w * .17 + w * .08) * rf;
        teile.push([-breite / 2 + i * breite / (n - 1) + zw(-10, 10), dy - r * .55, r]);
      }
    };
    reihe(6, w, 0, 1);
    if (hoch) { reihe(4, w * .56, -w * .16, .92); reihe(2, w * .24, -w * .31, .86); }
    for (const [x, y, r] of teile) el('circle', { cx: x, cy: y + 12, r, fill: '#B4C6DD' }, g);
    el('ellipse', { cx: 0, cy: 8, rx: w * .56, ry: w * .07, fill: '#C9D7E8' }, g);
    for (const [x, y, r] of teile) el('circle', { cx: x, cy: y, r, fill: '#F2F6FA' }, g);
    for (const [x, y, r] of teile) el('circle', { cx: x + r * .12, cy: y - r * .22, r: r * .72, fill: '#FFFFFF' }, g);
    for (const [x, y, r] of teile) if (zufall() < .6) el('circle', { cx: x + r * .34, cy: y - r * .4, r: r * .34, fill: '#FFEBC8', opacity: .8 }, g);
  }
  [[300, 520, -30, 1], [140, 280, -100], [96, 180, -150], [290, 460, -215, 1], [170, 230, -290]].forEach(([y, w, start, hoch]) => {
    const g = el('g', { class: 'wolke-z' }, $('#wolken'));
    g.style.setProperty('--dauer', `${zw(300, 420).toFixed(0)}s`); g.style.animationDelay = `${start}s`;
    const innen = el('g', { transform: `translate(0 ${y})`, filter: 'url(#weich)' }, g); wolke(innen, w, hoch);
  });
  // zweites Ara-Paar: blau-gelb, fliegt in die andere Richtung
  const aras = $('.aras'), blau = aras.cloneNode(true);
  blau.setAttribute('class', 'aras blau');
  blau.innerHTML = blau.innerHTML.replaceAll('#3E7FC4', '#F2C12E').replaceAll('#C8352B', '#2A6FC0').replaceAll('#D63A2E', '#2F7FD0').replaceAll('#E8C33A', '#2A6FC0');
  aras.after(blau);

  function farn(eltern, x, y, winkel, laenge, farbe) {
    const aussen = el('g', { transform: `translate(${x} ${y}) rotate(${winkel})` }, eltern);
    const g = el('g', { class: 'farn' }, aussen);
    g.style.animationDelay = `${-zw(0, 6)}s`;
    el('path', { d: `M0 0 Q${laenge * .15} ${-laenge * .5} ${laenge * .45} ${-laenge}`, stroke: farbe, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
    for (let i = 1; i < 14; i++) {
      const t = i / 14, px = laenge * .45 * t * t + laenge * .15 * 2 * t * (1 - t), py = -laenge * t;
      const l = (1 - t) * laenge * .28 + 10;
      el('ellipse', { cx: px - l / 2, cy: py, rx: l / 2, ry: 6, transform: `rotate(18 ${px} ${py})`, fill: farbe }, g);
      el('ellipse', { cx: px + l / 2, cy: py, rx: l / 2, ry: 6, transform: `rotate(-18 ${px} ${py})`, fill: farbe }, g);
    }
  }
  const farne = $('#farne'), DUNKEL = ['#23402D', '#2C4C36', '#35593E', '#284633'];
  [[-40, 920, 28, 300], [20, 930, 48, 260], [-60, 900, 62, 220], [100, 940, 20, 200], [-700, 920, 30, 300], [-620, 940, 52, 240]]
    .forEach((f, i) => farn(farne, ...f, DUNKEL[i % 4]));
  [[1660, 920, -30, 310], [1600, 940, -52, 250], [1700, 880, -68, 230], [1500, 950, -16, 190], [2240, 930, -32, 300], [2300, 900, -60, 240]]
    .forEach((f, i) => farn(farne, ...f, DUNKEL[(i + 1) % 4]));
  // große dunkle Blätter rahmen das Bild, mit Lichtkante
  function grossblatt(g, x, y, winkel, L, farbe) {
    const aussen = el('g', { transform: `translate(${x} ${y}) rotate(${winkel})` }, g);
    const b = el('g', { class: 'farn' }, aussen); b.style.animationDelay = `${-zw(0, 6)}s`;
    el('path', { d: `M0 0 C${L * .3} ${-L * .44} ${L * .82} ${-L * .4} ${L} 0 C${L * .82} ${L * .4} ${L * .3} ${L * .44} 0 0Z`, fill: farbe }, b);
    el('path', { d: `M${L * .1} ${-L * .2} C${L * .35} ${-L * .4} ${L * .75} ${-L * .38} ${L * .96} ${-L * .06}`, stroke: '#7FAE5A', 'stroke-width': 3, fill: 'none', opacity: .55 }, b);
    el('path', { d: `M2 0 L${L * .96} 0`, stroke: '#18301F', 'stroke-width': 3 }, b);
  }
  const gb = $('#grossblaetter');
  [[-40, 900, -62, 270, '#1E3A28'], [70, 920, -34, 220, '#26452F'], [1650, 910, -122, 270, '#1E3A28'], [1560, 930, -146, 220, '#26452F'],
   [-660, 900, -50, 250, '#22402C'], [2280, 900, -132, 260, '#22402C']]
    .forEach(b => grossblatt(gb, ...b));
  el('path', { d: 'M120 -10 C140 120 96 220 128 330', stroke: '#1B3324', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, gb);
  for (const [x, y, w] of [[126, 120, 30], [110, 200, -40], [128, 290, 20]]) grossblatt(gb, x, y, w, 60, '#26452F');
  const heli = el('g', { transform: 'translate(190 890) scale(1.6)' }, gb);
  heli.innerHTML = '<path d="M0 0 L0 -70" stroke="#2E5A2E" stroke-width="4"/><path d="M0 -20 l22 -6 l-20 -6 Z M0 -34 l-22 -6 l20 -6Z M0 -48 l20 -6 l-18 -6Z M0 -62 l-16 -5 l14 -5Z" fill="#E0412E"/><path d="M0 -20 l18 -5 M0 -34 l-18 -5 M0 -48 l16 -5" stroke="#F2C14E" stroke-width="2.5"/>';

  // Farbtupfer am Boden: kleine Blumen und Bromelien an den Stämmen
  const bb = $('#bunte-blumen'), BLUMEN = ['#E0412E', '#F2C14E', '#E86AA6', '#9A5BD0', '#FF8A3D', '#FFF4E8'];
  for (const [cx, cy, n] of [[600, 850, 5], [1010, 840, 5], [960, 712, 3], [470, 870, 3], [140, 810, 4], [1250, 780, 4], [1430, 660, 4], [1580, 720, 3],
                             [1780, 528, 4], [1980, 540, 4], [-90, 860, 4], [-320, 880, 3], [-560, 760, 3]]) {
    for (let i = 0; i < n; i++) {
      const g = el('g', { transform: `translate(${(cx + zw(-46, 46)).toFixed(0)} ${(cy + zw(-10, 10)).toFixed(0)}) scale(${zw(.75, 1.25).toFixed(2)})` }, bb), f = wahl(BLUMEN);
      el('path', { d: 'M0 0 Q2 -8 0 -15', stroke: '#3E6B34', 'stroke-width': 1.8, fill: 'none' }, g);
      el('ellipse', { cx: 4, cy: -6, rx: 4, ry: 1.6, fill: '#5E9A48', transform: 'rotate(-30 4 -6)' }, g);
      for (let k = 0; k < 5; k++) el('ellipse', { cx: 0, cy: -19.5, rx: 2.8, ry: 4.6, fill: f, transform: `rotate(${k * 72} 0 -15)` }, g);
      el('circle', { cx: 0, cy: -15, r: 1.9, fill: f === '#F2C14E' ? '#C26547' : '#FFE08A' }, g);
    }
  }
  function bromelie(x, y, s, farbe) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, bb);
    for (const w of [-78, -48, -20, 20, 48, 78]) el('path', { d: 'M0 0 C-5 -10 -4 -24 0 -34 C4 -24 5 -10 0 0Z', fill: wahl(['#4E8A40', '#6FAE52', '#3E7A3C']), transform: `rotate(${w})` }, g);
    for (const w of [-24, 0, 24]) el('path', { d: 'M0 -4 C-3 -12 -3 -20 0 -27 C3 -20 3 -12 0 -4Z', fill: farbe, transform: `rotate(${w})` }, g);
  }
  bromelie(628, 470, 1.4, '#E0412E'); bromelie(1003, 400, 1.2, '#FF8A3D'); bromelie(-420, 430, 1.5, '#E86AA6');

  // Lichtstaub in den Sonnenstrahlen
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('i');
    s.style.cssText = `left:${zw(560, 1250).toFixed(0)}px;top:${zw(120, 780).toFixed(0)}px;--d:${zw(6, 12).toFixed(1)}s;animation-delay:${-zw(0, 12).toFixed(1)}s;--dx:${zw(-40, 40).toFixed(0)}px`;
    $('#lichtstaub').append(s);
  }

  // Kakaobaum: große, glänzende, hängende Blätter; rote junge Blätter an den Spitzen;
  // Blüten in Büscheln direkt am Stamm; gerippte Früchte in vielen Farben.
  function blatt(g, x, y, winkel, L, farbe, glanz) {
    const aussen = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${winkel.toFixed(0)})` }, g);
    const b = el('g', { class: 'blatt-wiegen' }, aussen);
    b.style.animationDelay = `${-zw(0, 4)}s`;
    el('path', { d: `M0 0 L${L * .06} 0`, stroke: '#5A463A', 'stroke-width': 1.4 }, b);
    el('path', { d: `M${L * .05} 0 C${L * .3} -${L * .15} ${L * .74} -${L * .14} ${L} 0 C${L * .74} ${L * .13} ${L * .3} ${L * .15} ${L * .05} 0Z`, fill: farbe }, b);
    if (glanz) el('path', { d: `M${L * .08} 0 C${L * .3} -${L * .13} ${L * .7} -${L * .12} ${L * .94} -${L * .01} C${L * .66} -${L * .04} ${L * .32} -${L * .04} ${L * .08} 0Z`, fill: glanz, opacity: .55 }, b);
    el('path', { d: `M${L * .06} 0 L${L * .97} 0`, stroke: 'rgba(30,40,20,.3)', 'stroke-width': .9 }, b);
  }
  const gruen = ['#4E8A40', '#5E9A48', '#6FAE52', '#3E7A3C', '#7FBA58'];
  const ROT = ['#C9826B', '#B8735E', '#D49A78'];
  // junger Baum (Stufe 2)
  [[151, 214, 150, 28, 0], [151, 216, 34, 26, 0], [150, 236, 120, 24, 1], [150, 240, 58, 24, 1], [149, 262, 140, 20, 1], [150, 266, 44, 20, 1], [151, 204, 96, 22, 0]]
    .forEach(([x, y, w, l, gr]) => blatt($('#blaetter-klein'), x, y, w, l, gr ? wahl(gruen) : wahl(ROT), gr ? '#A3D364' : '#E8B49A'));
  // Äste: von der Gabelung (Kakao teilt sich oben am Stamm fächerförmig)
  const AESTE = [[150, 180, 50, 110], [151, 177, 100, 64], [154, 177, 206, 64], [153, 180, 252, 110], [153, 176, 154, 92]];
  const punkt = ([x0, y0, x1, y1], t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 6];
  for (const ast of AESTE) {
    const links = ast[2] < 150, mitte = Math.abs(ast[2] - 152) < 6;
    for (let i = 0; i < 36; i++) {
      const t = zw(.2, 1.04), [x, y] = punkt(ast, t);
      const w = mitte ? zw(40, 140) : links ? zw(95, 165) : zw(15, 85);   // hängen nach unten-außen
      const hinten = zufall() < .35;
      blatt($(hinten ? '#blaetter-hinten' : '#blaetter-gross'), x + zw(-8, 8), y + zw(-12, 6), w, zw(38, 58),
        hinten ? wahl(['#2E5E34', '#3A6B3C', '#33643A']) : wahl(gruen), hinten ? null : '#A3D364');
    }
    // rote, schlaff hängende junge Blätter an der Astspitze
    const [sx, sy] = punkt(ast, 1);
    for (const w of [links ? 200 : -20, links ? 150 : 30, mitte ? 60 : links ? 175 : 5]) blatt($('#blaetter-gross'), sx + zw(-4, 4), sy + zw(-4, 4), w + zw(-12, 12), zw(24, 32), wahl(ROT), '#EBC0A6');
  }
  // Blüten: kleine Büschel direkt am Stamm und an den dicken Ästen
  const blueten = $('#blueten');
  [[146, 198], [156, 214], [143, 236], [158, 252], [144, 272], [157, 288], [150, 226], [131, 164], [170, 162], [112, 146], [190, 146], [152, 186]]
    .forEach(([x, y]) => {
      for (let n = 0; n < 3; n++) {
        const b = el('g', { transform: `translate(${(x + zw(-3.5, 3.5)).toFixed(1)} ${(y + zw(-3, 3)).toFixed(1)}) scale(${zw(.8, 1.1).toFixed(2)})` }, blueten);
        const inner = el('g', { class: 'bluete' }, b);
        for (let k = 0; k < 5; k++) el('ellipse', { cx: 0, cy: -3.4, rx: 1.8, ry: 3.4, fill: '#FBF1E8', stroke: '#E3B9B0', 'stroke-width': .5, transform: `rotate(${k * 72})` }, inner);
        el('circle', { r: 1.5, fill: '#D98A94' }, inner);
      }
    });
  // Früchte: gerippt, mit Glanz, hängen an kurzen Stielen
  const fruechte = $('#fruechte');
  [[142, 212, '#E0A84C', 8], [160, 246, '#C2473A', -6], [118, 154, '#8E3A4A', 14], [187, 152, '#B7C27A', -14], [90, 132, '#8DB054', 10], [214, 132, '#E8892E', -10], [144, 278, '#D9B44A', 4]]
    .forEach(([x, y, farbe, w]) => {
      const g = el('g', { transform: `translate(${x} ${y}) rotate(${w})` }, fruechte);
      const f = el('g', { class: 'frucht' }, g);
      el('path', { d: 'M0 -2 L0 -7', stroke: '#6B4A35', 'stroke-width': 2.4 }, f);
      el('path', { d: 'M0 0 C11 4 15 22 10 38 C7 47 3 50 0 52 C-3 50 -7 47 -10 38 C-15 22 -11 4 0 0Z', fill: farbe }, f);
      el('path', { d: 'M0 2 C2 18 2 34 0 50 M-5 4 C-9 18 -8 34 -5 44 M5 4 C9 18 8 34 5 44 M-9 10 C-12 20 -11 30 -9 36 M9 10 C12 20 11 30 9 36', stroke: 'rgba(40,25,15,.28)', 'stroke-width': 1.1, fill: 'none' }, f);
      el('ellipse', { cx: 4, cy: 16, rx: 3.4, ry: 10, fill: '#FFFFFF', opacity: .28, transform: 'rotate(-8 4 16)' }, f);
    });

  let alteStufe = 0;
  function setStufe(n) {
    const schatten = $('#baum-schatten');
    for (let i = 0; i <= 5; i++) { baum.classList.remove('stufe-' + i); schatten.classList.remove('stufe-' + i); }
    baum.classList.add('stufe-' + n); schatten.classList.add('stufe-' + n);
    // jeder Wachstumsschub: der Baum leuchtet kurz auf (Wunsch Yilmaz)
    // nach jedem neuen Wachstumsbild leuchtet der Baum einmal weiß auf (Wunsch Yilmaz)
    if (n > alteStufe && n > 0) {
      const licht = $('#baum-licht');
      setTimeout(() => {
        for (let i = 0; i <= 5; i++) licht.classList.remove('stufe-' + i);
        licht.classList.add('stufe-' + n); licht.classList.remove('blitzt'); void licht.getBBox(); licht.classList.add('blitzt');
        baum.classList.remove('schub'); void baum.getBBox(); baum.classList.add('schub');
        setTimeout(() => { licht.classList.remove('blitzt'); baum.classList.remove('schub'); }, 1500);
      }, SCHNELL ? 0 : 650);
    }
    alteStufe = n;
    // ganz ausgewachsen: funkeln und glitzern, beim ersten Mal kurz aufleuchten mit Glitzerklang
    const ff = $('.ueber-kakaofrucht'); if (ff) ff.hidden = n !== 5;
    const funkeln = $('#baum-funkeln');
    if (n === 5 && !funkeln.classList.contains('an')) {
      funkeln.classList.add('an'); baum.classList.add('aufleuchten'); setTimeout(() => baum.classList.remove('aufleuchten'), 2100);
      KLANG.spiel('funkeln');
    } else if (n < 5) funkeln.classList.remove('an');
  }

  // ---------- Kolibri fliegt ----------
  const kolibri = $('#kolibri');
  let kol = { x: -200, y: 260 };
  function setzeKolibri(x, y) { kol = { x, y }; kolibri.style.left = x + 'px'; kolibri.style.top = y + 'px'; }
  function fliege(x, y, ms) {
    const start = { ...kol }, t0 = performance.now(), dauer = SCHNELL ? ms / 10 : ms;
    kolibri.classList.toggle('links', x < start.x);
    KLANG.start('fluegel', dauer, start.x < -600 ? 'an' : x > 2200 ? 'ab' : 'mitte');
    return new Promise(res => {
      function schritt(t) {
        const p = Math.min(1, (t - t0) / dauer), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const bogen = Math.sin(p * Math.PI) * -90 + Math.sin(p * Math.PI * 4) * 14;
        setzeKolibri(start.x + (x - start.x) * e, start.y + (y - start.y) * e + bogen);
        KLANG.kolibriOrt(kol.x);
        if (p < 1) requestAnimationFrame(schritt); else { KLANG.stopp('fluegel'); res(); }
      }
      requestAnimationFrame(schritt);
    });
  }
  setzeKolibri(-800, 260);

  // ---------- Der sprechende Urwaldbaum ----------
  const gesicht = $('#baumgesicht'), FIGUR = n => `bilder/platzhalter/figuren/${n}.webp`;
  let mundUhr = null;
  function baumSpricht(an) {
    clearInterval(mundUhr);
    const muender = $$('#baumgesicht .mund, #dialog .bp .mund');
    if (!an) { muender.forEach(m => { m.src = FIGUR('baum-mund'); }); return; }
    const MUND = ['baum-mund-halb', 'baum-mund-offen', 'baum-mund-halb', 'baum-mund'];
    mundUhr = setInterval(() => { const n = FIGUR(MUND[Math.floor(Math.random() * MUND.length)]); muender.forEach(m => { m.src = n; }); }, 115);
  }
  (function blinzeln() { setTimeout(() => { const g = [gesicht, $('#dialog .bp')]; g.forEach(x => x?.classList.add('zu')); setTimeout(() => g.forEach(x => x?.classList.remove('zu')), 170); blinzeln(); }, 2800 + Math.random() * 3600); })();
  let baumNr = 0;
  gesicht.onclick = () => { if (gezogen || !dialog.hidden) return; ruf('wald', I.baumRuf[baumNr++ % I.baumRuf.length]); };

  // ---------- Dialog ----------
  // Text im Kasten mit Rahmen unten (Wunsch Yilmaz: liest sich besser als frei über der Figur)
  let tippUhr = null, sprechNr = 0;
  const datei = text => !SCHNELL && window.STIMMEN ? window.STIMMEN[text] : null;
  // Sprechblase: Der Kasten mit Rahmen sitzt am Sprecher, ein Zipfel zeigt auf ihn
  // (Kolibri: darüber oder darunter, Baum: rechts neben dem Gesicht). In der Legende und ohne sichtbaren Sprecher: unten.
  let sprechWer = null;
  function platziereBlase() {
    if (dialog.hidden) return;
    let anker = null;
    if ($('#erzaehlbild').hidden) anker = sprechWer === 'kolibri' ? kolibri : sprechWer === 'wald' && !gesicht.hidden ? gesicht : null;
    const b = buehne.getBoundingClientRect();
    let r = anker && anker.getBoundingClientRect();
    if (r) {
      const dx = KAM.x - KAM.ziel;   // dort, wo der Sprecher nach dem Kameraschwenk steht – die Blase springt nicht
      r = { l: (r.left - b.left) / massstab + dx, t: (r.top - b.top) / massstab, r: (r.right - b.left) / massstab + dx, u: (r.bottom - b.top) / massstab };
      if (r.r < 30 || r.l > BREITE - 30 || r.u < 0 || r.t > 900) r = null;
    }
    if (!r) { if (dialog.classList.contains('blase')) { dialog.classList.remove('blase', 'oben', 'unten', 'rechts'); dialog.style.left = dialog.style.top = ''; } return; }
    dialog.classList.add('blase');
    const w = dialog.offsetWidth, h = dialog.offsetHeight;
    let x, y, modus, zipfel;
    if (sprechWer === 'wald') {
      x = Math.min(BREITE - 20 - w, r.r + 28); y = Math.max(90, Math.min(880 - h, (r.t + r.u) / 2 - h / 2)); modus = 'rechts'; zipfel = (r.t + r.u) / 2 - y;
    } else {
      const mx = (r.l + r.r) / 2;
      x = Math.max(20, Math.min(BREITE - 20 - w, mx - w / 2));
      if (r.t - 26 - h > 86) { y = r.t - 26 - h; modus = 'oben'; } else { y = Math.min(880 - h, r.u + 26); modus = 'unten'; }
      zipfel = Math.max(28, Math.min(w - 28, mx - x));
    }
    x -= KAM.x - KAM.ziel; zipfel += sprechWer === 'wald' ? 0 : 0;   // während des Schwenks mit der Kamera mitwandern
    dialog.style.left = x.toFixed(0) + 'px'; dialog.style.top = y.toFixed(0) + 'px';
    dialog.style.setProperty('--zipfel', zipfel.toFixed(0) + 'px');
    for (const m of ['oben', 'unten', 'rechts']) if (dialog.classList.contains(m) !== (m === modus)) dialog.classList.toggle(m, m === modus);
  }
  function oeffne(wer) {
    const sp = I.sprecher[wer];
    sprechWer = wer;
    dialog.hidden = false;
    dialog.classList.toggle('ohne-bild', !sp.bild); dialog.classList.toggle('wer-wald', wer === 'wald');
    $('.sprecher', dialog).textContent = sp.name;
    clearInterval(tippUhr);
    KLANG.hoerAuf(); dialog.classList.remove('spricht'); kolibri.classList.remove('spricht');
    platziereBlase();
  }
  function sprichLaut(wer, text, nr, beiDauer) {
    const d = datei(text); if (!d) return null;
    dialog.classList.add('spricht'); if (wer === 'kolibri') kolibri.classList.add('spricht'); else if (wer === 'wald') baumSpricht(true);
    return KLANG.sprich(d, beiDauer).then(() => { if (wer === 'wald') baumSpricht(false); if (nr === sprechNr) { dialog.classList.remove('spricht'); kolibri.classList.remove('spricht'); } });
  }
  let kameraBleibt = false;   // z. B. beim Platz-Wählen: der Blick bleibt beim Platz, das Gesicht des Waldes erscheint im Rahmen
  function sage(wer, text, knoepfe = [{ text: 'Weiter', wert: true }]) {
    const nr = ++sprechNr;
    if (!kameraBleibt) { if (wer === 'wald' && !gesicht.hidden) kameraZu(-500); else if (Math.abs(KAM.ziel) > 220) kameraZu(0); }
    oeffne(wer);
    const textEl = $('.text', dialog), leiste = $('.knoepfe', dialog);
    leiste.innerHTML = '';
    return new Promise(res => {
      // der Text entfaltet sich im Tempo der Stimme: Zeichentakt = Länge der Aufnahme / Zahl der Zeichen
      let i = SCHNELL ? text.length : 0, takt = 24;
      const starte = () => { clearInterval(tippUhr); tippUhr = setInterval(() => { i += 1; male(); if (i >= text.length) fertig(); }, takt); };
      if (sprichLaut(wer, text, nr, dauer => { if (i < text.length && dauer > 0) { takt = Math.max(16, Math.min(160, dauer * 940 / text.length)); starte(); } })) takt = 60;
      const fertig = () => {
        clearInterval(tippUhr); i = text.length; male();
        if (leiste.children.length) return;
        knoepfe.forEach(k => {
          const b = document.createElement('button');
          b.className = 'knopf' + (k.hell ? ' hell' : '');
          b.textContent = k.text;
          b.onclick = e => { e.stopPropagation(); KLANG.hoerAuf(); dialog.classList.remove('spricht'); kolibri.classList.remove('spricht'); res(k.wert); };
          leiste.append(b);
        });
        leiste.classList.toggle('auswahl', knoepfe.length > 1);   // mehrere Antworten: sauber untereinander
        if (buehne.dataset.eingabe === 'tasten') leiste.firstChild?.focus({ preventScroll: true });   // Fokus-Rahmen nur für Tastatur
      };
      // noch nicht getippter Rest bleibt unsichtbar im Text, damit die Blase nicht wächst und springt
      function male() { textEl.textContent = text.slice(0, i); if (i < text.length) { const r = document.createElement('span'); r.className = 'rest'; r.textContent = text.slice(i); textEl.append(r); } }
      male();
      if (i >= text.length) fertig();
      else starte();
      dialog.onclick = e => { if (!e.target.closest('button') && i < text.length) fertig(); };
    });
  }
  // kurzer Zuruf im Kasten ohne Knopf (Tipps, Freude): schließt sich von selbst
  function ruf(wer, text) {
    const nr = ++sprechNr;
    oeffne(wer);
    $('.text', dialog).textContent = text; $('.knoepfe', dialog).innerHTML = '';
    return new Promise(res => {
      const weg = () => { if (nr === sprechNr) { dialog.hidden = true; dialog.classList.remove('spricht'); kolibri.classList.remove('spricht'); } res(); };
      dialog.onclick = () => { KLANG.hoerAuf(); weg(); };
      const laut = sprichLaut(wer, text, nr);
      if (laut) { laut.then(() => setTimeout(weg, 700)); setTimeout(weg, 12000); }
      else setTimeout(weg, SCHNELL ? 300 : 1600 + text.length * 50);
    });
  }
  async function reden(liste) { for (const [wer, text] of liste) await sage(wer, text); }
  const stille = () => { sprechNr++; clearInterval(tippUhr); dialog.hidden = true; dialog.classList.remove('spricht'); kolibri.classList.remove('spricht'); baumSpricht(false); };

  // ---------- Hinweise und Wissensbuch ----------
  // Gemalte Bilder: vorerst Platzhalter von Muse (bilder/platzhalter/), bis Ekadashi ihr Go für ihren Stil gibt
  const bild = id => `bilder/platzhalter/${id}.jpg`;
  const gelernt = [];
  let hinweisUhr;
  function zeigeHinweis(text, ms = 3200) {
    const h = $('#hinweis'); h.textContent = text; h.classList.add('da');
    clearTimeout(hinweisUhr); hinweisUhr = setTimeout(() => h.classList.remove('da'), SCHNELL ? 300 : ms);
  }
  function lerne(id, still = false) {
    if (gelernt.includes(id)) return;
    gelernt.push(id);
    $('#buch-zahl').textContent = gelernt.length;
    speichere();
    if (still) return;
    const k = $('#buch-knopf'); k.classList.remove('neu'); void k.offsetWidth; k.classList.add('neu');
    zeigeHinweis('Neu im Wissensbuch: ' + I.wissen[id].titel);
    KLANG.spiel('lernen');
  }
  $('#buch-knopf').onclick = () => {
    const liste = $('#buch-liste');
    liste.innerHTML = gelernt.length ? '' : '<p class="leer">Noch leer – entdecke die Welt, dann füllt sich dein Buch.</p>';
    gelernt.forEach(id => {
      const d = document.createElement('div'); d.className = 'eintrag mit-bild';
      d.innerHTML = `<img alt=""><div><h3></h3><p></p></div>`;
      d.querySelector('h3').textContent = I.wissen[id].titel; d.querySelector('p').textContent = I.wissen[id].text;
      const im = d.querySelector('img'); im.onerror = () => { im.remove(); d.classList.remove('mit-bild'); }; im.src = bild(id);
      liste.append(d);
    });
    $('#buch').hidden = false; $('#buch').scrollTop = 0; $('#buch-x').focus({ preventScroll: true });
  };
  // schließen: oben mit ✕ (bleibt beim Scrollen sichtbar), unten mit „Schließen“ oder mit der Esc-Taste
  const buchZu = () => { $('#buch').hidden = true; };
  $('#buch-zu').onclick = buchZu; $('#buch-x').onclick = buchZu;
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#buch').hidden) buchZu(); });

  // ---------- Spielschritte ----------
  function warteAufOrt() {
    return new Promise(res => $$('.ort').forEach(b => { b.onclick = () => res(b.dataset.ort); }));
  }
  function blitz() {
    const b = $('#blitz'); b.classList.remove('zuckt'); void b.offsetWidth; b.classList.add('zuckt');
    setTimeout(() => KLANG.spiel('donner'), SCHNELL ? 50 : 500 + Math.random() * 700);   // erst Licht, dann Donner
  }
  // voll = ein ganzer Tropentag: Abend, Nacht mit Sternen und Grillen, Gewitter mit Regen, Morgen
  async function tagUndNacht(voll, wachse) {
    const t = $('#tageszeit'), st = buehne.classList;
    if (!voll) {
      t.className = 'nacht'; st.add('nachts'); await warte(1100);
      t.className = ''; st.remove('nachts'); await warte(900);
      return;
    }
    t.className = 'abend'; wachse?.(1); await warte(1700);
    t.className = 'nacht'; st.add('nachts'); KLANG.start('nacht'); await warte(1800);
    st.add('regnet'); KLANG.start('regen'); await warte(1400);
    blitz(); await warte(900); wachse?.(2); await warte(1000);
    blitz(); await warte(1700);
    st.remove('regnet'); KLANG.stopp('regen'); await warte(1100);
    t.className = 'morgen'; st.remove('nachts'); KLANG.stopp('nacht'); wachse?.(3); await warte(1700);
    t.className = ''; await warte(700);
  }
  // Legende: gemalte Bilder liegen über der SVG-Zeichnung (die bleibt als Rückfall) und blenden weich ineinander
  const ebBilder = I.legende.map(teil => {
    const im = new Image(); im.alt = ''; im.dataset.bild = teil.bild; im.onerror = () => im.remove();
    im.onload = () => $('#erzaehlbild .eb-buehne').classList.add('mit-bildern');
    $('#erzaehlbild .eb-bilder').append(im); return im;
  });
  const legendeLaden = () => ebBilder.forEach((im, i) => { if (!im.getAttribute('src')) im.src = bild(I.legende[i].bild); });
  async function legende() {
    legendeLaden();
    const eb = $('#erzaehlbild');
    $('figcaption', eb).textContent = I.legendeHinweis;
    const erstes = ebBilder.find(im => im.dataset.bild === I.legende[0].bild);   // erstes Bild ohne Einblenden, sonst schimmert die Zeichnung durch
    if (erstes) { erstes.style.transition = 'none'; erstes.classList.add('an'); void erstes.offsetWidth; erstes.style.transition = ''; }
    eb.setAttribute('class', 'p0 zu'); eb.hidden = false;
    void eb.offsetWidth; eb.classList.remove('zu');
    await warte(80);
    let tropfUhr = null;
    for (const teil of I.legende) {
      eb.setAttribute('class', teil.bild);
      ebBilder.forEach(im => im.classList.toggle('an', im.dataset.bild === teil.bild));
      if (['p1', 'p2', 'p3'].includes(teil.bild)) KLANG.start('feuer'); else KLANG.stopp('feuer');
      clearInterval(tropfUhr);
      if (['p2', 'p3'].includes(teil.bild)) tropfUhr = setInterval(() => KLANG.spiel('tropfen'), 500);
      if (teil.bild === 'p5') KLANG.spiel('richtig');
      await sage('kolibri', teil.text);
    }
    clearInterval(tropfUhr); KLANG.stopp('feuer');
    stille(); eb.classList.add('zu'); await warte(700);
    eb.hidden = true; ebBilder.forEach(im => im.classList.remove('an'));
  }
  // ---------- Tasche (Inventar) ----------
  const tasche = $('#tasche'), faecher = $$('.fach', tasche);
  function flugZurTasche(von, fach, fertig) {   // kleines Abbild fliegt vom Fundort in die Tasche
    const b = buehne.getBoundingClientRect(), a = von.getBoundingClientRect(), z = fach.getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'flieger'; f.innerHTML = von.innerHTML;
    Object.assign(f.style, { left: (a.left - b.left) / massstab + 'px', top: (a.top - b.top) / massstab + 'px' });
    buehne.append(f);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      Object.assign(f.style, { left: (z.left - b.left) / massstab + 'px', top: (z.top - b.top) / massstab + 'px', transform: 'scale(.8)' });
    }));
    setTimeout(() => { f.remove(); fertig(); }, SCHNELL ? 60 : 750);
  }
  function inTasche(d) {
    const fach = faecher.find(f => !f.firstChild && !f.reserviert); fach.reserviert = true;
    tasche.hidden = false;
    flugZurTasche(d, fach, () => {
      const ding = document.createElement('button'); ding.className = 'ding-in-tasche';
      ding.setAttribute('aria-label', I.sammeldinge[d.dataset.ding]); ding.innerHTML = d.innerHTML; ding.quelle = d;
      fach.append(ding); fach.reserviert = false;
      fach.parentElement.querySelector('.fach-name').textContent = I.sammeldinge[d.dataset.ding];   // Name unter dem Ding
      tasche.classList.remove('neu'); void tasche.offsetWidth; tasche.classList.add('neu');
    });
  }

  // Suche: Die drei Dinge liegen jedes Spiel unter anderen Laubhaufen, Gräsern, Wurzeln oder Farnen.
  // Man darf sie schon vor der Bitte des Kolibris finden – dann landen sie im Rucksack, und die Geschichte passt sich an.
  let plaetze = null, gefundenDinge = 0, questLaeuft = false, questFund = null, leerNr = 0, fruehNr = 0;
  function versteckKlick(p) {
    if (gezogen) return;
    const d = p.ding;
    if (d && !d.classList.contains('gefunden')) {
      p.classList.add('offen'); p.classList.remove('tipp'); KLANG.spiel('rascheln');
      d.classList.add('gefunden');
      setTimeout(() => {
        // Schild direkt über dem Fundort: was wurde gesammelt?
        const schild = document.createElement('div'); schild.className = 'fund-schild';
        schild.textContent = '✓ ' + I.sammeldinge[d.dataset.ding];
        schild.style.left = (d.offsetLeft + d.offsetWidth / 2) + 'px'; schild.style.top = d.offsetTop + 'px';
        d.parentElement.append(schild); setTimeout(() => schild.remove(), SCHNELL ? 300 : 2800);
        inTasche(d); d.classList.add('in-tasche');
        gefundenDinge += 1; KLANG.spiel('sammeln');
        if (questLaeuft) questFund?.();
        else if (dialog.hidden) ruf(kolibriDa ? 'kolibri' : 'wald', I.fruehFund[fruehNr++ % I.fruehFund.length]);
      }, SCHNELL ? 60 : 650);
      return;
    }
    if (questLaeuft && !p.classList.contains('offen')) {
      p.classList.add('offen'); KLANG.spiel('rascheln');
      zeigeHinweis(I.suchenLeer[leerNr++ % I.suchenLeer.length], 2200);
    }
  }
  function sammeln() {
    const anzeige = $('#questanzeige'), dinge = $$('.sammel');
    if (gefundenDinge >= dinge.length) return Promise.resolve();   // schon alles beisammen
    questLaeuft = true;
    let tippUhr = null;
    const zeige = () => { anzeige.textContent = `${I.questZiel}: ${gefundenDinge} / ${dinge.length}`; };
    anzeige.hidden = false; zeige();
    zeigeHinweis(I.suchenStart, 4600);
    // Tipp aus dem Gespräch: Nach einer Weile ohne Fund fliegt der Kolibri zum Versteck, sagt, was er bemerkt hat,
    // das Versteck schimmert – und die Kamera schaut hin.
    const tippStellen = () => {
      clearTimeout(tippUhr);
      tippUhr = setTimeout(async () => {
        const p = plaetze.find(p => p.ding && !p.ding.classList.contains('gefunden'));
        if (!p) return;
        const px = parseFloat(p.style.left), py = parseFloat(p.style.top);
        kameraZu(px - 720);
        await fliege(px + 10, Math.max(150, py - 150), 1700);
        if (p.ding.classList.contains('gefunden')) return;
        p.classList.add('tipp');
        ruf('kolibri', I.suchenHinweis[p.dataset.art]);
      }, SCHNELL ? 2000 : 40000);   // Kolibri-Hilfe erst nach 40 s (Wunsch Yilmaz)
    };
    const jubel = () => { kolibri.classList.remove('looping'); void kolibri.offsetWidth; kolibri.classList.add('looping'); KLANG.spiel('richtig'); return ruf('kolibri', I.fundJubel[Math.min(gefundenDinge, 3) - 1]); };
    tippStellen();
    return new Promise(res => {
      questFund = () => {
        zeige();
        const freude = jubel();
        if (gefundenDinge >= dinge.length) { clearTimeout(tippUhr); questLaeuft = false; questFund = null; freude.then(() => setTimeout(res, SCHNELL ? 100 : 400)); }
        else tippStellen();
      };
    });
  }

  // Ablegen: Dinge aus der Tasche unter den Baum ziehen – oder erst Ding, dann Baum antippen.
  function ablegen() {
    const ablage = $('#ablage'), anzeige = $('#questanzeige');
    const dinge = $$('.ding-in-tasche'); let n = 0, gewaehlt = null;
    const zeige = () => { anzeige.textContent = `${I.ablegenZiel}: ${n} / ${dinge.length}`; };
    ablage.hidden = false; anzeige.hidden = false; zeige();
    const waehle = d => { gewaehlt?.classList.remove('gewaehlt'); gewaehlt = d; d?.classList.add('gewaehlt'); buehne.classList.toggle('traegt', !!d); };
    return new Promise(res => {
      const lege = ding => {
        const d = ding.quelle; waehle(null);
        const name = ding.closest('.platz')?.querySelector('.fach-name'); if (name) name.textContent = '';
        ding.remove();
        d.style.transition = 'none'; d.style.left = (690 + n * 70) + 'px'; d.style.top = '690px';
        d.classList.remove('in-tasche'); d.classList.add('gesammelt');
        KLANG.spiel('ablegen', n); n += 1; zeige();   // steigende Töne
        if (n === dinge.length) {
          ablage.hidden = true; tasche.hidden = true; anzeige.hidden = true;
          // alle drei beisammen: kurzes Funkeln und ein „Freigeschaltet“-Klang
          setTimeout(() => {
            KLANG.spiel('freigeschaltet');
            const f = document.createElement('div'); f.className = 'freischalt-funkeln';
            f.style.left = (690 + 70 + 50) + 'px'; f.style.top = '715px';
            f.innerHTML = '<i></i>' + '<b></b>'.repeat(10);
            $$('b', f).forEach((b, i) => { b.style.setProperty('--w', (i * 36) + 'deg'); b.style.animationDelay = (i % 3 * .05) + 's'; });
            $('#spielflaeche').append(f); setTimeout(() => f.remove(), 1700);
            dinge.forEach(d => { d.quelle?.classList.add('leuchtet'); });
          }, SCHNELL ? 30 : 350);
          setTimeout(res, SCHNELL ? 100 : 1700);
        }
      };
      const ueberAblage = e => { const r = ablage.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; };
      dinge.forEach(ding => {
        let start = null, geist = null, unterdruecken = false;
        ding.onpointerdown = e => { start = { x: e.clientX, y: e.clientY }; try { ding.setPointerCapture(e.pointerId); } catch (_) {} };
        ding.onpointermove = e => {
          if (!start) return;
          if (!geist && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
            geist = document.createElement('div'); geist.className = 'flieger geist'; geist.innerHTML = ding.innerHTML; buehne.append(geist); ding.classList.add('weg');
          }
          if (geist) { const p = aufBuehne(e); geist.style.left = (p.x - 50) + 'px'; geist.style.top = (p.y - 30) + 'px'; ablage.classList.toggle('drueber', ueberAblage(e)); }
        };
        ding.onpointerup = e => {
          if (geist) { unterdruecken = true; geist.remove(); geist = null; ding.classList.remove('weg'); ablage.classList.remove('drueber'); if (ueberAblage(e)) lege(ding); }
          start = null;
        };
        ding.onclick = () => { if (unterdruecken) { unterdruecken = false; return; } waehle(gewaehlt === ding ? null : ding); };
      });
      ablage.onclick = () => { if (gewaehlt) lege(gewaehlt); else zeigeHinweis(I.ablegenTipp); };
    });
  }
  function mueckenSchwarm(n = 22) {
    const box = $('#muecken');
    const p = () => `${zw(20, 180).toFixed(0)}px`;
    for (let i = 0; i < n; i++) {
      const m = document.createElement('i'); m.className = 'muecke';
      m.style.cssText = `--x1:${p()};--y1:${p()};--x2:${p()};--y2:${p()};--x3:${p()};--y3:${p()};--d:${zw(1.1, 2.4).toFixed(2)}s;animation-delay:${-zw(0, 2)}s`;
      box.append(m);
    }
  }
  async function quiz() {
    const q = I.quiz;
    for (let runde = 0; ; runde++) {
      const frage = runde === 0 ? q.frage : q.frageNochmal[(runde - 1) % q.frageNochmal.length];
      const wahlNr = await sage('kolibri', frage, q.antworten.map((a, i) => ({ text: a.text, wert: i, hell: true })));
      const a = q.antworten[wahlNr];
      KLANG.spiel(a.richtig ? 'richtig' : 'sanft');
      await sage('kolibri', a.echo);
      if (a.richtig) return;
    }
  }
  // Aufgabe erfüllt: Die Welt bleibt offen zum Umsehen, bis man „Kapitel beenden“ wählt.
  function kapitelFertig() {
    const f = $('#kapitel-fertig');
    $('h2', f).textContent = I.fertig.titel; $('.satz', f).textContent = I.fertig.text.replace('{wunsch}', pate.wunsch); $('button', f).textContent = I.fertig.knopf;
    const zeige = () => {
      const r = I.entdecken.length - ENTDECKEN.anzahl;
      $('.rest', f).textContent = r > 0 ? I.fertig.rest.replace('{r}', r) : I.fertig.alle;
    };
    zeige(); f.hidden = false; KLANG.spiel('richtig');
    const uhr = setInterval(zeige, 800);
    return new Promise(res => { $('button', f).onclick = () => { clearInterval(uhr); f.hidden = true; res(); }; });
  }
  function zeigeEnde() {
    const e = $('#ende');
    $('h1', e).textContent = I.ende.titel;
    $('.intro', e).textContent = I.ende.text;
    $('.unter', e).textContent = I.ende.weiter;
    const n = ENTDECKEN.anzahl, m = I.entdecken.length;
    $('.entdeckt', e).textContent = (n === m ? I.ende.alleEntdeckt : I.ende.entdeckt).replace('{n}', n).replace('{m}', m)
      + ` · ${I.bohnen.ziel}: ${bohnen} / ${BOHNEN.length}`;
    $('.paten-hinweis', e).textContent = I.ende.patenschaft;
    const w = $('#ende-wissen'); w.innerHTML = '';
    gelernt.forEach(id => { const s = document.createElement('span'); s.textContent = I.wissen[id].titel; w.append(s); });
    e.hidden = false; $('#nochmal').focus();
    KLANG.stopp('gnitzen'); KLANG.spiel('schluss');
  }
  $('#nochmal').onclick = () => { try { localStorage.removeItem(SPEICHER); } catch (_) {} location.reload(); };

  // Ton: Klick-Geräusch für alle Knöpfe, Ton an/aus
  document.addEventListener('pointerdown', e => { if (e.target.closest('button')) KLANG.spiel('klick'); });
  const tonKnopf = $('#ton-knopf');
  const tonZeigen = () => { tonKnopf.classList.toggle('aus', KLANG.stumm); tonKnopf.setAttribute('aria-pressed', String(!KLANG.stumm)); tonKnopf.setAttribute('aria-label', KLANG.stumm ? 'Ton einschalten' : 'Ton ausschalten'); };
  tonKnopf.onclick = () => { KLANG.an(); KLANG.setStumm(!KLANG.stumm); tonZeigen(); };
  tonZeigen();

  // ---------- Baumpatenschaft: Name und Wunsch, Urkunde, Sri Yantra, Segen, Patenstein ----------
  const pate = { name: '', wunsch: '' };
  function wunschSetzen() {
    const f = $('#wunschfenster'), W = I.wunschFenster, nameEl = $('#pate-name'), wunschEl = $('#pate-wunsch');
    $('h2', f).textContent = W.titel; $('.frage-name', f).textContent = W.fuerWen; $('.frage-wunsch', f).textContent = W.wunsch;
    nameEl.placeholder = W.fuerWenHinweis; wunschEl.placeholder = W.wunschHinweis; $('#wunsch-setzen').textContent = W.knopf;
    const v = $('.vorschlaege', f); v.innerHTML = '';
    W.vorschlaege.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t;
      b.onclick = () => { wunschEl.value = t; $$('button', v).forEach(x => x.classList.toggle('an', x === b)); KLANG.spiel('klick'); }; v.append(b); });
    f.hidden = false;
    return new Promise(res => {
      $('#wunsch-setzen').onclick = () => {
        pate.name = nameEl.value.trim() || W.standardName; pate.wunsch = wunschEl.value.trim() || W.standardWunsch;
        nameEl.blur(); wunschEl.blur(); f.hidden = true; KLANG.spiel('richtig');
        Object.assign(stand, pate); speichere(); res();
      };
    });
  }
  function zeigeUrkunde() {
    const u = $('#urkunde'), U = I.urkunde;
    $('.u-fuer', u).textContent = U.fuer; $('.u-name', u).textContent = pate.name;
    $('.u-mit', u).textContent = U.mit; $('.u-wunsch', u).textContent = `„${pate.wunsch}“`;
    $('.u-ort', u).textContent = `${U.ort} · ${new Date().toLocaleDateString('de-DE')} · ${U.gestaltung}`;
    u.classList.remove('weg', 'offen'); u.hidden = false; $('.u-zu', u).hidden = true;
  }
  $('#urkunde').onclick = () => { if ($('#urkunde').classList.contains('offen')) urkundeWeg(); else $('#dialog:not([hidden]) .knopf')?.click(); };   // Antippen = weiter bzw. schließen
  function urkundeWeg() { const u = $('#urkunde'); u.classList.add('weg'); setTimeout(() => { u.hidden = true; u.classList.remove('weg'); }, SCHNELL ? 60 : 600); }
  function zeigeStein() {
    const st = $('#patenstein');
    $('.stein-name', st).textContent = pate.name; $('.stein-wunsch', st).textContent = `„${pate.wunsch}“`;
    st.setAttribute('aria-label', `${I.steinName}: ${pate.name} – ${pate.wunsch}`); st.hidden = false;
  }
  // Antippen des Steins öffnet die Urkunde – mit „Schließen“
  $('#patenstein').onclick = () => {
    if (gezogen || !$('#urkunde').hidden) return;
    if (!dialog.hidden) { if ($('.knoepfe', dialog).children.length) return; stille(); KLANG.hoerAuf(); }   // ein kurzer Zuruf darf unterbrochen werden
    zeigeUrkunde(); const u = $('#urkunde'), zu = $('.u-zu', u);
    u.classList.add('offen'); zu.textContent = I.urkunde.zu; zu.hidden = false; KLANG.spiel('klick');
    zu.onclick = e => { e.stopPropagation(); urkundeWeg(); };
  };
  function segenVoegel() {
    ['ara-rot', 'ara-blau'].forEach((n, i) => {
      const v = document.createElement('div'); v.className = 'segen-vogel' + (i ? ' von-rechts' : '');
      v.innerHTML = [n, n + '-2', n + '-3'].map((b, k) => `<img class="f${k + 1}" src="${FIGUR(b)}" alt="">`).join(''); v.style.animationDelay = (i * .5) + 's';   // drei Flügelbilder
      $('#spielflaeche').append(v); setTimeout(() => v.remove(), SCHNELL ? 800 : 17000);
    });
    setTimeout(() => KLANG.spiel('segenVoegel'), SCHNELL ? 50 : 1400);   // echte Papageien-Aufnahmen, leise unter dem Lied
  }
  async function pflanzZeremonie() {
    const y = $('#yantra');
    y.classList.add('zeichnet'); KLANG.spiel('funkeln');
    await sage(...I.yantraSatz);   // der Wald erzählt vom Kraftsymbol, während es sich zeichnet
    stille();
    baum.classList.add('gepflanzt'); await warte(750); KLANG.spiel('plopp'); await warte(400);
    y.classList.add('leuchtet');
    await sage(...I.segenVor);
    segenVoegel();   // keine Glöckchen-Melodie darunter – sie lief in einem anderen Takt als der Gesang
    await sage('wald', I.segen);
    y.classList.remove('zeichnet', 'leuchtet'); y.classList.add('fertig');
    zeigeStein(); KLANG.spiel('stein');
    await sage(...I.steinSatz);
    stille();
  }

  // ---------- Der Kolibri erzählt: fliegt zum Ding und sagt bei jedem Antippen die nächste von drei Infos ----------
  let kolibriDa = false, kommentarLaeuft = false;
  const kommentarNr = {};
  async function kommentar(was, ort) {
    const liste = I.kommentare[was];
    if (!liste || !kolibriDa || kommentarLaeuft || !dialog.hidden || !$('#erzaehlbild').hidden) return;
    kommentarLaeuft = true;
    const n = kommentarNr[was] = ((kommentarNr[was] ?? -1) + 1) % liste.length;
    try {
      if (ort) {
        const zx = ort.x + (ort.x > kol.x ? -95 : 95), zy = Math.max(130, Math.min(560, ort.y - 120));
        if (Math.hypot(zx - kol.x, zy - kol.y) > 120) await fliege(zx, zy, SCHNELL ? 300 : 1300);
      }
      await ruf('kolibri', liste[n]);
    } finally { kommentarLaeuft = false; }
  }

  // ---------- Mini-Spiel: Froschkonzert ----------
  let konzertLaeuft = false;
  function froschkonzert() {
    if (konzertLaeuft || !dialog.hidden) return;
    konzertLaeuft = true;
    const k = $('#froschkonzert'), T = I.konzert, frs = $$('.konzert-frosch', k), zeile = $('.stand', k);
    $('h2', k).textContent = T.titel; $('.anleitung', k).textContent = T.anleitung; $('#konzert-zu').textContent = T.schliessen;
    k.hidden = false;
    let offen = true, darf = false, eingabe = [];
    const folge = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    const singe = i => { const f = frs[i]; f.classList.remove('singt'); void f.offsetWidth; f.classList.add('singt'); setTimeout(() => f.classList.remove('singt'), 380); KLANG.spiel('quaken', i); };
    const vorspielen = async () => {
      darf = false; zeile.textContent = T.zuhoeren; await warte(800);
      for (const i of folge) { if (!offen) return; singe(i); await warte(650); }
      zeile.textContent = T.du; eingabe = []; darf = true;
    };
    const zu = () => { offen = false; k.hidden = true; konzertLaeuft = false; };
    $('#konzert-zu').onclick = zu;
    frs.forEach((f, i) => { f.onclick = async () => {
      if (!darf) return;
      singe(i); eingabe.push(i);
      const n = eingabe.length - 1;
      if (eingabe[n] !== folge[n]) { darf = false; zeile.textContent = T.nochmal; await warte(1300); vorspielen(); return; }
      if (eingabe.length < folge.length) return;
      darf = false;
      if (folge.length >= 6) { zeile.textContent = T.geschafft; KLANG.spiel('richtig'); await warte(2800); zu(); return; }
      zeile.textContent = T.gut; KLANG.spiel('sammeln'); await warte(1100);
      folge.push(Math.floor(Math.random() * 4)); vorspielen();
    }; });
    vorspielen();
  }

  // ---------- Spielstand (automatisch, nur in diesem Browser) ----------
  const SPEICHER = 'kakao-reise-spielstand-1';
  const stand = { punkt: 'anfang', name: '', wunsch: '', bohnen: [], gelernt: [], entdeckt: [] };
  function speichere(punkt) {
    if (punkt) stand.punkt = punkt;
    stand.gelernt = gelernt.slice(); stand.entdeckt = window.ENTDECKEN ? ENTDECKEN.liste : [];
    if (SCHNELL) return;
    try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (_) {}
  }
  function geladen() {
    if (SCHNELL) return null;
    try { const st = JSON.parse(localStorage.getItem(SPEICHER) || 'null'); return st && st.punkt && st.punkt !== 'anfang' ? st : null; } catch (_) { return null; }
  }
  function wiederherstellen(st) {
    Object.assign(stand, st); pate.name = st.name || I.wunschFenster.standardName; pate.wunsch = st.wunsch || I.wunschFenster.standardWunsch;
    (st.gelernt || []).forEach(id => lerne(id, true));
    ENTDECKEN.setze(st.entdeckt || []);
    (st.bohnen || []).forEach(nr => { const b = $(`.bohne[data-nr="${nr}"]`); if (b) { b.remove(); bohnen += 1; } });
    stand.bohnen = [...(st.bohnen || [])];
    if (bohnen) { bohnenAnzeige.hidden = false; $('span', bohnenAnzeige).textContent = `${bohnen} / ${BOHNEN.length}`; }
    $('#yantra').classList.add('fertig'); baum.classList.add('gepflanzt'); zeigeStein();
    if (st.keimling) $('#keimling').hidden = false;
    if (st.punkt === 'gepflanzt') setStufe(4);
    else { setStufe(5); baum.classList.add('bestaeubt'); mueckenSchwarm(); KLANG.start('gnitzen'); }
    if (st.punkt === 'bestaeubt') { setzeKolibri(570, 470); kolibriDa = true; }
    if (st.punkt === 'fertig') { setzeKolibri(470, 360); kolibriDa = true; }
  }

  // ---------- Ablauf in drei Teilen (nach jedem Teil wird gespeichert) ----------
  async function teilPflanzen() {
    lerne('guertel');
    await warte(500);
    await reden(I.pflanzen);
    await reden(I.patenschaft);
    stille();
    await wunschSetzen();
    zeigeUrkunde();
    await sage(...I.urkundeSatz);
    urkundeWeg(); lerne('patenschaft');
    await sage(...I.ortWaehlen);
    stille();

    kameraZu(0);
    buehne.classList.add('waehlen');
    zeigeHinweis('Wähle einen Platz für deinen Samen');
    while (true) {
      const ort = await warteAufOrt();
      buehne.classList.remove('waehlen');
      kameraBleibt = true;
      try {
        if (ort === 'schatten') { await sage('wald', I.orte.schatten.text); break; }
        await sage('wald', I.orte[ort].text, [{ text: 'Anderen Platz wählen', wert: 1 }]);
      } finally { kameraBleibt = false; }   // fürs Sri Yantra schwenkt die Kamera wieder zum großen Baum
      stille(); kameraZu(0); buehne.classList.add('waehlen');
    }
    lerne('schatten');
    stille();

    await pflanzZeremonie();
    // ein ganzer Tropentag – der Baum wächst dabei: am Abend, im nächtlichen Regen, am Morgen
    sage('wald', I.wachsen[0][1], []);
    await tagUndNacht(true, n => { setStufe(n); KLANG.spiel('wachsen', n); });
    lerne('blaetter');
    await tagUndNacht(false);
    setStufe(4); KLANG.spiel('wachsen', 4);
    await warte(800);
    await sage(...I.wachsen[1]);
    lerne('blueten');
    stille();
  }
  async function teilKolibri() {
    await fliege(570, 470, 2800);
    kolibriDa = true;
    await reden(I.kolibriKommt);
    await legende();
    lerne('legende');

    await reden(I.quest.slice(0, 2));
    await sage('kolibri', gefundenDinge ? I.questSchon[Math.min(3, gefundenDinge)] : I.quest[2][1]);
    stille();
    buehne.classList.add('quest');
    await sammeln();
    buehne.classList.remove('quest');
    $('#questanzeige').hidden = true;
    kameraZu(0);
    if (Math.hypot(kol.x - 570, kol.y - 470) > 30) await fliege(570, 470, 1800);   // zurück zum Baum
    await reden(I.ablegen);
    stille();
    await ablegen();
    lerne('kompost');

    mueckenSchwarm(); KLANG.start('gnitzen');
    await warte(1800);
    baum.classList.add('bestaeubt');
    await warte(1600);
    setStufe(5); KLANG.spiel('wachsen', 5);
    lerne('gnitzen');
    await warte(900);
  }
  async function teilSchluss() {
    if (Math.hypot(kol.x - 570, kol.y - 470) > 30) await fliege(570, 470, 1500);
    await reden(I.bestaeubt);
    await quiz();
    await reden(I.abschied);
    stille();
    await fliege(470, 360, 1800);   // der Kolibri bleibt in der Nähe und erzählt weiter, bis das Kapitel beendet ist
  }
  async function ablauf() {
    const st = geladen();
    if (st) { $('#start').textContent = I.weiter; const nb = $('#neu-beginnen'); nb.textContent = I.neu; nb.hidden = false; }
    const wahl = await new Promise(r => { $('#start').onclick = () => r('weiter'); $('#neu-beginnen').onclick = () => r('neu'); });
    KLANG.an();
    [...I.pflanzen, ...I.patenschaft].forEach(([, t]) => KLANG.vorladen(datei(t)));   // erste Sätze schon holen
    $('#titel').classList.add('weg');
    let punkt = 'anfang';
    if (st && wahl === 'weiter') { wiederherstellen(st); punkt = st.punkt; await warte(700); }
    else { try { localStorage.removeItem(SPEICHER); } catch (_) {} }
    if (punkt === 'anfang') { await teilPflanzen(); speichere('gepflanzt'); punkt = 'gepflanzt'; }
    if (punkt === 'gepflanzt') { await teilKolibri(); speichere('bestaeubt'); punkt = 'bestaeubt'; }
    if (punkt === 'bestaeubt') { await teilSchluss(); speichere('fertig'); }
    await kapitelFertig();
    kolibriDa = false; stille(); await fliege(2500, 160, 3000);   // erst jetzt fliegt der Kolibri davon
    zeigeEnde();
  }

  // ---------- Besonderer Moment für alle 7 Kakaobohnen ----------
  // Die Bohnen schweben golden herbei, kreisen um den Kakaobaum, sinken in die Erde – und daneben keimt ein neuer kleiner Baum.
  async function bohnenMoment() {
    while (!dialog.hidden && $('.knoepfe', dialog).children.length) await warte(500);   // laufendes Gespräch nicht unterbrechen
    stille(); kameraZu(0); await warte(700);
    const M = { x: 800, y: 560 }, flieger = [];
    for (let i = 0; i < 7; i++) {
      const b = document.createElement('div'); b.className = 'bohne-flug'; b.innerHTML = `<img src="${FIGUR('bohne')}" alt="">`;
      b.style.left = (KAM.x - O + 150 + Math.random() * (BREITE - 300)) + 'px'; b.style.top = (120 + Math.random() * 300) + 'px';
      $('#spielflaeche').append(b); flieger.push(b);
    }
    KLANG.spiel('funkeln');
    await warte(60);
    const kreis = w => flieger.forEach((b, i) => { const a = w + i / 7 * Math.PI * 2; b.style.left = (M.x + Math.cos(a) * 190) + 'px'; b.style.top = (M.y + Math.sin(a) * 70) + 'px'; });
    kreis(0); await warte(1700);
    // einmal ganz um den Baum kreisen
    flieger.forEach(b => { b.style.transition = 'none'; });
    await new Promise(fertig => { const t0 = performance.now(), dauer = SCHNELL ? 200 : 2200;
      const schritt = t => { const p = Math.min(1, (t - t0) / dauer); kreis(p * Math.PI * 2); if (p < 1) requestAnimationFrame(schritt); else fertig(); };
      requestAnimationFrame(schritt); });
    // in die Erde sinken, dort wo der neue Baum keimt
    flieger.forEach(b => { b.style.transition = ''; b.style.left = '923px'; b.style.top = '752px'; });
    await warte(1300);
    flieger.forEach(b => b.classList.add('versinkt'));
    KLANG.spiel('plopp'); await warte(700);
    flieger.forEach(b => b.remove());
    $('#keimling').hidden = false; KLANG.spiel('wachsen', 1); KLANG.spiel('richtig');
    stand.keimling = true; lerne('bohnen'); speichere();
    zeigeHinweis(I.bohnen.alle, 4200);
    await warte(900);
    if (dialog.hidden) ruf('wald', I.bohnen.moment);
  }

  // ---------- Kakaobohnen-Sammelei: 7 Bohnen über die ganze Welt verteilt ----------
  const BOHNEN = [[-485, 600], [-140, 642], [330, 762], [575, 694], [1110, 762], [1500, 604], [2040, 482]];
  let bohnen = 0;
  const bohnenAnzeige = document.createElement('div'); bohnenAnzeige.id = 'bohnen-zahl'; bohnenAnzeige.hidden = true;
  bohnenAnzeige.innerHTML = `<img src="${FIGUR('bohne')}" alt=""><span></span>`;
  $('#leiste').prepend(bohnenAnzeige);
  BOHNEN.forEach(([x, y], i) => {
    const b = document.createElement('button'); b.className = 'bohne'; b.dataset.nr = i; b.setAttribute('aria-label', 'Kakaobohne');
    b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.animationDelay = (-i * 1.3) + 's';
    b.innerHTML = `<img src="${FIGUR('bohne')}" alt="">`;
    b.onclick = () => {
      if (gezogen || b.classList.contains('gefunden')) return;
      b.classList.add('gefunden'); bohnen += 1; KLANG.spiel('sammeln'); stand.bohnen.push(i); speichere();
      bohnenAnzeige.hidden = false; $('span', bohnenAnzeige).textContent = `${bohnen} / ${BOHNEN.length}`;
      bohnenAnzeige.classList.remove('neu'); void bohnenAnzeige.offsetWidth; bohnenAnzeige.classList.add('neu');
      setTimeout(() => b.remove(), 900);
      // kleines Schild über der Bohne: blendet ein, steigt auf, blendet aus
      const schild = document.createElement('div'); schild.className = 'bohnen-schild';
      schild.innerHTML = `<img src="${FIGUR('bohne')}" alt=""><span></span><b></b>`;
      $('span', schild).textContent = I.bohnen.gefunden; $('b', schild).textContent = `${bohnen} / ${BOHNEN.length}`;
      schild.style.left = (parseFloat(b.style.left) + 11) + 'px'; schild.style.top = (parseFloat(b.style.top) - 12) + 'px';
      $('#spielflaeche').append(schild); setTimeout(() => schild.remove(), SCHNELL ? 400 : 2600);
      if (bohnen === BOHNEN.length) setTimeout(bohnenMoment, SCHNELL ? 100 : 1200);
    };
    $('#spielflaeche').append(b);
  });

  // Entdecken: Klick-Überraschungen und Verstecke (entdecken.js)
  ENTDECKEN.start({ I, lerne, zeigeHinweis, SCHNELL, bild, dialogOffen: () => !dialog.hidden, gezogen: () => gezogen, baumSpricht, kommentar, froschkonzert });
  $$('.sammel').forEach(d => ENTDECKEN.gemalt(d, 'ding-' + d.dataset.ding, 100, 60, d.innerHTML));   // gemalte Sammeldinge
  plaetze = ENTDECKEN.verstecke($$('.sammel'));
  plaetze.forEach(p => { p.onclick = () => versteckKlick(p); });
  const fruchtFeld = $('.ueber-kakaofrucht'); if (fruchtFeld) fruchtFeld.hidden = true;   // erst, wenn der Baum Früchte trägt

  // Ladebildschirm: Fortschritt nach geladenen Bildern, weg sobald alles da ist (spätestens nach 15 s)
  (function laden() {
    const el = $('#laden'); if (!el) return;
    const balken = $('.laden-balken span', el);
    const bilder = [...document.images].filter(im => !im.closest('#laden') && im.getAttribute('loading') !== 'lazy');
    const stand = () => { const n = bilder.filter(im => im.complete).length; balken.style.width = Math.round(15 + 85 * n / Math.max(1, bilder.length)) + '%'; };
    const uhr = setInterval(stand, 150); stand();
    const fertig = () => {
      clearInterval(uhr); balken.style.width = '100%';
      setTimeout(() => { el.classList.add('weg'); setTimeout(() => el.remove(), 900); }, 250);
      setTimeout(legendeLaden, 2500);   // Legendenbilder in Ruhe nachladen
    };
    if (document.readyState === 'complete') fertig(); else { addEventListener('load', fertig, { once: true }); setTimeout(fertig, 15000); }
  })();
  // Hochkant am Handy: großer Hinweis zum Drehen, auf Wunsch trotzdem weiter
  $('#hochkant-weiter')?.addEventListener('click', () => document.body.classList.add('hochkant-ok'));

  // ?blick=-500: zum Testen/Zeigen direkt in die Welt schauen (ohne Titel), Kamera an diese Stelle
  const blick = location.search.match(/blick=(-?\d+)/);
  if (blick) { $('#titel').hidden = true; KAM.x = KAM.ziel = klemme(+blick[1]); }

  // Titel füllen und los
  $('#titel h1').textContent = I.titel;
  $('#titel .unter').textContent = I.untertitel;
  $('#titel .intro').textContent = I.intro;
  ablauf();
})();
