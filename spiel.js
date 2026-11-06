// Kakao-Reise · Kapitel 1 · Der erste Samen
// Spielablauf, Fenster und Texte. Die Waldwelt selbst zeichnet welt.js in einer WebGL-Zeichenfläche (PixiJS).
window.WELT.bereit.then(() => { (() => {
  const I = window.INHALT;
  const WELT = window.WELT;
  // „Maya Munay“ immer in einer Zeile (Wunsch Yilmaz): geschütztes Leerzeichen in allen Texten; die Stimmen finden ihre Sätze trotzdem
  (function mayaMunayZusammen() {
    const NB = 'Maya Munay', tausche = o => { for (const k in o) { if (typeof o[k] === 'string') o[k] = o[k].replace(/Maya Munay/g, NB); else if (o[k] && typeof o[k] === 'object') tausche(o[k]); } };
    tausche(I);
    const S = window.STIMMEN; if (S) for (const k of Object.keys(S)) if (k.includes('Maya Munay')) S[k.replace(/Maya Munay/g, NB)] = S[k];
  })();
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const SCHNELL = /schnell/.test(location.search); // zum Testen: index.html?schnell
  const RUHIG = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const warte = ms => new Promise(r => setTimeout(r, SCHNELL ? ms / 10 : ms));

  const buehne = $('#buehne'), dialog = $('#dialog'), flaecheHtml = $('#spielflaeche');

  // ---------- Bühne an Fenstergröße anpassen ----------
  let massstab = 1, BREITE = 1600, O = 0;   // Bühnenbreite passt sich breiten Handys an (O = halber Zuwachs)
  // Breite Handys (quer) zeigen mehr vom Wald statt schwarzer Ränder: Bühne 1600–2560 px breit, immer 900 hoch
  function skaliere() {
    const ziel = innerHeight > 0 ? 900 * innerWidth / innerHeight : 1600;
    const maxB = document.body.classList.contains('sehr-leicht') ? 1600 : 2560;
    BREITE = Math.round(Math.max(1600, Math.min(maxB, ziel))); O = (BREITE - 1600) / 2;   // bis fast zur ganzen Weltbreite (2600)
    buehne.style.width = BREITE + 'px';
    massstab = Math.min(innerWidth / BREITE, innerHeight / 900);
    const zl = (innerWidth - BREITE * massstab) / 2, zt = (innerHeight - 900 * massstab) / 2;
    if (ZOOM) {
      // zoom: der Browser zeichnet direkt in Bildschirmgröße (transform:scale zeichnet groß und verkleinert danach)
      buehne.style.transform = 'none'; buehne.style.zoom = massstab;
      buehne.style.left = (zl / massstab) + 'px'; buehne.style.top = (zt / massstab) + 'px';
      const r = buehne.getBoundingClientRect();
      if (Math.abs(r.left - zl) > 2 || Math.abs(r.top - zt) > 2) { buehne.style.left = zl + 'px'; buehne.style.top = zt + 'px'; }   // ältere zoom-Art
    } else buehne.style.transform = `translate(-50%, -50%) scale(${massstab})`;
    WELT.groesse(BREITE, massstab, zl, zt);   // die Zeichenfläche liegt genau unter der Bühne, in Bildschirmgröße
    document.body.classList.toggle('handy', massstab < .62);   // kleine Bildschirme: größere Schrift
    if (window.KAMERA) { const K = window.KAMERA; K.min = -500 + O; K.max = 500 - O; K.o = O; K.breite = BREITE;
      K.ziel = Math.max(K.min, Math.min(K.max, K.ziel)); K.x = Math.max(K.min, Math.min(K.max, K.x)); }
  }
  // Wellen und wiegende Kronen kosten etwas Rechenzeit: kurz die Bildrate messen, auf schwachen Geräten abschalten
  {
    let n = 0, t0 = 0;
    const miss = t => { if (!t0) t0 = t; n++; if (t - t0 < 3000) requestAnimationFrame(miss); else if ((t - t0) / n > 30) WELT.sparsam(); };
    setTimeout(() => requestAnimationFrame(miss), 2500);
  }
  if (RUHIG) WELT.sparsam();

  // ---------- Kamera und Parallax ----------
  // Die Welt ist breiter als der Bildschirm (−500 … 2100). Umschauen: Maus an den Rand, Pfeiltasten,
  // mit dem Finger/der Maus ziehen oder die Pfeil-Knöpfe. Jede Ebene wandert nach ihrer Tiefe (welt.js).
  // Start ganz links beim großen Baum – er spricht zuerst, so schwenkt der Blick nicht gleich von rechts nach links
  const KAM = { x: -500, ziel: -500, min: -500, max: 500, o: 0, breite: 1600 };
  window.KAMERA = KAM;
  // zoom nur nutzen, wenn der Browser es so umsetzt, dass alle Umrechnungen stimmen (Rechtecke verkleinert, Maße unverkleinert)
  const ZOOM = (() => {
    if (!document.body.classList.contains('leicht') || !('zoom' in document.body.style)) return false;
    try {
      const t = document.createElement('div'); t.style.cssText = 'position:fixed;left:0;top:0;zoom:.5;visibility:hidden;pointer-events:none';
      const k = document.createElement('div'); k.style.cssText = 'width:100px;height:100px'; t.append(k); document.body.append(t);
      const r = k.getBoundingClientRect(), ok = Math.abs(r.width - 50) < 1 && Math.abs(k.offsetWidth - 100) < 1; t.remove(); return ok;
    } catch (e) { return false; }
  })();
  addEventListener('resize', skaliere); skaliere();
  const klemme = x => Math.max(KAM.min, Math.min(KAM.max, x));
  const kameraZu = x => { KAM.ziel = klemme(x); };
  const umschauErlaubt = () => $('#titel').classList.contains('weg') && $('#erzaehlbild').hidden && $('#buch').hidden && $('#ende').hidden
    && $('#wunschfenster').hidden && $('#froschkonzert').hidden && $('#urkunde').hidden && $('#ernte-spiel').hidden;
  const ziel = { x: 0, y: 0 }, ist = { x: 0, y: 0 };
  let rand = 0, zieh = null, gezogen = false;
  WELT.gezogen = () => gezogen;
  const aufBuehne = e => WELT.aufBuehne(e.clientX, e.clientY);
  addEventListener('pointermove', e => {
    ziel.x = (e.clientX / innerWidth - .5) * 2; ziel.y = (e.clientY / innerHeight - .5) * 2;
    const { x, y } = aufBuehne(e);
    rand = (e.pointerType === 'mouse' && y > 0 && y < 900 && !zieh && !e.target.closest?.('#tasche, .flieger') && WELT.hover()?.name !== 'ablage') ? (x < 110 && x > -40 ? -(1 - x / 110) : x > BREITE - 110 && x < BREITE + 40 ? (x - (BREITE - 110)) / 110 : 0) : 0;
    if (finger.has(e.pointerId)) {
      const alt = finger.get(e.pointerId); finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && finger.size >= 2) {   // zwei Finger: zoomen und dabei verschieben
        const [a, b] = [...finger.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = WELT.aufBuehne((a.x + b.x) / 2, (a.y + b.y) / 2);
        WELT.zoom.um(m.x, m.y, d / pinch.d); schiebe(m.x - pinch.m.x, m.y - pinch.m.y);
        pinch.d = d; pinch.m = m;
      } else if (zieh) {
        const dx = (e.clientX - zieh.x0) / massstab, dy = (e.clientY - zieh.y0) / massstab;
        if (Math.hypot(dx, dy) > 8) gezogen = true;
        if (gezogen) schiebe((e.clientX - alt.x) / massstab, (e.clientY - alt.y) / massstab);
      }
    }
  });
  // Welt mit dem Finger verschieben: erst wandert die Kamera, was übrig bleibt, verschiebt den Zoom-Ausschnitt
  function schiebe(dx, dy) {
    const z = WELT.zoom.z, k = klemme(KAM.x - dx / z), genutzt = (KAM.x - k) * z;
    KAM.ziel = KAM.x = k;
    WELT.zoom.schiebe(dx - genutzt, dy);
  }
  const finger = new Map(); let pinch = null;
  // Strg + Mausrad bzw. zwei Finger auf dem Trackpad: zoomen
  WELT.canvas.addEventListener('wheel', e => {
    if (!e.ctrlKey || !umschauErlaubt()) return;
    e.preventDefault();
    const p = aufBuehne(e); WELT.zoom.um(p.x, p.y, Math.exp(-e.deltaY * .01));
  }, { passive: false });
  for (const g of ['gesturestart', 'gesturechange']) document.addEventListener(g, e => e.preventDefault(), { passive: false });   // Safari: Seite nicht mitzoomen
  WELT.canvas.addEventListener('pointerleave', () => { rand = 0; });
  // jeder neue Tipper beginnt ungezogen – sonst blieben Klicks nach einem Wisch hängen
  buehne.addEventListener('pointerdown', () => { gezogen = false; });
  WELT.canvas.addEventListener('pointerdown', e => {
    if (!finger.size) gezogen = false;
    if (!umschauErlaubt()) return;
    finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (finger.size === 2) {
      const [a, b] = [...finger.values()];
      pinch = { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), m: WELT.aufBuehne((a.x + b.x) / 2, (a.y + b.y) / 2) };
      gezogen = true; zieh = null;
    } else if (finger.size === 1) zieh = { x0: e.clientX, y0: e.clientY };
  });
  const losgelassen = e => { finger.delete(e.pointerId); if (finger.size < 2) pinch = null; if (!finger.size) zieh = null; };
  addEventListener('pointerup', losgelassen);
  addEventListener('pointercancel', losgelassen);
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
    WELT.kamera(KAM.x, O, ist.x, ist.y);
    WELT.schritt(zeit);
    // HTML in der Welt (Wissenskarten, Schilder) wandert und zoomt wie die Spielfläche – die Schilder selbst bleiben gleich groß
    if (flaecheHtml.firstChild) {
      const Z = WELT.zoom.z;
      flaecheHtml.style.transform = `translate3d(${((-(KAM.x - O) - ist.x * .6 * 24) * Z + WELT.zoom.tx).toFixed(1)}px, ${((-ist.y * .6 * 10) * Z + WELT.zoom.ty).toFixed(1)}px, 0) scale(${Z.toFixed(4)})`;
      flaecheHtml.style.setProperty('--gegen', (1 / Z).toFixed(4));
    }
    zoomKnopf.hidden = WELT.zoom.z < 1.02;
    const l = !frei || KAM.x < KAM.min + 20, r = !frei || KAM.x > KAM.max - 20;
    if (pfeilL.hidden !== l) pfeilL.hidden = l;
    if (pfeilR.hidden !== r) pfeilR.hidden = r;
    platziereBlase();
    // Kapitel-Fenster weicht der Seite aus, die gerade ins Bild kommt: Blick wandert nach rechts → Fenster links, und umgekehrt.
    // So deckt es nie zu, wohin man gerade schaut (z. B. die Kokospalme ganz rechts, Tukan und Faultier ganz links).
    const kf = document.getElementById('kapitel-fertig');
    if (kf && !kf.hidden && zeit - kfZeit > 400) { kfZeit = zeit; kapitelFensterPlatz(kf); }
    requestAnimationFrame(schleife);
  }
  requestAnimationFrame(schleife);
  // Das Kapitel-Fenster sucht sich den Platz, an dem es am wenigsten Tiere, Kolibri oder Baumgesicht verdeckt
  let kfZeit = 0, kfPlatz = null;
  function kapitelFensterPlatz(kf) {
    const w = kf.offsetWidth, h = kf.offsetHeight;
    const PLAETZE = [[20, 16], [(BREITE - w) / 2, 16], [BREITE - w - 20, 96], [20, 900 - h - 20], [(BREITE - w) / 2, 900 - h - 20], [BREITE - w - 20, 900 - h - 20]];
    const dinge = WELT.wichtigeRechtecke();
    const deckt = ([x, y]) => dinge.reduce((s, r) => s + Math.max(0, Math.min(x + w + 12, r.r) - Math.max(x - 12, r.l)) * Math.max(0, Math.min(y + h + 12, r.u) - Math.max(y - 12, r.t)), 0)
      + (y > 450 && !$('#tasche').hidden ? 1e6 : 0);
    const jetzt = kfPlatz ? deckt(kfPlatz) : Infinity;
    let best = kfPlatz, bestWert = jetzt;
    for (const p of PLAETZE) { const v = deckt(p) + (p[1] > 450 ? 400 : 0); if (v < bestWert - 1500) { best = p; bestWert = v; } }
    if (best && best !== kfPlatz) { kfPlatz = best; kf.style.left = best[0].toFixed(0) + 'px'; kf.style.top = best[1].toFixed(0) + 'px'; }
  }

  // Ganzer Blick: Zoom zurücksetzen (Knopf erscheint nur, wenn hineingezoomt ist)
  const zoomKnopf = document.createElement('button'); zoomKnopf.id = 'zoom-knopf'; zoomKnopf.hidden = true;
  zoomKnopf.setAttribute('aria-label', 'Ganzer Blick'); zoomKnopf.title = 'Ganzer Blick';
  zoomKnopf.innerHTML = '<svg viewBox="0 0 40 32"><circle cx="17" cy="15" r="9" fill="#EFE6D5" stroke="#7A5C48" stroke-width="2.2"/><path d="M13 15 H21" stroke="#7A5C48" stroke-width="2.4" stroke-linecap="round"/><path d="M24 22 L31 29" stroke="#7A5C48" stroke-width="3" stroke-linecap="round"/></svg>';
  zoomKnopf.onclick = () => WELT.zoom.zurueck();
  $('#leiste').prepend(zoomKnopf);
  // Vollbild: am Computer und auf Android direkt, auf dem iPhone über „Zum Home-Bildschirm“ (Safari kennt dort kein Vollbild für Seiten)
  const vollbildKnopf = $('#vollbild-knopf'), alsApp = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
  const kannVollbild = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  const imVollbild = () => document.fullscreenElement || document.webkitFullscreenElement;
  if (alsApp) vollbildKnopf.hidden = true;
  vollbildKnopf.onclick = async () => {
    if (kannVollbild) {
      try {
        if (imVollbild()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else { const d = document.documentElement; await (d.requestFullscreen || d.webkitRequestFullscreen).call(d); screen.orientation?.lock?.('landscape').catch(() => {}); }
      } catch (_) {}
    } else $('#vollbild-tipp').hidden = false;
  };
  $('#vollbild-tipp button').onclick = () => { $('#vollbild-tipp').hidden = true; };

  // Name unter dem Mauszeiger (wie in klassischen Abenteuerspielen) – für Dinge in der Welt und im Rucksack
  const zname = $('#zeiger-name');
  const zeigeName = (text, e) => {
    if (!text || !e) { zname.classList.remove('da'); return; }
    const { x, y } = aufBuehne(e);
    zname.textContent = text; zname.style.left = x + 'px'; zname.style.top = (y - 34) + 'px'; zname.classList.add('da');
  };
  WELT.beimZeigen = (z, e) => zeigeName(z?.label, e);
  buehne.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const d = e.target.closest('.ding-in-tasche');
    if (d) zeigeName(d.getAttribute('aria-label'), e); else if (!WELT.hover()) zname.classList.remove('da');
  });
  // Plätze beim Pflanzen: Schild über dem Platz (wie bisher beim Darüberfahren)
  let ortSchild = null;
  WELT.ortSchild = o => {
    ortSchild?.remove(); ortSchild = null;
    if (!o) return;
    ortSchild = document.createElement('div'); ortSchild.className = 'ort-schild'; ortSchild.textContent = o.label;
    ortSchild.style.left = o.x + 'px'; ortSchild.style.top = (o.y - 6) + 'px'; flaecheHtml.append(ortSchild);
  };

  addEventListener('pointerdown', () => { buehne.dataset.eingabe = 'zeiger'; }, true);
  addEventListener('keydown', () => { buehne.dataset.eingabe = 'tasten'; }, true);

  // ---------- Der Kakaobaum ----------
  let alteStufe = 0, stufe = 0;
  function setStufe(n) {
    WELT.baumStufe(n, alteStufe); stufe = n;
    // nach jedem neuen Wachstumsbild leuchtet der Baum einmal weiß auf (Wunsch Yilmaz)
    if (n > alteStufe && n > 0) setTimeout(() => WELT.baumSchub(n), SCHNELL ? 0 : 650);
    // ganz ausgewachsen: funkeln und glitzern, beim ersten Mal kurz aufleuchten mit Glitzerklang
    ENTDECKEN.fruchtSichtbar(n === 5);
    if (n === 5 && alteStufe !== 5) { WELT.funkeln(true); WELT.baumAufleuchten(5); KLANG.spiel('funkeln'); }
    else if (n < 5) WELT.funkeln(false);
    alteStufe = n;
  }

  // ---------- Kolibri fliegt ----------
  let kol = { x: -200, y: 260 };
  function setzeKolibri(x, y) { kol = { x, y }; WELT.kolibri.setze(x, y); }
  function fliege(x, y, ms) {
    const start = { ...kol }, t0 = performance.now(), dauer = SCHNELL ? ms / 10 : ms;
    WELT.kolibri.links = x < start.x;
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
  const kolibriSpricht = an => { WELT.kolibri.spricht = an; };

  // ---------- Der sprechende Urwaldbaum ----------
  const FIGUR = n => `bilder/platzhalter/figuren/${n}.webp`;
  let mundUhr = null;
  function baumSpricht(an) {
    clearInterval(mundUhr);
    const muender = $$('#dialog .bp .mund');
    if (!an) { muender.forEach(m => { m.src = FIGUR('baum-mund'); }); WELT.gesicht.mund('baum-mund'); return; }
    const MUND = ['baum-mund-halb', 'baum-mund-offen', 'baum-mund-halb', 'baum-mund'];
    mundUhr = setInterval(() => { const m = MUND[Math.floor(Math.random() * MUND.length)]; muender.forEach(x => { x.src = FIGUR(m); }); WELT.gesicht.mund(m); }, 115);
  }
  (function blinzeln() { setTimeout(() => { const bp = $('#dialog .bp'); WELT.gesicht.zu(true); bp?.classList.add('zu'); setTimeout(() => { WELT.gesicht.zu(false); bp?.classList.remove('zu'); }, 170); blinzeln(); }, 2800 + Math.random() * 3600); })();
  let baumNr = 0;
  WELT.ziel({ name: 'baumgesicht', label: 'Der alte Urwaldbaum', box: WELT.gesicht.box, z: WELT.ZRANG.gesicht,
    tap: () => { if (gezogen || !dialog.hidden) return; ruf('wald', I.baumRuf[baumNr++ % I.baumRuf.length]); } });

  // ---------- Dialog ----------
  // Text im Kasten mit Rahmen unten (Wunsch Yilmaz: liest sich besser als frei über der Figur)
  let tippUhr = null, sprechNr = 0;
  const datei = text => !SCHNELL && window.STIMMEN ? window.STIMMEN[text] : null;
  // Sprechblase: Der Kasten mit Rahmen sitzt am Sprecher, ein Zipfel zeigt auf ihn
  // (Kolibri: darüber oder darunter, Baum: rechts neben dem Gesicht). In der Legende und ohne sichtbaren Sprecher: unten.
  let sprechWer = null;
  function platziereBlase() {
    if (dialog.hidden) return;
    let r = null;
    if ($('#erzaehlbild').hidden) r = sprechWer === 'kolibri' ? WELT.aufBuehneRechteck(WELT.kolibri.box()) : sprechWer === 'wald' ? WELT.aufBuehneRechteck(WELT.gesicht.box) : null;
    if (r) {
      const dx = (KAM.x - KAM.ziel) * WELT.zoom.z;   // dort, wo der Sprecher nach dem Kameraschwenk steht – die Blase springt nicht
      r = { l: r.l + dx, t: r.t, r: r.r + dx, u: r.u };
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
    x -= (KAM.x - KAM.ziel) * WELT.zoom.z;   // während des Schwenks mit der Kamera mitwandern
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
    KLANG.hoerAuf(); dialog.classList.remove('spricht'); kolibriSpricht(false);
    platziereBlase();
  }
  function sprichLaut(wer, text, nr, beiDauer) {
    const d = datei(text); if (!d) return null;
    dialog.classList.add('spricht'); if (wer === 'kolibri') kolibriSpricht(true); else if (wer === 'wald') baumSpricht(true);
    return KLANG.sprich(d, beiDauer).then(() => { if (wer === 'wald') baumSpricht(false); if (nr === sprechNr) { dialog.classList.remove('spricht'); kolibriSpricht(false); } });
  }
  // Bild zum Erzählten: erscheint beim passenden Satz und bleibt, bis ein anderes kommt oder das Gespräch endet
  const foto = $('#erzaehl-foto');
  function zeigeFoto(text) {
    const e = (I.erzaehlBilder || []).find(e => text.startsWith(e.satz));
    if (!e) return;
    if (!e.bild) { versteckeFoto(); return; }
    const img = $('img', foto), src = bild(e.bild);
    if (!foto.hidden && img.getAttribute('src') === src) return;
    img.src = src; $('figcaption', foto).textContent = e.text;
    foto.hidden = false; foto.classList.remove('weg'); void foto.offsetWidth; foto.classList.add('da');
  }
  function versteckeFoto() { if (foto.hidden) return; foto.classList.remove('da'); foto.classList.add('weg'); setTimeout(() => { if (foto.classList.contains('weg')) foto.hidden = true; }, 500); }
  let kameraBleibt = false;   // z. B. beim Platz-Wählen: der Blick bleibt beim Platz, das Gesicht des Waldes erscheint im Rahmen
  function sage(wer, text, knoepfe = [{ text: 'Weiter', wert: true }]) {
    const nr = ++sprechNr;
    if (!kameraBleibt) { if (wer === 'wald') kameraZu(-500); else if (Math.abs(KAM.ziel) > 220) kameraZu(0); }
    WELT.zoom.zurueck();   // wenn jemand erzählt, zeigt sich wieder der ganze Wald
    oeffne(wer);
    if (wer === 'wald') zeigeFoto(text); else versteckeFoto();
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
          b.onclick = e => { e.stopPropagation(); KLANG.hoerAuf(); dialog.classList.remove('spricht'); kolibriSpricht(false); res(k.wert); };
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
      const weg = () => { if (nr === sprechNr) { dialog.hidden = true; dialog.classList.remove('spricht'); kolibriSpricht(false); } res(); };
      dialog.onclick = () => { KLANG.hoerAuf(); weg(); };
      const laut = sprichLaut(wer, text, nr);
      if (laut) { laut.then(() => setTimeout(weg, 700)); setTimeout(weg, 12000); }
      else setTimeout(weg, SCHNELL ? 300 : 1600 + text.length * 50);
    });
  }
  async function reden(liste) { for (const [wer, text] of liste) await sage(wer, text); }
  const stille = () => { versteckeFoto(); sprechNr++; clearInterval(tippUhr); dialog.hidden = true; dialog.classList.remove('spricht'); kolibriSpricht(false); baumSpricht(false); };

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
    // die 7 Geheimnisse: entdeckte Tiere in Farbe, die anderen als Schattenriss
    const G = I.geheimnisse, BILD = { banane: 'bananenstaude' }, entdeckt = ENTDECKEN.liste;
    const box = document.createElement('div'); box.className = 'geheimnisse';
    box.innerHTML = `<h3></h3><div class="geheimnis-reihe"></div>`; $('h3', box).textContent = `${G.titel} · ${entdeckt.filter(w => I.entdecken.includes(w)).length} / ${I.entdecken.length}`;
    I.entdecken.forEach(w => {
      const da = entdeckt.includes(w), k = document.createElement('div'); k.className = 'geheimnis' + (da ? ' da' : '');
      k.innerHTML = `<span class="g-bild"><img alt="" src="${FIGUR(BILD[w] || w)}"></span><span class="g-name"></span>`;
      $('.g-name', k).textContent = da ? I.wissen[w].titel.replace(/^(Der|Die|Das) /, '') : G.verborgen;
      $('.geheimnis-reihe', box).append(k);
    });
    liste.prepend(box);
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
  let warteOrt = null, waehlenAn = false, questAn = false;
  const ORTE = [['sonne', [150, 640, 300, 160], 'Offenes Feld'], ['schatten', [680, 620, 260, 160], 'Unter den großen Bäumen'], ['hang', [1280, 470, 300, 180], 'Windiger Hang']];
  ORTE.forEach(([name, box, label]) => WELT.ort(name, box, label, () => { if (!gezogen && warteOrt) { const r = warteOrt; warteOrt = null; r(name); } }));
  function warteAufOrt() { return new Promise(res => { warteOrt = res; }); }
  const waehlen = an => { waehlenAn = an; WELT.waehlen(an); if (!an) WELT.ortSchild(null); };
  function blitz() {
    WELT.blitz();
    setTimeout(() => KLANG.spiel('donner'), SCHNELL ? 50 : 500 + Math.random() * 700);   // erst Licht, dann Donner
  }
  // voll = ein ganzer Tropentag: Abend, Nacht mit Sternen und Grillen, Gewitter mit Regen, Morgen
  async function tagUndNacht(voll, wachse) {
    if (!voll) {
      WELT.tageszeit('nacht'); WELT.nachts(true); await warte(1100);
      WELT.tageszeit(''); WELT.nachts(false); await warte(900);
      return;
    }
    WELT.tageszeit('abend'); wachse?.(1); await warte(1700);
    WELT.tageszeit('nacht'); WELT.nachts(true); KLANG.start('nacht'); await warte(1800);
    WELT.regnet(true); KLANG.start('regen'); await warte(1400);
    blitz(); await warte(900); wachse?.(2); await warte(1000);
    blitz(); await warte(1700);
    WELT.regnet(false); KLANG.stopp('regen'); await warte(1100);
    WELT.tageszeit('morgen'); WELT.nachts(false); KLANG.stopp('nacht'); wachse?.(3); await warte(1700);
    WELT.tageszeit(''); await warte(700);
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
  const dingBild = d => `<img src="${FIGUR(d.bild)}" alt="">`;
  function flugZurTasche(von, fach, fertig) {   // kleines Abbild fliegt vom Fundort in die Tasche
    const b = buehne.getBoundingClientRect(), a = WELT.aufBuehneRechteck(von.box()), z = fach.getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'flieger'; f.innerHTML = dingBild(von);
    Object.assign(f.style, { left: a.l + 'px', top: a.t + 'px' });
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
      ding.setAttribute('aria-label', I.sammeldinge[d.dataset.ding]); ding.innerHTML = dingBild(d); ding.quelle = d;
      fach.append(ding); fach.reserviert = false;
      fach.parentElement.querySelector('.fach-name').textContent = I.sammeldinge[d.dataset.ding];   // Name unter dem Ding
      tasche.classList.remove('neu'); void tasche.offsetWidth; tasche.classList.add('neu');
    });
  }
  // Schild über einem Ort in der Welt (HTML, wandert mit der Kamera)
  function weltSchild(klasse, html, x, y, ms) {
    const s = document.createElement('div'); s.className = klasse; s.innerHTML = html;
    s.style.left = x + 'px'; s.style.top = y + 'px'; flaecheHtml.append(s); setTimeout(() => s.remove(), ms);
    return s;
  }

  // Suche: Die drei Dinge liegen jedes Spiel unter anderen Laubhaufen, Gräsern, Wurzeln oder Farnen.
  // Man darf sie schon vor der Bitte des Kolibris finden – dann landen sie im Rucksack, und die Geschichte passt sich an.
  let plaetze = null, gefundenDinge = 0, questLaeuft = false, questFund = null, leerNr = 0, fruehNr = 0;
  const sammelDinge = ['laub', 'banane', 'schalen'].map(n => ENTDECKEN.sammelDing(n));
  function versteckKlick(p) {
    if (gezogen) return;
    const d = p.ding;
    if (d && !d.classList.contains('gefunden')) {
      p.classList.add('offen'); p.classList.remove('tipp'); KLANG.spiel('rascheln');
      d.classList.add('gefunden');
      setTimeout(() => {
        // Schild direkt über dem Fundort: was wurde gesammelt?
        const s = weltSchild('fund-schild', '', d.x + 50, d.y, SCHNELL ? 300 : 2800); s.textContent = '✓ ' + I.sammeldinge[d.dataset.ding];
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
    const anzeige = $('#questanzeige'), dinge = sammelDinge;
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
        const px = p.x, py = p.y;
        kameraZu(px - 720);
        await fliege(px + 10, Math.max(150, py - 150), 1700);
        if (p.ding.classList.contains('gefunden')) return;
        p.classList.add('tipp');
        ruf('kolibri', I.suchenHinweis[p.dataset.art]);
      }, SCHNELL ? 2000 : 40000);   // Kolibri-Hilfe erst nach 40 s (Wunsch Yilmaz)
    };
    const jubel = () => { WELT.kolibri.looping(); KLANG.spiel('richtig'); return ruf('kolibri', I.fundJubel[Math.min(gefundenDinge, 3) - 1]); };
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
    const anzeige = $('#questanzeige');
    const dinge = $$('.ding-in-tasche'); let n = 0, gewaehlt = null;
    const zeige = () => { anzeige.textContent = `${I.ablegenZiel}: ${n} / ${dinge.length}`; };
    WELT.ablage.an = true; anzeige.hidden = false; zeige();
    const waehle = d => { gewaehlt?.classList.remove('gewaehlt'); gewaehlt = d; d?.classList.add('gewaehlt'); buehne.classList.toggle('traegt', !!d); document.body.classList.toggle('traegt', !!d); };
    return new Promise(res => {
      const lege = ding => {
        const d = ding.quelle; waehle(null);
        const name = ding.closest('.platz')?.querySelector('.fach-name'); if (name) name.textContent = '';
        ding.remove();
        d.setze(690 + n * 70, 690);
        d.classList.remove('in-tasche'); d.classList.add('gesammelt');
        KLANG.spiel('ablegen', n); n += 1; zeige();   // steigende Töne
        if (n === dinge.length) {
          WELT.ablage.an = false; tasche.hidden = true; anzeige.hidden = true;
          // alle drei beisammen: kurzes Funkeln und ein „Freigeschaltet“-Klang
          setTimeout(() => { KLANG.spiel('freigeschaltet'); WELT.effekt.freischalt(690 + 70 + 50, 715); }, SCHNELL ? 30 : 350);
          setTimeout(res, SCHNELL ? 100 : 1700);
        }
      };
      const ueberAblage = e => WELT.trifft('ablage', e.clientX, e.clientY);
      dinge.forEach(ding => {
        let start = null, geist = null, unterdruecken = false;
        ding.onpointerdown = e => { start = { x: e.clientX, y: e.clientY }; try { ding.setPointerCapture(e.pointerId); } catch (_) {} };
        ding.onpointermove = e => {
          if (!start) return;
          if (!geist && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
            geist = document.createElement('div'); geist.className = 'flieger geist'; geist.innerHTML = ding.innerHTML; buehne.append(geist); ding.classList.add('weg');
          }
          if (geist) { const p = aufBuehne(e); geist.style.left = (p.x - 50) + 'px'; geist.style.top = (p.y - 30) + 'px'; WELT.ablage.drueber(ueberAblage(e)); }
        };
        ding.onpointerup = e => {
          if (geist) { unterdruecken = true; geist.remove(); geist = null; ding.classList.remove('weg'); WELT.ablage.drueber(false); if (ueberAblage(e)) lege(ding); }
          start = null;
        };
        ding.onclick = () => { if (unterdruecken) { unterdruecken = false; return; } waehle(gewaehlt === ding ? null : ding); };
      });
      WELT.ablage.tap = () => { if (gewaehlt) lege(gewaehlt); else zeigeHinweis(I.ablegenTipp); };
    });
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
    $('h2', f).textContent = I.fertig.titel; $('.satz', f).textContent = I.fertig.text.replace('{wunsch}', pate.wunsch); $('.kf-ende', f).textContent = I.fertig.knopf;
    // Mini-Spiel Fermentieren/Trocknen gehört zu Kapitel 3 und 4 (Entscheidung Yilmaz 06.11.) – hier nur zum Ausprobieren mit ?ernte
    const ernteKnopf = $('.kf-ernte', f); ernteKnopf.hidden = !/ernte/.test(location.search);
    ernteKnopf.textContent = I.ernte.knopf; ernteKnopf.onclick = () => ernteSpiel();
    kameraZu(0); setTimeout(() => WELT.wunschLeuchten(`„${pate.wunsch}“`), SCHNELL ? 50 : 900);   // der Wunsch leuchtet aus den Früchten
    const zeige = () => {
      const r = I.entdecken.length - ENTDECKEN.anzahl;
      $('.rest', f).textContent = r > 0 ? I.fertig.rest.replace('{r}', r) : I.fertig.alle;
    };
    zeige(); f.hidden = false; KLANG.spiel('richtig');
    const uhr = setInterval(zeige, 800);
    return new Promise(res => { $('.kf-ende', f).onclick = () => { clearInterval(uhr); f.hidden = true; res(); }; });
  }
  function zeigeEnde() {
    const e = $('#ende');
    $('h1', e).textContent = I.ende.titel;
    $('.intro', e).textContent = I.ende.text;
    const ab = $('.ausblick', e); $('img', ab).src = bild(I.ausblick.bild); $('h3', ab).textContent = I.ende.weiter; $('p', ab).textContent = I.ausblick.text;
    const n = ENTDECKEN.anzahl, m = I.entdecken.length;
    $('.entdeckt', e).textContent = (n === m ? I.ende.alleEntdeckt : I.ende.entdeckt).replace('{n}', n).replace('{m}', m)
      + ` · ${I.bohnen.ziel}: ${bohnen} / ${BOHNEN.length}`;
    $('.paten-hinweis span', e).textContent = I.ende.patenschaft;
    const w = $('#ende-wissen'); w.innerHTML = '';
    gelernt.forEach(id => { const s = document.createElement('span'); s.textContent = I.wissen[id].titel; w.append(s); });
    e.hidden = false; $('#nochmal').focus();
    KLANG.stopp('gnitzen'); KLANG.spiel('schluss');
  }
  $('#nochmal').onclick = () => { try { localStorage.removeItem(SPEICHER); } catch (_) {} location.reload(); };

  // Ton: Klick-Geräusch für alle Knöpfe (auch für Dinge in der Welt), Ton an/aus
  document.addEventListener('pointerdown', e => { if (e.target.closest('button')) KLANG.spiel('klick'); });
  WELT.beimDruck = () => KLANG.spiel('klick');
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
  function zeigeStein(sofort) { WELT.stein(pate.name, `„${pate.wunsch}“`, sofort); }
  // Antippen des Schilds öffnet die Urkunde – mit „Schließen“
  WELT.stein.tap = () => {
    if (gezogen || !$('#urkunde').hidden) return;
    if (!dialog.hidden) { if ($('.knoepfe', dialog).children.length) return; stille(); KLANG.hoerAuf(); }   // ein kurzer Zuruf darf unterbrochen werden
    zeigeUrkunde(); const u = $('#urkunde'), zu = $('.u-zu', u);
    u.classList.add('offen'); zu.textContent = I.urkunde.zu; zu.hidden = false; KLANG.spiel('klick');
    zu.onclick = e => { e.stopPropagation(); urkundeWeg(); };
  };
  function segenVoegel() {
    WELT.effekt.segenVoegel(SCHNELL);
    setTimeout(() => KLANG.spiel('segenVoegel'), SCHNELL ? 50 : 1400);   // echte Papageien-Aufnahmen, leise unter dem Lied
  }
  async function pflanzZeremonie() {
    WELT.yantra('zeichnet'); KLANG.spiel('funkeln');
    await sage(...I.yantraSatz);   // der Wald erzählt vom Kraftsymbol, während es sich zeichnet
    stille();
    WELT.baumGepflanzt(); await warte(750); KLANG.spiel('plopp'); await warte(400);
    WELT.yantra('leuchtet');
    await sage(...I.segenVor);
    segenVoegel();   // keine Glöckchen-Melodie darunter – sie lief in einem anderen Takt als der Gesang
    await sage('wald', I.segen);
    WELT.yantra('fertig');
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

  // ---------- Mini-Spiel: Bohnen fermentieren und trocknen, im Takt des Waldes ----------
  // Ein Ring zieht sich im Takt zusammen und leuchtet golden auf dem Schlag. Wer dann „Wenden“ tippt, wendet die Bohnen.
  // Beim Trocknen kommt einmal eine Regenwolke: schnell abdecken, danach wieder aufdecken.
  let ernteLaeuft = false;
  function ernteSpiel() {
    if (ernteLaeuft) return;
    ernteLaeuft = true; stille();
    const k = $('#ernte-spiel'), T = I.ernte, img = $('.ernte-bild img', k), tun = $('.ernte-tun', k), zu = $('.ernte-zu', k);
    const takt = $('.ernte-takt', k), rueck = $('.ernte-rueck', k), standEl = $('.ernte-stand', k), balken = $('.ernte-balken i', k);
    const wolke = $('.ernte-wolke', k), decke = $('.ernte-decke', k), dampf = $('.ernte-dampf', k);
    $('h2', k).textContent = T.titel; zu.textContent = T.schliessen;
    const SCHLAG = SCHNELL ? 300 : 900, ZIEL = 4, FENSTER = SCHNELL ? 140 : 230;
    let phase = 'fermentieren', n = 0, offen = true, t0 = performance.now(), schlagNr = -1, regen = null, regenKam = false;
    const sprich = text => { const d = datei(text); if (d) KLANG.sprich(d); };
    const zeigePhase = () => {
      img.src = bild(phase === 'trocknen' ? 'trocknen' : 'fermentieren');
      $('.anleitung', k).textContent = phase === 'trocknen' ? T.trocknen : T.fermentieren;
      tun.textContent = T.wenden; tun.hidden = false; n = 0; zeige(); rueck.textContent = '';
      k.classList.toggle('trocknen', phase === 'trocknen');
      sprich(phase === 'trocknen' ? T.trocknen : T.fermentieren);
    };
    const zeige = () => { standEl.textContent = `${T.gewendet}: ${n} / ${ZIEL}`; balken.style.width = (n / ZIEL * 100) + '%'; };
    const meldung = (text, gut) => { rueck.textContent = text; rueck.classList.toggle('gut', !!gut); };
    // Takt: Ring und Trommel
    const schlag = t => {
      if (!offen) return;
      const el = t - t0, nr = Math.floor(el / SCHLAG), p = (el % SCHLAG) / SCHLAG;
      if (nr !== schlagNr) { schlagNr = nr; if (!regen) KLANG.spiel('trommel', nr % 4 === 0); takt.classList.remove('schlag'); void takt.offsetWidth; takt.classList.add('schlag'); }
      takt.style.setProperty('--p', p.toFixed(3));
      requestAnimationFrame(schlag);
    };
    const imTakt = () => { const el = (performance.now() - t0) % SCHLAG; return el < FENSTER || el > SCHLAG - FENSTER; };
    const weiterPhase = () => {
      if (phase === 'fermentieren') { lerne('fermentieren'); tun.textContent = T.weiterTrocknen; phase = 'umzug'; KLANG.spiel('richtig'); return; }
      lerne('trocknen'); phase = 'fertig'; KLANG.spiel('richtig'); meldung(T.geschafft, true); sprich(T.geschafft);
      tun.textContent = T.nochmal; k.classList.add('geschafft');
    };
    tun.onclick = () => {
      if (phase === 'umzug') { phase = 'trocknen'; zeigePhase(); return; }
      if (phase === 'fertig') { phase = 'fermentieren'; regenKam = false; k.classList.remove('geschafft'); zeigePhase(); return; }
      if (regen === 'kommt') {   // abdecken
        regen = 'regnet'; decke.classList.add('da'); meldung(T.trocken, true); KLANG.spiel('rascheln');
        setTimeout(() => { if (!offen) return; regen = 'vorbei'; wolke.classList.remove('da', 'regnet'); tun.textContent = T.aufdecken; }, SCHNELL ? 300 : 2600);
        wolke.classList.add('regnet'); tun.textContent = '…'; return;
      }
      if (regen === 'regnet') return;
      if (regen === 'vorbei') { regen = null; decke.classList.remove('da'); tun.textContent = T.wenden; meldung(''); return; }
      if (imTakt()) {
        n += 1; zeige(); meldung(T.gut, true); KLANG.spiel('ablegen', n);
        img.parentElement.classList.remove('gewendet'); void img.offsetWidth; img.parentElement.classList.add('gewendet');
        if (phase === 'fermentieren') { dampf.classList.remove('da'); void dampf.offsetWidth; dampf.classList.add('da'); }
        if (phase === 'trocknen' && n === 2 && !regenKam) {   // jetzt kommt eine Regenwolke
          regenKam = true;
          setTimeout(() => { if (!offen || phase !== 'trocknen') return; regen = 'kommt'; wolke.classList.add('da'); tun.textContent = T.abdecken; meldung(T.regen); KLANG.spiel('tropfen');
            setTimeout(() => { if (regen === 'kommt' && offen) { regen = 'vorbei'; wolke.classList.add('regnet'); meldung(T.nass); setTimeout(() => { wolke.classList.remove('da', 'regnet'); tun.textContent = T.aufdecken; }, SCHNELL ? 200 : 2000); } }, SCHNELL ? 600 : 3600);
          }, SCHNELL ? 100 : 700);
        }
        if (n >= ZIEL) weiterPhase();
      } else { meldung(T.fast); KLANG.spiel('sanft'); }
    };
    const kf = $('#kapitel-fertig'), kfWar = !kf.hidden; kf.hidden = true;   // Kapitel-Fenster ruht, solange gespielt wird
    zu.onclick = () => { offen = false; k.hidden = true; ernteLaeuft = false; KLANG.hoerAuf(); wolke.classList.remove('da', 'regnet'); decke.classList.remove('da'); if (kfWar) kf.hidden = false; };
    k.hidden = false; zeigePhase(); requestAnimationFrame(schlag);
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
    (st.bohnen || []).forEach(nr => { const b = bohnenListe[nr]; if (b && !b.weg) { b.entfernen(); bohnen += 1; } });
    stand.bohnen = [...(st.bohnen || [])];
    if (bohnen) { bohnenAnzeige.hidden = false; $('span', bohnenAnzeige).textContent = `${bohnen} / ${BOHNEN.length}`; }
    WELT.yantra('fertig'); WELT.baumGepflanzt(true); zeigeStein(true);
    if (st.keimling) WELT.keimling(true);
    if (st.punkt === 'gepflanzt') setStufe(4);
    else { setStufe(5); WELT.muecken(22); KLANG.start('gnitzen'); }
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
    waehlen(true);
    zeigeHinweis('Wähle einen Platz für deinen Samen');
    while (true) {
      const ort = await warteAufOrt();
      waehlen(false);
      kameraBleibt = true;
      try {
        if (ort === 'schatten') { await sage('wald', I.orte.schatten.text); break; }
        await sage('wald', I.orte[ort].text, [{ text: 'Anderen Platz wählen', wert: 1 }]);
      } finally { kameraBleibt = false; }   // fürs Sri Yantra schwenkt die Kamera wieder zum großen Baum
      stille(); kameraZu(0); waehlen(true);
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
    questAn = true;
    await sammeln();
    questAn = false;
    $('#questanzeige').hidden = true;
    kameraZu(0);
    if (Math.hypot(kol.x - 570, kol.y - 470) > 30) await fliege(570, 470, 1800);   // zurück zum Baum
    await reden(I.ablegen);
    stille();
    await ablegen();
    lerne('kompost');

    WELT.muecken(22); KLANG.start('gnitzen');
    await warte(1800);
    WELT.baumBluehen();
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
    if (I.ausblickSatz) await sage(...I.ausblickSatz);
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
    stille(); kameraZu(0); WELT.zoom.zurueck(); await warte(700);
    const M = { x: 800, y: 560 };
    const start = Array.from({ length: 7 }, () => [KAM.x - O + 150 + Math.random() * (BREITE - 300), 120 + Math.random() * 300]);
    const flieger = WELT.effekt.bohnenFlug(start);
    KLANG.spiel('funkeln');
    const kreisPunkt = (w, i) => { const a = w + i / 7 * Math.PI * 2; return [M.x + Math.cos(a) * 190, M.y + Math.sin(a) * 70]; };
    const gleite = (ziele, ms, ease) => new Promise(fertig => {   // wie transition: left/top 1.6s cubic-bezier(.4,0,.2,1)
      const von = flieger.map(b => [b.x, b.y]), t0 = performance.now(), e = WELT.bez(...ease);
      const schritt = t => { const p = Math.min(1, (t - t0) / ms), k = e(p); flieger.forEach((b, i) => b.position.set(von[i][0] + (ziele[i][0] - von[i][0]) * k, von[i][1] + (ziele[i][1] - von[i][1]) * k)); if (p < 1) requestAnimationFrame(schritt); else fertig(); };
      requestAnimationFrame(schritt);
    });
    await gleite(flieger.map((_, i) => kreisPunkt(0, i)), SCHNELL ? 160 : 1600, [.4, 0, .2, 1]); await warte(100);
    // einmal ganz um den Baum kreisen
    await new Promise(fertig => { const t0 = performance.now(), dauer = SCHNELL ? 200 : 2200;
      const schritt = t => { const p = Math.min(1, (t - t0) / dauer); flieger.forEach((b, i) => b.position.set(...kreisPunkt(p * Math.PI * 2, i))); if (p < 1) requestAnimationFrame(schritt); else fertig(); };
      requestAnimationFrame(schritt); });
    // in die Erde sinken, dort wo der neue Baum keimt
    await gleite(flieger.map(() => [923, 752]), SCHNELL ? 130 : 1300, [.4, 0, .2, 1]);
    await new Promise(fertig => { const t0 = performance.now(), dauer = SCHNELL ? 80 : 800;
      const schritt = t => { const p = Math.min(1, (t - t0) / dauer); flieger.forEach(b => { b.alpha = 1 - p; b.scale.set(1 - .7 * p); }); if (p < 1) requestAnimationFrame(schritt); else fertig(); };
      requestAnimationFrame(schritt); });
    KLANG.spiel('plopp');
    flieger.forEach(b => b.destroy({ children: true }));
    WELT.keimling(); KLANG.spiel('wachsen', 1); KLANG.spiel('richtig');
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
  const bohnenListe = BOHNEN.map(([x, y], i) => {
    const b = { weg: false, gefunden: false };
    // Bohne: klein, schräg, schimmert ab und zu golden
    const fig = new WELT.Figur(WELT.F.bohnen, { box: [x, y, 22, 34], bild: 'bohne', unten: false, breite: 30 });
    fig.innen.br = -30;
    fig.zeigeGlanz('rgba(255,224,138,1)', 8, 0);
    const schimmer = WELT.kf([[0, { a: 0 }], [.8, { a: 0 }], [.88, { a: 1 }], [1, { a: 0 }]], 4, { ease: 'ease-in-out', iter: Infinity, verz: -i * 1.3 });
    WELT.lauf(t => { if (b.weg) return false; if (!b.gefunden) { const a = schimmer.wert(t)?.a ?? 0; fig.glanzAlpha(a); fig.hellAlpha(a * .2); } return true; });
    b.entfernen = () => { b.weg = true; WELT.weg(fig.aussen); };
    WELT.ziel({ name: 'bohne', box: [x - 14, y - 14, 50, 62], z: WELT.ZRANG.bohne, aktiv: () => !b.weg && !b.gefunden, tap: () => {
      if (gezogen || b.gefunden) return;
      b.gefunden = true; bohnen += 1; KLANG.spiel('sammeln'); stand.bohnen.push(i); speichere();
      bohnenAnzeige.hidden = false; $('span', bohnenAnzeige).textContent = `${bohnen} / ${BOHNEN.length}`;
      bohnenAnzeige.classList.remove('neu'); void bohnenAnzeige.offsetWidth; bohnenAnzeige.classList.add('neu');
      fig.glanzAlpha(0); fig.hellAlpha(0);
      fig.aussen.spiele(WELT.kf([[.3, { y: -30, s: 1.4, a: 1 }], [1, { y: -160, s: .4, a: 0 }]], .9, { ease: 'ease-in', halten: true }));
      setTimeout(() => b.entfernen(), 900);
      // kleines Schild über der Bohne: blendet ein, steigt auf, blendet aus
      const s = weltSchild('bohnen-schild', `<img src="${FIGUR('bohne')}" alt=""><span></span><b></b>`, x + 11, y - 12, SCHNELL ? 400 : 2600);
      $('span', s).textContent = I.bohnen.gefunden; $('b', s).textContent = `${bohnen} / ${BOHNEN.length}`;
      if (bohnen === BOHNEN.length) setTimeout(bohnenMoment, SCHNELL ? 100 : 1200);
    } });
    return b;
  });

  // Entdecken: Klick-Überraschungen und Verstecke (entdecken.js)
  ENTDECKEN.start({ I, lerne, zeigeHinweis, SCHNELL, bild, dialogOffen: () => !dialog.hidden, gezogen: () => gezogen, baumSpricht, kommentar, froschkonzert,
    baumStufe: () => stufe, istQuest: () => questAn, istWaehlen: () => waehlenAn, frei: () => umschauErlaubt() && dialog.hidden && !waehlenAn });
  plaetze = ENTDECKEN.verstecke(sammelDinge);
  plaetze.forEach(p => { p.onclick = () => versteckKlick(p); });

  // Ladebildschirm ausblenden (die Welt ist fertig gezeichnet), Legendenbilder in Ruhe nachladen
  (function laden() {
    const el = $('#laden'); if (!el) return;
    setTimeout(() => { el.classList.add('weg'); setTimeout(() => el.remove(), 900); }, 250);
    setTimeout(legendeLaden, 2500);
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
})(); }).catch(e => { console.error(e); });
