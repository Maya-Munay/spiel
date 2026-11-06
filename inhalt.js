// Alle Texte der Szene an einem Ort – hier kann Yilmaz Wörter ändern, ohne den Spiel-Code anzufassen.
// Quellen und Ampel zu jedem Fakt stehen in KONZEPT.md (Abschnitt „Faktenliste“).

window.INHALT = {
  titel: 'Kakao-Reise',
  untertitel: 'Kapitel 1 · Der erste Samen',
  intro: 'Kakao wächst nur in einem schmalen Gürtel rund um den Äquator – etwa 20° nördlich und südlich. Der Kakao von Maya Munay kommt aus Venezuela.',

  // Stimmen (Gemini-TTS über tts/). Nach Textänderungen: python3 stimme_bauen.py
  // hoeher < 1 = tiefer, tempo > 1 = schneller (gewählt von Yilmaz am 05.11.2026)
  stimme: {
    kolibri: { voice: 'Leda', stil: 'Sprich hell, fröhlich und lebendig, wie ein kleiner, freundlicher Vogel', hoeher: 1.05 },
    // gesungener Segen beim Pflanzen (gleiche Stimme, gesungen)
    waldGesang: { voice: 'Sadaltager', stil: 'Singe langsam und warm wie ein altes Kinderlied, in einem ruhigen, gleichmäßigen Takt, jedes Wort deutlich und vollständig, mit einer einfachen, sanften Melodie', hoeher: 0.93 },
    wald: { voice: 'Sadaltager', stil: 'Sprich wie ein fröhlicher, liebevoller alter Großvater, der seinem Enkelkind eine Geschichte erzählt: warm und tief, mit einem Lächeln in der Stimme, verschmitzt und mit kleinen Pausen', hoeher: 0.93, tempo: 1.02 },
  },
  // nur für die Aussprache (wird so gesprochen, aber nicht so angezeigt)
  aussprache: {
    'In lak’ech hala ken': 'In Lakesch, Hala Ken',
  },

  sprecher: {
    wald: { name: 'Der Wald erzählt', bild: true },
    kolibri: { name: 'Kolibri', bild: true },
  },

  pflanzen: [
    ['wald', 'Aloha, wundervoll, dass du da bist. In deiner Hand liegt ein Kakaosamen.'],
  ],
  // Baumpatenschaft von Maya Munay (Quelle: Website mayamunay.com, Seite Baumpatenschaft)
  patenschaft: [
    ['wald', 'Und weißt du was? Für diesen Samen haben wir eine Baumpatenschaft bekommen.'],
    ['wald', 'Eine Baumpatenschaft gibt es wirklich – bei Maya Munay. Sie hilft mit, in Macuro ein Zentrum aufzubauen, in dem die Bauernfamilien aus ihrem Kakao selbst etwas Wertvolles herstellen können.'],
    ['wald', 'Schreib auf, für wen der Baum wachsen soll, und gib ihm einen Wunsch mit. Mit diesem Wunsch wächst er heran.'],
  ],
  wunschFenster: {
    titel: 'Deine Baumpatenschaft',
    fuerWen: 'Für wen pflanzt du den Baum?', fuerWenHinweis: 'Dein Name oder ein lieber Mensch',
    wunsch: 'Dein Wunsch für den Baum', wunschHinweis: 'Was soll mit ihm wachsen?',
    vorschlaege: ['Frieden', 'Freundschaft', 'Gesundheit', 'Liebe', 'Mut', 'Dankbarkeit', 'Freude'],
    knopf: 'Wunsch setzen', standardName: 'alle Wesen', standardWunsch: 'Liebe',
  },
  urkunde: { titel: 'Patenschaftsurkunde', fuer: 'Für', mit: 'mit dem Wunsch', ort: 'gepflanzt auf der Kakao-Reise', gestaltung: 'Urkunde gestaltet von Panambi (@panambi_tattoo)', zu: 'Schließen' },
  urkundeSatz: ['wald', 'Schau, deine Urkunde! In Macuro, einem Dorf am Meer in Venezuela, pflanzen Bauernfamilien echte Kakaobäume für ihre Paten.'],
  ortWaehlen: ['wald', 'Wo möchte dein Samen wachsen? Schau dich um und wähle einen Platz.'],
  yantraSatz: ['wald', 'Bevor dein Samen in die Erde kommt, zeichnen wir ein Kraftsymbol in den Boden – das Sri Yantra. Es stärkt den Segen für deinen Kakaobaum.'],
  segenVor: ['wald', 'Und jetzt singen wir ihm ein Lied. Hör nur – die Vögel kommen dazu.'],
  segen: 'Kleiner Samen, wachse sacht, durch Sonne, Regen, Tag und Nacht. Trag deinen Wunsch ins Licht hinein – mögest du gesegnet sein.',
  steinSatz: ['wald', 'In Macuro bemalen Juan und Diego Steine für die Bäume der Paten. Dein Baum hier bekommt ein Holzschild mit deinem Namen und deinem Wunsch.'],
  steinName: 'Dein Patenstein',

  orte: {
    sonne: { name: 'Offenes Feld', text: 'Hier scheint die Sonne den ganzen Tag. Junge Kakaobäume mögen es lieber schattig – ihre Blätter trocknen sonst schnell aus. Magst du einen anderen Platz suchen?' },
    hang: { name: 'Windiger Hang', text: 'Hier oben pfeift der Wind und der Boden ist steinig. Kakao mag es warm, feucht und geschützt. Magst du einen anderen Platz suchen?' },
    schatten: { name: 'Unter den großen Bäumen', text: 'Unter hohen Bäumen und Bananenstauden ist es schattig und feucht. Hier fühlt sich Kakao zu Hause.' },
  },

  wachsen: [
    ['wald', 'Tage werden zu Wochen, Wochen zu Monaten, Monate zu Jahren …'],
    ['wald', 'Schau: Die jungen Blätter sind rötlich, bevor sie grün werden. Und nach einigen Jahren zeigt dein Baum die ersten Blüten – direkt am Stamm.'],
  ],

  kolibriKommt: [
    ['kolibri', 'Aloha! Ich habe deinen Baum von weit oben gesehen. Was für ein guter Platz – im Schatten, zwischen vielen anderen Pflanzen.'],
    ['kolibri', 'Darf ich dir eine Geschichte erzählen? Meine Großeltern haben sie mir erzählt, und ihnen ihre Großeltern.'],
  ],

  legendeHinweis: 'Nach einer Legende aus den Anden, die den Quechua zugeschrieben wird – frei weitererzählt.',
  legende: [
    { bild: 'p1', text: 'Vor langer Zeit brannte der Wald. Alle Tiere flohen – der Jaguar, der Tapir, die Papageien.' },
    { bild: 'p2', text: 'Nur ein kleiner Kolibri flog zum Fluss. Er nahm einen Tropfen Wasser in den Schnabel und ließ ihn über dem Feuer fallen. Wieder und wieder.' },
    { bild: 'p3', text: 'Die großen Tiere riefen: „Was willst du schon ausrichten? Du bist so klein!“ Der Kolibri antwortete: „Ich tue, was ich kann.“' },
    { bild: 'p4', text: 'Da hielten die Tiere inne. Eines nach dem anderen kam zurück und half – mit Pfoten, Rüsseln und Flügeln. Zusammen löschten sie das Feuer.' },
    { bild: 'p5', text: 'Auch etwas Kleines kann etwas Großes schaffen.' },
  ],

  quest: [
    ['kolibri', 'Und jetzt schau dir deine Blüten an. Sie sind so winzig, dass nicht einmal mein Schnabel hineinpasst.'],
    ['kolibri', 'Bestäubt werden sie von Gnitzen – Mücken, die nur wenige Millimeter groß sind. Etwas Kleines, das etwas Großes schafft!'],
    ['kolibri', 'Die Gnitzen legen ihre Eier in feuchte, modrige Pflanzenreste. Magst du drei Dinge für sie suchen? Sie liegen im Laub, im Gras, unter Wurzeln und Farnen – schau überall nach!'],
  ],
  // wenn schon vor der Bitte etwas gefunden wurde (Anzahl → Satz)
  questSchon: {
    1: 'Die Gnitzen legen ihre Eier in feuchte, modrige Pflanzenreste. Oh – du hast ja schon etwas davon in deinem Rucksack! Magst du noch zwei Dinge suchen?',
    2: 'Die Gnitzen legen ihre Eier in feuchte, modrige Pflanzenreste. Oh – du hast ja schon zwei Dinge dabei! Fehlt nur noch eins.',
    3: 'Die Gnitzen legen ihre Eier in feuchte, modrige Pflanzenreste. Oh – du hast ja schon alles beisammen! Wundervoll.',
  },
  // Fund vor der Bitte des Kolibris: der Wald wundert sich
  fruehFund: ['Hm, schön feucht und modrig … wer weiß, wofür das noch gut ist?', 'Noch so ein modriger Schatz. Heb ihn gut auf!'],
  questZiel: 'Für die Gnitzen gesammelt',
  // Suche: wenn unter einem Laubhaufen nichts liegt / Tipp nach einer Weile ohne Fund
  suchenLeer: ['Hier ist nur Erde.', 'Nur ein kleiner Käfer – schau weiter!', 'Nichts – vielleicht woanders?', 'Hier wohnt ein Regenwurm. Weiter geht’s!'],
  // Tipp aus dem Gespräch: Der Kolibri fliegt zur Fundstelle und sagt, was er bemerkt hat
  suchenHinweis: {
    laub: 'Psst … unter dem Laub dort hat es gerade geraschelt!',
    gras: 'Ich glaube, in dem Grasbüschel liegt etwas. Schau mal genau hin!',
    wurzel: 'Unter den Wurzeln ist es feucht und modrig – genau richtig für die Gnitzen!',
    farn: 'Hinter diesem Farn sehe ich etwas Braunes. Magst du nachschauen?',
  },
  // kleine Freude nach jedem Fund (der Kolibri schlägt dabei einen Looping)
  fundJubel: ['Juhu, das erste! Da werden sich die Gnitzen freuen.', 'Hihi, schön feucht und modrig – genau richtig! Eins fehlt noch.', 'Alle drei! Du hast wirklich gute Augen.'],
  suchenStart: 'Klicke auf Laub, Gras, Wurzeln und Farne – schau dich auch links und rechts um!',
  // Ablegen: Dinge aus dem Rucksack unter den Baum legen
  ablegen: [['kolibri', 'Wundervoll, alles beisammen! Jetzt leg die Dinge unter deinen Baum. Zieh sie aus deinem Rucksack dorthin – oder tippe erst auf ein Ding und dann auf den Baum.']],
  ablegenZiel: 'Unter den Baum gelegt',
  ablegenTipp: 'Tippe erst auf ein Ding in deinem Rucksack.',
  sammeldinge: {
    laub: 'Feuchtes Laub',
    banane: 'Alter Bananenstamm',
    schalen: 'Leere Kakaoschalen',
  },

  bestaeubt: [
    ['kolibri', 'Hörst du das feine Summen? Die Gnitzen sind da und tragen den Blütenstaub von Blüte zu Blüte.'],
    ['kolibri', 'Schau – aus den bestäubten Blüten wachsen kleine Früchte. Nur ein kleiner Teil der vielen Blüten wird zur Frucht.'],
  ],

  quiz: {
    frage: 'Eine Frage zum Schluss: Wer bestäubt die Kakaoblüte vor allem?',
    frageNochmal: ['Welche Helfer bestäuben die Kakaoblüte also vor allem?', 'Schau noch einmal genau hin: Welche winzigen Helfer bestäuben die Kakaoblüte?'],
    antworten: [
      { text: 'Honigbienen', richtig: false, echo: 'Bienen besuchen viele Blüten – die Kakaoblüte ist ihnen aber zu klein und eng gebaut. Magst du noch einmal wählen?' },
      { text: 'Winzige Mücken (Gnitzen)', richtig: true, echo: 'Genau! Die winzigen Gnitzen. Ohne sie gäbe es keine Kakaofrüchte.' },
      { text: 'Kolibris', richtig: false, echo: 'Ich fühle mich geehrt! Aber mein Schnabel ist zu groß für diese winzigen Blüten. Magst du noch einmal wählen?' },
    ],
  },

  abschied: [
    ['kolibri', 'Danke für deine Hilfe. Wenn die Früchte reif sind, schauen wir hinein. Drinnen wartet eine Überraschung: weißes, süßes Fruchtfleisch.'],
    ['kolibri', 'In lak’ech hala ken – ich bin ein anderes Du.'],
  ],

  // Nach der Aufgabe: Fenster mit „Kapitel beenden“ – bis dahin darf man sich frei im Wald umsehen (Wunsch Yilmaz 05.11.)
  // Der große Urwaldbaum spricht, wenn man ihn antippt (Stimme: Der Wald erzählt)
  baumRuf: ['Hallo, kleiner Mensch. Schau dich ruhig in Ruhe um.', 'Hihi, das kitzelt in meiner Rinde!', 'Psst … im Wald gibt es überall etwas zu entdecken.'],
  // Der Kolibri sagt ab und zu etwas, wenn man etwas antippt (nicht beim ersten Entdecken)
  kommentare: {
    // Der Kolibri fliegt hin und erzählt bei jedem Antippen die nächste von drei Infos
    frosch: ['Vorsicht, nicht anfassen – seine Farben sagen: Ich bin giftig!', 'Dieser gelb-schwarze Frosch heißt Gelbgebänderter Baumsteiger. Er lebt auch in Venezuela.', 'Bei den Baumsteigerfröschen tragen die Eltern ihre Kaulquappen auf dem Rücken zum Wasser.', 'Sein Gift bekommt der Frosch aus seinem Futter – vor allem aus winzigen Milben.'],
    tukan: ['Was für ein prächtiger Schnabel!', 'Tukane fressen gern Früchte – und tragen so die Samen durch den ganzen Wald.', 'Zum Schlafen legt der Tukan seinen Schnabel auf den Rücken.', 'Sein großer Schnabel ist ganz leicht. Innen ist er wie ein Schaum aus winzigen Luftbläschen.'],
    faultier: ['Psst … das Faultier nimmt sich für alles viel Zeit.', 'Faultiere klettern nur etwa einmal in der Woche vom Baum herunter.', 'Kaum zu glauben: Faultiere können richtig gut schwimmen.', 'Im Fell der Faultiere wachsen winzige Algen. Darum schimmert es manchmal grünlich.'],
    bruellaffe: ['Huch! Der ist aber laut!', 'Brüllaffen rufen oft am Morgen – so wissen die Nachbarn, wo die Gruppe ist.', 'Brüllaffen fressen vor allem Blätter.', 'Brüllaffen gehören zu den lautesten Tieren an Land – man hört sie weit durch den Wald.'],
    morpho: ['Blau wie der Himmel – wundervoll!', 'Von unten sind seine Flügel braun mit Augenflecken. So ist er gut getarnt.', 'Der Morphofalter mag den süßen Saft von reifen Früchten.', 'Sein Blau ist gar keine Farbe: Winzige Schuppen auf den Flügeln werfen das Licht so zurück, dass es blau leuchtet.'],
    ameisen: ['Fleißige Gärtner! Sie bringen Blätter für ihren Pilzgarten.', 'Eine Blattschneiderameise kann ein Blattstück tragen, das viel schwerer ist als sie selbst.', 'In einem Ameisenstaat gibt es eine Königin und ganz viele Arbeiterinnen.'],
    fisch: ['Platsch! Der Fluss ist voller Leben.', 'Fische atmen unter Wasser mit ihren Kiemen.', 'Sauberes, klares Wasser ist ein Zuhause für viele Tiere.'],
    pilz: ['Leuchtende Becherpilze! Sie wachsen auf totem Holz im Regenwald.', 'Eine Art dieser Becherpilze heißt sogar Cookeina venezuelae – sie ist nach Venezuela benannt.', 'Pilze helfen, altes Holz und Blätter wieder zu Erde zu machen.'],
    banane: ['Die Bananenstaude schenkt deinem jungen Kakaobaum Schatten.', 'Kaum zu glauben: Die Bananenstaude ist gar kein Baum. Ihr Stamm besteht aus eng gerollten Blättern.', 'Jeder Bananenstamm trägt nur einmal Früchte. Danach wachsen aus dem Boden neue Triebe nach.', 'Bananen wachsen nicht nach unten – sie biegen sich nach oben, dem Licht entgegen.', 'Auf den Haciendas von Maya Munay bleiben herabgefallene Bananenblätter liegen. Sie nähren den Boden für den Kakao.'],
    palme: ['Kokosnüsse können über das Meer schwimmen und an einem neuen Strand keimen.', 'Eine Kokosnuss ist eigentlich keine Nuss, sondern eine Steinfrucht – wie eine Kirsche, nur viel größer.', 'In einer jungen Kokosnuss steckt süßes Kokoswasser.', 'Eine Kokospalme kann bis zu 30 Meter hoch werden.', 'Kokospalmen mögen warme Küsten – so wie in Macuro, dem kleinen Dorf am Meer. Dort arbeitet Maya Munay mit rund 40 Kakaobauernfamilien zusammen.'],
    wasserfall: ['Solche Tafelberge heißen Tepuis. Es gibt sie in Venezuela.', 'Der höchste Wasserfall der Welt, der Salto Ángel, stürzt in Venezuela von einem Tepui.', 'Oben auf den Tepuis wachsen Pflanzen, die es sonst nirgends auf der Welt gibt.', 'Auch der Kakao von Maya Munay kommt aus Venezuela – einem Land, das seit Jahrhunderten für feinen Kakao bekannt ist.'],
    regenbogen: ['Ein Regenbogen entsteht, wenn Sonnenlicht in winzigen Wassertröpfchen gebrochen wird. So teilt sich das weiße Licht in seine Farben.', 'Einen Regenbogen siehst du nur, wenn die Sonne hinter dir steht.', 'Die Farben stehen immer in derselben Reihenfolge: außen Rot, innen Violett.', 'Am Wasserfall gibt es oft Regenbögen – die Gischt hängt voller winziger Tröpfchen.'],
    kakaobaum: ['Siehst du? Die Kakaofrüchte wachsen direkt am Stamm.', 'Reife Kakaofrüchte können gelb, orange, rot oder lila sein.', 'In einer Kakaofrucht stecken meist etwa 20 bis 50 Bohnen.', 'Bei Maya Munay werden die Kakaofrüchte erst geerntet, wenn sie ganz reif sind – von Hand.', 'Danach ruhen die Bohnen mehrere Tage in der Fermentation. Dabei entstehen ihre Aromen.', 'Dann trocknen die Bohnen mehrere Tage in der Sonne und werden immer wieder gewendet.'],
    laub: ['Aus altem Laub wird neue Erde – Käfer, Würmer und Pilze helfen dabei.', 'Im feuchten Laub legen die Gnitzen gern ihre Eier.', 'Auf den Haciendas von Maya Munay bleiben die heruntergefallenen Blätter liegen und nähren den Boden.', 'Aus den leeren Kakaoschalen machen die Bauern Komposterde. So nährt sich der Kakao wieder vom Kakao.'],
    gras: ['Hihi, da krabbelt was!', 'Im Gras wohnen Grillen – nachts hörst du sie zirpen.', 'Graswurzeln halten die Erde fest, damit der Regen sie nicht wegspült.'],
    wurzel: ['Wurzeln trinken Wasser aus der Erde und halten den Baum fest.', 'Manche Urwaldriesen haben Brettwurzeln – breite Stützen wie Wände.', 'Unter der Erde reichen sich Wurzeln und feine Pilzfäden die Hand.'],
    farn: ['Farne gab es schon zur Zeit der Dinosaurier – lange bevor die ersten Blumen blühten.', 'Farne haben keine Blüten und keine Samen. Neue Farne wachsen aus winzigen Sporen.', 'Junge Farnblätter sind eingerollt wie ein kleines Schneckenhaus.'],
  },
  // Mini-Spiel: Froschkonzert (zweites Antippen des Froschs)
  konzert: {
    hinweis: 'Tippe noch einmal auf den Frosch – er lädt dich zum Konzert ein!',
    titel: 'Froschkonzert', anleitung: 'Hör gut zu und tippe die Frösche in derselben Reihenfolge an.',
    zuhoeren: 'Hör gut zu …', du: 'Jetzt du!', nochmal: 'Fast! Hör noch einmal hin …', gut: 'Wundervoll! Weiter geht’s …',
    geschafft: 'Bravo – was für ein Froschkonzert!', schliessen: 'Zurück in den Wald',
  },
  // Spielstand
  weiter: 'Weiterspielen', neu: 'Neu beginnen',

  // Kakaobohnen-Sammelei
  bohnen: { moment: 'Sieben Kakaobohnen! Jede Bohne ist ein Samen – aus ihr kann ein neuer Kakaobaum wachsen. Schau, da keimt schon einer.', gefunden: 'Kakaobohne gefunden', ziel: 'Kakaobohnen', alle: 'Alle 7 Kakaobohnen gefunden – wundervoll!' },

  fertig: {
    titel: 'Geschafft!',
    text: 'Dein Kakaobaum trägt Früchte – und mit ihm dein Wunsch „{wunsch}“. Magst du dich noch ein wenig im Wald umsehen?',
    rest: 'Hier warten noch {r} Geheimnisse auf dich.',
    alle: 'Du hast alle Geheimnisse des Waldes entdeckt.',
    knopf: 'Kapitel beenden',
  },

  ende: {
    titel: 'Kapitel 1 ist geschafft',
    text: 'Dein Kakaobaum steht im Schatten und trägt seine ersten Früchte.',
    weiter: 'Bald geht es weiter: Kapitel 2 · Die Frucht',
    entdeckt: 'Im Wald hast du {n} von {m} Geheimnissen entdeckt.',
    alleEntdeckt: 'Du hast alle {m} Geheimnisse des Waldes entdeckt – wundervoll!',
    patenschaft: 'Eine echte Baumpatenschaft gibt es bei Maya Munay: Dann pflanzen die Bauernfamilien in Macuro einen Kakaobaum mit deiner Intention – und du hilfst mit, dort ein Zentrum aufzubauen, in dem die Familien aus ihrem Kakao selbst etwas Wertvolles herstellen können.',
  },

  // Klick-Überraschungen: Tiere und Pflanzen, die man im Wald anklicken kann.
  // Beim ersten Klick erzählt der Wald (Großvater-Stimme) das Wissen; es landet im Wissensbuch.
  // Quellen + Ampel: KONZEPT.md, Abschnitt „Faktenliste“ (Entdecken).
  entdecken: ['frosch', 'tukan', 'faultier', 'ameisen', 'morpho', 'bruellaffe', 'banane'],

  // Wissensbuch: was man in dieser Szene lernt
  wissen: {
    guertel: { titel: 'Der Kakaogürtel', text: 'Kakao wächst nur in einem schmalen Gürtel rund um den Äquator – meist werden etwa 20° nördlich und südlich genannt. Dort ist es das ganze Jahr warm und feucht.' },
    schatten: { titel: 'Schatten und Mischkultur', text: 'Junge Kakaobäume mögen Schatten. Darum wachsen sie gern unter hohen Bäumen und zwischen Bananenstauden. Das nennt man Mischkultur oder Agroforst.' },
    blaetter: { titel: 'Rote junge Blätter', text: 'Junge Kakaoblätter sind oft rötlich, bevor sie grün werden.' },
    blueten: { titel: 'Blüten am Stamm', text: 'Kakaoblüten wachsen direkt am Stamm und an den dicken Ästen. Daraus werden später die Früchte.' },
    legende: { titel: 'Die Legende vom Kolibri', text: 'Die Geschichte vom Kolibri und dem Waldbrand wird den Quechua aus den Anden zugeschrieben. Bekannt gemacht hat sie Wangari Maathai, Friedensnobelpreisträgerin aus Kenia. Dass am Ende alle zusammen löschen, ist frei weitererzählt.' },
    frosch: { titel: 'Der Baumsteigerfrosch', text: 'Schau, ein Baumsteigerfrosch! Seine leuchtenden Farben sagen: Achtung, ich bin giftig! Sein Gift bekommt er aus seiner Nahrung – aus winzigen Ameisen und Milben.' },
    tukan: { titel: 'Der Tukan', text: 'Der Tukan hat einen riesigen Schnabel – und trotzdem ist er ganz leicht, denn innen ist er luftig wie ein Schwamm. Über den Schnabel kann der Tukan sogar Wärme abgeben.' },
    faultier: { titel: 'Das Faultier', text: 'Ganz langsam … Das Faultier bewegt sich gemächlich und spart so Kraft. In seinem Fell wachsen winzige Algen, darum schimmert es oft grünlich. Vielleicht hilft ihm das, sich zwischen den Blättern zu tarnen.' },
    ameisen: { titel: 'Die Blattschneiderameisen', text: 'Die Blattschneiderameisen tragen Blattstücke nach Hause. Fressen sie die Blätter? Nein! Sie züchten darauf einen Pilz – und der ist ihr Essen.' },
    morpho: { titel: 'Der Morphofalter', text: 'Siehst du das leuchtende Blau? Im Flügel des Morphofalters ist gar keine blaue Farbe. Winzige Formen auf seinen Schuppen lenken das Licht so, dass wir Blau sehen.' },
    bruellaffe: { titel: 'Der Brüllaffe', text: 'Hörst du ihn? Brüllaffen gehören zu den lautesten Tieren an Land. Ihre Rufe hört man im Wald über weite Strecken.' },
    banane: { titel: 'Die Bananenstaude', text: 'Die Bananenstaude sieht aus wie ein Baum – ist aber keiner. Ihr Stamm besteht aus eng aufgerollten Blättern. Und sie schenkt dem jungen Kakao Schatten.' },
    patenschaft: { titel: 'Die Baumpatenschaft', text: 'Mit einer Baumpatenschaft von Maya Munay pflanzen die Bauernfamilien in Macuro, einem Dorf am Meer in Venezuela, einen Kakaobaum mit der Intention der Paten. Über hundert Bäume sind schon in der Erde.' },
    kompost: { titel: 'Der Kakao nährt den Kakao', text: 'Auf den Haciendas von Maya Munay werden die leeren Fruchtschalen zu Komposterde. So nährt sich der Kakao wieder vom Kakao.' },
    bohnen: { titel: 'Die Kakaobohnen', text: 'In einer Kakaofrucht stecken meist etwa 20 bis 50 Samen – die Kakaobohnen. Sie liegen in weißem, süßem Fruchtfleisch.' },
    gnitzen: { titel: 'Die Gnitzen', text: 'Bestäubt werden die winzigen Kakaoblüten vor allem von Gnitzen – Mücken, die nur wenige Millimeter groß sind. Ihre Eier legen sie gern in feuchtes Laub und modrige Pflanzenreste.' },
  },
};

