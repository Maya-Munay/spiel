// Kakao-Reise · Entdecken
// 1) Klick-Überraschungen: Tiere und Pflanzen im Wald reagieren auf Klicks (Animation + Ton).
//    Beim ersten Klick erzählt der Wald das Wissen dazu (Texte in inhalt.js → wissen/entdecken).
// 2) Verstecke: Laub, Gras, Wurzeln und Farne, unter denen die Quest-Dinge liegen – bei jedem Spiel woanders.
// Koordinaten = Welt-Pixel (Bühne 1600 × 900). Gezeichnet wird in der WebGL-Welt (welt.js), nicht mehr im HTML.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  let WW = window.WELT;   // die Welt (welt.js) – bereit, bevor spiel.js startet

  // Klassen wie im HTML (add/remove/contains/toggle), meldet jede Änderung – so bleibt die Spiellogik wie sie war
  function klassen(beiAenderung) {
    const s = new Set();
    return {
      add(...k) { k.forEach(x => { s.add(x); beiAenderung?.(x, true); }); },
      remove(...k) { k.forEach(x => { if (s.delete(x)) beiAenderung?.(x, false); }); },
      contains: k => s.has(k),
      toggle(k, an = !s.has(k)) { if (an) this.add(k); else this.remove(k); return an; },
    };
  }

  // was, Position (links, oben, Breite, Höhe), Beschriftung für den Mauszeiger
  const UEBERRASCHUNGEN = [
    { was: 'banane', box: [960, 400, 300, 300], name: 'Bananenstaude', bild: '' },
    // über die ganze Welt verteilt (Wunsch Yilmaz 05.11.): links im Urwaldbaum und am Fluss, rechts auf der Anhöhe
    { was: 'frosch', box: [1806, 382, 86, 66], name: 'Frosch auf dem Felsen' },
    { was: 'tukan', box: [-262, 96, 124, 112], name: 'Tukan im großen Baum' },
    { was: 'faultier', box: [-345, 215, 120, 154], name: 'Faultier am Stamm' },
    { was: 'ameisen', box: [1240, 784, 290, 50], name: 'Ameisenstraße' },
    { was: 'morpho', box: [6, 676, 90, 70], name: 'Blauer Schmetterling' },
    { was: 'bruellaffe', box: [420, 40, 180, 180], name: 'Brüllaffe auf dem Ast' },   // hoch oben in der Krone des linken Schattenbaums, dem Kakaobaum nicht im Weg
    { was: 'stein', box: [1262, 628, 86, 44], name: 'Stein', bild: '' },
    { was: 'wasser', box: [-490, 650, 330, 220], name: 'Fluss', bild: '' },
    { was: 'wasserfall', box: [170, 290, 240, 130], name: 'Wasserfall', bild: '' },
    { was: 'regenbogen', box: [110, 436, 345, 84], name: 'Regenbogen', bild: '' },   // der gemalte Regenbogen im Nebel
    { was: 'kakaofrucht', box: [620, 330, 360, 260], name: 'Reife Kakaofrüchte', bild: '' },
    { was: 'palme', box: [1955, 100, 180, 150], name: 'Kokospalme', bild: '' },
    { was: 'pilz', box: [-238, 530, 82, 80], name: 'Becherpilze' },
    { was: 'fisch', box: [-400, 700, 92, 58], name: 'Etwas im Fluss' },
  ];

  // Verstecke für die Quest: links, oben (Kasten 150 × 80), Art
  const VERSTECKE = [
    [250, 700, 'gras'], [380, 800, 'laub'], [492, 640, 'wurzel'], [1034, 660, 'farn'],
    [1160, 690, 'laub'], [862, 792, 'gras'], [1252, 782, 'farn'], [1440, 628, 'gras'],
    // links am Fluss und beim Kapokbaum, rechts auf der Anhöhe
    [-400, 536, 'wurzel'], [-60, 770, 'farn'], [-250, 790, 'gras'], [1560, 505, 'gras'], [1930, 480, 'laub'], [1620, 640, 'farn'],
  ];

  // ---------- Gemalte Figuren (Platzhalter von Muse) und ihre Bewegungen ----------
  // Bewegungsbilder (Bild für Bild wie im Trickfilm): Grundbild, ab und zu ein Ruhe-Bild (Blinzeln, Flügel), beim Antippen eine Folge
  const BEWEGUNG = {
    faultier: { ruhe: [['faultier-2', 220]], ruheAlle: 5200 },
    bruellaffe: { grund: 'bruellaffe-ruhe', aktiv: ['bruellaffe'], takt: 400 },
    tukan: { ruhe: [['tukan-2', 300]], ruheAlle: 9000, aktiv: ['tukan-2', 'tukan'], takt: 240 },
    frosch: { aktiv: ['frosch-sprung', 'frosch-sprung', 'frosch'], takt: 260 },
    fisch: { aktiv: ['fisch', 'fisch-2'], takt: 130 },
  };
  const RUHIG = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ruheBilder(fig, name) {
    const bw = BEWEGUNG[name]; fig.grund = bw?.grund || name;
    if (!bw?.ruhe || RUHIG) return;
    const einmal = () => setTimeout(() => {
      if (!fig.bewegt) { const [n, ms] = bw.ruhe[Math.floor(Math.random() * bw.ruhe.length)]; fig.bild(n); setTimeout(() => { if (!fig.bewegt) fig.bild(fig.grund); }, ms); }
      einmal();
    }, bw.ruheAlle * (.7 + Math.random() * .6));
    einmal();
  }
  function bewege(fig, name, dauer) {   // Folge der Bewegungsbilder während der Antipp-Animation
    const bw = BEWEGUNG[name]; if (!bw?.aktiv || !fig) return;
    fig.bewegt = true; let i = 0;
    const uhr = setInterval(() => { fig.bild(bw.aktiv[i++ % bw.aktiv.length]); }, bw.takt);
    fig.bild(bw.aktiv[i++]);
    setTimeout(() => { clearInterval(uhr); fig.bild(fig.grund); fig.bewegt = false; }, dauer);
  }
  // Wie sich jede Figur bewegt (wie bisher in spiel.css): Ursprung außen (Kasten) und innen (Bild), dauernd und beim Antippen
  function figurAnlegen(u) {
    const W = WW, kf = W.kf, [, , w, h] = u.box;
    const AUSSEN = { faultier: [w / 2, 0] }, INNEN = { tukan: [w * .45, h * .85], bruellaffe: [w / 2, h], pilz: [30, 54], fisch: [40, 40] };
    const fig = new W.Figur(W.F.entdecken, { box: u.box, bild: BEWEGUNG[u.was]?.grund || u.was, art: 'umriss', unten: true, aussen: AUSSEN[u.was], innen: INNEN[u.was] });
    const A = fig.aussen, I = fig.innen;
    switch (u.was) {
      case 'faultier': A.idle = kf([[.5, { y: -5, r: -1 }]], 7, { ease: 'ease-in-out', iter: Infinity }); break;
      case 'ameisen':
        I.idle = kf([[0, { x: -60, a: 0 }], [.08, { a: 1 }], [.88, { a: 1 }], [1, { x: 90, a: 0 }]], 11, { ease: 'linear', iter: Infinity });
        A.idle = kf([[0, { y: 0 }], [.5, { y: -1.5 }], [1, { y: 0 }]], .22, { ease: 'steps(2)', iter: Infinity }); break;
      case 'fisch': I.idle = kf([[0, { a: 0 }], [1, { a: 0 }]], 1, { iter: Infinity }); break;
      case 'pilz': {   // mystisch, magisch glitzernd
        fig.zeigeGlanz('rgba(255,200,240,.95)', 14, .35);
        const glanz = kf([[0, { a: .3 }], [.5, { a: 1 }], [1, { a: .3 }]], 3.2, { ease: 'ease-in-out', iter: Infinity });
        W.lauf(t => { const g = glanz.wert(t)?.a ?? .3; if (!fig.hoverAn) fig.glanzAlpha(g); fig.hellAlpha(g * .08); return true; });
        const [l, t] = u.box, kw = w + 36, kh = h + 36;
        const PUNKTE = [[.12, .3, 2.2, '#FFF6FF'], [.8, .18, 1.6, '#FFE9F8'], [.64, .72, 2, '#FFFFFF'], [.28, .8, 1.4, '#FFE2F4'], [.92, .55, 1.8, '#FFF6D8'], [.46, .06, 1.4, '#FFFFFF']];
        [[0, 1, 0], [140, .85, -1.3]].forEach(([dreh, sk, verz]) => {
          const g = W.teil(W.F.entdecken, l - 18, t - 18, kw / 2, kh / 2);
          g.br = dreh; g.bsx = g.bsy = sk;
          for (const [px, py, r, f] of PUNKTE) W.sprite(W.punktTex(f, 'rgba(255,198,236,.7)'), g, { anchor: .5, x: px * kw, y: py * kh, width: r * 2 / .32 * 1.3, height: r * 2 / .32 * 1.3 });
          g.idle = kf([[0, { a: .15, y: 4 }], [.5, { a: 1, y: -6 }], [1, { a: .15, y: 4 }]], 2.6, { ease: 'ease-in-out', iter: Infinity, verz });
        });
        break;
      }
    }
    ruheBilder(fig, u.was);
    return fig;
  }
  function aktivAnimation(u, fig, dauer) {
    const kf = WW.kf, A = fig.aussen, I = fig.innen, S = api.SCHNELL ? .1 : 1;
    switch (u.was) {
      case 'frosch': A.spiele(kf([[.4, { y: -50, r: -8, sx: 1, sy: 1 }], [.7, { y: 0, r: 0, sx: 1.1, sy: .8 }]], .8 * S, { ease: 'ease-out' })); break;
      case 'tukan': I.spiele(kf([[.2, { r: -10 }], [.4, { r: 4 }], [.6, { r: -8 }], [.8, { r: 2 }]], 1.4 * S, { ease: 'ease-in-out' })); break;
      case 'faultier': A.spiele(kf([[.45, { y: -28 }], [.6, { y: -28 }]], 3.2 * S, { ease: 'ease-in-out' })); break;
      case 'ameisen': A.spiele(kf([[.5, { y: -3 }]], .3 * S, { ease: 'ease-in-out', iter: 4 })); break;
      case 'morpho':
        A.spiele(kf([[.2, { x: -90, y: -140, r: -10 }], [.45, { x: 60, y: -230, r: 8 }], [.7, { x: 140, y: -90, r: 10 }]], 4.2 * S, { ease: 'ease-in-out' }));
        I.spiele(kf([[0, { sx: 1 }], [1, { sx: .2 }]], .16, { ease: 'ease-in-out', alt: true, iter: Math.round(dauer / 160) })); break;
      case 'bruellaffe': I.spiele(kf([[.15, { y: -4, s: 1.02 }], [.75, { y: -4, s: 1.02 }]], 2.6 * S, { ease: 'ease-in-out' })); break;
      case 'pilz': I.spiele(kf([[.4, { sx: 1.15, sy: .75 }]], .5 * S, { ease: 'ease' })); break;
      case 'fisch': I.spiele(kf([[0, { a: 1, x: -30, y: 30, r: -40 }], [.45, { a: 1, x: 0, y: -60, r: 0 }], [.9, { a: 1, x: 30, y: 26, r: 50 }], [1, { a: 0, x: 34, y: 34, r: 60 }]], 1.3 * S, { ease: 'ease-out' })); break;
    }
  }

  // ---------- Kleine Überraschungen: Krabbeltiere, Wellen ----------
  const KRABBLER = ['kaefer', 'wurm', 'grille'];
  function krabbler(von, art = KRABBLER[Math.floor(Math.random() * KRABBLER.length)]) {
    const [l, t, w, h] = von.box;
    WW.effekt.krabbler(l + w / 2 - 27, t + h / 2 - 10, art, Math.random() < .5);
  }
  // Eine reife Kakaofrucht plumpst vom Baum und kullert ein Stück (nur wenn der Baum Früchte trägt)
  const fruechte = [];
  function frucht() {
    if (!api.baumStufe || api.baumStufe() !== 5) return;
    for (let i = fruechte.length - 1; i >= 0; i--) if (!fruechte[i]()) fruechte.splice(i, 1);
    if (fruechte.length > 2) return;
    fruechte.push(WW.effekt.frucht(690 + Math.random() * 200, 420 + Math.random() * 90));
    setTimeout(() => KLANG.spiel('plopp'), 520);
  }
  // Ein Steinchen fliegt in hohem Bogen ins Wasser und plumpst
  function steinWurf(el, p) {
    const [l, t, w, h] = el.box, zx = p ? p.x : l + w / 2, zy = p ? p.y : t + h / 2;
    WW.effekt.steinWurf(zx, zy, api.SCHNELL ? 60 : 620, () => { KLANG.spiel('steinWasser'); welle(el, { x: zx, y: zy }); WW.effekt.spritzer(zx, zy); });
  }
  // Eine Kokosnuss fällt von der Palme und kullert den Hang hinunter
  let kokosZahl = 0;
  function kokosnuss() {
    if (kokosZahl > 2) return;
    kokosZahl++; setTimeout(() => kokosZahl--, 7900);
    WW.effekt.kokos(1975 + Math.random() * 45, api.SCHNELL);   // unter den Kokosnüssen der gemalten Palme
    setTimeout(() => { KLANG.spiel('stein'); KLANG.spiel('plopp'); }, api.SCHNELL ? 30 : 560);
  }
  function welle(el, p) {
    const [l, t, w, h] = el.box;
    WW.effekt.welle(p ? p.x : l + w / 2, p ? p.y : t + h / 2);
  }
  function stoebern(b) {
    if (api.gezogen?.() || b.classList.contains('stoebert')) return;
    b.classList.add('stoebert'); KLANG.spiel('rascheln');
    setTimeout(() => b.classList.remove('stoebert'), 900);
    // Blätter bzw. Halme wirbeln heraus
    const FARBEN = { laub: ['#B5832E', '#D9A441', '#8E5F24', '#C9772F'], gras: ['#9DB548', '#C8C04E', '#7E9A3A'], wurzel: ['#7A5634', '#5E7A3A', '#9A7048'], farn: ['#5E9A44', '#79B24E', '#4E8A3C'] }[b.dataset.art] || ['#9DB548'];
    WW.effekt.wirbel(b.x, b.y, FARBEN);
    if (Math.random() < .85) setTimeout(() => krabbler(b), 300);
    api.kommentar?.(b.dataset.art, { x: b.x + 75, y: b.y + 40 });
  }

  // ---------- Start ----------
  let api = null;
  const entdeckt = new Set();

  function karte(was, box) {   // Wissenskarte neben dem Tier (HTML über der Welt, wandert mit der Kamera)
    const w = api.I.wissen[was]; if (!w) return;
    if (api.dialogOffen()) return;   // während jemand spricht: nur „Neu im Wissensbuch“, keine Karte über dem Text
    $('.wissenskarte')?.remove();
    const k = document.createElement('div'); k.className = 'wissenskarte';
    k.innerHTML = '<div class="karte-text"><h4></h4><p></p></div>';
    k.querySelector('h4').textContent = w.titel; k.querySelector('p').textContent = w.text;
    if (api.bild) {   // gemaltes Bild (Platzhalter), fällt still weg, wenn es fehlt
      const im = new Image(); im.alt = ''; im.src = api.bild(was); k.prepend(im); k.classList.add('mit-bild');
      im.onerror = () => { im.remove(); k.classList.remove('mit-bild'); };
    }
    // seitlich neben das Tier (zur Bildmitte hin), senkrecht mittig, im sichtbaren Ausschnitt; Zipfel zeigt zum Tier
    $('#spielflaeche').append(k);
    // sichtbarer Ausschnitt in Weltpunkten (auch hineingezoomt); die Karte selbst bleibt gleich groß (Maße in Weltpunkten = Pixel / Zoom)
    const S = WW.sicht(window.KAMERA?.ziel), z = S.z, w0 = k.offsetWidth / z, h0 = k.offsetHeight / z;
    const mitteX = box[0] + box[2] / 2, mitteY = box[1] + box[3] / 2, rechts = mitteX - S.x < S.w / 2;
    let x = rechts ? box[0] + box[2] + 24 / z : box[0] - 24 / z - w0;
    x = Math.max(S.x + 20 / z, Math.min(S.x + S.w - 20 / z - w0, x));
    const y = Math.max(S.y + 90 / z, Math.min(S.y + S.h - 40 / z - h0, mitteY - h0 / 2));
    k.style.left = x + 'px'; k.style.top = y + 'px';
    k.classList.add(rechts ? 'zipfel-links' : 'zipfel-rechts');
    k.style.setProperty('--zipfel', Math.max(24, Math.min(h0 * z - 24, (mitteY - y) * z)) + 'px');
    let zu = false; const weg = () => { if (zu) return; zu = true; k.classList.add('weg'); setTimeout(() => k.remove(), 500); };
    k.onclick = weg;
    const datei = !api.SCHNELL && !api.dialogOffen() && window.STIMMEN ? window.STIMMEN[w.text] : null;
    if (datei) { api.baumSpricht?.(true); KLANG.sprich(datei).then(() => { api.baumSpricht?.(false); setTimeout(weg, 1800); }); }
    else setTimeout(weg, api.SCHNELL ? 400 : 9000);
  }

  const AKTION = {
    banane() { WW.bananeWiegen(); KLANG.spiel('banane'); },
    stein(el) { KLANG.spiel('stein'); krabbler(el, 'kaefer'); },
    wasser(el, p) { steinWurf(el, p); },
    palme() { kokosnuss(); },
    // Regenbogen: leuchtet kräftig auf, Lichtperlen laufen in allen sieben Farben über den Bogen, dazu sieben steigende Töne
    regenbogen() { WW.regenbogen(true); KLANG.spiel('regenbogen'); WW.effekt.bogenperlen(api.SCHNELL); },
    wasserfall() { WW.regenbogen(false); KLANG.spiel('funkeln'); },
    kakaofrucht() { frucht(); },
    bruellaffe() { KLANG.spiel('affe'); },
  };
  const DAUER = { fisch: 1300, frosch: 800, tukan: 1400, faultier: 3200, ameisen: 1200, morpho: 4200, bruellaffe: 2600, pilz: 1200, banane: 1700, stein: 900 };
  const TON = { fisch: 'platsch', frosch: 'frosch', tukan: 'tukan', faultier: 'faultier', ameisen: 'ameisen', morpho: 'falter', pilz: 'puff' };
  let fruchtSichtbar = false;

  // Hinweis: Ist eine Weile nichts Neues entdeckt worden, glitzert ein noch verborgenes Geheimnis, das gerade im Bild ist
  let letzteEntdeckung = performance.now(), letzterHinweis = 0;
  function hinweisGlitzern() {
    const jetzt = performance.now(), warten = api.SCHNELL ? 3000 : 45000, abstand = api.SCHNELL ? 2000 : 25000;
    if (!api.frei?.() || jetzt - letzteEntdeckung < warten || jetzt - letzterHinweis < abstand) return;
    const S = WW.sicht(), offen = UEBERRASCHUNGEN.filter(u => api.I.entdecken.includes(u.was) && !entdeckt.has(u.was)
      && u.box[0] + u.box[2] / 2 > S.x + 40 && u.box[0] + u.box[2] / 2 < S.x + S.w - 40 && u.box[1] + u.box[3] / 2 > S.y && u.box[1] + u.box[3] / 2 < S.y + S.h);
    if (!offen.length) return;
    const u = offen[Math.floor(Math.random() * offen.length)];
    letzterHinweis = jetzt; WW.effekt.glitzern(u.box[0] + u.box[2] / 2, u.box[1] + u.box[3] / 2);
  }
  function start(a) {
    api = a;
    setInterval(hinweisGlitzern, 3000);
    for (const u of UEBERRASCHUNGEN) {
      const b = { was: u.was, box: u.box, classList: klassen() };
      if (u.bild !== '') b.fig = figurAnlegen(u);
      b.aktivBis = 0;
      const tippe = p => {
        const ort = { x: u.box[0] + u.box[2] / 2, y: u.box[1] + u.box[3] / 2 };
        b.classList.add('entdeckt');
        if (['wasser', 'wasserfall', 'kakaofrucht', 'palme', 'regenbogen'].includes(u.was)) {   // jedes Antippen wirkt
          AKTION[u.was](b, p);
          if (u.was !== 'wasser') api.kommentar?.(u.was === 'kakaofrucht' ? 'kakaobaum' : u.was, ort);
          return;
        }
        if (u.was === 'frosch' && entdeckt.has('frosch') && api.froschkonzert) { api.froschkonzert(); return; }   // zweites Antippen: Froschkonzert
        if (b.classList.contains('aktiv')) return;
        const dauer = api.SCHNELL ? 100 : DAUER[u.was] || 1200;
        b.classList.add('aktiv'); setTimeout(() => b.classList.remove('aktiv'), api.SCHNELL ? 100 : DAUER[u.was]);
        if (b.fig) { bewege(b.fig, u.was, dauer); aktivAnimation(u, b.fig, DAUER[u.was] || 1200); }
        AKTION[u.was]?.(b, p); if (TON[u.was]) KLANG.spiel(TON[u.was]);
        if (api.I.entdecken.includes(u.was) && !entdeckt.has(u.was)) {
          entdeckt.add(u.was); letzteEntdeckung = performance.now(); api.lerne(u.was); karte(u.was, u.box);
          if (u.was === 'frosch') setTimeout(() => api.zeigeHinweis(api.I.konzert.hinweis, 4800), api.SCHNELL ? 200 : 9800);
        } else api.kommentar?.(u.was, ort);   // schon bekannt: der Kolibri fliegt hin und erzählt
      };
      // warmer Schein beim Darüberfahren (wie bisher :hover)
      const hover = b.fig && u.was !== 'pilz' ? v => { b.fig.hoverAn = v; if (v) b.fig.zeigeGlanz('rgba(255,240,200,.95)', 8, 1); else b.fig.glanzAlpha(0); } : null;
      WW.ziel({ name: u.was, label: u.name, box: u.box, z: WW.ZRANG.entdecken, zeigeName: true, aktiv: () => u.was !== 'kakaofrucht' || fruchtSichtbar, tap: tippe, hover });
    }
  }

  // Verstecke anlegen und die Quest-Dinge zufällig darunter legen. Gibt die Verstecke zurück.
  function verstecke(dinge) {
    const W = WW, kf = W.kf, federn = W.bez(.3, 1.3, .5, 1);
    const plaetze = VERSTECKE.map(([l, t, art]) => {
      const p = { x: l, y: t, box: [l, t, 150, 80], dataset: { art }, ding: null, onclick: null };
      const fig = new W.Figur(W.F.verstecke, { box: p.box, bild: 'decke-' + art, art: 'umriss', unten: true, aussen: [105, 80] });
      p.fig = fig;
      const dx = new W.Wert(0), dy = new W.Wert(0), dr = new W.Wert(0), da = new W.Wert(1);
      let hover = false, tippAn = null;
      const stelle = () => {
        const offen = p.classList.contains('offen'), heben = hover && !offen && api.istQuest?.();
        dx.zu(offen ? 28 : 0, .6, federn); dy.zu(offen ? -8 : heben ? -4 : 0, .6, federn); dr.zu(offen ? 16 : heben ? -2 : 0, .6, federn); da.zu(offen ? .5 : 1, .6, federn);
      };
      p.classList = klassen((k, an) => {
        if (k === 'offen') stelle();
        if (k === 'tipp') {
          if (an && !tippAn) { fig.zeigeGlanz('rgba(255,224,138,1)', 14, 0); tippAn = kf([[0, { a: 0 }], [.5, { a: 1 }], [1, { a: 0 }]], 1.6, { ease: 'ease-in-out', iter: Infinity }); }
          if (!an) { tippAn = null; fig.glanzAlpha(0); }
        }
        if (k === 'stoebert' && an) fig.aussen.spiele(kf([[.2, { x: 14, y: -26, r: 14 }], [.45, { x: -4, y: -8, r: -6 }], [.7, { x: 0, y: -3, r: 3 }]], api.SCHNELL ? .085 : .85, { ease: W.bez(.3, 1.4, .5, 1) }));
      });
      W.lauf(t => {
        const A = fig.aussen; A.bdx = dx.v; A.bdy = dy.v; A.br = dr.v; A.balpha = da.v;
        if (tippAn) fig.glanzAlpha(tippAn.wert(t)?.a ?? 0);
        return true;
      });
      W.ziel({
        name: 'versteck', label: { laub: 'Laubhaufen', gras: 'Grasbüschel', wurzel: 'Wurzeln', farn: 'Farn' }[art], box: p.box, z: W.ZRANG.versteck, zeigeName: true,
        aktiv: () => !api.istWaehlen?.(),
        hover: v => { hover = v; stelle(); },
        tap: () => {
          p.classList.add('durchsucht');   // schon nachgeschaut
          if (!api.istQuest?.() && !(p.ding && !p.ding.classList.contains('gefunden'))) stoebern(p);
          p.onclick?.();
        },
      });
      return p;
    });
    // jedes Spiel anders: echte Zufallsreihenfolge
    const frei = plaetze.slice().sort(() => Math.random() - .5);
    dinge.forEach((d, i) => { const p = frei[i]; p.ding = d; d.setze(p.x + 25, p.y + 24); });
    return plaetze;
  }

  // Sammelding (Quest): liegt unsichtbar unter einem Versteck, taucht beim Finden auf
  function sammelDing(name) {
    const W = WW, kf = W.kf;
    const d = { dataset: { ding: name }, x: 0, y: 0, bild: 'ding-' + name };
    const fig = new W.Figur(W.F.sammel, { box: [0, 0, 100, 60], bild: 'ding-' + name, art: 'umriss', unten: true });
    const alpha = new W.Wert(0); fig.aussen.balpha = 0;
    W.lauf(() => { fig.aussen.balpha = alpha.v; return true; });
    d.fig = fig;
    d.setze = (x, y, sofort = true) => { d.x = x; d.y = y; fig.aussen.bx = x + 50; fig.aussen.by = y + 30; fig.box = [x, y, 100, 60]; void sofort; };
    d.box = () => [d.x, d.y, 100, 60];
    d.classList = klassen((k, an) => {
      const c = d.classList;
      if (k === 'gefunden' && an && !c.contains('gesammelt')) { alpha.zu(1, .6); fig.aussen.spiele(kf([[0, { y: 14, s: .6 }], [1, { y: 0, s: 1 }]], .6, { ease: W.bez(.3, 1.5, .5, 1) })); }
      if (k === 'in-tasche') alpha.zu(an ? 0 : 1, .6);
      if (k === 'gesammelt' && an) { alpha.zu(1, 0); fig.aussen.bsx = fig.aussen.bsy = .6; }
    });
    return d;
  }

  window.ENTDECKEN = {
    start, verstecke, sammelDing, klassen,
    fruchtSichtbar(v) { fruchtSichtbar = v; },
    get anzahl() { return entdeckt.size; }, get liste() { return [...entdeckt]; },
    setze(liste) { liste.forEach(w => entdeckt.add(w)); },
  };
})();
