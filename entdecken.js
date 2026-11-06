// Kakao-Reise · Entdecken
// 1) Klick-Überraschungen: Tiere und Pflanzen im Wald reagieren auf Klicks (Animation + Ton).
//    Beim ersten Klick erzählt der Wald das Wissen dazu (Texte in inhalt.js → wissen/entdecken).
// 2) Verstecke: Laub, Gras, Wurzeln und Farne, unter denen die Quest-Dinge liegen – bei jedem Spiel woanders.
// Koordinaten = Bühnen-Pixel (1600 × 900), gleich wie in index.html.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, el = document) => el.querySelector(s);

  // ---------- Zeichnungen der Tiere (einfach gehalten, im Aquarell-Ton) ----------
  const BILD = {
    frosch: `<svg viewBox="0 0 70 50"><g class="koerper" filter="url(#weich)">
      <ellipse cx="14" cy="40" rx="10" ry="5" fill="#E2B93B"/><ellipse cx="56" cy="40" rx="10" ry="5" fill="#E2B93B"/>
      <ellipse cx="35" cy="30" rx="22" ry="15" fill="#EBC844"/>
      <path d="M16 26 C26 32 44 32 54 26 M18 37 C28 41 42 41 52 37" stroke="#2A2420" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="24" cy="17" r="6" fill="#2A2420"/><circle cx="46" cy="17" r="6" fill="#2A2420"/>
      <circle cx="25.5" cy="15.5" r="1.6" fill="#fff"/><circle cx="47.5" cy="15.5" r="1.6" fill="#fff"/>
      <ellipse cx="22" cy="45" rx="6" ry="3" fill="#E2B93B"/><ellipse cx="48" cy="45" rx="6" ry="3" fill="#E2B93B"/></g></svg>`,
    tukan: `<svg viewBox="0 0 110 100"><g class="tukan" filter="url(#weich)">
      <path d="M30 72 L22 98 L36 96 Z" fill="#1F1B18"/>
      <ellipse cx="38" cy="58" rx="16" ry="24" fill="#1F1B18"/>
      <ellipse cx="36" cy="80" rx="7" ry="4" fill="#C2413A"/>
      <ellipse cx="47" cy="43" rx="10" ry="11" fill="#F4E3A1"/>
      <circle cx="44" cy="32" r="12" fill="#1F1B18"/>
      <g class="schnabel-unten"><path d="M54 38 C70 37 86 36 98 35 C86 42 68 45 54 42 Z" fill="#D9762A"/></g>
      <path d="M52 26 C70 19 90 23 100 34 C88 34 70 36 54 38 Z" fill="#E8892E"/>
      <path d="M55 26 C70 21 88 24 97 31" stroke="#F2C14E" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M93 30 L100 34 L92 35 Z" fill="#2A2420"/>
      <circle cx="47" cy="29" r="4" fill="#7FB3C9"/><circle cx="47.5" cy="29" r="1.8" fill="#1F1B18"/>
      <path d="M34 80 L33 87 M42 80 L42 87" stroke="#6A7A8A" stroke-width="3" stroke-linecap="round"/></g></svg>`,
    faultier: `<svg viewBox="0 0 110 132"><g filter="url(#weich)">
      <path d="M38 52 C34 30 34 12 40 3 M72 52 C76 30 76 12 70 3" stroke="#8A7752" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M35 3 l-4 -3 M40 3 l0 -5 M45 3 l4 -3 M65 3 l-4 -3 M70 3 l0 -5 M75 3 l4 -3" stroke="#3B2A1E" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="55" cy="80" rx="30" ry="36" fill="#8C7B55"/>
      <ellipse cx="48" cy="88" rx="20" ry="22" fill="#7E8C58" opacity=".45"/>
      <path d="M36 106 C30 118 34 126 40 128 M74 106 C80 118 76 126 70 128" stroke="#8A7752" stroke-width="11" stroke-linecap="round" fill="none"/>
      <g class="faultier-kopf">
        <circle cx="55" cy="54" r="20" fill="#A8946A"/>
        <ellipse cx="55" cy="57" rx="14" ry="11" fill="#E9DCC0"/>
        <path d="M41 54 C45 50 50 52 51 56 C48 58 44 58 41 54Z M69 54 C65 50 60 52 59 56 C62 58 66 58 69 54Z" fill="#4A3826"/>
        <g class="augen"><circle cx="47" cy="55" r="2" fill="#1F1B18"/><circle cx="63" cy="55" r="2" fill="#1F1B18"/></g>
        <ellipse cx="55" cy="61" rx="3.5" ry="2.5" fill="#3B2A1E"/>
        <path d="M50 65 Q55 68 60 65" stroke="#3B2A1E" stroke-width="1.5" fill="none"/>
      </g></g></svg>`,
    morpho: `<svg viewBox="0 0 80 62"><g class="falter">
      <g class="flug-l"><path d="M40 30 C26 4 2 4 3 22 C4 35 22 38 40 32Z" fill="#3D7FD6" stroke="#1C2E4A" stroke-width="2.5"/>
        <path d="M40 33 C24 37 11 47 18 56 C26 62 37 49 40 35Z" fill="#2F66B8" stroke="#1C2E4A" stroke-width="2.5"/>
        <path d="M14 16 C20 12 28 16 34 26" stroke="#9CC6F2" stroke-width="3" fill="none" opacity=".7"/></g>
      <g class="flug-r"><path d="M40 30 C54 4 78 4 77 22 C76 35 58 38 40 32Z" fill="#3D7FD6" stroke="#1C2E4A" stroke-width="2.5"/>
        <path d="M40 33 C56 37 69 47 62 56 C54 62 43 49 40 35Z" fill="#2F66B8" stroke="#1C2E4A" stroke-width="2.5"/>
        <path d="M66 16 C60 12 52 16 46 26" stroke="#9CC6F2" stroke-width="3" fill="none" opacity=".7"/></g>
      <ellipse cx="40" cy="34" rx="2.6" ry="12" fill="#2A2420"/>
      <path d="M39 23 C36 14 33 10 30 8 M41 23 C44 14 47 10 50 8" stroke="#2A2420" stroke-width="1.3" fill="none"/></g></svg>`,
    bruellaffe: `<svg viewBox="0 0 120 96"><g class="affe" filter="url(#weich)">
      <ellipse cx="60" cy="66" rx="32" ry="26" fill="#8E4B2C"/>
      <circle cx="60" cy="40" r="23" fill="#9A5534"/>
      <ellipse cx="60" cy="47" rx="14" ry="15" fill="#3B2A1E"/>
      <circle cx="54" cy="41" r="3" fill="#F4E3A1"/><circle cx="66" cy="41" r="3" fill="#F4E3A1"/>
      <circle cx="54" cy="41.5" r="1.5" fill="#1A1210"/><circle cx="66" cy="41.5" r="1.5" fill="#1A1210"/>
      <ellipse class="maul" cx="60" cy="55" rx="5" ry="2" fill="#1A1210"/>
      <ellipse cx="60" cy="64" rx="12" ry="7" fill="#8E4B2C"/></g>
      <g filter="url(#aquarell)">
      <circle cx="18" cy="80" r="22" fill="#55663F"/><circle cx="46" cy="90" r="20" fill="#62744A"/><circle cx="78" cy="88" r="22" fill="#4A5A36"/>
      <circle cx="104" cy="78" r="20" fill="#55663F"/><circle cx="60" cy="98" r="18" fill="#6F7F52"/></g></svg>`,
    fisch: `<svg viewBox="0 0 80 50"><g class="fisch" filter="url(#weich)">
      <path d="M14 25 C24 10 50 10 62 25 C50 40 24 40 14 25Z" fill="#E8892E"/><path d="M14 25 L2 14 L4 25 L2 36Z" fill="#D9762A"/>
      <path d="M30 16 C36 12 44 12 48 16" stroke="#F2C14E" stroke-width="3" fill="none"/><circle cx="54" cy="22" r="2.6" fill="#2A2420"/></g>
      <g class="spritzer" fill="#E6F6FF"><circle cx="30" cy="46" r="3"/><circle cx="44" cy="44" r="2.4"/><circle cx="20" cy="44" r="2"/></g></svg>`,
    pilz: `<svg viewBox="0 0 60 56"><g class="pilz" filter="url(#weich)">
      <path d="M24 30 C24 40 22 50 20 54 L38 54 C36 50 34 40 34 30Z" fill="#EFE6D5"/>
      <path d="M4 32 C6 12 54 12 56 32 C44 36 16 36 4 32Z" fill="#C26547"/>
      <circle cx="20" cy="24" r="3" fill="#F7F2EA"/><circle cx="34" cy="20" r="2.5" fill="#F7F2EA"/><circle cx="44" cy="27" r="2.2" fill="#F7F2EA"/></g>
      <g class="sporen"><circle cx="22" cy="14" r="2"/><circle cx="32" cy="8" r="1.6"/><circle cx="40" cy="14" r="1.8"/><circle cx="28" cy="4" r="1.4"/></g></svg>`,
  };
  function ameisenBild() {
    let s = '<svg viewBox="0 0 280 40"><g transform="translate(0 30)">';
    for (let i = 0; i < 7; i++) {
      s += `<g class="ameise" style="animation-delay:${(-i * 2.1).toFixed(1)}s"><g class="blattstueck"><path d="M-7 -19 L8 -24 L11 -9 L-4 -11Z" fill="${i % 2 ? '#9DB061' : '#7E8C58'}"/></g>
        <path d="M2 -11 L1 -2" stroke="#3B2418" stroke-width="1.2"/>
        <path d="M-5 1 l-4 4 M-1 1 l0 5 M3 1 l4 4 M-5 -1 l-4 -3 M3 -1 l4 -3" stroke="#3B2418" stroke-width="1" fill="none"/>
        <ellipse cx="-6" cy="0" rx="4" ry="3" fill="#3B2418"/><ellipse cx="0" cy="0" rx="2.6" ry="2.2" fill="#3B2418"/><ellipse cx="5" cy="-1" rx="3" ry="2.6" fill="#3B2418"/></g>`;
    }
    return s + '</g></svg>';
  }

  // was, Position (links, oben, Breite, Höhe), Beschriftung für Vorlesehilfen
  const UEBERRASCHUNGEN = [
    { was: 'banane', box: [960, 400, 300, 300], name: 'Bananenstaude', bild: '' },
    // über die ganze Welt verteilt (Wunsch Yilmaz 05.11.): links im Urwaldbaum und am Fluss, rechts auf der Anhöhe
    { was: 'frosch', box: [1806, 382, 86, 66], name: 'Frosch auf dem Felsen' },
    { was: 'tukan', box: [-262, 96, 124, 112], name: 'Tukan im großen Baum' },
    { was: 'faultier', box: [-345, 215, 120, 154], name: 'Faultier am Stamm' },
    { was: 'ameisen', box: [1240, 784, 290, 50], name: 'Ameisenstraße', bild: ameisenBild() },
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

  // ---------- Decken für die Verstecke zeichnen ----------
  let saat = 11;
  const zz = () => { saat = (saat * 16807) % 2147483647; return (saat - 1) / 2147483646; };
  const zw = (a, b) => a + zz() * (b - a);
  const wahl = a => a[Math.floor(zz() * a.length)];
  function decke(art) {
    let s = '<svg viewBox="0 0 150 80"><g filter="url(#weich)">';
    if (art === 'laub') {
      for (let i = 0; i < 11; i++) s += `<ellipse cx="${zw(22, 128).toFixed(0)}" cy="${zw(48, 70).toFixed(0)}" rx="${zw(14, 22).toFixed(0)}" ry="${zw(5, 8).toFixed(0)}" transform="rotate(${zw(-30, 30).toFixed(0)} 75 60)" fill="${wahl(['#8E7A3E', '#A3884A', '#7E6A35', '#9A6B3E', '#6F7F52', '#B7894E'])}"/>`;
    } else if (art === 'gras') {
      for (let i = 0; i < 18; i++) { const x = zw(18, 132), h = zw(34, 62), b = zw(-16, 16); s += `<path d="M${x.toFixed(0)} 78 Q${(x + b / 2).toFixed(0)} ${(78 - h / 2).toFixed(0)} ${(x + b).toFixed(0)} ${(78 - h).toFixed(0)}" stroke="${wahl(['#7E8C58', '#6F7F52', '#93A06A', '#5F6E46'])}" stroke-width="5" fill="none" stroke-linecap="round"/>`; }
    } else if (art === 'wurzel') {
      s += '<path d="M2 78 C20 40 50 34 78 54 M70 78 C84 42 116 36 148 70 M40 78 C52 58 70 56 92 78" stroke="#6A5240" stroke-width="11" fill="none" stroke-linecap="round"/>';
      for (let i = 0; i < 6; i++) s += `<ellipse cx="${zw(20, 130).toFixed(0)}" cy="${zw(56, 74).toFixed(0)}" rx="${zw(8, 14).toFixed(0)}" ry="4" fill="${wahl(['#7E8C58', '#93A06A', '#A3884A'])}" transform="rotate(${zw(-25, 25).toFixed(0)} 75 64)"/>`;
    } else { // farn
      for (const [x, w] of [[50, -34], [75, -4], [100, 30]]) {
        s += `<g transform="translate(${x} 80) rotate(${w})"><path d="M0 0 Q8 -30 4 -64" stroke="#5F6E46" stroke-width="4" fill="none"/>`;
        for (let k = 1; k < 9; k++) { const y = -k * 7.5, l = 18 - k * 1.6; s += `<ellipse cx="${-l / 2}" cy="${y}" rx="${l / 2}" ry="3.6" fill="#6F7F52" transform="rotate(20 0 ${y})"/><ellipse cx="${l / 2}" cy="${y}" rx="${l / 2}" ry="3.6" fill="#7E8C58" transform="rotate(-20 0 ${y})"/>`; }
        s += '</g>';
      }
    }
    return s + '</g></svg>';
  }

  // ---------- Gemalte Figuren (Platzhalter von Muse) ----------
  // Muse malt auf Magenta, figuren/freistellen.py macht den Hintergrund durchsichtig. Fehlt ein Bild, bleibt die Zeichnung.
  const KLASSE = { tukan: 'tukan', bruellaffe: 'affe', pilz: 'pilz', fisch: 'fisch', morpho: 'falter' };
  const FIG = n => `bilder/platzhalter/figuren/${n}.webp`;
  // Bewegungsbilder (Bild für Bild wie im Trickfilm): Grundbild, ab und zu ein Ruhe-Bild (Blinzeln, Flügel), beim Antippen eine Folge
  const BEWEGUNG = {
    faultier: { ruhe: [['faultier-2', 220]], ruheAlle: 5200 },
    bruellaffe: { grund: 'bruellaffe-ruhe', aktiv: ['bruellaffe'], takt: 400 },
    tukan: { ruhe: [['tukan-2', 300]], ruheAlle: 9000, aktiv: ['tukan-2', 'tukan'], takt: 240 },
    frosch: { aktiv: ['frosch-sprung', 'frosch-sprung', 'frosch'], takt: 260 },
    fisch: { aktiv: ['fisch', 'fisch-2'], takt: 130 },
  };
  function gemalt(el, name, w, h, rueckfall = '', klasse = '') {
    el.innerHTML = rueckfall;
    if (/svg/.test(location.search)) return;
    const bw = BEWEGUNG[name], grund = bw?.grund || name, im = new Image();
    im.onload = () => {
      el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" overflow="visible"><image class="figur ${klasse}" href="${FIG(grund)}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet"/></svg>`;
      if (!bw) return;
      el.grund = grund; el.bild = el.querySelector('image');
      [...(bw.aktiv || []), ...(bw.ruhe || []).map(r => r[0])].forEach(n => { new Image().src = FIG(n); });   // vorladen
      if (bw.ruhe && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const einmal = () => {
          setTimeout(() => {
            if (!el.bewegt) { const [n, ms] = bw.ruhe[Math.floor(Math.random() * bw.ruhe.length)]; el.bild.setAttribute('href', FIG(n)); setTimeout(() => { if (!el.bewegt) el.bild.setAttribute('href', FIG(el.grund)); }, ms); }
            einmal();
          }, bw.ruheAlle * (.7 + Math.random() * .6));
        };
        einmal();
      }
    };
    im.src = FIG(grund);
  }
  function bewege(el, name, dauer) {   // Folge der Bewegungsbilder während der Antipp-Animation
    const bw = BEWEGUNG[name]; if (!bw?.aktiv || !el.bild) return;
    el.bewegt = true; let i = 0;
    const uhr = setInterval(() => { el.bild.setAttribute('href', FIG(bw.aktiv[i++ % bw.aktiv.length])); }, bw.takt);
    el.bild.setAttribute('href', FIG(bw.aktiv[i++]));
    setTimeout(() => { clearInterval(uhr); el.bild.setAttribute('href', FIG(el.grund)); el.bewegt = false; }, dauer);
  }

  // ---------- Kleine Überraschungen: Krabbeltiere, Wellen ----------
  const KRABBLER = ['kaefer', 'wurm', 'grille'];
  function krabbler(von, art = KRABBLER[Math.floor(Math.random() * KRABBLER.length)]) {
    const k = document.createElement('div'), links = Math.random() < .5;
    k.className = `krabbler ${art}${links ? ' links' : ''}`;
    k.style.left = (parseFloat(von.style.left) + von.offsetWidth / 2 - 27) + 'px';
    k.style.top = (parseFloat(von.style.top) + von.offsetHeight / 2 - 10) + 'px';
    k.style.setProperty('--weg', (links ? -1 : 1) * (130 + Math.random() * 80) + 'px');
    k.innerHTML = `<img src="bilder/platzhalter/figuren/krabbel-${art}.webp" alt="">`;
    $('#spielflaeche').append(k); setTimeout(() => k.remove(), 2300);
  }
  // Eine reife Kakaofrucht plumpst vom Baum und kullert ein Stück (nur wenn der Baum Früchte trägt)
  function frucht() {
    if (!document.getElementById('baum').classList.contains('stufe-5')) return;
    if (document.querySelectorAll('.plumps').length > 2) return;
    const f = document.createElement('div'); f.className = 'plumps';
    const x = 690 + Math.random() * 200, y = 420 + Math.random() * 90;
    f.style.left = x + 'px'; f.style.top = y + 'px';
    f.style.setProperty('--fall', (735 - y) + 'px'); f.style.setProperty('--roll', (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 50) + 'px');
    f.innerHTML = '<img src="bilder/platzhalter/figuren/frucht.webp" alt="">';
    $('#spielflaeche').append(f);
    setTimeout(() => KLANG.spiel('plopp'), 520);
    setTimeout(() => { f.classList.add('weg'); setTimeout(() => f.remove(), 900); }, 6000);
  }
  // Ein Steinchen fliegt in hohem Bogen ins Wasser und plumpst
  function steinWurf(el, e) {
    const r = el.getBoundingClientRect(), m = el.offsetWidth / r.width;
    const zx = parseFloat(el.style.left) + (e ? (e.clientX - r.left) * m : el.offsetWidth / 2);
    const zy = parseFloat(el.style.top) + (e ? (e.clientY - r.top) * m : el.offsetHeight / 2);
    const st = document.createElement('i'); st.className = 'wurfstein'; $('#spielflaeche').append(st);
    const x0 = zx + 170, y0 = 900, t0 = performance.now(), dauer = api.SCHNELL ? 60 : 620;
    const schritt = t => {
      const p = Math.min(1, (t - t0) / dauer), x = x0 + (zx - x0) * p, y = y0 + (zy - y0) * p - Math.sin(p * Math.PI) * 170;
      st.style.left = x + 'px'; st.style.top = y + 'px'; st.style.transform = `rotate(${p * 540}deg) scale(${1 - p * .35})`;
      if (p < 1) requestAnimationFrame(schritt);
      else {
        st.remove(); KLANG.spiel('steinWasser'); welle(el, e);   // eine von drei echten Aufnahmen
        for (let i = 0; i < 7; i++) { const t2 = document.createElement('i'); t2.className = 'spritzer-tropfen';
          t2.style.left = zx + 'px'; t2.style.top = zy + 'px'; t2.style.setProperty('--dx', (Math.random() * 60 - 30).toFixed(0) + 'px'); t2.style.setProperty('--dy', (-25 - Math.random() * 35).toFixed(0) + 'px');
          $('#spielflaeche').append(t2); setTimeout(() => t2.remove(), 800); }
      }
    };
    requestAnimationFrame(schritt);
  }
  // Eine Kokosnuss fällt von der Palme und kullert den Hang hinunter
  function kokosnuss() {
    if (document.querySelectorAll('.kokos').length > 2) return;
    const k = document.createElement('div'); k.className = 'kokos';
    const x = 1975 + Math.random() * 45; k.style.left = x + 'px'; k.style.top = '185px';   // unter den Kokosnüssen der gemalten Palme
    k.style.setProperty('--roll', (-60 - Math.random() * 80) + 'px');
    k.innerHTML = '<img src="bilder/platzhalter/figuren/kokosnuss.webp" alt="">';
    $('#spielflaeche').append(k);
    setTimeout(() => { KLANG.spiel('stein'); KLANG.spiel('plopp'); }, api.SCHNELL ? 30 : 560);
    setTimeout(() => { k.classList.add('weg'); setTimeout(() => k.remove(), 900); }, 7000);
  }
  function welle(el, e) {
    const r = el.getBoundingClientRect(), w = el.offsetWidth / r.width;
    for (let i = 0; i < 3; i++) {
      const k = document.createElement('i'); k.className = 'welle';
      k.style.left = (parseFloat(el.style.left) + (e ? (e.clientX - r.left) * w : el.offsetWidth / 2)) + 'px';
      k.style.top = (parseFloat(el.style.top) + (e ? (e.clientY - r.top) * w : el.offsetHeight / 2)) + 'px';
      k.style.animationDelay = (i * .22) + 's';
      $('#spielflaeche').append(k); setTimeout(() => k.remove(), 1800);
    }
  }
  function stoebern(b) {
    if (api.gezogen?.() || b.classList.contains('stoebert')) return;
    b.classList.add('stoebert'); KLANG.spiel('rascheln');
    setTimeout(() => b.classList.remove('stoebert'), 900);
    // Blätter bzw. Halme wirbeln heraus
    const FARBEN = { laub: ['#B5832E', '#D9A441', '#8E5F24', '#C9772F'], gras: ['#9DB548', '#C8C04E', '#7E9A3A'], wurzel: ['#7A5634', '#5E7A3A', '#9A7048'], farn: ['#5E9A44', '#79B24E', '#4E8A3C'] }[b.dataset.art] || ['#9DB548'];
    for (let i = 0; i < 7; i++) {
      const t = document.createElement('i'); t.className = 'wirbel';
      t.style.left = (parseFloat(b.style.left) + 40 + Math.random() * 70) + 'px'; t.style.top = (parseFloat(b.style.top) + 30) + 'px';
      t.style.background = FARBEN[i % FARBEN.length];
      t.style.setProperty('--dx', (Math.random() * 140 - 70).toFixed(0) + 'px'); t.style.setProperty('--dy', (-50 - Math.random() * 60).toFixed(0) + 'px');
      t.style.setProperty('--dreh', (Math.random() * 540 - 270).toFixed(0) + 'deg'); t.style.animationDelay = (Math.random() * .12).toFixed(2) + 's';
      $('#spielflaeche').append(t); setTimeout(() => t.remove(), 1500);
    }
    if (Math.random() < .85) setTimeout(() => krabbler(b), 300);
    api.kommentar?.(b.dataset.art, { x: parseFloat(b.style.left) + 75, y: parseFloat(b.style.top) + 40 });
  }

  // ---------- Start ----------
  let api = null;
  const entdeckt = new Set();

  function karte(was, box) {   // Wissenskarte neben dem Tier
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
    const K = window.KAMERA || { ziel: 0, o: 0, breite: 1600 }, kx = K.ziel - (K.o || 0), breite = K.breite || 1600, w0 = k.offsetWidth, h0 = k.offsetHeight;
    const mitteX = box[0] + box[2] / 2, mitteY = box[1] + box[3] / 2, rechts = mitteX - kx < breite / 2;
    let x = rechts ? box[0] + box[2] + 24 : box[0] - 24 - w0;
    x = Math.max(kx + 20, Math.min(kx + breite - 20 - w0, x));
    const y = Math.max(90, Math.min(860 - h0, mitteY - h0 / 2));
    k.style.left = x + 'px'; k.style.top = y + 'px';
    k.classList.add(rechts ? 'zipfel-links' : 'zipfel-rechts');
    k.style.setProperty('--zipfel', Math.max(24, Math.min(h0 - 24, mitteY - y)) + 'px');
    let zu = false; const weg = () => { if (zu) return; zu = true; k.classList.add('weg'); setTimeout(() => k.remove(), 500); };
    k.onclick = weg;
    const datei = !api.SCHNELL && !api.dialogOffen() && window.STIMMEN ? window.STIMMEN[w.text] : null;
    if (datei) { api.baumSpricht?.(true); KLANG.sprich(datei).then(() => { api.baumSpricht?.(false); setTimeout(weg, 1800); }); }
    else setTimeout(weg, api.SCHNELL ? 400 : 9000);
  }

  const AKTION = {
    banane(el) { const b = document.getElementById('bananenstaude'); b.classList.remove('wiegen'); void b.offsetWidth; b.classList.add('wiegen'); KLANG.spiel('banane'); },
    stein(el) { document.getElementById('kullerstein')?.classList.toggle('gerollt'); KLANG.spiel('stein'); krabbler(el, 'kaefer'); },
    wasser(el, e) { steinWurf(el, e); },
    palme() { kokosnuss(); },
    // Regenbogen: leuchtet kräftig auf, Lichtperlen laufen in allen sieben Farben über den Bogen, dazu sieben steigende Töne
    regenbogen() {
      const r = document.getElementById('regenbogen'); r.classList.remove('da', 'hell'); void r.offsetWidth; r.classList.add('da', 'hell');
      KLANG.spiel('regenbogen');
      const FARBEN = ['#F0503F', '#FF9A3C', '#FFE15A', '#62C76E', '#4A9BF0', '#5B5FD6', '#A066DE'];
      const cx = 282, cy = 528, rx = 172, ry = 88;   // Bogen des gemalten Regenbogens (Weltkoordinaten)
      FARBEN.forEach((f, i) => {
        const d = document.createElement('i'); d.className = 'bogenperle'; d.style.background = f; d.style.boxShadow = `0 0 10px 3px ${f}`;
        $('#spielflaeche').append(d);
        const k = 1 - i * .035, punkte = [];
        for (let j = 0; j <= 16; j++) { const w = Math.PI - j / 16 * Math.PI; punkte.push({ left: (cx + Math.cos(w) * rx * k - 5) + 'px', top: (cy - Math.sin(w) * ry * k - 5) + 'px', opacity: j === 0 || j === 16 ? 0 : 1 }); }
        d.animate(punkte, { duration: api.SCHNELL ? 100 : 1600, delay: api.SCHNELL ? 0 : i * 110, easing: 'ease-in-out', fill: 'both' }).onfinish = () => d.remove();
      });
    },
    wasserfall() { const r = document.getElementById('regenbogen'); r.classList.remove('da'); void r.offsetWidth; r.classList.add('da'); KLANG.spiel('funkeln'); },
    kakaofrucht(el) { frucht(); },
    bruellaffe(el) { const k = document.getElementById('schattenkrone'); k?.classList.remove('wackeln'); void k?.getBBox(); k?.classList.add('wackeln'); KLANG.spiel('affe'); },
  };
  const DAUER = { fisch: 1300, frosch: 800, tukan: 1400, faultier: 3200, ameisen: 1200, morpho: 4200, bruellaffe: 2600, pilz: 1200, banane: 1700, stein: 900 };
  const TON = { fisch: 'platsch', frosch: 'frosch', tukan: 'tukan', faultier: 'faultier', ameisen: 'ameisen', morpho: 'falter', pilz: 'puff' };

  function start(a) {
    api = a;
    const flaeche = $('#spielflaeche');
    const box = document.createElement('div'); box.id = 'entdecken';
    flaeche.prepend(box);   // unter den Plätzen: beim Platz-Wählen gewinnt der Platz
    for (const u of UEBERRASCHUNGEN) {
      const b = document.createElement('button');
      b.className = 'ueber ueber-' + u.was; b.dataset.was = u.was; b.setAttribute('aria-label', u.name);
      const [l, t, w, h] = u.box; Object.assign(b.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' });
      if (u.bild === '') b.innerHTML = ''; else gemalt(b, u.was, u.box[2], u.box[3], u.bild ?? BILD[u.was] ?? '', KLASSE[u.was]);
      b.onclick = e => {
        const ort = { x: u.box[0] + u.box[2] / 2, y: u.box[1] + u.box[3] / 2 };
        b.classList.add('entdeckt');   // angetippt: ein Blatt vorn muss es nicht mehr freihalten
        if (['wasser', 'wasserfall', 'kakaofrucht', 'palme', 'regenbogen'].includes(u.was)) {   // jedes Antippen wirkt
          AKTION[u.was](b, e);
          if (u.was !== 'wasser') api.kommentar?.(u.was === 'kakaofrucht' ? 'kakaobaum' : u.was, ort);
          return;
        }
        if (u.was === 'frosch' && entdeckt.has('frosch') && api.froschkonzert) { api.froschkonzert(); return; }   // zweites Antippen: Froschkonzert
        if (b.classList.contains('aktiv')) return;
        b.classList.add('aktiv'); setTimeout(() => b.classList.remove('aktiv'), api.SCHNELL ? 100 : DAUER[u.was]);
        bewege(b, u.was, api.SCHNELL ? 100 : DAUER[u.was] || 1200);
        AKTION[u.was]?.(b, e); if (TON[u.was]) KLANG.spiel(TON[u.was]);
        if (api.I.entdecken.includes(u.was) && !entdeckt.has(u.was)) {
          entdeckt.add(u.was); api.lerne(u.was); karte(u.was, u.box);
          if (u.was === 'frosch') setTimeout(() => api.zeigeHinweis(api.I.konzert.hinweis, 4800), api.SCHNELL ? 200 : 9800);
        } else api.kommentar?.(u.was, ort);   // schon bekannt: der Kolibri fliegt hin und erzählt
      };
      box.append(b);
    }
  }

  // Verstecke anlegen und die Quest-Dinge zufällig darunter legen. Gibt die Versteck-Knöpfe zurück.
  function verstecke(dinge) {
    const flaeche = $('#spielflaeche'), box = document.createElement('div'); box.id = 'verstecke';
    flaeche.insertBefore(box, $('#kolibri'));
    const plaetze = VERSTECKE.map(([l, t, art], i) => {
      const b = document.createElement('button'); b.className = 'versteck'; b.dataset.art = art;
      b.setAttribute('aria-label', { laub: 'Laubhaufen', gras: 'Grasbüschel', wurzel: 'Wurzeln', farn: 'Farn' }[art]);
      Object.assign(b.style, { left: l + 'px', top: t + 'px' });
      gemalt(b, 'decke-' + art, 150, 80, decke(art)); box.append(b);
      b.addEventListener('click', () => {
        b.classList.add('durchsucht');   // schon nachgeschaut: kein Freihalten mehr
        if (document.getElementById('buehne').classList.contains('quest')) return;
        if (b.ding && !b.ding.classList.contains('gefunden')) return;   // hier liegt noch etwas für die Gnitzen – das übernimmt spiel.js
        stoebern(b);
      });
      return b;
    });
    // jedes Spiel anders: echte Zufallsreihenfolge
    const frei = plaetze.slice().sort(() => Math.random() - .5);
    dinge.forEach((d, i) => {
      const p = frei[i]; p.ding = d;
      d.style.left = (parseFloat(p.style.left) + 25) + 'px'; d.style.top = (parseFloat(p.style.top) + 24) + 'px';
    });
    return plaetze;
  }

  window.ENTDECKEN = { start, verstecke, gemalt, get anzahl() { return entdeckt.size; }, get liste() { return [...entdeckt]; },
    setze(liste) { liste.forEach(w => { entdeckt.add(w); document.querySelector('.ueber-' + w)?.classList.add('entdeckt'); }); } };
})();