// ---------- Ergänzungen 06.11. (Wunsch Yilmaz): Bilder beim Erzählen, Ausblick, Sammelübersicht, Mini-Spiel ----------
// Quellen: Bauernfamilien in Macuro, Fermentation und Trocknen = Angaben von Maya Munay (KONZEPT.md, Faktenliste 🟢).
Object.assign(window.INHALT, {
  // Bild, das erscheint, während der Wald einen bestimmten Satz erzählt (Satzanfang → Bild in bilder/platzhalter/)
  erzaehlBilder: [
    { satz: 'Aloha, wundervoll, dass du da bist. In deiner Hand liegt ein Kakaosamen.', bild: 'haende', text: 'Ein Kakaosamen in deinen Händen' },
    { satz: 'Eine Baumpatenschaft gibt es wirklich – bei Maya Munay.', bild: 'familie', text: 'So könnte eine Bauernfamilie in Macuro aussehen (gemalt)' },
    { satz: 'Schau, deine Urkunde!', bild: '', text: '' },
  ],
  // roter Faden zum nächsten Kapitel: der Kolibri macht neugierig
  ausblickSatz: ['kolibri', 'Weißt du eigentlich, was in einer reifen Kakaofrucht steckt? Das zeige ich dir beim nächsten Mal …'],
  ausblick: { titel: 'Im nächsten Kapitel', text: 'Wie sieht es in einer Kakaofrucht aus? Du erntest reife Früchte und öffnest sie.', bild: 'kapitel2' },
  // Sammelübersicht im Wissensbuch
  geheimnisse: { titel: 'Die 7 Geheimnisse des Waldes', verborgen: 'noch zu entdecken' },
  // Mini-Spiel: die Bohnen reifen lassen – aufgehoben für Kapitel 3 (Fermentieren) und 4 (Trocknen); zum Ausprobieren: index.html?ernte
  ernte: {
    knopf: 'Mini-Spiel: Bohnen fermentieren',
    titel: 'Fermentieren und Trocknen',
    fermentieren: 'Jetzt ruhen die Bohnen mit ihrem Fruchtfleisch in einer Holzkiste, zugedeckt mit Bananenblättern. Wende sie im Takt des Waldes – tippe auf „Wenden“, wenn der Ring golden leuchtet.',
    trocknen: 'Jetzt trocknen die Bohnen in der Sonne. Wende sie wieder im Takt – und wenn eine Regenwolke kommt, deck sie schnell ab!',
    wenden: 'Wenden', abdecken: 'Abdecken', aufdecken: 'Sonne – aufdecken',
    gewendet: 'Gewendet', gut: 'Wundervoll – genau im Takt!', fast: 'Fast – lausch noch einmal dem Takt.',
    regen: 'Eine Regenwolke kommt!', trocken: 'Gut abgedeckt – die Bohnen bleiben trocken.', nass: 'Oh, ein paar Tropfen … Beim nächsten Mal schneller abdecken.',
    weiterTrocknen: 'Weiter zum Trocknen', geschafft: 'Geschafft! Die Bohnen duften und sind bereit für ihre weitere Reise.',
    schliessen: 'Zurück in den Wald', nochmal: 'Noch einmal',
  },
});
Object.assign(window.INHALT.wissen, {
  fermentieren: { titel: 'Fermentieren', text: 'Nach der Ernte ruhen die Kakaobohnen bei Maya Munay mehrere Tage in der Fermentation. Dabei entstehen ihre Aromen.' },
  trocknen: { titel: 'Trocknen in der Sonne', text: 'Danach trocknen die Bohnen mehrere Tage in der Sonne und werden immer wieder gewendet. Kommt Regen, deckt man sie ab.' },
});
