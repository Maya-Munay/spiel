// Kakao-Reise · Die Waldwelt in EINER WebGL-Zeichenfläche (PixiJS v8, lib/pixi.min.js)
// Alles, was zur Welt gehört (Weltbild, Tiere, Kakaobaum, Licht, Wetter, Blätter vorn), wird hier gezeichnet.
// HTML bleibt nur für Fenster, Texte und Knöpfe darüber (index.html). Koordinaten wie bisher:
// Bühne 1600 × 900 (bis 2560 breit), Welt x −500 … 2100. Jede Ebene wandert beim Umschauen nach ihrer Tiefe.
(() => {
  const P = window.PIXI;
  const SUCHE = location.search;
  const SCHNELL = /schnell/.test(SUCHE);
  const RUHIG = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINGER = matchMedia('(pointer: coarse)').matches;
  const FIG = n => `bilder/platzhalter/figuren/${n}.webp`;
  const jetzt = () => performance.now();
  const W = {}; window.WELT = W;

  // ---------- Modus: leicht (Handy/Tablet), ganz leicht (nach einem Absturz), flach (Vergleich ohne Tiefe) ----------
  const body = document.body;
  if (FINGER || /leicht/.test(SUCHE)) body.classList.add('leicht');
  try {   // Absturz-Erkennung: Wurde die Seite beim letzten Mal nicht ordentlich verlassen, läuft sie jetzt ganz leicht
    if (sessionStorage.getItem('kakao-laeuft') === '1' || /sehrleicht/.test(SUCHE)) body.classList.add('leicht', 'sehr-leicht');
    const lauf = () => sessionStorage.setItem('kakao-laeuft', '1');
    lauf(); addEventListener('pageshow', lauf); addEventListener('pagehide', () => sessionStorage.removeItem('kakao-laeuft'));
  } catch (e) {}
  const LEICHT = body.classList.contains('leicht'), SEHR_LEICHT = body.classList.contains('sehr-leicht');
  const FLACH = /flach/.test(SUCHE);
  if (FLACH) body.classList.add('flach');
  W.LEICHT = LEICHT; W.SEHR_LEICHT = SEHR_LEICHT;

  // Auflösung der Zeichenfläche begrenzen (höchstens 2 Bildpunkte je Bildschirmpunkt, nach einem Absturz 1)
  const AUFL = Math.min(window.devicePixelRatio || 1, SEHR_LEICHT ? 1 : 2);
  // Texturen nur so groß, wie sie auf diesem Gerät höchstens gezeigt werden (Bildpunkte je Bühnenpunkt)
  const TEXMASS = (() => {
    const test = SUCHE.match(/texmass=([\d.]+)/); if (test) return +test[1];   // zum Prüfen am PC, z. B. ?texmass=1.5 wie auf dem iPhone
    const sw = Math.max(screen.width, screen.height) || 1600, sh = Math.min(screen.width, screen.height) || 900;
    const breite = Math.max(1600, Math.min(2560, 900 * sw / sh)), m = Math.min(sw / breite, sh / 900);
    // auf Handys etwas Reserve, damit die Figuren auch hineingezoomt scharf bleiben
    return Math.max(.5, Math.min(2, m * AUFL * (FINGER ? 1.7 : 1.15)));
  })();

  // ---------- Hilfen: Zufall, Kurven, Schlüsselbilder wie in CSS ----------
  let saat = 7;
  const zufall = () => { saat |= 0; saat = saat + 0x6D2B79F5 | 0; let t = Math.imul(saat ^ saat >>> 15, 1 | saat); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const zw = (a, b) => a + zufall() * (b - a);
  const klemme = (v, a, b) => Math.max(a, Math.min(b, v));
  function bez(x1, y1, x2, y2) {   // cubic-bezier wie in CSS
    const ax = 3 * x1 - 3 * x2 + 1, bx = 3 * x2 - 6 * x1, cx = 3 * x1, ay = 3 * y1 - 3 * y2 + 1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
    const X = u => ((ax * u + bx) * u + cx) * u, Y = u => ((ay * u + by) * u + cy) * u, dX = u => (3 * ax * u + 2 * bx) * u + cx;
    return t => {
      if (t <= 0) return 0; if (t >= 1) return 1;
      let u = t;
      for (let i = 0; i < 8; i++) { const f = X(u) - t, d = dX(u); if (Math.abs(f) < 1e-5) return Y(u); if (Math.abs(d) < 1e-6) break; u -= f / d; }
      let lo = 0, hi = 1; u = t;
      for (let i = 0; i < 30; i++) { const f = X(u); if (Math.abs(f - t) < 1e-5) break; if (f < t) lo = u; else hi = u; u = (lo + hi) / 2; }
      return Y(u);
    };
  }
  const EASE = { linear: t => t, ease: bez(.25, .1, .25, 1), 'ease-in-out': bez(.42, 0, .58, 1), 'ease-out': bez(0, 0, .58, 1), 'ease-in': bez(.42, 0, 1, 1) };
  const easing = e => typeof e === 'function' ? e : EASE[e] || (/^steps/.test(e || '') ? (n => u => Math.min(1, Math.floor(u * n) / n))(+e.match(/\d+/)[0]) : EASE.ease);
  const GRUND = { x: 0, y: 0, r: 0, s: 1, sx: 1, sy: 1, a: 1 };
  // kf([[0, {x, y, r, s, sx, sy, a}], [.4, {...}], ...], dauerSek, {ease, iter, alt, verz, halten, start})
  function kf(frames, dauer, o = {}) {
    const e = easing(o.ease || 'ease'), n = o.iter ?? 1, alt = !!o.alt, verz = o.verz || 0, start = o.start ?? jetzt();
    const props = {};
    for (const [p, w] of frames) for (const k in w) (props[k] ||= []).push([p, w[k]]);
    for (const k in props) {
      const l = props[k]; l.sort((a, b) => a[0] - b[0]);
      if (l[0][0] > 0) l.unshift([0, GRUND[k] ?? 0]);
      if (l[l.length - 1][0] < 1) l.push([1, GRUND[k] ?? 0]);
    }
    const wert = p => {
      const v = {};
      for (const k in props) {
        const l = props[k]; let i = 0;
        while (i < l.length - 2 && p > l[i + 1][0]) i++;
        const [pa, va] = l[i], [pb, vb] = l[i + 1], u = pb > pa ? klemme((p - pa) / (pb - pa), 0, 1) : 1;
        v[k] = va + (vb - va) * e(u);
      }
      return v;
    };
    const ende = alt && n % 2 === 0 ? 0 : 1;
    return {
      fertig: false, start,
      wert(t) {
        let el = (t - start) / 1000 - verz;
        if (el < 0 && el > -.1 && verz <= 0) el = 0;   // Bildtakt liegt minimal vor dem Start: schon den Anfang zeigen
        if (el < 0) return o.vorher ? wert(0) : null;
        const z = el / dauer;
        if (z >= n) { this.fertig = true; return o.halten ? wert(ende) : null; }
        const i = Math.floor(z); let p = z - i; if (alt && i % 2) p = 1 - p;
        return wert(p);
      },
    };
  }
  // weicher Übergang eines Wertes (wie CSS transition)
  function uebergang(start, ziel, dauer, ease = 'ease') {
    const e = easing(ease), t0 = jetzt();
    return { ziel, wert(t) { const p = dauer > 0 ? klemme((t - t0) / (dauer * 1000), 0, 1) : 1; return start + (ziel - start) * e(p); }, fertig(t) { return t - t0 >= dauer * 1000; } };
  }
  class Wert {   // Zahl mit Übergang: w.zu(ziel, sek, ease); w.v
    constructor(v) { this.u = null; this._v = v; }
    zu(ziel, dauer = 0, ease = 'ease') { const v = this.v; this.u = dauer > 0 ? uebergang(v, ziel, dauer, ease) : null; this._v = ziel; }
    get v() { if (!this.u) return this._v; const t = jetzt(), v = this.u.wert(t); if (this.u.fertig(t)) this.u = null; return v; }
    get ziel() { return this._v; }
  }

  // ---------- Zeichenfläche ----------
  const canvas = document.createElement('canvas'); canvas.id = 'welt';
  W.canvas = canvas;
  let app = null, BREITE = 1600, MASS = 1, O = 0;
  const wurzel = new P.Container();     // in Bühnenpunkten (wird mit MASS skaliert)
  const lagen = [];                       // Ebenen mit Kamera-Faktor k und Tiefe t
  function lage(name, k, t, opt = {}) {
    const c = new P.Container(); c.label = name; c.k = k; c.t = t; c.fest = !!opt.fest; c.off = { x: 0, y: 0 };
    wurzel.addChild(c); lagen.push(c); return c;
  }
  const L = {
    gemalt: lage('gemalt', 1, .6),
    himmel: lage('himmel', .08, .04),
    strahlen: lage('strahlen', .9, .6),
    flaeche: lage('flaeche', 1, .6),
    sonne: lage('sonnenfleck', 1, .6),
    vorn: lage('vorn', 1.06, 1.15),
    vignette: lage('vignette', 0, 0, { fest: true }),
    tag: lage('tageszeit', 0, 0, { fest: true }),
    licht: lage('baumlicht', 1, .6),
    sterne: lage('sterne', 1, .6),
    wetter: lage('wetter', 0, 0, { fest: true }),
  };
  // Unterebenen der Spielfläche (Reihenfolge = was vorn liegt, wie bisher im HTML)
  const F = {};
  for (const n of ['entdecken', 'orte', 'schatten', 'pflanzen', 'yantra', 'baum', 'funkeln', 'muecken', 'ablage', 'sammel', 'gesicht', 'regenbogen', 'keimling', 'stein', 'verstecke', 'kolibri', 'bohnen', 'effekte', 'flug']) {
    F[n] = new P.Container(); F[n].label = n; L.flaeche.addChild(F[n]);
  }

  // ---------- Bilder laden und als Texturen vorbereiten ----------
  const BILDER = {};      // name → HTMLImageElement
  const TEX = {};          // schlüssel → { tex, iw, ih, rand }  (rand in Bildpunkten des Originals)
  function ladeBild(src) {
    return new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  }
  // Figur-Textur backen: auf die nötige Größe verkleinern, auf Wunsch mit weichem dunklem Umriss (statt CSS-Filter)
  // breite = wie breit das Bild auf der Bühne höchstens erscheint (Bühnenpunkte)
  function backe(name, art = 'umriss', breite = 0, farbe = '', unschaerfe = 0) {
    const key = `${name}|${art}|${farbe}|${unschaerfe}`;
    if (TEX[key]) return TEX[key];
    const im = BILDER[name]; if (!im) return null;
    const iw = im.naturalWidth, ih = im.naturalHeight;
    // Bild (oder Ausschnitt aus dem Bildblatt) auf eine Leinwand malen
    const malen = (ctx, dx, dy, dw, dh) => im.blatt ? ctx.drawImage(im.blatt, im.sx, im.sy, iw, ih, dx, dy, dw, dh) : ctx.drawImage(im, dx, dy, dw, dh);
    const zielB = breite ? breite * TEXMASS : iw;
    const s = Math.min(1, zielB / iw);                     // Texturpunkte je Bildpunkt
    const q = breite ? s * iw / breite : s;                 // Texturpunkte je Bühnenpunkt
    let pad = 0;
    if (art === 'umriss') pad = Math.ceil(3.5 * q) + 1;
    else if (art === 'kolibri') pad = Math.ceil(9 * q) + 1;
    else if (art === 'schatten') pad = Math.ceil(6 * q) + 1;
    else if (art === 'glanz') pad = Math.ceil((unschaerfe * 1.2 + 2) * q) + 1;
    else if (art === 'weiss') pad = Math.ceil(44 * q) + 1;
    const cw = Math.max(1, Math.round(iw * s)) + 2 * pad, ch = Math.max(1, Math.round(ih * s)) + 2 * pad;
    if (art === 'roh' && s >= .999 && !im.blatt) {   // unverändert: direkt als Textur
      const tex = P.Texture.from(im);
      return (TEX[key] = { tex, iw, ih, rand: 0 });
    }
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d');
    const w = cw - 2 * pad, h = ch - 2 * pad;
    const schattenNur = (blur, col, dx = 0, dy = 0) => {   // nur den Schatten zeichnen (Bild weit links außerhalb)
      x.save(); x.shadowColor = col; x.shadowBlur = blur; x.shadowOffsetX = 20000 + dx; x.shadowOffsetY = dy;
      malen(x, pad - 20000, pad, w, h); x.restore();
    };
    if (art === 'umriss' || art === 'kolibri') {
      schattenNur(2.6 * q, 'rgba(22,16,10,.3)');
      schattenNur(1.2 * q, art === 'kolibri' ? 'rgba(22,16,10,.95)' : 'rgba(22,16,10,.9)');
      if (art === 'kolibri') schattenNur(6 * q, 'rgba(53,46,38,.25)', 0, 6 * q);
      malen(x, pad, pad, w, h);
    } else if (art === 'roh' || art === 'blatt') {
      malen(x, pad, pad, w, h);
      if (art === 'blatt') {   // weicher Rand: harte Bildkanten verschwinden
        x.globalCompositeOperation = 'destination-in';
        const f = .12;
        for (const [x0, y0, x1, y1] of [[0, 0, w * f, 0], [w, 0, w * (1 - f), 0], [0, 0, 0, h * f], [0, h, 0, h * (1 - f)]]) {
          const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
          x.fillStyle = g; x.fillRect(0, 0, cw, ch);
        }
        x.globalCompositeOperation = 'source-over';
      }
    } else if (art === 'schatten') {      // schwarzer, weicher Wurfschatten
      schattenNur(5 * q, 'rgba(0,0,0,1)');
    } else if (art === 'glanz') {         // nur der farbige Schein um die Figur (drop-shadow 0 0 N px farbe)
      schattenNur(unschaerfe * q, farbe);
      if (unschaerfe > 6) schattenNur(unschaerfe * .45 * q, farbe);
    } else if (art === 'weiss') {         // weißes Leuchten des Kakaobaums (Silhouette, weich, mit Schein)
      const t = document.createElement('canvas'); t.width = cw; t.height = ch;
      const y = t.getContext('2d'); malen(y, pad, pad, w, h); y.globalCompositeOperation = 'source-in'; y.fillStyle = '#fff'; y.fillRect(0, 0, cw, ch);
      const nur = (blur, col) => { x.save(); x.shadowColor = col; x.shadowBlur = blur; x.shadowOffsetX = 20000; x.drawImage(t, -20000, 0); x.restore(); };
      nur(38 * q, 'rgba(255,255,255,.85)'); nur(16 * q, '#fff'); nur(4 * q, '#fff'); nur(2 * q, '#fff');
    }
    const tex = P.Texture.from(c);
    return (TEX[key] = { tex, iw, ih, rand: pad / s, maske: art === 'roh' || art === 'blatt' ? maske(c) : null });
  }
  function maske(c) {   // kleine Alpha-Maske für Treffer nach Blattform
    try {
      const m = document.createElement('canvas'); m.width = 80; m.height = Math.max(1, Math.round(80 * c.height / c.width));
      const x = m.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0, m.width, m.height);
      return { d: x.getImageData(0, 0, m.width, m.height).data, w: m.width, h: m.height };
    } catch (e) { return null; }
  }
  // Sprite mit gebackener Textur in ein Rechteck (Bildinhalt) setzen
  function setzeBild(sp, t, x, y, w, h) {
    sp.texture = t.tex;
    const k = w / t.iw;
    sp.x = x - t.rand * k; sp.y = y - t.rand * k;
    sp.width = (t.iw + 2 * t.rand) * k; sp.height = (t.ih + 2 * t.rand) * (h / t.ih);
  }
  // Bild in einen Kasten einpassen (wie preserveAspectRatio meet / object-fit: contain)
  function einpassen(iw, ih, bx, by, bw, bh, unten = false) {
    const s = Math.min(bw / iw, bh / ih), w = iw * s, h = ih * s;
    return [bx + (bw - w) / 2, unten ? by + bh - h : by + (bh - h) / 2, w, h];
  }

  // ---------- Gemalte Hilfstexturen (Verläufe, Lichtpunkte) ----------
  const leinwand = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const TX = {};
  function radial(stops, groesse = 128) {   // runder Verlauf, Radius 1 = Rand
    const key = 'r' + JSON.stringify(stops);
    if (TX[key]) return TX[key];
    const [c, x] = leinwand(groesse, groesse), g = x.createRadialGradient(groesse / 2, groesse / 2, 0, groesse / 2, groesse / 2, groesse / 2);
    for (const [p, f] of stops) g.addColorStop(klemme(p, 0, 1), f);
    x.fillStyle = g; x.fillRect(0, 0, groesse, groesse);
    return (TX[key] = P.Texture.from(c));
  }
  function punktTex(farbe, glanz) {   // kleiner leuchtender Punkt: Kern + Schein (für Sterne, Staub, Glitzer)
    const key = 'p' + farbe + glanz;
    if (TX[key]) return TX[key];
    const [c, x] = leinwand(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, farbe); g.addColorStop(.16, farbe); g.addColorStop(.22, glanz); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (TX[key] = P.Texture.from(c));
  }
  function sternTex(farbe = '#FFF6D0', schein = '#FFD86A') {   // vierzackiger Funke mit Schein
    const key = 's' + farbe + schein;
    if (TX[key]) return TX[key];
    const [c, x] = leinwand(64, 64);
    x.shadowColor = schein; x.shadowBlur = 8; x.fillStyle = farbe;
    x.beginPath(); x.moveTo(32, 12); x.quadraticCurveTo(34.5, 29.5, 52, 32); x.quadraticCurveTo(34.5, 34.5, 32, 52); x.quadraticCurveTo(29.5, 34.5, 12, 32); x.quadraticCurveTo(29.5, 29.5, 32, 12); x.fill();
    return (TX[key] = P.Texture.from(c));
  }
  const weiss = () => P.Texture.WHITE;

  // ---------- Sprites und Teile ----------
  function sprite(tex, eltern, opt = {}) {
    const s = new P.Sprite(tex || weiss());
    Object.assign(s, opt); if (eltern) eltern.addChild(s); return s;
  }
  // Teil = Container mit Drehpunkt; Animationen: dauernd (idle) und einmal (überschreibt solange sie läuft)
  class Teil extends P.Container {
    constructor(eltern, x = 0, y = 0, ox = 0, oy = 0) {
      super(); this.bx = x + ox; this.by = y + oy; this.pivot.set(ox, oy); this.position.set(this.bx, this.by);
      this.idle = null; this.einmal = null; this.balpha = 1; this.bsx = 1; this.bsy = 1; this.br = 0; this.bdx = 0; this.bdy = 0;
      if (eltern) eltern.addChild(this);
    }
    spiele(a) { this.einmal = a; return a; }
    schritt(t) {
      let v = null;
      if (this.einmal) { v = this.einmal.wert(t); if (this.einmal.fertig) { this.einmal = null; v = null; } }
      if (!v && this.idle && !RUHIG) v = this.idle.wert(t);
      v ||= GRUND;
      const s = v.s ?? 1;
      this.position.set(this.bx + this.bdx + (v.x || 0), this.by + this.bdy + (v.y || 0));
      this.rotation = ((v.r || 0) + this.br) * Math.PI / 180;
      this.scale.set(this.bsx * s * (v.sx ?? 1), this.bsy * s * (v.sy ?? 1));
      this.alpha = this.balpha * (v.a ?? 1);
    }
  }
  const teile = new Set();       // alle Teile, die jedes Bild ihre Animation brauchen
  const laeufer = new Set();     // einmalige Abläufe: f(t) → false = fertig
  const lauf = f => { laeufer.add(f); return f; };
  function teil(eltern, x, y, ox, oy) { const t = new Teil(eltern, x, y, ox, oy); teile.add(t); return t; }
  function weg(obj) { teile.delete(obj); obj.children?.forEach(k => teile.delete(k)); obj.destroy({ children: true }); }

  // ---------- Figur: Bild in Kasten, zwei Ebenen für Bewegung (außen = Kasten, innen = Bild) ----------
  // Glanz (warmer Schein) und Hell (Aufhellen) als zusätzliche Sprites, nur wenn gebraucht
  class Figur {
    constructor(eltern, { box: [l, t, w, h], bild, art = 'umriss', unten = true, aussen, innen, breite }) {
      this.box = [l, t, w, h]; this.art = art; this.unten = unten; this.breite = breite;
      const [ox, oy] = aussen || [w / 2, h / 2], [ix, iy] = innen || [ox, oy];
      this.aussen = teil(eltern, l, t, ox, oy);
      this.innen = teil(this.aussen, 0, 0, ix, iy);
      this.glanz = null; this.hell = null;
      this.sp = sprite(null, this.innen);
      this.name = null; this.bild(bild);
    }
    rechteck(name) { const im = BILDER[name]; return einpassen(im.naturalWidth, im.naturalHeight, 0, 0, this.box[2], this.box[3], this.unten); }
    bild(name) {
      if (!name || name === this.name || !BILDER[name]) return;
      this.name = name;
      const r = this.rechteck(name), t = backe(name, this.art, this.breite || r[2]);
      setzeBild(this.sp, t, ...r);
      if (this.glanz?.visible) this.zeigeGlanz(this.glanzFarbe, this.glanzBlur, this.glanz.alpha);
      if (this.hell) setzeBild(this.hell, t, ...r);
    }
    zeigeGlanz(farbe, blur, alpha = 1) {   // drop-shadow(0 0 blur farbe) als eigener Schein hinter der Figur
      if (!this.glanz) { this.glanz = sprite(null, null); this.innen.addChildAt(this.glanz, 0); }
      this.glanzFarbe = farbe; this.glanzBlur = blur;
      const r = this.rechteck(this.name), t = backe(this.name, 'glanz', this.breite || r[2], farbe, blur);
      setzeBild(this.glanz, t, ...r); this.glanz.alpha = alpha; this.glanz.visible = alpha > .01;
    }
    glanzAlpha(a) { if (this.glanz) { this.glanz.alpha = a; this.glanz.visible = a > .01; } }
    hellAlpha(a) {   // brightness(1 + a): dieselbe Figur noch einmal „addiert“
      if (!this.hell) { if (a <= .01) return; this.hell = sprite(null, this.innen, { blendMode: 'add' }); const r = this.rechteck(this.name); setzeBild(this.hell, backe(this.name, this.art, this.breite || r[2]), ...r); }
      this.hell.alpha = a; this.hell.visible = a > .01;
    }
    set sichtbar(v) { this.aussen.visible = v; }
    get sichtbar() { return this.aussen.visible; }
  }
  W.Figur = Figur;

  // ---------- Treffer (klickbare Dinge) ----------
  // Jedes Ziel: name (für den Mauszeiger), box in Weltpunkten, aktiv(), tap(punkt). Später angelegte liegen oben.
  const ziele = [];
  let zielNr = 0;
  function ziel(o) {
    const z = Object.assign({ z: 0, nr: zielNr++, zeigeName: false, aktiv: () => true, tap: () => {}, hover: null }, o);
    ziele.push(z); ziele.sort((a, b) => (b.z - a.z) || (b.nr - a.nr));
    return z;
  }
  const ZRANG = { entdecken: 1, orte: 2, ablage: 3, gesicht: 4, stein: 5, versteck: 6, bohne: 7 };
  function trifft(z, x, y) { const [l, t, w, h] = typeof z.box === 'function' ? z.box() : z.box; return x >= l && x <= l + w && y >= t && y <= t + h; }
  function treffer(x, y) { for (const z of ziele) if (z.aktiv() && trifft(z, x, y)) return z; return null; }
  W.ziel = ziel; W.ZRANG = ZRANG;

  // Bildschirm ↔ Welt
  // Bildschirm → Bühne: immer an der echten Lage der Zeichenfläche messen (stimmt auch, wenn der Browser die Leisten verschiebt)
  const aufBuehne = (cx, cy) => { const r = canvas.getBoundingClientRect(); return { x: (cx - r.left) / MASS, y: (cy - r.top) / MASS }; };
  // Zoom (zwei Finger, Strg + Mausrad): Bühnenpunkt p → ZOOM.z · p + (tx, ty); Fenster und Knöpfe bleiben gleich groß
  const ZOOM = { z: 1, tx: 0, ty: 0, max: 2.6, zurueck: null };
  const inWelt = (cx, cy, lg = L.flaeche) => { const p = aufBuehne(cx, cy); return { x: (p.x - ZOOM.tx) / ZOOM.z - lg.off.x, y: (p.y - ZOOM.ty) / ZOOM.z - lg.off.y }; };
  W.aufBuehne = aufBuehne; W.inWelt = inWelt;
  // Rechteck eines Weltdings in Bühnenpunkten (für Sprechblasen und Flieger)
  W.aufBuehneRechteck = ([l, t, w, h], lg = L.flaeche) => {
    const z = ZOOM.z, x = lg.off.x, y = lg.off.y;
    return { l: (l + x) * z + ZOOM.tx, t: (t + y) * z + ZOOM.ty, r: (l + w + x) * z + ZOOM.tx, u: (t + h + y) * z + ZOOM.ty };
  };
  function zoomKlemme() {
    ZOOM.z = klemme(ZOOM.z, 1, ZOOM.max);
    ZOOM.tx = klemme(ZOOM.tx, BREITE * (1 - ZOOM.z), 0); ZOOM.ty = klemme(ZOOM.ty, 900 * (1 - ZOOM.z), 0);
  }
  W.zoom = {
    get z() { return ZOOM.z; }, get tx() { return ZOOM.tx; }, get ty() { return ZOOM.ty; },
    um(sx, sy, faktor) {   // um einen Bühnenpunkt herum vergrößern/verkleinern
      ZOOM.zurueck = null;
      const z0 = ZOOM.z, z1 = klemme(z0 * faktor, 1, ZOOM.max);
      ZOOM.tx = sx - (sx - ZOOM.tx) * z1 / z0; ZOOM.ty = sy - (sy - ZOOM.ty) * z1 / z0; ZOOM.z = z1; zoomKlemme();
    },
    schiebe(dx, dy) {   // verschieben (Bühnenpunkte); gibt zurück, was in x nicht mehr ging
      ZOOM.zurueck = null;
      const tx0 = ZOOM.tx; ZOOM.tx += dx; ZOOM.ty += dy; zoomKlemme(); return dx - (ZOOM.tx - tx0);
    },
    setze(tx, ty) { ZOOM.zurueck = null; ZOOM.tx = tx; ZOOM.ty = ty; zoomKlemme(); },
    zurueck(sek = .6) { if (ZOOM.z > 1.001) ZOOM.zurueck = { z: new Wert(ZOOM.z), tx: new Wert(ZOOM.tx), ty: new Wert(ZOOM.ty) }, ['z', 'tx', 'ty'].forEach(k => ZOOM.zurueck[k].zu(k === 'z' ? 1 : 0, sek, 'ease-in-out')); },
  };
  // sichtbarer Ausschnitt der Spielfläche in Weltpunkten (für Wissenskarten), bei Kamera-Ziel kx
  W.sicht = kx => { const lg = L.flaeche, offX = kx === undefined ? lg.off.x : -(kx - O) * lg.k - KAM.istX * lg.t * 24;
    return { x: -ZOOM.tx / ZOOM.z - offX, y: -ZOOM.ty / ZOOM.z - lg.off.y, w: BREITE / ZOOM.z, h: 900 / ZOOM.z, z: ZOOM.z }; };

  // ---------- Kamera ----------
  const KAM = { x: 0, istX: 0, istY: 0 };
  W.kamera = (x, o, ix, iy) => { KAM.x = x; O = o; KAM.istX = ix; KAM.istY = iy; };
  function lagenSetzen() {
    if (ferne) { const a = klemme((ZOOM.z - 1.05) / 1.1, 0, 1) * .9; ferne.alpha = a; ferne.visible = a > .01; }
    if (ZOOM.zurueck) { const r = ZOOM.zurueck; ZOOM.z = r.z.v; ZOOM.tx = r.tx.v; ZOOM.ty = r.ty.v; if (!r.z.u) ZOOM.zurueck = null; }
    for (const c of lagen) {
      if (c.fest) { c.x = 0; c.y = 0; c.off = { x: 0, y: 0 }; continue; }
      const ox = -(KAM.x - O) * c.k - KAM.istX * c.t * 24, oy = -KAM.istY * c.t * 10;
      c.off = { x: ox, y: oy };
      c.x = ox * ZOOM.z + ZOOM.tx; c.y = oy * ZOOM.z + ZOOM.ty; c.scale.set(ZOOM.z);
    }
  }

  // ======================================================================
  //  Die Welt
  // ======================================================================
  let welt = null;     // Sprite des gemalten Weltbilds
  function baueWelt() {
    // --- gemaltes Weltbild ---
    const wt = backe(FLACH ? 'welt' : 'welt-tief', 'roh', 2600);
    welt = sprite(wt.tex, L.gemalt); welt.x = -500; welt.y = 0; welt.width = 2600; welt.height = 900;
    if (!SEHR_LEICHT) baueLebendig(wt.tex);
    baueWasser();
    if (!SEHR_LEICHT) { baueFerne(); baueAbendlicht(); }
    // Schattenfleck zwischen den beiden Stämmen
    sprite(radial([[0, 'rgba(70,96,60,.62)'], [.6, 'rgba(70,96,60,.32)'], [1, 'rgba(70,96,60,0)']]), L.gemalt, { x: 560, y: 560, width: 520, height: 260, blendMode: 'multiply' });

    baueAras();
    if (!FLACH && !SEHR_LEICHT) baueStrahlen();
    baueStaub();
    baueSonnenfleck();
    baueSchatten();
    bauePflanzen();
    baueBaum();
    baueYantra();
    baueFunkeln();
    baueAblage();
    baueGesicht();
    baueRegenbogen();
    baueKeimling();
    baueStein();
    baueKolibri();
    if (!FLACH && !SEHR_LEICHT) baueVorn();
    baueVignette();
    baueTageszeit();
    baueBaumlicht();
    baueSterne();
    baueWetter();
  }

  // --- Lebendiges Weltbild: Kronen wiegen sich, Fluss kräuselt sich ---
  // Kein Filter und keine Kopie des großen Bilds: kleine Netze (Meshes) über den bewegten Stellen lesen aus derselben
  // Textur und verschieben nur ihre Textur-Koordinaten. Am Rand des weichen Bereichs ist die Verschiebung 0 – nahtlos.
  const wellen = [];
  let wellenAn = true;
  function polygon(d) { return d.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number).reduce((a, v, i) => (i % 2 ? a[a.length - 1].push(v) : a.push([v]), a), []); }
  function abstand(px, py, pol) {   // vorzeichenbehafteter Abstand zum Polygon (innen positiv)
    let d = Infinity, innen = false;
    for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
      const [xi, yi] = pol[i], [xj, yj] = pol[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) innen = !innen;
      const dx = xj - xi, dy = yj - yi, l2 = dx * dx + dy * dy, u = l2 ? klemme(((px - xi) * dx + (py - yi) * dy) / l2, 0, 1) : 0;
      d = Math.min(d, Math.hypot(px - (xi + u * dx), py - (yi + u * dy)));
    }
    return innen ? d : -d;
  }
  function rauschen(seed, fx, fy, oktaven = 1) {   // glattes Rauschen (Summe schräger Sinuswellen), Werte etwa −0,5 … 0,5
    let s = seed * 9301 + 49297; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const wellen = [];
    for (let o = 0; o < oktaven; o++) for (let i = 0; i < 3; i++) {
      const w = r() * Math.PI, f = (.75 + r() * .5) * 2 * Math.PI * (o ? 2 : 1);
      wellen.push([Math.cos(w) * fx * f, Math.sin(w) * fy * f, r() * 6.28, (o ? .5 : 1) * .12]);
    }
    return (x, y) => { let v = 0; for (const [a, b, c, amp] of wellen) v += Math.sin(a * x + b * y + c) * amp; return v; };
  }
  function baueLebendig(tex) {
    const BEREICHE = [   // wie bisher: Bereich, weiche Maske, Rauschen, Stärke, Takt
      { x: -500, y: 0, w: 560, h: 330, raster: 10, maske: 'M-500 0 L40 0 L40 140 L-60 250 L-180 300 L-280 250 L-420 180 L-500 200 Z', seed: 80, fx: .018, fy: .026, okt: 1, s: 9, dauer: 6 },
      { x: 320, y: 0, w: 1170, h: 350, raster: 10, maske: 'M330 0 L1470 0 L1470 180 L1300 330 L900 330 L600 310 L380 250 L330 160 Z', seed: 46, fx: .018, fy: .026, okt: 1, s: 9, dauer: 7.1 },
      { x: 1850, y: 20, w: 260, h: 230, raster: 10, maske: 'M1860 30 L2100 30 L2100 230 L1860 230 Z', seed: 95, fx: .018, fy: .026, okt: 1, s: 9, dauer: 6.8 },
      { x: -500, y: 600, w: 460, h: 300, raster: 5, maske: 'M-500 680 L-300 662 L-200 640 L-60 612 L-60 640 L-160 668 L-215 700 L-260 750 L-310 790 L-330 900 L-500 900 Z', seed: 11, fx: .012, fy: .07, okt: 2, s: 8, dauer: 2.6 },
    ];
    const spline = bez(.45, 0, .55, 1);
    for (const B of BEREICHE) {
      const nx = Math.ceil(B.w / B.raster) + 1, ny = Math.ceil(B.h / B.raster) + 1;
      const pos = new Float32Array(nx * ny * 2), uv = new Float32Array(nx * ny * 2), basis = new Float32Array(nx * ny * 2), schub = new Float32Array(nx * ny * 2);
      const pol = polygon(B.maske), rx = rauschen(B.seed, B.fx, B.fy, B.okt), ry = rauschen(B.seed + 17, B.fx, B.fy, B.okt);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = (j * nx + i) * 2, X = B.x + Math.min(B.w, i * B.raster), Y = B.y + Math.min(B.h, j * B.raster);
        pos[k] = X; pos[k + 1] = Y;
        basis[k] = (X + 500) / 2600; basis[k + 1] = Y / 900;
        const am = i === 0 || j === 0 || i === nx - 1 || j === ny - 1 ? 0 : 1;   // Rand des Netzes bleibt fest
        const g = am * klemme((abstand(X, Y, pol) + 24) / 48, 0, 1), gw = g * g * (3 - 2 * g);
        schub[k] = gw * rx(X, Y) / 2600; schub[k + 1] = gw * ry(X, Y) / 900;
      }
      const idx = new Uint32Array((nx - 1) * (ny - 1) * 6);
      let n = 0;
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.set([a, b, c, b, d, c], n); n += 6; }
      uv.set(basis);
      const geo = new P.MeshGeometry({ positions: pos, uvs: uv, indices: idx });
      const mesh = new P.Mesh({ geometry: geo, texture: tex });
      L.gemalt.addChild(mesh);
      wellen.push({ mesh, geo, uv, basis, schub, B, spline });
    }
  }
  function wellenSchritt(t) {
    for (const w of wellen) {
      w.mesh.visible = wellenAn;
      if (!wellenAn) continue;
      const z = (t / 1000 / w.B.dauer) % 1, p = z < .5 ? z * 2 : (1 - z) * 2, s = -w.B.s + 2 * w.B.s * w.spline(p);
      const { uv, basis, schub } = w;
      for (let i = 0; i < uv.length; i++) uv[i] = basis[i] + s * schub[i];
      const buf = w.geo.getBuffer('aUV'); buf.data = uv; buf.update();
    }
  }

  // --- Wasserfall, Gischt, Glitzer, Fluss ---
  let fallG = null;
  const FAEDEN = [['M135 305 Q113 362 101 480', 4.0, -.83, 1.05], ['M141 303 Q122 362 112 480', 4.0, -.26, 1.12], ['M147 304 Q131 362 123 480', 4.0, -.61, 1.00], ['M163 300 L162 480', 4.8, 0, .95], ['M172 300 L172 480', 4.8, -.08, 1.12], ['M181 300 L180 480', 4.8, -.28, .82], ['M207 297 L209 470', 3.3, -.89, 1.15], ['M213 297 L213 470', 3.3, -.04, .93], ['M219 297 L219 470', 3.3, -.14, 1.18], ['M286 315 L285 480', 4.4, -.19, 1.13], ['M294 315 L292 480', 4.4, -1.11, .98], ['M332 315 L332 470', 3.9, -.41, .99], ['M338 315 L337 470', 3.9, -.04, 1.15], ['M361 312 L360 420', 3.3, -.94, .88], ['M388 305 L389 470', 3.9, -1.07, 1.10], ['M394 305 L396 470', 3.9, -.70, 1.09]];
  const STRICHE = [7, 4, 16, 6, 4, 10];
  function linienzug(d, schritt = 3) {   // M/L/Q-Pfad → Punkte mit Längen
    const t = d.match(/[MLQ]|-?[\d.]+/g); const pts = []; let i = 0, cx = 0, cy = 0;
    while (i < t.length) {
      const c = t[i++];
      if (c === 'M' || c === 'L') { cx = +t[i++]; cy = +t[i++]; pts.push([cx, cy]); }
      else if (c === 'Q') { const qx = +t[i++], qy = +t[i++], ex = +t[i++], ey = +t[i++], x0 = cx, y0 = cy; for (let k = 1; k <= 24; k++) { const u = k / 24, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, e = u * u; pts.push([a * x0 + b * qx + e * ex, a * y0 + b * qy + e * ey]); } cx = ex; cy = ey; }
    }
    const fein = [pts[0]], len = [0];
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], l = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(l / schritt));
      for (let m = 1; m <= n; m++) { fein.push([x0 + (x1 - x0) * m / n, y0 + (y1 - y0) * m / n]); len.push(len[len.length - 1] + l / n); }
    }
    return { p: fein, l: len, ges: len[len.length - 1] };
  }
  function strichStueck(g, z, a, b) {   // Stück des Linienzugs von Länge a bis b
    a = Math.max(0, a); b = Math.min(z.ges, b); if (b <= a) return;
    const { p, l } = z; let i = 0; while (i < l.length - 1 && l[i + 1] < a) i++;
    const pt = (k, s) => { const u = (s - l[k]) / ((l[k + 1] - l[k]) || 1); return [p[k][0] + (p[k + 1][0] - p[k][0]) * u, p[k][1] + (p[k + 1][1] - p[k][1]) * u]; };
    const s0 = pt(i, a); g.moveTo(s0[0], s0[1]);
    while (i < l.length - 1 && l[i + 1] < b) { i++; g.lineTo(p[i][0], p[i][1]); }
    const s1 = pt(Math.min(i, l.length - 2), b); g.lineTo(s1[0], s1[1]);
  }
  const faeden = FAEDEN.map(([d, b, verz, dauer]) => ({ z: linienzug(d), b, verz, dauer }));
  function baueWasser() {
    // Fluss: treibendes Glitzern (in der Flussform)
    const glitzer = new P.Container(); L.gemalt.addChild(glitzer);
    const form = new P.Graphics().poly(polygon('M-500 680 L-300 662 L-200 640 L-60 612 L-60 640 L-160 668 L-215 700 L-260 750 L-310 790 L-330 900 L-500 900 Z').flat()).fill(0xffffff);
    L.gemalt.addChild(form); glitzer.mask = form;
    sprite(radial([[0, 'rgba(205,238,255,.42)'], [.55, 'rgba(190,230,255,.24)'], [1, 'rgba(190,230,255,0)']]), glitzer, { x: -640, y: 590, width: 640, height: 420, blendMode: 'screen' });
    const [sc, sx] = leinwand(40, 12); sx.strokeStyle = '#fff'; sx.lineWidth = 5.2; sx.lineCap = 'round'; sx.beginPath(); sx.moveTo(6, 6); sx.lineTo(34, 6); sx.stroke();
    const strich = P.Texture.from(sc);
    for (const [x, y, dx, dy, v] of [[-284, 825, 16, -4, -.2], [-415, 722, 17, -4, -.4], [-383, 801, 13, -4, -3.5], [-334, 808, 11, -5, -1.8], [-424, 854, 10, -5, -3.8], [-412, 677, 13, -4, -3.5], [-251, 680, 18, -4, -3.9], [-336, 645, 13, -6, -1.1], [-354, 820, 15, -5, -2.8], [-447, 718, 12, -5, -.7], [-305, 679, 12, -6, -3.8], [-345, 729, 14, -4, -1.5], [-176, 740, 16, -5, -3.8], [-428, 694, 17, -4, -2.0], [-158, 695, 14, -5, -3.1], [-341, 705, 13, -6, -.8]]) {
      const tl = teil(glitzer, x, y, 0, 0), l = Math.hypot(dx, dy);
      sprite(strich, tl, { anchor: { x: 6 / 40, y: .5 }, width: (l + 2.6) * 40 / 28 * .82, height: 2.6 * 12 / 5.2 * .82, rotation: Math.atan2(dy, dx) });
      tl.idle = kf([[0, { a: 0, x: 0, y: 0 }], [.2, { a: .85 }], [.7, { a: .85 }], [1, { a: 0, x: -70, y: 34 }]], 4, { ease: 'linear', iter: Infinity, verz: v });
    }
    // Wasserfall-Fäden (gestrichelt, fallend) mit kühlem Schein
    fallG = new P.Graphics(); L.gemalt.addChild(fallG);
    // Gischt
    const weich = radial([[0, 'rgba(255,255,255,1)'], [.55, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]);
    [[140, 480, 60, 16, 0], [210, 478, 40, 12, -.7], [300, 482, 50, 14, -1.4], [370, 474, 45, 12, -2.1]].forEach(([cx, cy, rx, ry, v]) => {
      const tl = teil(L.gemalt, cx, cy, 0, 0);
      sprite(weich, tl, { anchor: .5, width: rx * 2 + 22, height: ry * 2 + 22 });
      tl.idle = kf([[0, { a: .22, sx: 1, sy: 1 }], [1, { a: .45, sx: 1.3, sy: 1.2 }]], 2.4, { ease: 'ease-in-out', iter: Infinity, alt: true, verz: v });
    });
    // funkelnde Lichtpunkte im Nebel
    const punkt = punktTex('#E8FFFF', 'rgba(168,255,246,.55)');
    for (const [cx, cy, r, v, d] of [[134, 385, 2.4, -.8, 4.3], [375, 372, 1.7, -1.8, 3.3], [408, 367, 1.2, -.4, 3.9], [408, 389, 1.9, -2.2, 4.0], [165, 412, 2.0, -2.5, 2.9], [149, 360, 2.5, -1.4, 3.7], [192, 311, 1.3, -3.3, 4.1], [213, 427, 2.1, -3.6, 4.4], [223, 488, 2.5, -2.4, 4.3], [250, 365, 1.5, -3.5, 2.8], [117, 451, 2.3, -1.9, 4.2], [111, 342, 1.6, -1.7, 2.8], [117, 358, 2.5, -3.9, 4.0], [246, 340, 2.5, -2.1, 4.0], [104, 332, 2.4, -3.2, 4.3], [284, 375, 2.0, -3.4, 3.1], [263, 345, 2.3, 0, 3.9], [396, 295, 2.0, -2.6, 4.2], [279, 341, 1.8, -3.8, 4.3], [137, 309, 1.3, -.1, 3.4], [139, 463, 2.1, -.5, 3.6], [197, 389, 1.5, -.7, 2.9], [214, 432, 2.0, -.2, 3.9], [370, 445, 2.3, 0, 3.4], [115, 443, 1.4, -2.8, 3.0], [314, 353, 1.3, -1.6, 3.1]]) {
      const tl = teil(L.gemalt, cx, cy, 0, 0);
      sprite(punkt, tl, { anchor: .5, width: r * 2 / .32, height: r * 2 / .32 });
      tl.idle = kf([[0, { a: 0, y: 0 }], [.4, { a: 1 }], [1, { a: 0, y: -22 }]], d, { ease: 'ease-in-out', iter: Infinity, verz: v });
    }
  }
  function wasserfallSchritt(t) {
    if (!fallG) return;
    fallG.clear();
    const periode = STRICHE.reduce((a, b) => a + b, 0);
    for (const breite of [1, 0]) {   // erst der kühle Schein, dann die Fäden
      for (const f of faeden) {
        const z = ((t / 1000 - f.verz) / f.dauer) % 1, versatz = 38 * z;
        let s = -periode + (versatz % periode);
        while (s < f.z.ges) {
          let a = s;
          for (let k = 0; k < STRICHE.length; k += 2) { strichStueck(fallG, f.z, a, a + STRICHE[k]); a += STRICHE[k] + STRICHE[k + 1]; }
          s += periode;
        }
        if (breite) fallG.stroke({ width: f.b + 7, color: 0xA0FFFA, alpha: .1, cap: 'round' });
        else fallG.stroke({ width: f.b, color: 0xF0FFFF, alpha: .5, cap: 'round' });
      }
      if (LEICHT) break;
    }
  }

  // --- Aras am Himmel (zwei Paare, eins rot, eins blau-gelb) ---
  const arasListe = [];
  function ara(eltern, farben, mitStreifen) {
    const g = new P.Container(); eltern.addChild(g);
    const k = new P.Graphics();
    k.moveTo(-4, 4).lineTo(-58, 22).lineTo(-54, 14).lineTo(-60, 10).lineTo(-6, 0).closePath().fill(farben.schwanz);
    if (mitStreifen) k.moveTo(-4, 4).lineTo(-50, 20).stroke({ width: 3, color: farben.streifen });
    k.ellipse(6, 0, 18, 8).fill(farben.koerper);
    k.circle(24, -4, 7).fill(farben.koerper); k.circle(26, -5, 2.4).fill('#F7F2EA');
    k.moveTo(30, -6).bezierCurveTo(36, -6, 37, 0, 32, 2).closePath().fill('#2A2420');
    g.addChild(k);
    const fl = new P.Graphics();
    fl.moveTo(0, -2).bezierCurveTo(-6, -30, 8, -46, 20, -48).bezierCurveTo(14, -34, 16, -18, 10, -2).closePath().fill(farben.fluegel);
    fl.moveTo(8, -26).bezierCurveTo(10, -40, 18, -46, 20, -48).bezierCurveTo(18, -38, 16, -30, 12, -20).closePath().fill(farben.streifen);
    const ft = teil(g, 0, 0, 8.75, -2); ft.addChild(fl);
    return { g, ft };
  }
  let ferne = null;
  function baueFerne() {   // weiches Abbild der Ferne: kleines Weltbild, nur wo Himmel/Berge sind (Alpha aus der Himmelsmaske)
    const im = BILDER['welt-tief'] || BILDER.welt, w = 390, h = 135, [c, x] = leinwand(w, h);
    x.drawImage(im, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < w * h; i++) {
      const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const blau = (b - Math.max(r, g) + 6) / 22, wolke = mx - mn < 45 ? (mn - 165) / 40 : 0;
      p[i * 4 + 3] = Math.round(255 * klemme(Math.max(blau, wolke) * 1.15 - .1, 0, 1));
    }
    x.putImageData(d, 0, 0);
    ferne = sprite(P.Texture.from(c), L.gemalt, { x: -500, y: 0, width: 2600, height: 900, alpha: 0, visible: false });
  }
  let himmelTex = null;
  function himmelMaske() {   // weiß = Himmel, Wolken, ferne Berge; schwarz = Bäume, Stämme, Blätter
    if (himmelTex) return himmelTex;
    const im = BILDER['welt-tief'] || BILDER.welt, w = 650, h = 225, [c, x] = leinwand(w, h);
    x.drawImage(im, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data, v = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const blau = (b - Math.max(r, g) + 6) / 22, wolke = mx - mn < 45 ? (mn - 165) / 40 : 0;
      v[i] = klemme(Math.max(blau, wolke) * 1.3, 0, 1);
    }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {   // leicht weichzeichnen
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = i + dx, b = j + dy; if (a >= 0 && b >= 0 && a < w && b < h) { s += v[b * w + a]; n++; } }
      const k = (j * w + i) * 4, m = Math.round(255 * s / n); p[k] = p[k + 1] = p[k + 2] = 255; p[k + 3] = m;
    }
    x.putImageData(d, 0, 0);
    return (himmelTex = P.Texture.from(c));
  }
  function baueAras() {
    const ROT = { schwanz: '#C8352B', streifen: '#3E7FC4', koerper: '#D63A2E', fluegel: '#E8C33A' };
    const BLAU = { schwanz: '#2A6FC0', streifen: '#F2C12E', koerper: '#2F7FD0', fluegel: '#2A6FC0' };
    for (const [farben, dauer, verz, von, bis, skal] of [[ROT, 52, -18, [-260, 260], [2100, 150], 1], [BLAU, 64, -8, [1900, 110], [-320, 220], -.8]]) {
      const paar = teil(L.himmel, 0, 0, 0, 0);
      const a1 = ara(paar, farben, true), a2 = ara(paar, farben, false);
      a2.g.position.set(-70, 26); a2.g.scale.set(.85);
      a1.ft.idle = kf([[0, { sy: 1 }], [1, { sy: -.7 }]], .34, { ease: 'ease-in-out', iter: Infinity, alt: true });
      a2.ft.idle = kf([[0, { sy: 1 }], [1, { sy: -.7 }]], .34, { ease: 'ease-in-out', iter: Infinity, alt: true, verz: -.17 });
      const ende = farben === ROT ? .48 : .46;
      paar.idle = kf([[0, { x: von[0], y: von[1] }], [ende, { x: bis[0], y: bis[1] }], [1, { x: bis[0], y: bis[1] }]], dauer, { ease: 'linear', iter: Infinity, verz });
      paar.bsx = skal; paar.bsy = Math.abs(skal);
      paar.nacht = new Wert(1);
      // hinter den großen Bäumen: Maske aus dem Weltbild (liegt in Weltpunkten auf der gemalten Ebene)
      if (!SEHR_LEICHT) { const m = sprite(himmelMaske(), L.gemalt, { x: -500, y: 0, width: 2600, height: 900 }); paar.mask = m; }
      arasListe.push(paar);
    }
  }

  // --- Lichtstrahlen und Lichtstaub ---
  function baueStrahlen() {
    L.strahlen.alpha = .8;
    const [c, x] = leinwand(64, 512);
    const v = x.createLinearGradient(0, 0, 0, 512);
    if (LEICHT) { v.addColorStop(0, 'rgba(255,240,190,.42)'); v.addColorStop(.55, 'rgba(255,226,150,.14)'); v.addColorStop(1, 'rgba(255,226,150,0)'); }
    else { v.addColorStop(0, 'rgba(255,240,190,.55)'); v.addColorStop(.45, 'rgba(255,226,150,.28)'); v.addColorStop(.85, 'rgba(255,226,150,0)'); v.addColorStop(1, 'rgba(255,226,150,0)'); }
    x.fillStyle = v; x.fillRect(0, 0, 64, 512);
    x.globalCompositeOperation = 'destination-in';   // weicher Rand seitlich (wie blur 14px)
    const h = x.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.3, 'rgba(0,0,0,1)'); h.addColorStop(.7, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = h; x.fillRect(0, 0, 64, 512);
    const tex = P.Texture.from(c);
    for (const [links, art] of [[380, 1], [700, 2], [1180, 3], [-300, 2], [1760, 1]]) {
      const b = { 1: 140, 2: 90, 3: 190 }[art], dauer = { 1: 9, 2: 12, 3: 14 }[art], verz = { 1: 0, 2: -4, 3: -7 }[art];
      const tl = teil(L.strahlen, links, -60, b / 2, 0);
      sprite(tex, tl, { x: -28 + b / 2 - (b + 56) / 2 + b / 2, y: -20, width: b + 56, height: 1090, blendMode: 'screen' });
      tl.br = 24;
      tl.idle = kf([[0, { a: .35 }], [1, { a: .85 }]], dauer, { ease: 'ease-in-out', iter: Infinity, alt: true, verz });
      tl.nacht = new Wert(1);
    }
  }
  function baueStaub() {
    const tex = punktTex('#FFF6D6', 'rgba(255,241,194,.55)');
    for (let i = 0; i < 28; i++) {
      const tl = teil(L.strahlen, zw(560, 1250), zw(120, 780), 0, 0);
      sprite(tex, tl, { anchor: .5, width: 16, height: 16, blendMode: 'screen' });
      const d = zw(6, 12), v = -zw(0, 12), dx = zw(-40, 40);
      tl.idle = kf([[0, { a: 0, x: 0, y: 0 }], [.3, { a: .9 }], [.7, { a: .9 }], [1, { a: 0, x: dx, y: -90 }]], d, { ease: 'ease-in-out', iter: Infinity, verz: v });
    }
  }
  let sonnenfleck = null;
  function baueSonnenfleck() {
    if (SEHR_LEICHT) return;
    sonnenfleck = teil(L.sonne, 0, 0, 0, 0);
    sprite(radial([[0, 'rgba(255,200,100,.34)'], [.52, 'rgba(255,190,90,.12)'], [1, 'rgba(255,190,90,0)']]), sonnenfleck, { x: 805 - 480, y: 690 - 300, width: 960, height: 600, blendMode: 'screen' });
    sprite(radial([[0, 'rgba(255,214,120,.62)'], [1, 'rgba(255,200,100,0)']]), sonnenfleck, { x: 805 - 330, y: 735 - 95, width: 660, height: 190, blendMode: 'screen' });
    sonnenfleck.idle = kf([[0, { a: .7 }], [1, { a: 1 }]], 9, { ease: 'ease-in-out', iter: Infinity, alt: true });
    sonnenfleck.nacht = new Wert(1);
  }

  // --- Schatten am Boden und Wurfschatten (Licht von links vorn) ---
  const schattenListe = [];
  let baumSchatten = null;
  function baueSchatten() {
    const bs = radial([[0, 'rgba(24,30,12,.58)'], [.636, 'rgba(24,30,12,.32)'], [1, 'rgba(24,30,12,0)']]);
    for (const [l, t, w, h] of [[-560, 660, 420, 90], [520, 690, 430, 84], [900, 702, 400, 80]]) schattenListe.push(sprite(bs, F.schatten, { x: l, y: t, width: w, height: h }));
    if (SEHR_LEICHT) return;
    // Wurfschatten des Kakaobaums (fünf Stufen, weich überblendet)
    const wb = new P.Container(); F.schatten.addChild(wb);
    const sk = new P.Container(); wb.addChild(sk);
    baumSchatten = { c: wb, bilder: [] };
    for (let i = 1; i <= 5; i++) {
      const [x, y, w, h] = BAUM_BILDER[i], sp = sprite(null, sk);
      setzeBild(sp, backe('baum' + i, 'schatten', w * 1.7), 545 + x * 1.7, 210 + y * 1.7, w * 1.7, h * 1.7);
      sp.alpha = 0; sp.a = new Wert(0); baumSchatten.bilder.push(sp);
    }
    schatten(sk, 800, 210 + 544 * .953, -52, .3); wb.alpha = .42; schattenListe.push(wb);
    for (const [name, l, t, w, h, ox, sy, a] of [['bananenstaude', 944, 343, 322, 380, .578, .3, .42], ['palme', 1835, 25, 350, 470, .48, .26, .32]]) {
      const c = new P.Container(); F.schatten.addChild(c);
      const sp = sprite(null, c); setzeBild(sp, backe(name, 'schatten', w), l, t, w, h);
      schatten(c, l + w * ox, t + h, -52, sy); c.alpha = a; schattenListe.push(c);
    }
  }
  function schatten(c, ox, oy, skew, sy) {   // skewX/scaleY um den Punkt (ox, oy) – Inhalt liegt in Weltpunkten
    const tan = Math.tan(skew * Math.PI / 180);
    // p' = O + M (p − O) mit M = [[1, tan·sy], [0, sy]]
    c.setFromMatrix(new P.Matrix(1, 0, tan * sy, sy, ox - tan * sy * oy, oy - sy * oy));
  }

  // --- Bananenstaude und Kokospalme (wiegen sich) ---
  let banane = null;
  function bauePflanzen() {
    banane = new Figur(F.pflanzen, { box: [944, 343, 322, 380], bild: 'bananenstaude', art: 'umriss', unten: false, aussen: [161, 380] });
    banane.innen.idle = kf([[0, { r: -.8 }], [1, { r: .9 }]], 6.5, { ease: 'ease-in-out', iter: Infinity, alt: true });
    const palme = new Figur(F.pflanzen, { box: [1835, 25, 350, 470], bild: 'palme', art: 'umriss', unten: false, aussen: [168, 470] });
    palme.innen.idle = kf([[0, { r: -.8 }], [1, { r: .9 }]], 8, { ease: 'ease-in-out', iter: Infinity, alt: true });
  }
  W.bananeWiegen = () => banane?.innen.spiele(kf([[.2, { r: -5 }], [.5, { r: 4 }], [.75, { r: -2 }]], 1.7, { ease: 'ease-in-out' }));

  // --- Der Kakaobaum: fünf gemalte Stufen, Hügel, Samen, Aufleuchten ---
  // Bildplätze im alten viewBox 300 × 320 (Baum-Kasten 510 × 544 bei 545/210, Faktor 1,7)
  const BAUM_BILDER = { 1: [131.5, 254, 37, 52], 2: [89, 174, 122, 130], 3: [16.5, 15, 267, 300], 4: [16.5, 15, 267, 300], 5: [16.5, 15, 267, 300] };
  const baum = { stufe: 0, bilder: [], huegel: null, samen: null, glanz: null };
  function baueBaum() {
    const c = new P.Container(); c.position.set(545, 210); c.scale.set(1.7); F.baum.addChild(c);
    baum.c = c;
    // Hügel und Samen
    const hg = new P.Graphics();
    hg.ellipse(150, 305, 74, 9).fill({ color: '#2B3A5A', alpha: .22 });
    hg.ellipse(150, 302, 40, 8).fill('#5E4636');
    hg.ellipse(124, 303, 7, 2.4).fill('#8E6A3E'); hg.ellipse(174, 302, 8, 2.4).fill('#A3884A'); hg.ellipse(160, 306, 6, 2).fill('#7E6A35');
    c.addChild(hg); hg.alpha = 0; baum.huegel = hg; hg.a = new Wert(0);
    const sm = teil(c, 150, 296, 0, 0); const sg = new P.Graphics().ellipse(0, 0, 7, 5).fill('#6B4A35'); sm.addChild(sg); sm.balpha = 0; baum.samen = sm;
    for (let i = 1; i <= 5; i++) {
      const [x, y, w, h] = BAUM_BILDER[i], im = BILDER['baum' + i];
      const [rx, ry, rw, rh] = einpassen(im.naturalWidth, im.naturalHeight, x, y, w, h);
      const tl = teil(c, rx, ry, rw / 2, rh);   // Ursprung unten Mitte
      const sp = sprite(null, tl); setzeBild(sp, backe('baum' + i, 'umriss', rw * 1.7), 0, 0, rw, rh);
      tl.balpha = 0; tl.a = new Wert(0); tl.s = new Wert(.88); tl.rect = [rx, ry, rw, rh]; tl.sp = sp;
      baum.bilder.push(tl);
    }
  }
  function baumSchritt() {
    if (!baum.c) return;
    baum.huegel.alpha = baum.huegel.a.v;
    for (const b of baum.bilder) { b.balpha = b.a.v; b.bsx = b.bsy = b.s.v; b.visible = b.balpha > .005 || b.glanz?.visible; }
    if (baumSchatten) for (const sp of baumSchatten.bilder) { sp.alpha = sp.a.v; sp.visible = sp.alpha > .005; }
  }
  // Schein und Aufhellen des sichtbaren Baumbilds (Wachstumsschub, Aufleuchten, Blühen)
  function baumGlanz(nr, farbe, blur, dauer, spitze, hell) {
    const b = baum.bilder[nr - 1]; if (!b) return;
    const [, , rw, rh] = b.rect, name = 'baum' + nr;
    const gl = b.glanz || (b.glanz = sprite(null, null)); b.addChildAt(gl, 0);
    setzeBild(gl, backe(name, 'glanz', rw * 1.7, farbe, blur / 1.7 * 1.7), 0, 0, rw, rh);
    const hl = b.hell || (b.hell = sprite(null, b, { blendMode: 'add' })); setzeBild(hl, backe(name, 'umriss', rw * 1.7), 0, 0, rw, rh);
    const a = kf([[0, { a: 0 }], [spitze, { a: 1 }], [1, { a: 0 }]], dauer, { ease: 'ease-out' });
    lauf(t => { const v = a.wert(t); const x = v ? v.a : 0; gl.alpha = x; gl.visible = x > .01; hl.alpha = x * hell; hl.visible = x * hell > .01; return !a.fertig; });
  }
  W.baumStufe = (n, alt) => {
    for (let i = 1; i <= 5; i++) {
      const b = baum.bilder[i - 1], an = i === n;
      if (b.a.ziel !== (an ? 1 : 0)) { b.a.zu(an ? 1 : 0, SCHNELL ? .1 : 1.4, 'ease'); b.s.zu(an ? 1 : .88, SCHNELL ? .1 : 1.8, bez(.3, 1.3, .5, 1)); }
      if (baumSchatten) { const s = baumSchatten.bilder[i - 1]; if (s.a.ziel !== (an ? 1 : 0)) s.a.zu(an ? 1 : 0, SCHNELL ? .1 : 1.4, 'ease'); }
    }
    baum.stufe = n;
  };
  W.baumSchub = n => { baumGlanz(n, 'rgba(255,255,255,.95)', 22, 1.4, .3, .45); baumLicht(n); };
  W.baumAufleuchten = n => baumGlanz(n, 'rgba(255,226,140,.95)', 22, 2, .3, .15);
  W.baumBluehen = () => { if (baum.stufe === 4) baumGlanz(4, '#FFE9A8', 10, 1.6, .4, .12); };
  W.baumGepflanzt = (sofort) => {
    baum.huegel.a.zu(1, sofort ? 0 : 1, 'ease');
    if (sofort || RUHIG) return;
    // der Samen fällt in die Erde
    baum.samen.spiele(kf([[0, { y: -260, a: 1 }], [.8, { y: 0, a: 1, s: 1 }], [1, { y: 4, a: 0, s: .6 }]], SCHNELL ? .09 : .9, { ease: bez(.5, 0, 1, 1), vorher: true }));
    baum.samen.balpha = 1;
    setTimeout(() => { baum.samen.balpha = 0; }, SCHNELL ? 100 : 950);
  };

  // --- Weißes Aufleuchten nach jedem Wachstumsbild (liegt über der Nacht) ---
  let lichtC = null;
  function baueBaumlicht() { lichtC = new P.Container(); L.licht.addChild(lichtC); }
  function baumLicht(n) {
    const [x, y, w, h] = baum.bilder[n - 1].rect, t = backe('baum' + n, 'weiss', w * 1.7);
    const sp = sprite(null, lichtC, { blendMode: 'screen' }); setzeBild(sp, t, 545 + x * 1.7, 210 + y * 1.7, w * 1.7, h * 1.7);
    const a = kf([[0, { a: 0 }], [.16, { a: .95 }], [1, { a: 0 }]], LEICHT ? 1.4 : 1.4, { ease: 'ease-out' });
    lauf(t2 => { const v = a.wert(t2); sp.alpha = v ? v.a : 0; if (a.fertig) { sp.destroy(); return false; } return true; });
  }

  // --- Funkeln des ausgewachsenen Baums ---
  let funkeln = null;
  function baueFunkeln() {
    funkeln = new P.Container(); funkeln.position.set(545, 210); funkeln.scale.set(1.7); F.funkeln.addChild(funkeln);
    funkeln.alpha = 0; funkeln.a = new Wert(0); funkeln.visible = false;
    const staub = punktTex('#FFF3C4', 'rgba(255,214,106,.6)');
    for (const [cx, cy, r, d, v] of [[151, 124, 1.4, 5.4, -5.0], [178, 159, 1.6, 4.4, -3.8], [103, 281, 2.1, 3.5, -1.7], [225, 167, 2.1, 4.5, -4.2], [191, 156, 1.3, 3.8, -4.1], [189, 142, 2.1, 4.3, -1.4], [137, 287, 1.7, 4.9, -5.5], [242, 249, 1.5, 4.8, -5.4], [208, 219, 1.4, 4.1, -4.4], [163, 123, 1.9, 5.7, -4.8], [229, 275, 1.6, 5.4, -2.3], [70, 180, 1.4, 5.8, -4.1], [158, 226, 1.1, 4.6, -4.2], [129, 162, 1.5, 4.0, -4.1], [78, 135, 1.4, 5.1, -4.6], [182, 279, 1.4, 3.1, -2.9], [139, 150, 1.8, 4.0, -1.4], [115, 280, 1.0, 4.1, -1.7], [90, 194, 1.3, 5.8, -3.0], [190, 148, 1.6, 4.8, -5.1], [100, 198, 2.0, 5.5, -1.4], [158, 249, 1.5, 5.0, -4.0]]) {
      const tl = teil(funkeln, cx, cy, 0, 0); sprite(staub, tl, { anchor: .5, width: r * 2 / .3, height: r * 2 / .3 });
      tl.idle = kf([[0, { a: 0, x: 0, y: 0 }], [.2, { a: .9 }], [.7, { a: .9 }], [1, { a: 0, x: 6, y: -60 }]], d, { ease: 'linear', iter: Infinity, verz: v });
    }
    const stern = sternTex('#FFF6D8', 'rgba(255,214,106,.95)');
    for (const [cx, cy, g, d, v] of [[144, 178, 18, 1.8, 0], [122, 98, 19, 2.7, -1.8], [163, 179, 12, 2.3, -.5], [239, 52, 20, 1.7, -2.1], [114, 125, 20, 1.6, -.2], [241, 147, 11, 3.2, -2.8], [65, 129, 12, 2.1, -1.9], [76, 186, 11, 1.9, -2.4], [128, 128, 18, 2.4, -1.2], [47, 193, 21, 3.2, -2.0], [118, 116, 18, 2.7, -.3], [92, 116, 16, 2.9, -1.5], [46, 213, 15, 2.4, -.7], [134, 122, 19, 1.8, -1.6], [79, 186, 10, 2.0, -1.0], [180, 51, 16, 1.9, -.8], [145, 241, 16, 3.1, -.5], [243, 116, 13, 2.8, -2.7], [41, 96, 19, 2.1, -.7], [42, 48, 17, 3.2, -3.0]]) {
      const tl = teil(funkeln, cx, cy, 0, 0); sprite(stern, tl, { anchor: .5, width: g * 64 / 40, height: g * 64 / 40 });
      tl.idle = kf([[0, { a: 0, s: .1, r: 0 }], [.45, { a: 1, s: 1.45, r: 45 }], [.6, { a: .9, s: 1.1, r: 60 }], [1, { a: 0, s: .1, r: 0 }]], RUHIG ? 6 : d, { ease: 'ease-in-out', iter: Infinity, verz: v });
    }
  }
  W.funkeln = an => { funkeln.a.zu(an ? 1 : 0, SCHNELL ? .1 : 1.5, 'ease'); };

  // --- Sri Yantra auf dem Boden: Linien ziehen sich, leuchten, bleiben zart ---
  const YANTRA = ['M-92.6 -73.2 L92.6 -73.2 L0 115.6 Z', 'M-82.1 -51.9 L82.1 -51.9 L0 85.0 Z', 'M-53.8 -28.3 L53.8 -28.3 L0 61.4 Z', 'M-31.2 -13.0 L31.2 -13.0 L0 38.9 Z', 'M-12.0 3.5 L12.0 3.5 L0 23.6 Z', 'M-92.6 73.2 L92.6 73.2 L0 -115.6 Z', 'M-79.3 49.6 L79.3 49.6 L0 -82.6 Z', 'M-48.9 24.8 L48.9 24.8 L0 -56.6 Z', 'M-25.5 9.4 L25.5 9.4 L0 -33.0 Z', 'K118.0', 'M-41.7 -110.4 Q-26.8 -133.0 0.0 -141.6 Q26.8 -133.0 41.7 -110.4', 'M48.6 -107.5 Q75.1 -113.0 100.1 -100.1 Q113.0 -75.1 107.5 -48.6', 'M110.4 -41.7 Q133.0 -26.8 141.6 0.0 Q133.0 26.8 110.4 41.7', 'M107.5 48.6 Q113.0 75.1 100.1 100.1 Q75.1 113.0 48.6 107.5', 'M41.7 110.4 Q26.8 133.0 0.0 141.6 Q-26.8 133.0 -41.7 110.4', 'M-48.6 107.5 Q-75.1 113.0 -100.1 100.1 Q-113.0 75.1 -107.5 48.6', 'M-110.4 41.7 Q-133.0 26.8 -141.6 0.0 Q-133.0 -26.8 -110.4 -41.7', 'M-107.5 -48.6 Q-113.0 -75.1 -100.1 -100.1 Q-75.1 -113.0 -48.6 -107.5', 'K144.0', 'M-25.9 -141.6 Q-16.0 -160.9 0.0 -167.6 Q16.0 -160.9 25.9 -141.6', 'M30.3 -140.7 Q46.7 -154.8 64.1 -154.8 Q76.4 -142.5 78.1 -120.9', 'M81.9 -118.4 Q102.4 -125.1 118.5 -118.5 Q125.1 -102.4 118.4 -81.9', 'M120.9 -78.1 Q142.5 -76.4 154.8 -64.1 Q154.8 -46.7 140.7 -30.3', 'M141.6 -25.9 Q160.9 -16.0 167.6 0.0 Q160.9 16.0 141.6 25.9', 'M140.7 30.3 Q154.8 46.7 154.8 64.1 Q142.5 76.4 120.9 78.1', 'M118.4 81.9 Q125.1 102.4 118.5 118.5 Q102.4 125.1 81.9 118.4', 'M78.1 120.9 Q76.4 142.5 64.1 154.8 Q46.7 154.8 30.3 140.7', 'M25.9 141.6 Q16.0 160.9 0.0 167.6 Q-16.0 160.9 -25.9 141.6', 'M-30.3 140.7 Q-46.7 154.8 -64.1 154.8 Q-76.4 142.5 -78.1 120.9', 'M-81.9 118.4 Q-102.4 125.1 -118.5 118.5 Q-125.1 102.4 -118.4 81.9', 'M-120.9 78.1 Q-142.5 76.4 -154.8 64.1 Q-154.8 46.7 -140.7 30.3', 'M-141.6 25.9 Q-160.9 16.0 -167.6 0.0 Q-160.9 -16.0 -141.6 -25.9', 'M-140.7 -30.3 Q-154.8 -46.7 -154.8 -64.1 Q-142.5 -76.4 -120.9 -78.1', 'M-118.4 -81.9 Q-125.1 -102.4 -118.5 -118.5 Q-102.4 -125.1 -81.9 -118.4', 'M-78.1 -120.9 Q-76.4 -142.5 -64.1 -154.8 Q-46.7 -154.8 -30.3 -140.7', 'K144.0', 'K173.5', 'K179.4', 'M-200.6 -200.6 L-35.4 -200.6 L-35.4 -214.8 L35.4 -214.8 L35.4 -200.6 L200.6 -200.6 L200.6 -35.4 L214.8 -35.4 L214.8 35.4 L200.6 35.4 L200.6 200.6 L35.4 200.6 L35.4 214.8 L-35.4 214.8 L-35.4 200.6 L-200.6 200.6 L-200.6 35.4 L-214.8 35.4 L-214.8 -35.4 L-200.6 -35.4 Z'];
  const yantra = { g: null, zuege: [], zustand: '', t0: 0, alpha: new Wert(0), leuchten: null };
  function baueYantra() {
    for (const d of YANTRA) {
      let pts;
      if (d[0] === 'K') { const r = +d.slice(1); pts = []; for (let k = 0; k <= 96; k++) { const w = Math.PI - k / 96 * 2 * Math.PI; pts.push([r * Math.cos(w), r * Math.sin(w)]); } }
      else {
        const t = d.match(/[MLQZ]|-?[\d.]+/g); pts = []; let i = 0, cx = 0, cy = 0;
        while (i < t.length) {
          const c = t[i++];
          if (c === 'M' || c === 'L') { cx = +t[i++]; cy = +t[i++]; pts.push([cx, cy]); }
          else if (c === 'Q') { const qx = +t[i++], qy = +t[i++], ex = +t[i++], ey = +t[i++]; for (let k = 1; k <= 16; k++) { const u = k / 16; pts.push([(1 - u) ** 2 * cx + 2 * (1 - u) * u * qx + u * u * ex, (1 - u) ** 2 * cy + 2 * (1 - u) * u * qy + u * u * ey]); } cx = ex; cy = ey; }
          else if (c === 'Z') pts.push([...pts[0]]);
        }
      }
      // in Weltpunkte: translate(800 748) scale(1 .34)
      const welt = pts.map(([x, y]) => [800 + x, 748 + y * .34]);
      const l = [0]; for (let k = 1; k < welt.length; k++) l.push(l[k - 1] + Math.hypot(welt[k][0] - welt[k - 1][0], welt[k][1] - welt[k - 1][1]));
      yantra.zuege.push({ p: welt, l, ges: l[l.length - 1] });
    }
    yantra.g = new P.Graphics(); F.yantra.addChild(yantra.g); yantra.g.alpha = 0;
  }
  function yantraZeichnen(t) {
    const g = yantra.g; if (!g) return;
    const a = yantra.alpha.v; let hell = 0;
    if (yantra.leuchten) { const v = yantra.leuchten.wert(t); hell = v ? v.a : 0; if (yantra.leuchten.fertig) yantra.leuchten = null; }
    g.alpha = a; g.visible = a > .005;
    if (!g.visible) return;
    const el = (t - yantra.t0) / 1000, zeichnet = yantra.zustand === 'zeichnet';
    if (!zeichnet && !yantra.leuchten && g.fertigGemalt) return;
    g.clear();
    const e = EASE['ease-in-out'];
    for (const breite of [7 + hell * 8, 1.7]) {
      yantra.zuege.forEach((z, i) => {
        const p = zeichnet ? e(klemme((el - i * .08 * (SCHNELL ? .1 : 1)) / (SCHNELL ? .11 : 1.1), 0, 1)) : 1;
        if (p <= 0) return;
        strichStueck(g, z, 0, z.ges * p);
      });
      if (breite > 2) g.stroke({ width: breite, color: 0xFFD66A, alpha: .22 + hell * .3, join: 'round', cap: 'round' });
      else g.stroke({ width: 1.7, color: hell > .01 ? 0xFFF0B8 : 0xF2D489, alpha: 1, join: 'round', cap: 'round' });
    }
    const bindu = zeichnet ? klemme((el - (SCHNELL ? .24 : 2.4)) / (SCHNELL ? .1 : 1), 0, 1) : 1;
    if (bindu > 0) g.ellipse(800, 748, 3.5, 3.5 * .34).fill({ color: 0xFFE9A8, alpha: bindu });
    g.fertigGemalt = !zeichnet && !yantra.leuchten;
  }
  W.yantra = zustand => {
    if (zustand === 'zeichnet') { yantra.zustand = 'zeichnet'; yantra.t0 = jetzt(); yantra.alpha.zu(1, SCHNELL ? .1 : 1.2); yantra.g.fertigGemalt = false; }
    else if (zustand === 'leuchtet') { yantra.leuchten = kf([[0, { a: 0 }], [.4, { a: 1 }], [1, { a: 0 }]], 2.4, { ease: 'ease-in-out' }); yantra.g.fertigGemalt = false; }
    else if (zustand === 'fertig') { yantra.zustand = 'fertig'; yantra.leuchten = null; yantra.alpha.zu(.5, SCHNELL ? .1 : 1.2); yantra.g.fertigGemalt = false; }
  };

  // --- Ablage unter dem Baum (gestrichelter Kreis, pulsiert) ---
  const ablage = { c: null, an: false, drueber: false, hover: false };
  function gestricheltEllipse(g, cx, cy, rx, ry, strich = 10, luecke = 7) {
    const n = 180, pts = []; for (let k = 0; k <= n; k++) { const w = k / n * Math.PI * 2; pts.push([cx + rx * Math.cos(w), cy + ry * Math.sin(w)]); }
    const l = [0]; for (let k = 1; k < pts.length; k++) l.push(l[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const z = { p: pts, l, ges: l[l.length - 1] };
    for (let s = 0; s < z.ges; s += strich + luecke) strichStueck(g, z, s, s + strich);
  }
  function baueAblage() {
    const c = new P.Container(); F.ablage.addChild(c); c.visible = false; ablage.c = c;
    const schein = sprite(radial([[0, 'rgba(255,226,140,0)'], [.72, 'rgba(255,226,140,.0)'], [.86, 'rgba(255,226,140,.7)'], [1, 'rgba(255,226,140,0)']]), c, { x: 660 - 40, y: 640 - 30, width: 380, height: 190 });
    const fuell = new P.Graphics(); c.addChild(fuell);
    const rand = new P.Graphics(); c.addChild(rand);
    Object.assign(ablage, { schein, fuell, rand, puls: kf([[0, { a: 0 }], [.5, { a: 1 }], [1, { a: 0 }]], 1.6, { ease: 'ease-in-out', iter: Infinity }) });
    ablageMalen();
  }
  function ablageMalen() {
    const voll = ablage.drueber || ablage.hover;
    ablage.fuell.clear().ellipse(810, 705, 150, 65).fill({ color: 0xFFF0C8, alpha: voll ? .38 : .18 });
    ablage.rand.clear();
    if (voll) ablage.rand.ellipse(810, 705, 148.5, 63.5).stroke({ width: 3, color: 0xFFF0C8, alpha: .9 });
    else { gestricheltEllipse(ablage.rand, 810, 705, 148.5, 63.5, 9, 6); ablage.rand.stroke({ width: 3, color: 0xFFF0C8, alpha: .9 }); }
  }
  W.ablage = {
    set an(v) { ablage.an = v; ablage.c.visible = v; },
    get an() { return ablage.an; },
    drueber(v) { if (ablage.drueber !== v) { ablage.drueber = v; ablageMalen(); } },
  };
  ziel({ name: 'ablage', label: 'Unter deinem Kakaobaum', box: [660, 640, 300, 130], z: ZRANG.ablage, zeigeName: true, aktiv: () => ablage.an, tap: () => W.ablage.tap?.(), hover: v => { ablage.hover = v; ablageMalen(); } });

  // --- Die drei Plätze zum Pflanzen ---
  const orte = [];
  let waehlen = false;
  const ortAlpha = new Wert(0);
  W.ort = (name, box, label, tap) => {
    const [l, t, w, h] = box, cx = l + w / 2, cy = t + h / 2, rx = w * .3 - 1.5, ry = h * .3 - 1.5;
    const c = teil(F.orte, cx, cy, 0, 0);
    const ring = sprite(radial([[0, 'rgba(203,174,111,0)'], [.8, 'rgba(203,174,111,0)'], [.86, 'rgba(203,174,111,.6)'], [1, 'rgba(203,174,111,0)']]), c, { anchor: .5 });
    const g = new P.Graphics(); c.addChild(g);
    const o = { c, g, ring, rx, ry, hover: false, puls: kf([[0, { a: 1, s: 0 }], [.5, { a: 0, s: 1 }], [1, { a: 0, s: 1 }]], 2.4, { ease: 'ease-in-out', iter: Infinity }) };
    c.idle = kf([[0, { s: 1 }], [.5, { s: 1.04 }], [1, { s: 1 }]], 2.4, { ease: 'ease-in-out', iter: Infinity });
    const male = () => {
      g.clear();
      if (o.hover) { g.ellipse(0, 0, rx + 1.5, ry + 1.5).fill({ color: 0xFFF0C8, alpha: .25 }); g.ellipse(0, 0, rx, ry).stroke({ width: 3, color: 0xFFF8E6, alpha: .85 }); }
      else { gestricheltEllipse(g, 0, 0, rx, ry, 9, 6); g.stroke({ width: 3, color: 0xFFF8E6, alpha: .85 }); }
    };
    o.male = male; male(); orte.push(o);
    ziel({ name: 'ort-' + name, label, ort: true, box, z: ZRANG.orte, aktiv: () => waehlen, tap, hover: v => { o.hover = v; male(); W.ortSchild?.(v ? { label, x: cx, y: t } : null); } });
  };
  W.waehlen = v => { waehlen = v; ortAlpha.zu(v ? 1 : 0, .6); };
  function orteSchritt(t) {
    const a = ortAlpha.v;
    F.orte.alpha = a; F.orte.visible = a > .005;
    if (!F.orte.visible) return;
    for (const o of orte) {
      const v = o.puls.wert(t) || { a: 1, s: 0 };
      o.ring.width = (o.rx + 2 + v.s * 14) * 2 / .93; o.ring.height = (o.ry + 2 + v.s * 14) * 2 / .93; o.ring.alpha = v.a;
    }
  }

  // --- Der sprechende Urwaldbaum: Augen blinzeln, Mund bewegt sich ---
  const gesicht = { augen: null, zu: null, mund: null };
  function baueGesicht() {
    const c = new P.Container(); c.position.set(-446, 386); F.gesicht.addChild(c);
    const art = 'gesicht';
    const mach = (name, x, y, w, h) => { const im = BILDER[name], r = einpassen(im.naturalWidth, im.naturalHeight, x, y, w, h), sp = sprite(null, c); setzeBild(sp, backe(name, 'umriss', r[2]), ...r); sp.r = r; return sp; };
    gesicht.augen = mach('baum-augen', 0, 0, 122, 80);
    gesicht.zu = mach('baum-augen-zu', 0, 0, 122, 80); gesicht.zu.visible = false;
    gesicht.mund = mach('baum-mund', 19, 82, 84, 65);
    gesicht.c = c;
    void art;
  }
  W.gesicht = {
    zu(v) { if (!gesicht.augen) return; gesicht.augen.visible = !v; gesicht.zu.visible = v; },
    mund(name) { const sp = gesicht.mund; if (!sp || !BILDER[name]) return; const r = einpassen(BILDER[name].naturalWidth, BILDER[name].naturalHeight, 19, 82, 84, 65); setzeBild(sp, backe(name, 'umriss', r[2]), ...r); },
    box: [-446, 386, 122, 150],
  };

  // --- Regenbogen in der Gischt ---
  let regenbogen = null;
  function baueRegenbogen() {
    const [c, x] = leinwand(380, 104);
    x.save(); x.translate(190, 104); x.scale(1, 104 / 190);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 190);
    for (const [p, f] of [[.7, 'rgba(150,90,220,0)'], [.73, 'rgba(150,90,220,.75)'], [.77, 'rgba(70,140,240,.75)'], [.81, 'rgba(90,200,120,.75)'], [.85, 'rgba(255,226,90,.8)'], [.89, 'rgba(255,150,60,.75)'], [.93, 'rgba(240,80,70,.7)'], [.97, 'rgba(240,80,70,0)']]) g.addColorStop(p, f);
    x.fillStyle = g; x.fillRect(-190, -190, 380, 190); x.restore();
    x.globalCompositeOperation = 'destination-in';
    const m = x.createLinearGradient(0, 0, 0, 104); m.addColorStop(0, '#000'); m.addColorStop(.45, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = m; x.fillRect(0, 0, 380, 104);
    let tex = c;
    if (!LEICHT && 'filter' in x) {   // weich wie blur(3.5px), wo der Browser es kann
      const [c2, y] = leinwand(400, 124); y.filter = 'blur(3.5px)'; y.drawImage(c, 10, 10); tex = c2;
    }
    const tl = teil(F.regenbogen, 92, 428, 190, 52);
    const sp = sprite(P.Texture.from(tex), tl, { x: tex === c ? 0 : -10, y: tex === c ? 0 : -10 });
    const hl = sprite(sp.texture, tl, { x: sp.x, y: sp.y, blendMode: 'add', alpha: 0 });
    tl.balpha = 0; tl.visible = false;
    regenbogen = { tl, hl, a: null };
  }
  W.regenbogen = hell => {
    regenbogen.a = hell ? kf([[0, { a: 0, h: 0 }], [.18, { a: 1, h: .35 }], [.65, { a: .9, h: 0 }], [1, { a: 0, h: 0 }]], 3.6, { ease: 'ease-in-out' })
      : kf([[0, { a: 0 }], [.2, { a: .75 }], [.7, { a: .75 }], [1, { a: 0 }]], 4.6, { ease: 'ease-in-out' });
  };
  function regenbogenSchritt(t) {
    const r = regenbogen; if (!r?.a) return;
    const v = r.a.wert(t); if (r.a.fertig) r.a = null;
    r.tl.visible = !!v; if (!v) return;
    r.tl.alpha = v.a; r.hl.alpha = v.h || 0;
  }

  // --- Keimling (Belohnung für alle 7 Bohnen) ---
  let keimling = null;
  function baueKeimling() {
    keimling = new Figur(F.keimling, { box: [900, 694, 46, 64], bild: 'baum1', unten: false, aussen: [23, 64] });
    keimling.sichtbar = false;
  }
  W.keimling = (sofort) => {
    keimling.sichtbar = true;
    if (!sofort) keimling.aussen.spiele(kf([[0, { a: 0, sx: .05, sy: 0 }], [.4, { a: 1 }], [1, { a: 1, sx: 1, sy: 1 }]], 2.2, { ease: bez(.3, 1.4, .5, 1) }));
    keimling.zeigeGlanz('rgba(255,216,106,.8)', 10, 0);
    const a = kf([[0, { a: 0 }], [.5, { a: 1 }], [1, { a: 0 }]], 3.4, { ease: 'ease', iter: Infinity });
    lauf(t => { keimling.glanzAlpha(a.wert(t)?.a ?? 0); return true; });
  };

  // --- Patenschild neben dem Baum: Name und Wunsch ---
  const stein = { c: null };
  function baueStein() {
    const c = teil(F.stein, 548, 748, 75, 73); c.visible = false; stein.c = c;
    // Lichtschein hinter dem Schild: radial-gradient(ellipse at 50% 42%, …) über 218 × 150 (farthest-corner ≈ Radius × 1,41)
    const glanz = radial([[0, 'rgba(255,244,200,.6)'], [.45, 'rgba(255,236,170,.25)'], [.7, 'rgba(255,236,170,0)'], [1, 'rgba(255,236,170,0)']]);
    sprite(glanz, c, { anchor: .5, x: 75, y: -26 + 150 * .42, width: 218 * 1.41, height: 150 * 1.41 });
    const im = BILDER.patenschild, r = einpassen(im.naturalWidth, im.naturalHeight, 0, 0, 150, 146);
    const sch = sprite(null, c); setzeBild(sch, backe('patenschild', 'glanz', r[2], 'rgba(255,236,170,.5)', 10), ...r);
    const sp = sprite(null, c); setzeBild(sp, backe('patenschild', 'umriss', r[2]), ...r);
    const hl = sprite(sp.texture, c, { x: sp.x, y: sp.y, width: sp.width, height: sp.height, blendMode: 'add', alpha: .22 });
    const schrift = '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive';
    const stil = (gr, farbe) => new P.TextStyle({ fontFamily: schrift, fontSize: gr, fill: farbe, align: 'center', wordWrap: true, wordWrapWidth: 104, breakWords: true, lineHeight: Math.round(gr * 1.05), padding: 0,
      dropShadow: { color: '#FFFAE8', alpha: .95, blur: 4, distance: 0, angle: 0 } });
    stein.name = new P.Text({ text: '', style: stil(20, '#2E1C12'), resolution: 2 }); stein.name.anchor.set(.5, 0); c.addChild(stein.name);
    stein.wunsch = new P.Text({ text: '', style: stil(18, '#7E2F18'), resolution: 2 }); stein.wunsch.anchor.set(.5, 0); c.addChild(stein.wunsch);
    void hl;
  }
  function zweiZeilen(txt, stil) {   // wie -webkit-line-clamp: 2
    const m = P.CanvasTextMetrics.measureText(txt, stil);
    if (m.lines.length <= 2) return txt;
    let s = txt; while (s.length > 1 && P.CanvasTextMetrics.measureText(s + '…', stil).lines.length > 2) s = s.slice(0, -1);
    return s.trimEnd() + '…';
  }
  W.stein = (name, wunsch, sofort) => {
    stein.name.text = zweiZeilen(name, stein.name.style);
    stein.wunsch.text = zweiZeilen(wunsch, stein.wunsch.style);
    const zeilen = t => P.CanvasTextMetrics.measureText(t.text, t.style).lines.length;
    const hName = zeilen(stein.name) * stein.name.style.lineHeight, hWunsch = zeilen(stein.wunsch) * stein.wunsch.style.lineHeight;
    const oben = 24 + Math.max(0, (52 - hName - hWunsch) / 2);   // im hellen Feld des Schilds mittig
    stein.name.position.set(75, oben); stein.wunsch.position.set(75, oben + hName + 1);
    stein.c.visible = true;
    if (!sofort) stein.c.spiele(kf([[0, { a: 0, y: -40, s: .6 }], [1, { a: 1, y: 0, s: 1 }]], .9, { ease: bez(.3, 1.4, .5, 1) }));
  };
  ziel({ name: 'stein', box: [548, 748, 150, 146], z: ZRANG.stein, aktiv: () => stein.c?.visible, tap: () => W.stein.tap?.() });

  // --- Der Kolibri ---
  const kol = { x: -800, y: 260, links: false, spricht: false, c: null, svg: null, sp: null, loop: null };
  const KOL_BILDER = ['kolibri', 'kolibri-3', 'kolibri-2', 'kolibri-3'];
  function baueKolibri() {
    const c = teil(F.kolibri, 0, 0, 60, 45); kol.c = c;
    const svg = teil(c, 0, 0, 60, 45); kol.svg = svg;
    kol.sp = sprite(null, svg);
    kol.rect = einpassen(474, 380, 0, 0, 120, 90);
    for (const n of new Set(KOL_BILDER)) backe(n, 'kolibri', kol.rect[2]);
    svg.idle = kf([[0, { y: 0 }], [1, { y: -8 }]], 1.4, { ease: 'ease-in-out', iter: Infinity, alt: true });
  }
  function kolibriSchritt(t) {
    if (!kol.c) return;
    kol.c.bx = kol.x + 60; kol.c.by = kol.y + 45;
    const n = KOL_BILDER[Math.floor(t / 25) % 4], tx = TEX[`${n}|kolibri||0`];
    if (tx && kol.sp.texture !== tx.tex) setzeBild(kol.sp, tx, ...kol.rect);
    kol.svg.bsx = kol.links ? -1 : 1;
    if (kol.spricht && kol.svg.idle) { kol.svgIdle = kol.svg.idle; kol.svg.idle = null; }
    else if (!kol.spricht && !kol.svg.idle && kol.svgIdle) kol.svg.idle = kol.svgIdle;
  }
  W.kolibri = {
    setze(x, y) { kol.x = x; kol.y = y; },
    set links(v) { kol.links = v; }, get links() { return kol.links; },
    set spricht(v) { kol.spricht = v; },
    looping() { kol.c.spiele(kf([[0, { y: 0, r: 0 }], [.5, { y: -60, r: -180 }], [1, { y: 0, r: -360 }]], SCHNELL ? .1 : .95, { ease: 'ease-in-out' })); },
    box: () => [kol.x, kol.y, 120, 90],
  };

  // --- Blätter ganz vorn (unscharf, wandern schneller, werden beim Darüberfahren/Antippen durchsichtig) ---
  const vornBlaetter = [];
  function baueVorn() {
    const LISTE = [['vorn-rechts-vorn', -740, 700, 460], ['vorn-rechts-vorn', 1640, 660, 460, 'g'], ['vorn-links-vorn', 1860, 500, 460], ['vorn-links-vorn', 1060, 810, 140], ['vorn-links-vorn', 150, 820, 180, 'g'],
      ['haengt-1-vorn', -720, -127, 340, 'h'], ['haengt-1-vorn', 60, -43, 260, 'hg'], ['haengt-2-vorn', 700, -127, 340, 'h'], ['haengt-2-vorn', 1180, -8, 320, 'hg'], ['vorn-rechts-vorn', 50, 760, 280], ['vorn-links-vorn', -50, 780, 200], ['haengt-2-vorn', 2020, -143, 260, 'h']];
    LISTE.forEach(([name, l, t, h, f = ''], i) => {
      const im = BILDER[name]; if (!im) return;
      const w = h * im.naturalWidth / im.naturalHeight, haengt = f.includes('h'), gesp = f.includes('g');
      const tl = teil(L.vorn, l, t, w / 2, haengt ? 0 : h);
      const tx = backe(name, 'blatt', w);
      const sp = sprite(null, tl); setzeBild(sp, tx, 0, 0, w, h);
      if (gesp) { tl.bsx = -1; }
      const gerade = (i + 1) % 2 === 0, dauer = haengt ? 8 : gerade ? 9 : 7, verz = gerade ? -3 : 0;
      const a = gesp ? -1 : 1;
      tl.idle = kf([[0, { r: -1.2 * a }], [1, { r: 1.4 * a }]], dauer, { ease: 'ease-in-out', iter: Infinity, alt: true, verz });
      tl.durch = new Wert(1); tl.sp = sp; tl.tx = tx; tl.w = w; tl.h = h;
      vornBlaetter.push(tl);
    });
  }
  function blattTreffer(tl, cx, cy, nurRechteck = false) {
    const cr = canvas.getBoundingClientRect(), g = { x: cx - cr.left, y: cy - cr.top };
    const p = tl.sp.toLocal(g);   // in Bildpunkten der (ggf. gespiegelten, gedrehten) Textur
    const tw = tl.sp.texture.width, th = tl.sp.texture.height;
    if (p.x < 0 || p.y < 0 || p.x > tw || p.y > th) return false;
    if (nurRechteck) return true;
    const m = tl.tx.maske; if (!m) return true;
    const px = Math.floor(p.x / tw * m.w), py = Math.floor(p.y / th * m.h);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = px + dx, y = py + dy; if (x >= 0 && y >= 0 && x < m.w && y < m.h && m.d[(y * m.w + x) * 4 + 3] > 40) return true; }
    return false;
  }
  function vornSchritt() { for (const tl of vornBlaetter) tl.balpha = tl.durch.v; }

  // --- Bildrand: Vignette und weicher dunkler Rand wie ein gemaltes Bild ---
  let vignette = null, vignetteBreite = 0;
  function baueVignette() { vignette = sprite(null, L.vignette); }
  function vignetteMalen() {
    if (!vignette || vignetteBreite === BREITE) return;
    vignetteBreite = BREITE;
    const k = 4, w = Math.round(BREITE / k), h = Math.round(900 / k), [c, x] = leinwand(w, h), bild = x.createImageData(w, h), d = bild.data;
    const mitVig = !FLACH && !SEHR_LEICHT;
    const phi = z => .5 * (1 + Math.tanh(.7978845 * (z + .044715 * z * z * z)));   // Normalverteilung (Näherung)
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = (i + .5) * k, Y = (j + .5) * k;
      // Vignette: radial-gradient(ellipse 75% 70% at 50% 46%, transparent 55%, rgba(14,18,10,.32) 82%, rgba(10,12,6,.55) 100%)
      let va = 0; if (mitVig) { const r = Math.hypot((X - BREITE * .5) / (BREITE * .75), (Y - 900 * .46) / (900 * .7)); va = r < .55 ? 0 : r < .82 ? .32 * (r - .55) / .27 : Math.min(.55, .32 + .23 * (r - .82) / .18); }
      // Rand: box-shadow inset 0 0 200px rgba(8,36,48,.5)
      const q = (dd) => 1 - phi(dd / 100);
      const ra = .5 * (1 - (1 - q(X)) * (1 - q(BREITE - X)) * (1 - q(Y)) * (1 - q(900 - Y)));
      // übereinander: erst Vignette, dann Rand
      const a = ra + va * (1 - ra);
      const n = (j * w + i) * 4;
      if (a > 0) {
        d[n] = (8 * ra + 12 * va * (1 - ra)) / a; d[n + 1] = (36 * ra + 15 * va * (1 - ra)) / a; d[n + 2] = (48 * ra + 8 * va * (1 - ra)) / a;
      }
      d[n + 3] = Math.round(a * 255);
    }
    x.putImageData(bild, 0, 0);
    vignette.texture?.destroy(true);
    vignette.texture = P.Texture.from(c); vignette.width = BREITE; vignette.height = 900;
  }

  // --- Tageszeit (Abend, Nacht, Morgen), Sterne und Mond ---
  const tag = { sp: null, farbe: [0x1E, 0x24, 0x40], von: [0x1E, 0x24, 0x40], zu: [0x1E, 0x24, 0x40], a: new Wert(0), t0: 0 };
  function baueTageszeit() { tag.sp = sprite(weiss(), L.tag, { blendMode: 'multiply', alpha: 0 }); }
  // Abend- und Morgenlicht: warmer Schein nur auf dem Laub der Kronen (Maske aus dem Weltbild: grün und oben)
  let abendlicht = null;
  function baueAbendlicht() {
    const im = BILDER['welt-tief'] || BILDER.welt, w = 520, h = 180, [c, x] = leinwand(w, h);
    x.drawImage(im, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4, r = p[k], g = p[k + 1], b = p[k + 2];
      const laub = klemme((g - Math.max(r, b) + 4) / 40, 0, 1), oben = klemme((.72 - j / h) / .25, 0, 1);
      const licht = klemme((r + g + b) / 500, .25, 1);   // helles Laub fängt mehr Licht
      p[k] = 255; p[k + 1] = 146; p[k + 2] = 66; p[k + 3] = Math.round(255 * laub * oben * licht);
    }
    x.putImageData(d, 0, 0);
    abendlicht = sprite(P.Texture.from(c), L.gemalt, { x: -500, y: 0, width: 2600, height: 900, blendMode: 'add', alpha: 0, visible: false });
    abendlicht.a = new Wert(0);
  }
  const TAGFARBEN = { abend: ['#E2783A', .34], nacht: ['#141C3C', .68], morgen: ['#F2A08A', .26], '': ['#1E2440', 0] };
  const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  W.tageszeit = name => {
    const [f, a] = TAGFARBEN[name] || TAGFARBEN[''];
    tag.von = tag.farbe.slice(); tag.zu = hex(f); tag.t0 = jetzt();
    tag.a.zu(a, SCHNELL ? .14 : 2.2, 'ease-in-out');
    abendlicht?.a.zu({ abend: .42, morgen: .28 }[name] || 0, SCHNELL ? .2 : 2.4, 'ease-in-out');
  };
  function tagSchritt(t) {
    const p = EASE['ease-in-out'](klemme((t - tag.t0) / (SCHNELL ? 140 : 2200), 0, 1));
    if (abendlicht) { abendlicht.alpha = abendlicht.a.v; abendlicht.visible = abendlicht.alpha > .005; }
    tag.farbe = tag.von.map((v, i) => v + (tag.zu[i] - v) * p);
    tag.sp.tint = (Math.round(tag.farbe[0]) << 16) | (Math.round(tag.farbe[1]) << 8) | Math.round(tag.farbe[2]);
    tag.sp.alpha = tag.a.v; tag.sp.visible = tag.sp.alpha > .003;
    tag.sp.width = BREITE; tag.sp.height = 900;
  }
  let sterne = null;
  const nachtZustand = { nachts: false, regnet: false, sterneA: new Wert(0), regenA: new Wert(0), tagA: new Wert(1) };
  function baueSterne() {
    sterne = new P.Container(); L.sterne.addChild(sterne); sterne.visible = false;
    const mond = new P.Container(); mond.position.set(1790 + 23, 70 + 23); sterne.addChild(mond);
    sprite(radial([[0, 'rgba(255,244,210,.45)'], [.45, 'rgba(255,244,210,.4)'], [1, 'rgba(255,244,210,0)']]), mond, { anchor: .5, width: 46 + 76, height: 46 + 76 });
    const [c, x] = leinwand(92, 92), g = x.createRadialGradient(35, 35, 0, 35, 35, 58);
    g.addColorStop(0, '#FFFBEA'); g.addColorStop(.6, '#F1E6C0'); g.addColorStop(1, '#D9CBA0');
    x.fillStyle = g; x.beginPath(); x.arc(46, 46, 46, 0, Math.PI * 2); x.fill();
    sprite(P.Texture.from(c), mond, { anchor: .5, width: 46, height: 46 });
    const st = punktTex('#FFF8E2', 'rgba(255,241,194,.6)');
    for (const [l, t, g2, v] of [[159, 108, 1.7, -2.6], [22, 136, 3.0, -.2], [186, 159, 1.6, -1.1], [231, 125, 2.7, -.5], [91, 53, 2.4, -2.8], [197, 193, 2.2, -2.2], [51, 91, 2.6, -2.2], [147, 48, 2.0, -.6], [104, 200, 1.8, -2.7], [284, 42, 2.1, -1.5], [27, 119, 3.0, -.3], [199, 55, 2.5, -2.7], [81, 32, 1.6, -1.6], [25, 48, 2.3, -2.8], [1736, 163, 2.6, -.3], [1834, 82, 2.5, -2.9], [1513, 220, 2.5, -.4], [1644, 378, 3.2, -.4], [1910, 362, 1.9, -1.8], [1506, 152, 2.6, -1.8], [1953, 51, 2.1, -2.6], [1836, 182, 2.2, -3.0], [1830, 27, 2.9, -1.0], [1744, 97, 2.3, -1.0], [1534, 247, 1.7, -2.4], [1495, 301, 2.9, -1.5], [1913, 109, 2.8, -1.3], [1621, 367, 2.2, -1.1], [2005, 153, 2.6, -.5], [1994, 113, 1.6, -2.9], [1585, 361, 3.2, -1.8], [1487, 42, 1.9, -1.2], [1853, 368, 2.1, -.4], [1823, 69, 1.6, -1.7], [1905, 44, 2.3, -2.1], [1946, 158, 3.0, -.5], [1916, 298, 3.0, -1.5], [1541, 37, 2.4, -.5], [1864, 50, 2.8, -.7], [1488, 83, 2.3, -1.7]]) {
      const tl = teil(sterne, l + g2 / 2, t + g2 / 2, 0, 0); sprite(st, tl, { anchor: .5, width: g2 / .32 * 1.2, height: g2 / .32 * 1.2 });
      tl.idle = kf([[0, { a: .35 }], [1, { a: 1 }]], 2.6, { ease: 'ease-in-out', iter: Infinity, alt: true, verz: v });
    }
  }
  W.nachts = v => {
    nachtZustand.nachts = v;
    nachtZustand.sterneA.zu(v ? (nachtZustand.regnet ? .25 : 1) : 0, SCHNELL ? .16 : 1.6, 'ease');
    nachtZustand.tagA.zu(v ? 0 : 1, SCHNELL ? .14 : 2.2, 'ease-in-out');
  };
  W.regnet = v => {
    nachtZustand.regnet = v;
    nachtZustand.regenA.zu(v ? 1 : 0, SCHNELL ? .12 : 1.2, 'ease');
    if (nachtZustand.nachts) nachtZustand.sterneA.zu(v ? .25 : 1, SCHNELL ? .16 : 1.6, 'ease');
  };
  function nachtSchritt() {
    const sa = nachtZustand.sterneA.v; sterne.alpha = sa; sterne.visible = sa > .005;
    const ta = nachtZustand.tagA.v;   // was nachts verschwindet: Sonnenfleck, Strahlen, Schatten, Aras
    if (sonnenfleck) sonnenfleck.balpha = ta;
    L.strahlen.alpha = (FLACH || SEHR_LEICHT ? 1 : .8) * ta;
    for (const s of schattenListe) s.visible = ta > .005, s.tagA = ta;
    F.schatten.alpha = ta;
    for (const a of arasListe) a.balpha = ta;
  }

  // --- Wetter: Regen, Blitz, Papier-Struktur, Rand ---
  const wetter = {};
  function regenKachel(linien, groesse, alpha, breite) {
    const [c, x] = leinwand(240, 240);
    x.strokeStyle = `rgba(225,235,255,${alpha})`; x.lineWidth = breite; x.lineCap = 'round';
    for (const [x1, y1, x2, y2] of linien) for (const dx of [-240, 0, 240]) for (const dy of [-240, 0, 240]) { x.beginPath(); x.moveTo(x1 + dx, y1 + dy); x.lineTo(x2 + dx, y2 + dy); x.stroke(); }
    const t = P.Texture.from(c); t.source.addressMode = 'repeat'; void groesse; return t;
  }
  function baueWetter() {
    const NAH = [[57, 25, 52, 46], [37, 16, 32, 38], [220, 192, 214, 219], [53, 129, 49, 149], [41, 25, 37, 44], [223, 199, 217, 226], [192, 46, 188, 67], [150, 176, 144, 204], [211, 21, 206, 45], [161, 121, 157, 140], [114, 21, 107, 51], [208, 131, 203, 152], [218, 137, 212, 166], [204, 122, 199, 144], [144, 103, 140, 122], [73, 195, 70, 212], [11, 150, 7, 170], [128, 113, 124, 134], [239, 47, 235, 69], [49, 152, 44, 172], [85, 179, 81, 200], [134, 217, 130, 234], [15, 55, 9, 82], [148, 57, 143, 78], [43, 110, 39, 127], [167, 215, 161, 244]];
    const FERN = [[176, 230, 174, 239], [69, 232, 66, 246], [99, 226, 96, 240], [196, 70, 194, 81], [107, 33, 104, 44], [231, 80, 229, 89], [11, 41, 8, 55], [87, 70, 85, 79], [236, 102, 233, 112], [14, 13, 12, 23], [162, 36, 160, 45], [118, 60, 114, 76], [29, 127, 26, 141], [98, 237, 96, 249], [58, 99, 56, 108], [101, 60, 98, 75], [199, 120, 197, 129], [61, 58, 59, 69], [56, 209, 53, 219], [12, 223, 9, 236], [238, 97, 234, 112], [157, 190, 154, 204], [119, 22, 116, 33], [210, 216, 206, 231], [81, 158, 78, 172], [154, 196, 151, 208], [157, 165, 155, 176], [221, 230, 219, 239], [233, 231, 230, 245], [11, 216, 9, 226], [232, 160, 230, 170], [40, 152, 37, 165], [179, 223, 177, 233], [1, 221, -1, 230], [210, 28, 207, 42], [188, 211, 185, 224], [211, 48, 208, 62], [79, 214, 76, 228], [113, 126, 111, 136], [8, 143, 5, 155]];
    const regen = new P.Container(); L.wetter.addChild(regen); regen.visible = false; wetter.regen = regen;
    wetter.nah = new P.TilingSprite({ texture: regenKachel(NAH, 240, .62, 1.6), width: 1600, height: 900 }); regen.addChild(wetter.nah);
    wetter.fern = new P.TilingSprite({ texture: regenKachel(FERN, 180, .45, 1), width: 1600, height: 900 }); wetter.fern.tileScale.set(.75); wetter.fern.alpha = .8; regen.addChild(wetter.fern);
    wetter.blitz = sprite(weiss(), L.wetter, { tint: 0xF4F7FF, blendMode: 'screen', alpha: 0, visible: false });
    // Papier-Struktur (feines Korn, multipliziert)
    const [c, x] = leinwand(256, 256), bild = x.createImageData(256, 256), d = bild.data;
    let s = 5; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < d.length; i += 4) { const n = r() * .6 + r() * .4; d[i] = 140; d[i + 1] = 115; d[i + 2] = 89; d[i + 3] = Math.round(255 * .35 * (.25 + n * .9)); }
    x.putImageData(bild, 0, 0);
    const pt = P.Texture.from(c); pt.source.addressMode = 'repeat';
    wetter.papier = new P.TilingSprite({ texture: pt, width: 1600, height: 900 }); wetter.papier.alpha = .16; wetter.papier.blendMode = 'multiply';
    L.wetter.addChild(wetter.papier);
  }
  W.blitz = () => { wetter.blitzA = kf([[0, { a: 0 }], [.04, { a: .85 }], [.1, { a: .1 }], [.16, { a: .65 }], [.3, { a: 0 }], [1, { a: 0 }]], .9, { ease: 'ease-out' }); };
  function wetterSchritt(t) {
    const ra = nachtZustand.regenA.v;
    wetter.regen.alpha = ra; wetter.regen.visible = ra > .005;
    if (wetter.regen.visible && !RUHIG) {
      const s = t / 1000;
      wetter.nah.tilePosition.set(-53 * ((s / .42) % 1), 240 * ((s / .42) % 1));
      wetter.fern.tilePosition.set(-40 * ((s / .6) % 1), 180 * ((s / .6) % 1));
    }
    for (const sp of [wetter.nah, wetter.fern, wetter.papier]) { sp.width = BREITE; sp.height = 900; }
    if (wetter.blitzA) { const v = wetter.blitzA.wert(t); wetter.blitz.alpha = v ? v.a : 0; wetter.blitz.visible = !!v; if (wetter.blitzA.fertig) { wetter.blitzA = null; wetter.blitz.visible = false; } }
    wetter.blitz.width = BREITE; wetter.blitz.height = 900;
  }

  // ======================================================================
  //  Effekte (kurzlebig)
  // ======================================================================
  function effekt(eltern, x, y, ox, oy, dauerSek, a) {   // Teil, das sich nach der Animation selbst entfernt
    const tl = teil(eltern, x, y, ox, oy); tl.spiele(a);
    lauf(t => { if (!tl.einmal || tl.einmal.fertig) { weg(tl); return false; } return true; });
    void dauerSek; return tl;
  }
  function figurBild(eltern, name, box, opt = {}) {   // Bild mit Umriss in Kasten (object-fit: contain)
    const im = BILDER[name]; if (!im) return null;
    const r = einpassen(im.naturalWidth, im.naturalHeight, ...box);
    const sp = sprite(null, eltern); setzeBild(sp, backe(name, opt.art || 'umriss', r[2]), ...r); return sp;
  }
  W.effekt = {
    // Krabbeltier kommt aus dem Versteck und läuft weg
    krabbler(x, y, art, links) {
      const wurm = art === 'wurm', w = wurm ? 50 : 54, h = wurm ? 30 : 40, weg = (links ? -1 : 1) * (130 + Math.random() * 80);
      const frames = art === 'grille'
        ? [[0, { a: 0, x: 0, y: 10, s: .5 }], [.12, { a: 1, x: 0, y: -10, s: 1 }], [.3, { x: weg * .3, y: -50, s: 1 }], [.45, { x: weg * .5, y: 0, s: 1 }], [.65, { x: weg * .8, y: -40, s: 1 }], [.88, { a: 1 }], [1, { a: 0, x: weg, y: 0, s: 1 }]]
        : [[0, { a: 0, x: 0, y: 12, s: .5 }], [.14, { a: 1, x: 0, y: -16, s: 1 }], [.28, { x: 0, y: 0, s: 1 }], [.88, { a: 1 }], [1, { a: 0, x: weg, y: 4, s: 1 }]];
      const tl = effekt(F.effekte, x, y, w / 2, h / 2, wurm ? 2.6 : 2.2, kf(frames, wurm ? 2.6 : 2.2, { ease: 'ease-in', halten: true, vorher: true }));
      const inner = new P.Container(); tl.addChild(inner); if (links) { inner.scale.x = -1; inner.x = w; }
      figurBild(inner, 'krabbel-' + art, [0, 0, w, h]);
    },
    // reife Kakaofrucht plumpst und kullert
    frucht(x, y) {
      const fall = 735 - y, roll = (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 50);
      const tl = teil(F.effekte, x, y, 22, 13);
      const im = new P.Container(); im.position.set(22, 13); im.rotation = Math.PI / 2; tl.addChild(im);
      figurBild(im, 'frucht', [-22, -13, 44, 26]);
      tl.spiele(kf([[0, { x: 0, y: 0, r: 0 }], [.32, { x: 0, y: fall, r: 20 }], [.42, { x: roll * .15, y: fall - 18, r: 60 }], [.52, { x: roll * .3, y: fall, r: 110 }], [1, { x: roll, y: fall, r: 300 }]], 1.6, { ease: bez(.4, 0, .6, 1), halten: true }));
      const t0 = jetzt();
      lauf(t => { const el = t - t0; if (el > 6000) tl.balpha = 1 - klemme((el - 6000) / 800, 0, 1); if (el > 6900) { weg(tl); return false; } return true; });
      return () => F.effekte.children.includes(tl);
    },
    kokos(x, schnell) {
      const roll = -60 - Math.random() * 80;
      const tl = teil(F.effekte, x, 185, 20, 18);
      figurBild(tl, 'kokosnuss', [0, 0, 40, 36]);
      tl.spiele(kf([[0, { x: 0, y: 0, r: 0 }], [.24, { x: 0, y: 272, r: 40 }], [.32, { x: roll * .1, y: 250, r: 80 }], [.4, { x: roll * .2, y: 272, r: 130 }], [1, { x: roll, y: 300, r: -340 }]], schnell ? .24 : 2.4, { ease: bez(.45, 0, .6, 1), halten: true }));
      const t0 = jetzt();
      lauf(t => { const el = t - t0; if (el > 7000) tl.balpha = 1 - klemme((el - 7000) / 800, 0, 1); if (el > 7900) { weg(tl); return false; } return true; });
    },
    // Steinchen fliegt in hohem Bogen ins Wasser
    steinWurf(zx, zy, dauer, fertig) {
      const g = new P.Graphics().ellipse(0, 0, 7, 5.5).fill('#8F887D').ellipse(-2, -1.6, 3.6, 2.6).fill({ color: '#B9B2A6', alpha: .9 });
      F.effekte.addChild(g);
      const x0 = zx + 170, y0 = 900, t0 = jetzt();
      lauf(t => {
        const p = Math.min(1, (t - t0) / dauer);
        g.position.set(x0 + (zx - x0) * p, y0 + (zy - y0) * p - Math.sin(p * Math.PI) * 170);
        g.rotation = p * 540 * Math.PI / 180; g.scale.set(1 - p * .35);
        if (p >= 1) { g.destroy(); fertig?.(); return false; }
        return true;
      });
    },
    spritzer(x, y) {
      for (let i = 0; i < 7; i++) {
        const dx = Math.random() * 60 - 30, dy = -25 - Math.random() * 35;
        const tl = effekt(F.effekte, x, y, 0, 0, .75, kf([[0, { x: 0, y: 0, a: 1 }], [.5, { x: dx * .6, y: dy }], [1, { x: dx, y: 6, a: 0 }]], .75, { ease: 'ease-out', halten: true }));
        tl.addChild(new P.Graphics().ellipse(0, 0, 2.5, 3.5).fill({ color: 0xEBF8FF, alpha: .95 }));
      }
    },
    welle(x, y) {
      const tex = TX.welle || (TX.welle = (() => { const [c, g] = leinwand(112, 48); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 10; g.beginPath(); g.ellipse(56, 24, 49, 19, 0, 0, Math.PI * 2); g.stroke(); return P.Texture.from(c); })());
      for (let i = 0; i < 3; i++) {
        const tl = effekt(F.effekte, x, y, 0, 0, 1.3, kf([[0, { a: .9, s: .4 }], [1, { a: 0, s: 5 }]], 1.3, { ease: 'ease-out', verz: i * .22, halten: true }));
        tl.balpha = 0; setTimeout(() => { if (!tl.destroyed) tl.balpha = 1; }, i * 220);
        sprite(tex, tl, { anchor: .5, width: 28, height: 12 });
      }
    },
    // Blätter bzw. Halme wirbeln aus dem Versteck
    wirbel(x, y, farben) {
      for (let i = 0; i < 7; i++) {
        const dx = Math.random() * 140 - 70, dy = -50 - Math.random() * 60, dreh = Math.random() * 540 - 270, verz = Math.random() * .12;
        const tl = effekt(F.effekte, x + 40 + Math.random() * 70, y + 30, 6, 3, 1.3, kf([[0, { a: 1, x: 0, y: 0, r: 0 }], [.45, { a: 1, x: dx * .7, y: dy, r: dreh * .6 }], [1, { a: 0, x: dx, y: 20, r: dreh }]], 1.3, { ease: 'ease-out', verz, halten: true }));
        const g = new P.Graphics(); const f = farben[i % farben.length];
        g.moveTo(6, 0).lineTo(12, 0).lineTo(12, 3).quadraticCurveTo(12, 6, 6, 6).lineTo(0, 6).lineTo(0, 3).quadraticCurveTo(0, 0, 6, 0).fill(f);
        tl.addChild(g);
      }
    },
    // sanftes Glitzern als Hinweis: hier gibt es noch etwas zu entdecken
    glitzern(x, y) {
      const st = sternTex('#FFFBEA', 'rgba(255,224,138,.95)');
      const schein = sprite(radial([[0, 'rgba(255,240,190,.55)'], [1, 'rgba(255,240,190,0)']]), F.effekte, { anchor: .5, x, y, width: 120, height: 120, alpha: 0, blendMode: 'screen' });
      const funken = Array.from({ length: 8 }, (_, i) => { const s = sprite(st, F.effekte, { anchor: .5, alpha: 0 }); s.w = i / 8 * Math.PI * 2 + Math.random() * .4; s.d = .1 + Math.random() * .35; return s; });
      const t0 = jetzt(), dauer = 2400;
      lauf(t => {
        const p = (t - t0) / dauer; if (p >= 1) { schein.destroy(); funken.forEach(f => f.destroy()); return false; }
        schein.alpha = Math.sin(p * Math.PI) * .9;
        for (const f of funken) { const q = klemme((p - f.d) / .55, 0, 1), a = Math.sin(q * Math.PI); f.alpha = a; f.scale.set(.18 + .22 * a); f.rotation = q * 2; f.position.set(x + Math.cos(f.w) * (14 + 36 * q), y + Math.sin(f.w) * (10 + 26 * q)); }
        return true;
      });
    },
    // Lichtperlen laufen über den Regenbogen
    bogenperlen(schnell) {
      const FARBEN = ['#F0503F', '#FF9A3C', '#FFE15A', '#62C76E', '#4A9BF0', '#5B5FD6', '#A066DE'];
      const cx = 282, cy = 528, rx = 172, ry = 88;
      FARBEN.forEach((f, i) => {
        const sp = sprite(punktTex(f, f.replace('#', '#') + '99'), F.effekte, { anchor: .5, width: 10 / .32 * 1.1, height: 10 / .32 * 1.1, alpha: 0 });
        const k = 1 - i * .035, dauer = schnell ? 100 : 1600, verz = schnell ? 0 : i * 110, t0 = jetzt();
        lauf(t => {
          const el = t - t0 - verz; if (el < 0) return true;
          const p = EASE['ease-in-out'](Math.min(1, el / dauer)), j = p * 16, j0 = Math.floor(Math.min(15, j)), u = j - j0;
          const pos = jj => { const w = Math.PI - jj / 16 * Math.PI; return [cx + Math.cos(w) * rx * k, cy - Math.sin(w) * ry * k]; };
          const [x0, y0] = pos(j0), [x1, y1] = pos(j0 + 1);
          sp.position.set(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u);
          sp.alpha = j0 === 0 ? u : j0 === 15 ? 1 - u : 1;
          if (el >= dauer) { sp.destroy(); return false; }
          return true;
        });
      });
    },
    // goldenes Funkeln, wenn alle drei Dinge unter dem Baum liegen
    freischalt(x, y) {
      const tl = effekt(F.effekte, x, y, 0, 0, 1.4, kf([[0, { a: 0, s: .3 }], [.25, { a: 1, s: 1.1 }], [1, { a: 0, s: 1.6 }]], 1.4, { ease: 'ease-out', halten: true }));
      sprite(radial([[0, 'rgba(255,240,180,.95)'], [.4 * 1.41, 'rgba(255,214,106,.5)'], [.7 * 1.41, 'rgba(255,214,106,0)'], [1, 'rgba(255,214,106,0)']]), tl, { anchor: .5, width: 220, height: 110 });
      const st = sternTex();
      for (let i = 0; i < 10; i++) {
        const w = i * 36 * Math.PI / 180, verz = (i % 3) * .05, sp = sprite(st, F.effekte, { anchor: .5, width: 12 * 64 / 40, height: 12 * 64 / 40, alpha: 0 });
        const a = kf([[0, { a: 0, d: 10, s: .4, r: 0 }], [.3, { a: 1 }], [1, { a: 0, d: 130, s: 1.2, r: 180 }]], 1.2, { ease: 'ease-out', verz, halten: true });
        lauf(t => { const v = a.wert(t); if (!v) return true; sp.alpha = v.a; sp.position.set(x + Math.cos(w) * v.d, y + Math.sin(w) * v.d); sp.scale.set(v.s * 12 / 40); sp.rotation = w + v.r * Math.PI / 180; if (a.fertig) { sp.destroy(); return false; } return true; });
      }
    },
    // Segen: zwei Aras fliegen herbei und kreisen über dem Baum
    segenVoegel(schnell) {
      ['ara-rot', 'ara-blau'].forEach((n, i) => {
        const bilder = [n, n + '-2', n + '-3'];
        const huelle = new P.Container(); F.flug.addChild(huelle); huelle.visible = false;
        const bob = teil(huelle, 0, 0, 65, 54);
        const sps = bilder.map(b => { const s = figurBild(bob, b, [0, 0, 130, 108]); return s; });
        if (i) { bob.bsx = -1; }
        bob.idle = kf([[0, { y: 0 }], [1, { y: -5 }]], .9, { ease: 'ease-in-out', iter: Infinity, alt: true });
        const pfad = i ? [[0, 2400, 90], [.22, 980, 220], [.32, 700, 300], [.42, 580, 200], [.52, 860, 160], [.62, 1000, 280], [.72, 720, 320], [1, -1000, -30]]
          : [[0, -1000, 120], [.22, 600, 250], [.32, 860, 190], [.42, 980, 300], [.52, 700, 330], [.62, 600, 220], [.72, 880, 170], [1, 2400, -40]];
        const flug = kf(pfad.map(([p, x, y]) => [p, { x, y }]), schnell ? .8 : 16, { ease: 'linear', verz: i * .5, halten: true });
        const t0 = jetzt();
        lauf(t => {
          const v = flug.wert(t);
          if (v) { huelle.visible = true; huelle.position.set(v.x, v.y); }
          const ph = (((t - t0) / 1000 + (i ? .12 : 0)) / .3) % 1, k = ph < .25 ? 0 : ph < .5 ? 1 : ph < .75 ? 2 : 1;
          sps.forEach((s, j) => { if (s) s.visible = j === k; });
          if (flug.fertig || t - t0 > (schnell ? 800 : 17000)) { weg(huelle); teile.delete(bob); return false; }
          return true;
        });
      });
    },
    // Die sieben Bohnen schweben herbei, kreisen um den Baum und sinken in die Erde
    bohnenFlug(punkte) {
      const tex = backe('bohne', 'glanz', 26, 'rgba(255,216,106,1)', 6);
      return punkte.map(([x, y]) => {
        const c = new P.Container(); F.flug.addChild(c); c.position.set(x, y);
        const inner = new P.Container(); inner.rotation = -30 * Math.PI / 180; c.addChild(inner);
        const im = BILDER.bohne, r = einpassen(im.naturalWidth, im.naturalHeight, -13, -20, 26, 40);
        const g = sprite(null, inner); setzeBild(g, tex, ...r);
        figurBild(inner, 'bohne', [-13, -20, 26, 40]);
        return c;
      });
    },
  };

  // --- Der Wunsch leuchtet aus den Früchten und steigt über dem Baum auf ---
  W.wunschLeuchten = text => {
    baumGlanz(5, 'rgba(255,214,106,1)', 18, 5, .35, .2);
    const stil = new P.TextStyle({ fontFamily: 'Palatino, "Palatino Linotype", "MM Pagella", "Book Antiqua", serif', fontStyle: 'italic', fontSize: 46, fill: '#FFF6DA',
      align: 'center', wordWrap: true, wordWrapWidth: 520, dropShadow: { color: '#C98A1E', alpha: .95, blur: 12, distance: 0, angle: 0 }, padding: 14 });
    const tx = new P.Text({ text: text, style: stil, resolution: 2 }); tx.anchor.set(.5); F.flug.addChild(tx);
    const st = sternTex('#FFF6D8', 'rgba(255,214,106,.95)');
    const funken = Array.from({ length: 14 }, () => { const s = sprite(st, F.flug, { anchor: .5, alpha: 0 }); s.w = Math.random() * Math.PI * 2; s.r = 30 + Math.random() * 120; s.v = .4 + Math.random() * .6; return s; });
    const a = kf([[0, { a: 0, y: 0, s: .85 }], [.18, { a: 1 }], [.75, { a: 1 }], [1, { a: 0, y: -170, s: 1.05 }]], SCHNELL ? .6 : 6.5, { ease: 'ease-in-out', halten: true });
    lauf(t => {
      const v = a.wert(t); if (!v) return true;
      tx.alpha = v.a; tx.position.set(800, 400 + v.y); tx.scale.set(v.s);
      for (const f of funken) { f.alpha = v.a * (.5 + .5 * Math.sin(t / 300 * f.v + f.w)); f.position.set(800 + Math.cos(f.w + t / 2000 * f.v) * f.r * 1.6, 400 + v.y + Math.sin(f.w + t / 2000 * f.v) * f.r * .6); f.scale.set(.35); }
      if (a.fertig) { tx.destroy(); funken.forEach(f => f.destroy()); return false; }
      return true;
    });
  };

  // --- Mücken (Gnitzen) um den Baum ---
  W.muecken = n => {
    const tex = TX.muecke || (TX.muecke = (() => { const [c, x] = leinwand(24, 24), g = x.createRadialGradient(12, 12, 0, 12, 12, 12); g.addColorStop(0, '#3B3226'); g.addColorStop(.18, '#3B3226'); g.addColorStop(.24, 'rgba(255,241,192,.7)'); g.addColorStop(1, 'rgba(255,241,192,0)'); x.fillStyle = g; x.fillRect(0, 0, 24, 24); return P.Texture.from(c); })());
    const p = () => zw(20, 180);
    for (let i = 0; i < n; i++) {
      const tl = teil(F.muecken, 700 + 2, 520 + 2, 0, 0); sprite(tex, tl, { anchor: .5, width: 12, height: 12 });
      tl.idle = kf([[0, { x: p(), y: p() }], [.5, { x: p(), y: p() }], [1, { x: p(), y: p() }]], zw(1.1, 2.4), { ease: 'ease-in-out', iter: Infinity, alt: true, verz: -zw(0, 2) });
    }
  };

  // ======================================================================
  //  Eingabe: Treffer, Mauszeiger-Namen, Blätter durchsichtig
  // ======================================================================
  let hoverZiel = null, druckZiel = null;
  W.gezogen = () => false;          // spiel.js setzt das
  W.beimDruck = () => {};           // z. B. Klick-Ton
  W.beimZeigen = () => {};          // Name unter dem Mauszeiger
  function setzeHover(z, e) {
    if (hoverZiel !== z) { hoverZiel?.hover?.(false); hoverZiel = z; z?.hover?.(true); }
    canvas.classList.toggle('zeigt', !!z);
    W.beimZeigen(z && z.zeigeName ? z : null, e);
  }
  canvas.addEventListener('pointerdown', e => {
    const p = inWelt(e.clientX, e.clientY);
    druckZiel = treffer(p.x, p.y);
    if (druckZiel) W.beimDruck(druckZiel);
    if (e.pointerType !== 'mouse') for (const tl of vornBlaetter) if (blattTreffer(tl, e.clientX, e.clientY)) {
      tl.durch.zu(.18, .35); clearTimeout(tl.uhr); tl.uhr = setTimeout(() => tl.durch.zu(1, .35), 5000);
    }
  });
  canvas.addEventListener('pointerup', e => {
    const p = inWelt(e.clientX, e.clientY), z = treffer(p.x, p.y);
    if (z && z === druckZiel && !W.gezogen()) z.tap(p);
    druckZiel = null;
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const p = inWelt(e.clientX, e.clientY);
    setzeHover(treffer(p.x, p.y), e);
  });
  canvas.addEventListener('pointerleave', () => setzeHover(null, null));
  addEventListener('pointermove', e => {   // Blätter vorn durchsichtig, solange die Maus darauf zeigt
    if (e.pointerType !== 'mouse') return;
    for (const tl of vornBlaetter) {
      const an = tl.durch.ziel < 1;
      if (!an && blattTreffer(tl, e.clientX, e.clientY)) tl.durch.zu(.18, .35);
      else if (an && !blattTreffer(tl, e.clientX, e.clientY, true)) tl.durch.zu(1, .35);
    }
  });
  W.vornBlaetter = vornBlaetter;   // zum Prüfen
  W.arasListe = arasListe;   // zum Prüfen
  W.ziele = () => ziele;
  W.wichtigeRechtecke = () => ziele.filter(z => z.aktiv() && (z.z === ZRANG.entdecken || z.z === ZRANG.gesicht || z.z === ZRANG.stein) && z.label !== 'Fluss' && z.name !== 'banane')
    .map(z => W.aufBuehneRechteck(typeof z.box === 'function' ? z.box() : z.box)).concat([W.aufBuehneRechteck(W.kolibri.box())]);
  W.trifft = (name, cx, cy) => { const z = ziele.find(z => z.name === name); if (!z) return false; const p = inWelt(cx, cy); return z.aktiv() && trifft(z, p.x, p.y); };
  W.hover = () => hoverZiel;

  // ======================================================================
  //  Größe, Zeichnen, Laden
  // ======================================================================
  W.groesse = (breite, mass) => {
    BREITE = breite; MASS = mass;
    const w = Math.round(breite * mass), h = Math.round(900 * mass);
    // mittig wie die Bühne (CSS: left/top 50 %, translate −50 %) – nur die Größe kommt von hier
    Object.assign(canvas.style, { width: w + 'px', height: h + 'px' });
    if (app) { app.renderer.resize(w, h); wurzel.scale.set(mass); vignetteMalen(); zoomKlemme(); }
  };
  let fehler = 0;
  W.schritt = t => {
    if (!app) return;
    try {
      lagenSetzen();
      wellenSchritt(t);
      wasserfallSchritt(t);
      baumSchritt(); orteSchritt(t); kolibriSchritt(t); vornSchritt(); regenbogenSchritt(t);
      yantraZeichnen(t); tagSchritt(t); nachtSchritt(); wetterSchritt(t);
      if (funkeln) { const a = funkeln.a.v; funkeln.alpha = a; funkeln.visible = a > .005; }
      if (ablage.an) ablage.schein.alpha = ablage.puls.wert(t)?.a ?? 0;
      for (const f of laeufer) if (f(t) === false) laeufer.delete(f);
      for (const tl of teile) if (!tl.destroyed && tl.worldVisible !== false) tl.schritt(t);
      app.renderer.render(app.stage);
    } catch (e) { if (fehler++ < 3) console.error(e); }
  };
  W.sparsam = () => { wellenAn = false; };

  // Alle Bilder, die die Welt braucht (Rest wird bei Bedarf nachgeladen)
  const ALLE = ['baum1', 'baum2', 'baum3', 'baum4', 'baum5', 'bananenstaude', 'palme', 'kolibri', 'kolibri-2', 'kolibri-3', 'baum-augen', 'baum-augen-zu', 'baum-mund', 'baum-mund-halb', 'baum-mund-offen',
    'patenschild', 'bohne', 'frosch', 'frosch-sprung', 'tukan', 'tukan-2', 'faultier', 'faultier-2', 'ameisen', 'morpho', 'bruellaffe', 'bruellaffe-ruhe', 'pilz', 'fisch', 'fisch-2',
    'decke-laub', 'decke-gras', 'decke-wurzel', 'decke-farn', 'ding-laub', 'ding-banane', 'ding-schalen', 'krabbel-kaefer', 'krabbel-wurm', 'krabbel-grille', 'frucht', 'kokosnuss',
    'ara-rot', 'ara-rot-2', 'ara-rot-3', 'ara-blau', 'ara-blau-2', 'ara-blau-3'];
  const VORN = ['vorn-rechts-vorn', 'vorn-links-vorn', 'haengt-1-vorn', 'haengt-2-vorn'];
  W.bereit = (async () => {
    const balken = document.querySelector('#laden .laden-balken span');
    if (location.protocol === 'file:') {   // Browser sperren lokale Bilder für WebGL – das Spiel braucht einen kleinen Webserver
      const t = document.querySelector('#laden .laden-text');
      if (t) t.innerHTML = 'Die Kakao-Reise läuft über einen kleinen Webserver.<br>Bitte im Ordner <b>„Spiel starten.command“</b> doppelklicken – dann öffnet sich der Wald im Browser.';
      document.querySelector('#laden .laden-balken')?.remove();
      throw new Error('Als Datei geöffnet (file://) – bitte über „Spiel starten.command“ öffnen.');
    }
    const liste = [[FLACH ? 'welt' : 'welt-tief', `bilder/platzhalter/${FLACH ? 'welt' : 'welt-tief'}.jpg`], ...ALLE.map(n => [n, FIG(n)]), ...(FLACH || SEHR_LEICHT ? [] : VORN.map(n => [n, FIG(n)]))];
    let fertig = 0; const gesamt = liste.length;
    const zeige = () => { if (balken) balken.style.width = Math.round(15 + 75 * Math.min(1, fertig / gesamt)) + '%'; };
    // Figuren aus dem gemeinsamen Bildblatt (wenige Dateien = schneller online); fehlt es, kommen die Einzelbilder
    const ausBlatt = async () => {
      try {
        const info = await (await fetch('bilder/platzhalter/figuren/bildblatt.json?v=95')).json();
        const blaetter = await Promise.all(info.blaetter.map(f => ladeBild(`bilder/platzhalter/figuren/${f}?v=95`)));
        if (blaetter.some(b => !b)) return false;
        for (const [n, [b, x, y, w, h]] of Object.entries(info.bilder)) BILDER[n] = { blatt: blaetter[b], sx: x, sy: y, naturalWidth: w, naturalHeight: h };
        return true;
      } catch (e) { return false; }
    };
    const welt0 = liste.shift();
    const geladen = (async () => {
      const blattOk = await ausBlatt();
      if (blattOk) { fertig += liste.length - liste.filter(([n]) => !BILDER[n]).length; zeige(); }
      await Promise.all([welt0, ...liste.filter(([n]) => !BILDER[n])].map(async ([n, src]) => { const im = await ladeBild(src); if (im) BILDER[n] = im; fertig++; zeige(); }));
    })();
    app = new P.Application();
    try {
      await app.init({ canvas, width: 1600, height: 900, resolution: AUFL, autoDensity: true, antialias: !LEICHT, backgroundColor: 0x2A241E, autoStart: false, sharedTicker: false, preference: 'webgl', powerPreference: LEICHT ? 'low-power' : 'default' });
    } catch (e) {
      app = null;
      const t = document.querySelector('#laden .laden-text'); if (t) t.textContent = 'Dein Browser kann die Waldwelt leider nicht zeichnen (WebGL ist aus).';
      throw e;
    }
    app.ticker?.stop();
    app.stage.eventMode = 'none';
    app.stage.addChild(wurzel);
    const rahmenEl = document.getElementById('rahmen'); rahmenEl.insertBefore(canvas, rahmenEl.firstChild);
    await geladen;
    if (!BILDER['welt-tief'] && !BILDER.welt) throw new Error('Weltbild fehlt');
    baueWelt();
    // alle Texturen einmal hochladen, damit beim ersten Umschauen nichts ruckelt
    try { app.renderer.render(app.stage); } catch (e) { console.error(e); }
    if (balken) balken.style.width = '100%';
    return W;
  })();

  // Hilfen für entdecken.js / spiel.js
  W.BILDER = BILDER; W.kf = kf; W.bez = bez; W.teil = teil; W.F = F; W.L = L; W.sprite = sprite; W.einpassen = einpassen; W.backe = backe; W.setzeBild = setzeBild;
  W.lauf = lauf; W.weg = weg; W.Wert = Wert; W.jetzt = jetzt; W.punktTex = punktTex; W.radial = radial;
  W.ladeNach = async n => { if (!BILDER[n]) { const im = await ladeBild(FIG(n)); if (im) BILDER[n] = im; } return BILDER[n]; };
})();
