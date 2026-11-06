// Kakao-Reise · Klänge
// Dschungel, Klicks und kleine Effekte werden live im Browser erzeugt (Web Audio).
// Aus Dateien kommen: die Stimmen (stimme/*.mp3, erzeugt mit stimme_bauen.py) und echte Aufnahmen
// in klang/ (Kolibri: Fliegen, Anflug, Abflug; Waldvögel – Herkunft siehe klang/QUELLEN.md).
// Fehlt eine Aufnahme, springt automatisch der live erzeugte Ersatz ein.
(() => {
  let ctx = null, master, amb, effekt, tiere, hall, rausch, stimmBus;
  let stumm = false;
  try { stumm = localStorage.getItem('kakao-stumm') === '1'; } catch (e) {}
  const zufall = (a, b) => a + Math.random() * (b - a);
  const laufend = {};
  let stimme = null;
  // echte Aufnahmen; Schleifen haben 0,1 s Rand an beiden Seiten (nahtlos überblendet)
  const AUFNAHMEN = { voegel: 'klang/waldvoegel.mp3', fliegen: 'klang/kolibri-fliegen.mp3',
    anflug: 'klang/kolibri-anflug.mp3', abflug: 'klang/kolibri-abflug.mp3',
    tukan: 'klang/tukan.mp3', affe: 'klang/bruellaffe.mp3', frosch: 'klang/frosch.mp3',
    stein1: 'klang/stein-wasser-1.mp3', stein2: 'klang/stein-wasser-2.mp3', stein3: 'klang/stein-wasser-3.mp3',
    papageien: 'klang/papageien.mp3' };   // echte Tieraufnahmen von Yilmaz
  let kolPan = null, schwebe = null;
  function einmal(buf, ziel, laut, wann) {
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; g.gain.value = laut;
    s.connect(g); g.connect(ziel); s.start(wann); return s;
  }
  // leises Summen, solange der Kolibri in der Szene schwebt (läuft über den Dschungel-Bus, wird also beim Sprechen leiser)
  function schweben(an) {
    if (an) {
      if (schwebe || !puffer.fliegen) return;
      const p = pan(kolPan && kolPan.pan ? kolPan.pan.value : 0); p.connect(amb);
      schwebe = schleife(puffer.fliegen, p, .12);
    } else if (schwebe) {
      const { s, g } = schwebe, n = ctx.currentTime; schwebe = null;
      g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(.0001, n, .2); setTimeout(() => s.stop(), 1500);
    }
  }
  const puffer = {};
  function aufnahmenLaden() {
    const eingebettet = window.AUFNAHMEN_DATEN || {};   // aus klang/aufnahmen.js – klappt auch beim Öffnen als Datei
    for (const [name, url] of Object.entries(AUFNAHMEN)) {
      const holen = eingebettet[name]
        ? Promise.resolve(Uint8Array.from(atob(eingebettet[name]), c => c.charCodeAt(0)).buffer)
        : fetch(url).then(r => r.ok ? r.arrayBuffer() : Promise.reject());
      holen
        .then(b => new Promise((ok, nein) => ctx.decodeAudioData(b, ok, nein)))
        .then(buf => { puffer[name] = buf; if (name === 'voegel') waldvoegel(); })
        .catch(() => {});
    }
  }
  function schleife(buf, ziel, laut) {
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    s.loopStart = .1; s.loopEnd = buf.duration - .1;
    const g = ctx.createGain(); g.gain.value = .0001; s.connect(g); g.connect(ziel);
    s.start(0, zufall(.1, buf.duration - .2));
    g.gain.exponentialRampToValueAtTime(laut, ctx.currentTime + 1);
    return { s, g };
  }
  function waldvoegel() { const { g } = schleife(puffer.voegel, amb, .5); lfo(.03, .15, g.gain); }

  // iPhone/iPad: Web Audio verstummt, wenn der Lautlos-Schalter an ist. Als Medien-Wiedergabe angemeldet (wie ein Video)
  // klingt es trotzdem: neue Safari-Schnittstelle audioSession, sonst ein stilles, endlos laufendes Audio-Element.
  let stillesAudio = null;
  function alsMedienWiedergabe() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    if (!matchMedia('(pointer: coarse)').matches) return;   // nur Handys/Tablets
    if (!stillesAudio) {
      stillesAudio = new Audio('data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==');
      stillesAudio.loop = true; stillesAudio.setAttribute('playsinline', '');
    }
    if (stillesAudio.paused) stillesAudio.play().catch(() => {});
  }
  function an() {
    alsMedienWiedergabe();
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = stumm ? 0 : 1; master.connect(ctx.destination);
    amb = ctx.createGain(); amb.gain.value = .9; amb.connect(master);
    stimmBus = ctx.createGain(); stimmBus.gain.value = 1; stimmBus.connect(master);   // Stimmen laufen im selben Ton-System wie der Wald
    // Handys halten den Ton manchmal an (andere Wiedergabe, Anruf, Sperrbildschirm) – dann gleich wieder wecken
    ctx.onstatechange = () => { if (ctx.state !== 'running' && !document.hidden) ctx.resume().catch(() => {}); };
    const wecken = () => { alsMedienWiedergabe(); if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); };
    ['pointerdown', 'touchend', 'keydown'].forEach(n => addEventListener(n, wecken, { passive: true }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wecken(); });
    effekt = ctx.createGain(); effekt.gain.value = .8; effekt.connect(master);
    // eigener, kräftiger Kanal für Tierlaute (Wunsch Yilmaz: viel lauter), mit Begrenzer gegen Übersteuern
    const begrenzer = ctx.createDynamicsCompressor(); begrenzer.threshold.value = -12; begrenzer.knee.value = 6; begrenzer.ratio.value = 8;
    begrenzer.attack.value = .003; begrenzer.release.value = .2; begrenzer.connect(master);
    tiere = ctx.createGain(); tiere.gain.value = 3.2; tiere.connect(begrenzer);
    // kleiner Raumhall (Echo mit Rückkopplung, gedämpft)
    hall = ctx.createDelay(1); hall.delayTime.value = .19;
    const fb = ctx.createGain(); fb.gain.value = .32;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    hall.connect(lp); lp.connect(fb); fb.connect(hall);
    const hallAus = ctx.createGain(); hallAus.gain.value = .5; lp.connect(hallAus); hallAus.connect(master);
    // Rauschen als Grundstoff
    rausch = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = rausch.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) { // rosa Rauschen (weicher als weißes)
      const w = Math.random() * 2 - 1;
      b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * .1848) * .18;
    }
    dschungel();
    aufnahmenLaden();
  }

  function rauschQuelle() { const s = ctx.createBufferSource(); s.buffer = rausch; s.loop = true; s.loopStart = zufall(0, 2); return s; }
  function filter(typ, f, q = 1) { const x = ctx.createBiquadFilter(); x.type = typ; x.frequency.value = f; x.Q.value = q; return x; }
  function lfo(f, tiefe, ziel) { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = tiefe; o.connect(g); g.connect(ziel); o.start(); return o; }
  function pan(x) { const p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (p.pan) p.pan.value = x; return p; }

  // ---------- Dschungel-Grundklang ----------
  function dschungel() {
    // leises Blätterrauschen als Grund (kaum hörbar, nur Luft im Raum)
    const w = rauschQuelle(), wf = filter('lowpass', 420, .4), wg = ctx.createGain(); wg.gain.value = .045;
    w.connect(wf); wf.connect(wg); wg.connect(amb); lfo(.05, .015, wg.gain); w.start();
    // Windböen: kommen unregelmäßig, mal kurz, mal länger, mal links, mal rechts
    const b0 = rauschQuelle(), bf0 = filter('bandpass', 900, .7), bg0 = ctx.createGain(), bp0 = pan(0);
    bg0.gain.value = 0; b0.connect(bf0); bf0.connect(bg0); bg0.connect(bp0); bp0.connect(amb); b0.start();
    const boe = () => {
      if (!ctx) return;
      const t = ctx.currentTime, an = zufall(.6, 2.2), halt = zufall(.2, 1.5), ab = zufall(1.2, 3.5);
      const laut = Math.random() < .25 ? zufall(.07, .1) : zufall(.025, .055);   // selten etwas kräftiger
      const f = zufall(600, 1400);
      bf0.frequency.cancelScheduledValues(t); bg0.gain.cancelScheduledValues(t);
      bf0.frequency.setValueAtTime(f * .7, t); bf0.frequency.linearRampToValueAtTime(f * zufall(1.3, 2), t + an); bf0.frequency.linearRampToValueAtTime(f * .6, t + an + halt + ab);
      bg0.gain.setValueAtTime(0, t); bg0.gain.linearRampToValueAtTime(laut, t + an);
      bg0.gain.setValueAtTime(laut * zufall(.6, 1), t + an + halt); bg0.gain.linearRampToValueAtTime(0, t + an + halt + ab);
      if (bp0.pan) { bp0.pan.setValueAtTime(zufall(-.8, .8), t); bp0.pan.linearRampToValueAtTime(zufall(-.8, .8), t + an + halt + ab); }
      // nächste Böe: manchmal gleich hinterher, meist lange Ruhe
      setTimeout(boe, (an + halt + ab) * 1000 + (Math.random() < .2 ? zufall(500, 2500) : zufall(9000, 32000)));
    };
    setTimeout(boe, zufall(4000, 15000));
    // ferner Bach / feuchte Luft
    const b = rauschQuelle(), bf = filter('bandpass', 1800, .8), bg = ctx.createGain(); bg.gain.value = .05;
    b.connect(bf); bf.connect(bg); bg.connect(amb); b.start();
    // Zikaden / Grillen: hoher Ton, schnell pulsierend, an- und abschwellend
    for (const [f, puls, x] of [[4700, 38, -.6], [5600, 52, .7]]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const bp = filter('bandpass', f, 6), am = ctx.createGain(); am.gain.value = 0;
      const huelle = ctx.createGain(); huelle.gain.value = 0;
      o.connect(bp); bp.connect(am); am.connect(huelle); huelle.connect(pan(x)).connect(amb);
      lfo(puls, 1, am.gain); o.start();
      const schwellen = () => {
        const t = ctx.currentTime, h = zufall(.012, .03);
        huelle.gain.cancelScheduledValues(t); huelle.gain.setValueAtTime(huelle.gain.value, t);
        huelle.gain.linearRampToValueAtTime(h, t + zufall(1.5, 3)); huelle.gain.linearRampToValueAtTime(h * .8, t + 6);
        huelle.gain.linearRampToValueAtTime(0, t + zufall(8, 11));
        setTimeout(schwellen, zufall(10000, 18000));
      };
      setTimeout(schwellen, zufall(500, 6000));
    }
    vogelSchleife();
  }

  // ---------- Vögel ----------
  function ton(t, { f0, f1, dauer, art = 'sine', laut = .05, x = 0, zuHall = true, ziel = amb, vibrato = 0, vibratoF = 0 }) {
    const o = ctx.createOscillator(); o.type = art;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dauer);
    if (vibrato) { const v = ctx.createOscillator(); v.frequency.value = vibratoF; const vg = ctx.createGain(); vg.gain.value = vibrato; v.connect(vg); vg.connect(o.frequency); v.start(t); v.stop(t + dauer + .05); }
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(laut, t + Math.min(.02, dauer / 4)); g.gain.exponentialRampToValueAtTime(.0001, t + dauer);
    const p = pan(x); o.connect(g); g.connect(p); p.connect(ziel); if (zuHall) p.connect(hall);
    o.start(t); o.stop(t + dauer + .05);
  }
  const vogelArten = [
    (t, x) => { const n = 2 + Math.floor(zufall(0, 3)), f = zufall(1700, 2300); for (let i = 0; i < n; i++) ton(t + i * .2, { f0: f, f1: f * 1.7, dauer: .14, laut: .035, x }); },
    (t, x) => ton(t, { f0: zufall(3200, 3800), f1: zufall(3000, 3400), dauer: zufall(.5, .9), laut: .022, x, vibrato: 260, vibratoF: 24 }),
    (t, x) => { const f = zufall(520, 680); ton(t, { f0: f, f1: f * 1.45, dauer: .22, art: 'triangle', laut: .05, x }); ton(t + .22, { f0: f * 1.45, f1: f * .8, dauer: .35, art: 'triangle', laut: .04, x }); },
    (t, x) => [2500, 3000, 2200].forEach((f, i) => ton(t + i * .16, { f0: f, f1: f * .92, dauer: .12, laut: .03, x })),
    (t, x) => { for (let i = 0; i < 6; i++) ton(t + i * .07, { f0: 4200 - i * 180, f1: 3600 - i * 180, dauer: .06, laut: .018, x }); },
  ];
  function vogelSchleife() {
    if (!ctx) return;
    wahl(vogelArten)(ctx.currentTime + .05, zufall(-.85, .85));
    setTimeout(vogelSchleife, puffer.voegel ? zufall(5000, 14000) : zufall(1400, 4800));
  }
  const wahl = a => a[Math.floor(Math.random() * a.length)];

  // ---------- Effekte ----------
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
  function glocke(f, t = ctx.currentTime, laut = .07, dauer = 1.4) {
    ton(t, { f0: f, f1: f * .998, dauer, laut, ziel: effekt });
    ton(t, { f0: f * 2.01, f1: f * 2, dauer: dauer * .5, laut: laut * .25, ziel: effekt });
  }
  const fx = {
    klick() { const t = ctx.currentTime; ton(t, { f0: 950, f1: 520, dauer: .08, art: 'triangle', laut: .09, ziel: effekt, zuHall: false }); ton(t, { f0: 2400, f1: 1800, dauer: .03, laut: .02, ziel: effekt, zuHall: false }); },
    plopp() { const t = ctx.currentTime; ton(t, { f0: 340, f1: 90, dauer: .22, laut: .2, ziel: effekt, zuHall: false }); },
    lernen() { const t = ctx.currentTime; glocke(PENTA[4], t, .05); glocke(PENTA[6], t + .12, .05); },
    wachsen(stufe = 1) { const t = ctx.currentTime; [0, 2, 4].forEach((n, i) => glocke(PENTA[Math.min(7, n + stufe - 1)] / 2, t + i * .11, .05, 1.8)); },
    // Regenbogen: sieben Farben, sieben steigende Glöckchen, oben ein heller Schimmer
    regenbogen() { const t = ctx.currentTime; [0, 1, 2, 3, 4, 5, 6].forEach((n, i) => glocke(PENTA[n], t + i * .11, .045, 1.4));
      glocke(PENTA[7], t + .85, .03, 2.2); glocke(PENTA[4] * 2, t + .9, .018, 2.4); },
    sammeln() { const t = ctx.currentTime; [2, 4, 7].forEach((n, i) => glocke(PENTA[n], t + i * .08, .05, .9)); },
    // Ablegen unter dem Baum: jedes Ding einen Ton höher (n = 0, 1, 2)
    ablegen(n = 0) { const t = ctx.currentTime, ton1 = [2, 4, 6][n % 3]; glocke(PENTA[ton1], t, .07, 1.2); glocke(PENTA[ton1] * 2, t + .06, .025, .8); },
    // „Freigeschaltet“: schnell aufsteigende Glöckchen und ein heller, schimmernder Schluss
    freigeschaltet() { const t = ctx.currentTime;
      [0, 2, 4, 5, 7].forEach((n, i) => glocke(PENTA[n] * (i < 3 ? 1 : 2), t + i * .07, .055, 1));
      [7, 6, 7].forEach((n, i) => glocke(PENTA[n] * 2, t + .45 + i * .05, .03, 1.8)); },
    richtig() { const t = ctx.currentTime; [0, 2, 4, 7].forEach((n, i) => glocke(PENTA[n], t + i * .12, .06, 1.6)); },
    sanft() { const t = ctx.currentTime; glocke(PENTA[3] / 2, t, .05); glocke(PENTA[1] / 2, t + .18, .05); },
    tropfen() { const t = ctx.currentTime; ton(t, { f0: 1500, f1: 520, dauer: .09, laut: .06, ziel: effekt }); },
    schluss() { const t = ctx.currentTime; [0, 2, 4, 5, 7].forEach((n, i) => glocke(PENTA[n] / (i < 3 ? 2 : 1), t + i * .2, .05, 2.2)); },
    // ---- Entdecken: Tiere und Dinge im Wald ----
    frosch() { if (puffer.frosch) { const p = pan(zufall(-.3, .3)); p.connect(tiere); return einmal(puffer.frosch, p, .5, ctx.currentTime); }
      const t = ctx.currentTime, f = zufall(3000, 3600); for (let i = 0; i < 14; i++) ton(t + i * .034, { f0: f, f1: f * .96, dauer: .02, laut: .045, ziel: tiere }); },
    // Tukan (wie Riesentukan): Reihe tiefer, knarrender Rufe „rrrak – rrrak“ – schnell pulsierend, durch zwei Klangräume
    tukan() { if (puffer.tukan) { const p = pan(zufall(-.3, .3)); p.connect(tiere); p.connect(hall); return einmal(puffer.tukan, p, .55, ctx.currentTime); }
      const t = ctx.currentTime, n = 4 + Math.floor(zufall(0, 3)), x = zufall(-.4, .4);
      for (let i = 0; i < n; i++) {
        const tt = t + i * zufall(.3, .4), d = zufall(.16, .22), f = zufall(170, 210);
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.15, tt); o.frequency.exponentialRampToValueAtTime(f * .85, tt + d);
        const puls = ctx.createGain(); puls.gain.value = .5;                       // Knarren: Lautstärke pulsiert ~38-mal pro Sekunde
        const lfoO = ctx.createOscillator(); lfoO.type = 'square'; lfoO.frequency.value = zufall(34, 42);
        const lfoG = ctx.createGain(); lfoG.gain.value = .5; lfoO.connect(lfoG); lfoG.connect(puls.gain);
        const f1 = filter('bandpass', 850, 1.6), f2 = filter('bandpass', 1700, 2.2), mix = ctx.createGain();
        const env = ctx.createGain(); env.gain.setValueAtTime(.0001, tt); env.gain.linearRampToValueAtTime(.55, tt + .025); env.gain.setValueAtTime(.5, tt + d * .6); env.gain.exponentialRampToValueAtTime(.0001, tt + d);
        o.connect(puls); puls.connect(f1); puls.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(env);
        const r = rauschQuelle(), rb = filter('bandpass', 1200, 1), rg = ctx.createGain(); rg.gain.value = .25; r.connect(rb); rb.connect(rg); rg.connect(puls);
        const p = pan(x); env.connect(p); p.connect(tiere); p.connect(hall);
        o.start(tt); lfoO.start(tt); r.start(tt); o.stop(tt + d + .05); lfoO.stop(tt + d + .05); r.stop(tt + d + .05);
      } },
    faultier() { const t = ctx.currentTime; ton(t + .4, { f0: 2500, f1: 2150, dauer: .9, laut: .03, ziel: tiere, vibrato: 18, vibratoF: 5 }); },
    ameisen() { const t = ctx.currentTime; for (let i = 0; i < 10; i++) { const s = rauschQuelle(), hp = filter('highpass', 5200), g = ctx.createGain(), tt = t + i * zufall(.05, .11);
      g.gain.setValueAtTime(.06, tt); g.gain.exponentialRampToValueAtTime(.0001, tt + .015); s.connect(hp); hp.connect(g); g.connect(tiere); s.start(tt); s.stop(tt + .03); } },
    // Steinchen fällt ins Wasser: tiefes Plumpsen mit kurzem Spritzen
    // Stein ins Wasser: jedes Mal eine der drei Aufnahmen von Yilmaz, sonst der nachgebaute Plumps
    // Vögel zum Segenslied: leises Papageien-Geschnatter – bewusst leise unter dem Gesang
    segenVoegel() { const t = ctx.currentTime;
      if (puffer.papageien) { const p = pan(-.35); p.connect(effekt); einmal(puffer.papageien, p, .32, t); }
      if (!puffer.papageien) fx.tukan(); },
    steinWasser() { const da = ['stein1', 'stein2', 'stein3'].filter(n => puffer[n]); if (!da.length) return fx.plumps();
      const p = pan(zufall(-.3, .3)); p.connect(tiere); einmal(puffer[da[Math.floor(Math.random() * da.length)]], p, .3, ctx.currentTime); },
    plumps() { const t = ctx.currentTime; ton(t, { f0: 260, f1: 70, dauer: .2, laut: .32, ziel: tiere, zuHall: true });
      const s = rauschQuelle(), lp = filter('lowpass', 1400), g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.22, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + .3);
      s.connect(lp); lp.connect(g); g.connect(tiere); s.start(t); s.stop(t + .35); },
    // Froschkonzert: vier Frösche, jeder mit eigenem Ton (pentatonisch), kurz gequakt
    quaken(i = 0) {
      if (puffer.frosch) {   // die echte Froschaufnahme, viermal verschieden hoch (Wiedergabe schneller/langsamer)
        const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = puffer.frosch; s.playbackRate.value = [.75, .92, 1.12, 1.38][i % 4];
        g.gain.value = .45; s.connect(g); g.connect(tiere); s.start(); s.stop(ctx.currentTime + .7); return;
      }
      const t = ctx.currentTime, f = [262, 330, 392, 523][i % 4];
      for (let k = 0; k < 4; k++) ton(t + k * .045, { f0: f * 1.03, f1: f * .97, dauer: .035, art: 'square', laut: .035, ziel: tiere, zuHall: false });
      ton(t + .02, { f0: f, f1: f * .99, dauer: .32, art: 'triangle', laut: .09, ziel: tiere }); },
    // Segen beim Pflanzen: ein ruhiges Wiegenlied aus Glöckchen
    segen() { const t = ctx.currentTime; [4, 5, 4, 2, 0, 2, 4, 7].forEach((n, i) => glocke(PENTA[n], t + i * .6, .045, 2)); },
    // Glitzerklang: hohe Glöckchen, die nach oben perlen
    funkeln() { const t = ctx.currentTime; [4, 5, 6, 7, 6, 7].forEach((n, i) => glocke(PENTA[n] * 2, t + .2 + i * .07, .045, 1.4)); },
    falter() { const t = ctx.currentTime; [5, 6, 7, 6].forEach((n, i) => glocke(PENTA[n] * 2, t + i * .09, .07, .7)); },
    // Brüllaffe: tiefes, kehliges Brüllen in mehreren Atemzügen; ein zweiter Affe antwortet etwas höher
    affe() { if (puffer.affe) { const p = pan(-.2); p.connect(tiere); p.connect(hall); return einmal(puffer.affe, p, .6, ctx.currentTime); }
      const t = ctx.currentTime;
      const verzerr = ctx.createWaveShaper(), kurve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = i / 128 - 1; kurve[i] = Math.tanh(x * 3.2); } verzerr.curve = kurve;
      const brull = (start, grund, x, laut) => {
        for (let k = 0; k < 3; k++) {
          const tt = start + k * 1.05, d = zufall(.8, .95);
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(grund * .8, tt); o.frequency.linearRampToValueAtTime(grund * 1.12, tt + .25); o.frequency.linearRampToValueAtTime(grund * .9, tt + d);
          const jit = ctx.createOscillator(), jg = ctx.createGain(); jit.frequency.value = zufall(9, 13); jg.gain.value = grund * .06; jit.connect(jg); jg.connect(o.frequency);
          const r = rauschQuelle(), rg = ctx.createGain(); rg.gain.value = .35;
          const vor = ctx.createGain(); vor.gain.value = .9; o.connect(vor); r.connect(rg); rg.connect(vor);
          const ws = ctx.createWaveShaper(); ws.curve = kurve; vor.connect(ws);
          const tremolo = ctx.createGain(); tremolo.gain.value = .65;               // kehliges Pulsieren
          const tl = ctx.createOscillator(), tg = ctx.createGain(); tl.frequency.value = zufall(6, 8.5); tg.gain.value = .35; tl.connect(tg); tg.connect(tremolo.gain);
          ws.connect(tremolo);
          const f1 = filter('bandpass', 420, 3), f2 = filter('bandpass', 760, 3), f3 = filter('bandpass', 1250, 4), lp = filter('lowpass', 1800);
          const env = ctx.createGain(); env.gain.setValueAtTime(.0001, tt); env.gain.linearRampToValueAtTime(laut, tt + .3); env.gain.setValueAtTime(laut * .9, tt + d * .7); env.gain.exponentialRampToValueAtTime(.0001, tt + d);
          [f1, f2, f3].forEach(f => { tremolo.connect(f); f.connect(lp); }); lp.connect(env);
          const p = pan(x); env.connect(p); p.connect(tiere); p.connect(hall);
          [o, jit, r, tl].forEach(n => { n.start(tt); n.stop(tt + d + .05); });
        }
      };
      brull(t, zufall(88, 100), -.25, .55);
      brull(t + 1.6, zufall(105, 118), .45, .35);   // Antwort aus der Ferne
    },
    rascheln() { const t = ctx.currentTime; for (let i = 0; i < 3; i++) { const s = rauschQuelle(), bp = filter('bandpass', zufall(2500, 4200), 1.2), g = ctx.createGain(), tt = t + i * zufall(.06, .12);
      g.gain.setValueAtTime(.0001, tt); g.gain.linearRampToValueAtTime(.22, tt + .02); g.gain.exponentialRampToValueAtTime(.0001, tt + .18); s.connect(bp); bp.connect(g); g.connect(tiere); s.start(tt); s.stop(tt + .2); } },
    banane() { const t = ctx.currentTime, s = rauschQuelle(), bp = filter('bandpass', 900, .8), g = ctx.createGain();
      bp.frequency.setValueAtTime(600, t); bp.frequency.linearRampToValueAtTime(1600, t + .5); bp.frequency.linearRampToValueAtTime(700, t + 1.3);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.055, t + .4); g.gain.linearRampToValueAtTime(.0001, t + 1.4);   // leiser (Wunsch Yilmaz)
      s.connect(bp); bp.connect(g); g.connect(tiere); s.start(t); s.stop(t + 1.5); },
    stein() { const t = ctx.currentTime; [0, .22, .38].forEach((d, i) => ton(t + d, { f0: 210 - i * 20, f1: 120, dauer: .09, art: 'triangle', laut: .16 - i * .04, ziel: tiere, zuHall: false })); },
    platsch() { const t = ctx.currentTime; fx.rascheln(); ton(t + .02, { f0: 900, f1: 300, dauer: .12, laut: .07, ziel: tiere });
      setTimeout(() => { if (ctx) { const u = ctx.currentTime; fx.rascheln(); ton(u, { f0: 1300, f1: 500, dauer: .09, laut: .06, ziel: tiere }); } }, 900); },
    // Donner: kurzer Knall, dann langes, unregelmäßiges Grollen (tiefes Rauschen)
    donner() {
      const t = ctx.currentTime;
      const knall = rauschQuelle(), kbp = filter('bandpass', 1400, .8), kg = ctx.createGain();
      kg.gain.setValueAtTime(.0001, t); kg.gain.linearRampToValueAtTime(.35, t + .02); kg.gain.exponentialRampToValueAtTime(.0001, t + .5);
      knall.connect(kbp); kbp.connect(kg); kg.connect(effekt); knall.start(t); knall.stop(t + .6);
      for (let i = 0; i < 4; i++) {
        const r = rauschQuelle(), lp = filter('lowpass', zufall(90, 220), 1.2), g = ctx.createGain(), tt = t + .08 + i * zufall(.25, .6), d = zufall(1.6, 3.4);
        g.gain.setValueAtTime(.0001, tt); g.gain.linearRampToValueAtTime(zufall(.5, .9), tt + zufall(.08, .25)); g.gain.exponentialRampToValueAtTime(.0001, tt + d);
        r.connect(lp); lp.connect(g); g.connect(effekt); r.start(tt); r.stop(tt + d + .1);
      }
    },
    puff() { const t = ctx.currentTime, s = rauschQuelle(), lp = filter('lowpass', 900), g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.3, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
      s.connect(lp); lp.connect(g); g.connect(tiere); s.start(t); s.stop(t + .4); ton(t, { f0: 260, f1: 140, dauer: .12, laut: .06, ziel: tiere, zuHall: false }); },
  };

  // Dauerklänge: Feuer, Kolibri-Flügel, Gnitzen, Regen, Nacht
  const dauer = {
    // Tropenregen: dichtes Rauschen + tiefes Prasseln + einzelne Tropfen
    regen() {
      const t = ctx.currentTime, g = ctx.createGain(); g.gain.value = .0001; g.connect(effekt);
      const hoch = rauschQuelle(), hbp = filter('bandpass', 4200, .5); hoch.connect(hbp); hbp.connect(g); hoch.start();
      const tief = rauschQuelle(), tlp = filter('lowpass', 700), tg = ctx.createGain(); tg.gain.value = .6; tief.connect(tlp); tlp.connect(tg); tg.connect(g); tief.start();
      g.gain.exponentialRampToValueAtTime(.32, t + 1.4);
      let aktiv = true;
      const tropfen = () => { if (!aktiv) return; const tt = ctx.currentTime;
        for (let i = 0; i < 4; i++) { const s = rauschQuelle(), bp = filter('bandpass', zufall(2500, 6000), 6), dg = ctx.createGain(), u = tt + zufall(0, .2);
          dg.gain.setValueAtTime(zufall(.04, .1), u); dg.gain.exponentialRampToValueAtTime(.0001, u + .03);
          s.connect(bp); bp.connect(dg); dg.connect(pan(zufall(-.8, .8))).connect(effekt); s.start(u); s.stop(u + .05); }
        setTimeout(tropfen, zufall(40, 160)); };
      tropfen();
      return () => { aktiv = false; g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setTargetAtTime(.0001, ctx.currentTime, .7); setTimeout(() => { hoch.stop(); tief.stop(); }, 4000); };
    },
    // Tropennacht: Grillen zirpen
    nacht() {
      const g = ctx.createGain(); g.gain.value = .0001; g.connect(amb); g.gain.exponentialRampToValueAtTime(.05, ctx.currentTime + 1.2);
      let aktiv = true;
      const zirpen = () => { if (!aktiv) return; const t = ctx.currentTime, f = zufall(4200, 5200), x = zufall(-.7, .7);
        for (let i = 0; i < 3; i++) ton(t + i * .055, { f0: f, f1: f, dauer: .035, laut: .5, x, ziel: g, zuHall: true });
        setTimeout(zirpen, zufall(180, 520)); };
      zirpen();
      return () => { aktiv = false; g.gain.setTargetAtTime(.0001, ctx.currentTime, .6); };
    },
    feuer() {
      const r = rauschQuelle(), lp = filter('lowpass', 260), g = ctx.createGain(); g.gain.value = .0001;
      r.connect(lp); lp.connect(g); g.connect(effekt); r.start();
      g.gain.exponentialRampToValueAtTime(.35, ctx.currentTime + 1.5);
      let aktiv = true;
      const knistern = () => { if (!aktiv) return; const t = ctx.currentTime;
        for (let i = 0; i < 3; i++) { const s = rauschQuelle(), hp = filter('highpass', zufall(1800, 4000)), kg = ctx.createGain(), tt = t + zufall(0, .15);
          kg.gain.setValueAtTime(zufall(.05, .14), tt); kg.gain.exponentialRampToValueAtTime(.0001, tt + zufall(.01, .04));
          s.connect(hp); hp.connect(kg); kg.connect(effekt); s.start(tt); s.stop(tt + .06); }
        setTimeout(knistern, zufall(60, 260)); };
      knistern();
      return () => { aktiv = false; g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setTargetAtTime(.0001, ctx.currentTime, .6); setTimeout(() => r.stop(), 3000); };
    },
    // art: 'an' = fliegt in die Szene, 'ab' = fliegt davon, sonst innerhalb der Szene
    fluegel(ms = 2000, art = 'mitte') {
      if (puffer.fliegen) {   // echte Kolibri-Aufnahmen, wandern mit dem Kolibri von links nach rechts
        const t = ctx.currentTime, sek = ms / 1000;
        schweben(false);
        kolPan = pan(0); kolPan.connect(effekt);
        const { s, g } = schleife(puffer.fliegen, kolPan, .0001);
        g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(.0001, t);
        if (art === 'an') {          // kommt näher: Fliegen schwillt an, Anflug endet genau bei der Ankunft
          g.gain.linearRampToValueAtTime(.45, t + sek);
          if (puffer.anflug) einmal(puffer.anflug, kolPan, .9, t + Math.max(0, sek - puffer.anflug.duration));
        } else if (art === 'ab') {   // fliegt davon: Abflug sofort, Fliegen klingt aus
          g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.01, t + sek);
          if (puffer.abflug) einmal(puffer.abflug, kolPan, .9, t);
        } else {
          g.gain.exponentialRampToValueAtTime(.55, t + .3);
        }
        return () => {
          const n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(.0001, n, .25); setTimeout(() => s.stop(), 2000);
          if (art !== 'ab') schweben(true);
        };
      }
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 150;
      const lp = filter('lowpass', 480, 2), g = ctx.createGain(); g.gain.value = .0001;
      o.connect(lp); lp.connect(g); g.connect(effekt); lfo(48, 60, lp.frequency); o.start();
      g.gain.exponentialRampToValueAtTime(.06, ctx.currentTime + .3);
      return () => { g.gain.setTargetAtTime(.0001, ctx.currentTime, .15); setTimeout(() => o.stop(), 1200); };
    },
    gnitzen() {
      const g = ctx.createGain(); g.gain.value = .0001; g.connect(effekt);
      const os = [612, 655, 701].map((f, i) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
        const bp = filter('bandpass', f * 2, 4), p = pan([-.4, .1, .5][i]); o.connect(bp); bp.connect(p); p.connect(g); lfo(zufall(4, 7), zufall(15, 30), o.frequency); o.start(); return o; });
      g.gain.exponentialRampToValueAtTime(.022, ctx.currentTime + 1.5);
      lfo(.4, .01, g.gain);
      return () => { g.gain.setTargetAtTime(.0001, ctx.currentTime, .8); setTimeout(() => os.forEach(o => o.stop()), 4000); };
    },
  };

  // ---------- Stimme ----------
  // Stimmen werden als Ton-Puffer im selben Web-Audio-System abgespielt. Früher lief jede Stimme über ein eigenes
  // Audio-Element – auf Handys (vor allem iPhone) hielt das danach die Waldgeräusche an.
  const stimmPuffer = new Map();
  function stimmeLaden(src) {
    if (!stimmPuffer.has(src)) {
      const p = fetch(src).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(b => new Promise((ok, nein) => ctx.decodeAudioData(b, ok, nein)));
      p.catch(() => stimmPuffer.delete(src));
      stimmPuffer.set(src, p);
      while (stimmPuffer.size > 6) stimmPuffer.delete(stimmPuffer.keys().next().value);   // Speicher schonen (Handys)
    }
    return stimmPuffer.get(src);
  }
  function sprich(src, beiDauer) {
    hoerAuf();
    if (!src) return Promise.resolve();
    if (ctx && location.protocol !== 'file:') {
      const marke = { muted: stumm, quelle: null, stopp() { try { this.quelle && this.quelle.stop(); } catch (e) {} } };
      stimme = marke;
      amb.gain.setTargetAtTime(.45, ctx.currentTime, .3);
      return new Promise(res => {
        let sicher = null;
        const fertig = () => { clearTimeout(sicher); if (stimme === marke) { stimme = null; amb.gain.setTargetAtTime(.9, ctx.currentTime, .8); } res(); };
        stimmeLaden(src).then(buf => {
          if (stimme !== marke) return res();
          if (ctx.state !== 'running') ctx.resume().catch(() => {});
          if (beiDauer) beiDauer(buf.duration);
          const q = ctx.createBufferSource(); q.buffer = buf; q.connect(stimmBus); q.onended = fertig; marke.quelle = q; q.start();
          sicher = setTimeout(fertig, (buf.duration + 1.2) * 1000);   // falls der Ton angehalten ist: das Spiel läuft trotzdem weiter
        }).catch(() => { if (stimme === marke) { stimme = null; sprichElement(src, beiDauer).then(res); } else res(); });
      });
    }
    return sprichElement(src, beiDauer);
  }
  // Rückfall (z. B. Spiel als Datei geöffnet): Audio-Element wie bisher
  function sprichElement(src, beiDauer) {
    const a = new Audio(src); a.muted = stumm; stimme = a;
    if (beiDauer) a.addEventListener('loadedmetadata', () => beiDauer(a.duration), { once: true });   // damit der Text im Sprechtempo erscheint
    if (ctx) amb.gain.setTargetAtTime(.45, ctx.currentTime, .3); // Dschungel leiser, solange der Kolibri spricht
    return new Promise(res => {
      const fertig = () => { if (stimme === a) { stimme = null; if (ctx) amb.gain.setTargetAtTime(.9, ctx.currentTime, .8); } res(); };
      a.onended = fertig; a.onerror = fertig; a.onpause = fertig;
      a.play().catch(fertig);
    });
  }
  function hoerAuf() { if (stimme) { const a = stimme; stimme = null; if (a.pause) a.pause(); else a.stopp(); } if (ctx) amb.gain.setTargetAtTime(.9, ctx.currentTime, .8); }

  window.KLANG = {
    an,
    get stumm() { return stumm; },
    setStumm(w) {
      stumm = w; try { localStorage.setItem('kakao-stumm', w ? '1' : '0'); } catch (e) {}
      if (ctx) master.gain.setTargetAtTime(w ? 0 : 1, ctx.currentTime, .1);
      if (stimme) stimme.muted = w;
    },
    spiel(name, ...args) { if (ctx && fx[name]) fx[name](...args); },
    start(name, ...args) { if (!ctx || laufend[name]) return; laufend[name] = dauer[name](...args); },
    // Kolibri-Position (Bühne 0–1600 px) -> links/rechts im Ton
    kolibriOrt(x) { if (ctx && kolPan && kolPan.pan) kolPan.pan.setTargetAtTime(Math.max(-.9, Math.min(.9, x / 800 - 1)), ctx.currentTime, .05); },
    stopp(name) { if (laufend[name]) { laufend[name](); delete laufend[name]; } },
    sprich, hoerAuf,
    vorladen(src) { if (ctx && src && location.protocol !== 'file:') stimmeLaden(src).catch(() => {}); },
    get geladen() { return Object.keys(puffer); },   // zum Prüfen: welche Aufnahmen bereit sind
  };
})();
