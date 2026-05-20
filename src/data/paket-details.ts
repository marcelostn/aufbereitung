import type { PaketTyp } from './preise';

export interface ProduktEinsatz {
  name: string;
  wofuer: string;
}

export interface AblaufSchritt {
  titel: string;
  beschreibung: string;
}

export interface PaketFAQ {
  frage: string;
  antwort: string;
}

export interface Voraussetzungen {
  wasser: 'wir' | 'optional' | 'noetig';
  strom: 'wir' | 'optional' | 'noetig';
  platz: string;
  hinweis?: string;
}

export interface PaketDetail {
  slug: string;
  kurzbeschreibung: string;
  enthalten: string[];
  geeignet_fuer: string[];
  produkte: ProduktEinsatz[];
  geraete: string[];
  ablauf: AblaufSchritt[];
  voraussetzungen: Voraussetzungen;
  faqs: PaketFAQ[];
  hinweise?: string[];
}

// Wir arbeiten ausschließlich mit Profi-Produkten von Koch Chemie – derselben Marke,
// die auch zertifizierte Aufbereitungs-Betriebe und Premium-Autohäuser verwenden.

// ── Standard-FAQs, die in fast jedem Paket vorkommen ────────────────────────
const FAQ_STELLPLATZ: PaketFAQ = {
  frage: 'Welchen Stellplatz brauchen Sie bei mir?',
  antwort:
    'Ein ebener Stellplatz, an dem das Auto rundherum frei steht (ca. 1 m Platz an jeder Seite). Schatten oder Carport ist ideal – direkt in der prallen Sonne trocknet Wasser zu schnell und hinterlässt Wasserflecken. Innenhof, Hofeinfahrt oder Stellplatz vor dem Haus sind in der Regel perfekt.',
};

const FAQ_ZAHLUNG: PaketFAQ = {
  frage: 'Wie und wann bezahle ich?',
  antwort:
    'Bequem nach getaner Arbeit direkt vor Ort – bar oder per EC-Karte/SumUp. Den Festpreis kennen Sie schon bei der Terminbestätigung, es kommen keine versteckten Kosten dazu. Auf Wunsch erhalten Sie eine ordentliche Rechnung.',
};

const FAQ_TIERHAARE: PaketFAQ = {
  frage: 'Meine Tierhaare sitzen tief in den Polstern – schaffen Sie das?',
  antwort:
    'Ja, mit dem passenden Aufpreis (leicht 15 €, mittel 25 €, stark 45 €). Bei langhaarigen Hunden empfehlen wir die Stufe „stark" – wir nutzen dann zusätzlich Spezial-Gummibürsten und arbeiten die Polster mehrfach durch.',
};

const FAQ_DAUER: (h: string) => PaketFAQ = (h) => ({
  frage: 'Wie lange dauert es?',
  antwort: `Wir rechnen mit ca. ${h} reiner Arbeitszeit. Bei stark verschmutzten Fahrzeugen kann es etwas länger dauern – wir besprechen das vorher mit Ihnen, der Festpreis ändert sich dadurch nicht.`,
});

const FAQ_WETTER: PaketFAQ = {
  frage: 'Was passiert bei schlechtem Wetter?',
  antwort:
    'Bei starkem Regen verschieben wir Außenarbeiten unkompliziert auf einen passenden Tag – ohne Zusatzkosten. Innenaufbereitungen sind weitgehend wetterunabhängig, sofern ein trockener Stellplatz (Garage, Carport, Tiefgarage) verfügbar ist.',
};

const FAQ_WEGGEHEN: PaketFAQ = {
  frage: 'Muss ich während der Aufbereitung dabei bleiben?',
  antwort:
    'Nein, Sie können in Ruhe ihren Tag weitermachen. Wir melden uns kurz, wenn wir fertig sind. Eine gemeinsame Endabnahme am Auto ist uns aber wichtig – damit Sie das Ergebnis selbst sehen.',
};

const FAQ_AUSRAEUMEN: PaketFAQ = {
  frage: 'Muss ich das Auto vorher leerräumen?',
  antwort:
    'Sehr gerne, das spart Zeit und ist günstiger für Sie. Persönliche Wertsachen sollten Sie auf jeden Fall vorher entnehmen. Was unsicher ist (lose Münzen, Sonnenbrille, Tankquittungen), legen wir in eine kleine Box auf dem Beifahrersitz, damit nichts verloren geht.',
};

// ── Paket-Daten ──────────────────────────────────────────────────────────────
export const PAKET_DETAILS: Record<PaketTyp, PaketDetail> = {

  // ────────────────────────────────────────────────────────────────────────────
  aussen: {
    slug: 'aussenreinigung',
    kurzbeschreibung:
      'Die klassische Außenwäsche von Hand – schonend für den Lack, gründlicher als jede Waschstraße. Ideal als Auffrischung zwischendurch.',
    enthalten: [
      'Vorwäsche und Schaumbad zum schonenden Anlösen von Schmutz',
      'Handwäsche mit Zwei-Eimer-Methode (kein Mikro-Kratzer-Risiko)',
      'Felgenreinigung außen, Reifenflanken sauber',
      'Scheiben außen streifenfrei',
      'Türrahmen und Dichtungen abwischen',
      'Trocknen mit weichen Mikrofasertüchern',
      'Reifenpflege für tiefen Schwarzton',
    ],
    geeignet_fuer: [
      'Regelmäßige Pflege zwischen größeren Aufbereitungen',
      'Vor einem wichtigen Termin oder Foto-Shooting',
      'Wenn der Lack matt wirkt, aber noch keine Politur nötig ist',
    ],
    produkte: [
      { name: 'Koch Chemie Felgenreiniger',     wofuer: 'Reactive Wheel Cleaner – löst Bremsstaub und Flugrost ohne harte Säuren.' },
      { name: 'Koch Chemie Snow Foam',          wofuer: 'Gentle Snow Foam – dichter Reinigungsschaum als kontaktarme Vorwäsche.' },
      { name: 'Koch Chemie Green Star',         wofuer: 'Universalreiniger für Tür- und Tankrahmen, Dichtungen, Radkästen.' },
      { name: 'Insektenreiniger',               wofuer: 'Löst Insekten- und Eiweißreste an Front und Spiegeln.' },
      { name: 'Vorreiniger',                    wofuer: 'Punktuell für hartnäckige Stellen vor der Hauptwäsche.' },
      { name: 'Mikrofasertücher (mehrere)',     wofuer: 'Getrennt für Lack, Glas und Türrahmen – keine Kreuzkontamination.' },
      { name: 'Saugstarkes Trockentuch',        wofuer: 'Großes Premium-Tuch zum streifenfreien Trocknen ohne Druck.' },
    ],
    geraete: [
      'Hochdruckreiniger mit Schaumlanze',
      'Zwei separate Wascheimer mit Grit Guards',
      'Premium-Waschhandschuh (Mikrofaser)',
      'Felgenbürsten (lang + Detail)',
      'Drucksprüher für Vorwäsche',
      'Mikrofaser-Trockentücher',
      'Eigener mobiler Wassertank (ca. 100 L)',
    ],
    ablauf: [
      { titel: 'Felgen vorbereiten',     beschreibung: 'Felgenreiniger satt aufsprühen und einwirken lassen – beginnt mit der schmutzigsten Stelle, damit gelöste Partikel später nicht den Lack treffen.' },
      { titel: 'Insektenreste lösen',    beschreibung: 'Front, Spiegel und Kennzeichen mit Insektenreiniger einsprühen, parallel zur Felgen-Einwirkzeit.' },
      { titel: 'Schaumbad',              beschreibung: 'Komplettes Fahrzeug mit Snow Foam einschäumen – löst groben Schmutz vor dem Berühren, schützt den Klarlack.' },
      { titel: 'Felgen schrubben',       beschreibung: 'Felgen mit verschiedenen Bürsten gründlich säubern und mit Hochdruck abspülen.' },
      { titel: 'Handwäsche',             beschreibung: 'Zwei-Eimer-Methode mit Waschhandschuh: ein Eimer Shampoo, ein Eimer klares Spülwasser. Verhindert Mikro-Kratzer durch erneut aufgenommenen Sand.' },
      { titel: 'Türfalze & Dichtungen',  beschreibung: 'Türrahmen und Tankdeckel öffnen, mit Green Star und Mikrofaser ausreiben – Stellen, die in der Waschstraße nie sauber werden.' },
      { titel: 'Klarspülen',             beschreibung: 'Komplettes Fahrzeug mit klarem Wasser abspülen, von oben nach unten.' },
      { titel: 'Trocknen',               beschreibung: 'Mit saugstarkem Mikrofaser-Trockentuch abtupfen, nicht ziehen – keine Streifen, kein Druck auf den Lack.' },
      { titel: 'Scheiben & Reifen',      beschreibung: 'Scheiben außen streifenfrei nachpolieren, Reifenflanken mit Pflege einreiben für tiefes Schwarz ohne fettigen Glanz.' },
    ],
    voraussetzungen: {
      wasser: 'optional',
      strom: 'optional',
      platz: 'Ebener Stellplatz mit ca. 1 m Platz an jeder Fahrzeugseite. Schatten/Carport ideal.',
      hinweis: 'Wir bringen unseren eigenen Wassertank und einen Akku-Hochdruckreiniger mit – ein Anschluss bei Ihnen ist nicht zwingend nötig. Wenn vorhanden, freuen wir uns natürlich.',
    },
    faqs: [
      FAQ_STELLPLATZ,
      {
        frage: 'Brauchen Sie einen Wasseranschluss von mir?',
        antwort:
          'Nein, wir bringen alles mit. Wir haben einen mobilen Wassertank dabei, der für eine Außenreinigung locker reicht. Wenn Sie aber einen Außenwasserhahn haben, freuen wir uns – das spart uns einen Tankwechsel.',
      },
      {
        frage: 'Wird das Schmutzwasser aufgefangen?',
        antwort:
          'Wir arbeiten umweltbewusst und sparsam mit Wasser. Bei kleineren Mengen versickert das Wasser harmlos. Bei besonders empfindlichen Stellen (z. B. öffentlicher Bürgersteig, fließendes Gewässer in der Nähe) sprechen wir das vorher mit Ihnen ab.',
      },
      FAQ_WETTER,
      FAQ_DAUER('1,5 Stunden'),
      FAQ_WEGGEHEN,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  innen_basic: {
    slug: 'innen-basic',
    kurzbeschreibung:
      'Solide Grundreinigung des Innenraums – alle sichtbaren Flächen sauber, Sitze gesaugt, Armaturenbrett aufgefrischt.',
    enthalten: [
      'Gründliches Aussaugen aller Sitze und Bodenflächen',
      'Armaturenbrett und Mittelkonsole feucht abwischen',
      'Scheiben innen streifenfrei',
      'Türverkleidungen oberflächlich reinigen',
      'Fußmatten ausklopfen und reinigen',
    ],
    geeignet_fuer: [
      'Alltagsstaub und leichte Verschmutzungen',
      'Kunden, die regelmäßig pflegen lassen wollen',
      'Vor dem Verkauf bei optisch gutem Innenraum',
    ],
    produkte: [
      { name: 'Koch Chemie Mehrzweckreiniger',  wofuer: 'Allzweck-Innenraumreiniger für Kunststoff, Armaturen, Türverkleidungen.' },
      { name: 'Koch Chemie Pol Star',           wofuer: 'Textilreiniger – sprüht direkt auf Sitze und Matten, löst frische Verschmutzungen.' },
      { name: 'Koch Chemie Glass Cleaner',      wofuer: 'Glasreiniger für streifenfreie Innenscheiben (Innenseite neigt zu Schlierenbildung).' },
      { name: 'Mikrofasertücher',               wofuer: 'Strikt getrennt – Armaturen, Glas und Polster nie mit demselben Tuch.' },
      { name: 'Carbon Tuch',                    wofuer: 'Feine Faserstruktur für Bildschirme, Touchdisplays und Hochglanzleisten.' },
    ],
    geraete: [
      'Profi-Werkstattsauger mit verschiedenen Aufsätzen',
      'Detailbürsten für Lüftungslamellen und Spalten',
      'Druckluftpistole / mobile Druckluft',
      'Sprühflaschen mit Profi-Verdünnung',
      'Mikrofaser-Set',
    ],
    ablauf: [
      { titel: 'Ausräumen',         beschreibung: 'Fußmatten raus, Kofferraum leeren, lose Gegenstände entfernen. Wir fragen vorher, was bleiben darf und was nicht.' },
      { titel: 'Druckluft & Bürste', beschreibung: 'Lüftungsschlitze, Knopfleisten und Spalten mit Druckluft ausblasen, damit der Staubsauger danach mehr greifen kann.' },
      { titel: 'Aussaugen',         beschreibung: 'Sitze, Boden, Spalten, Kofferraum und Hutablage – mit verschiedenen Aufsätzen, damit auch die Ritzen zwischen Sitz und Mittelkonsole sauber werden.' },
      { titel: 'Flächen wischen',   beschreibung: 'Armaturenbrett, Mittelkonsole, Türverkleidungen mit Mehrzweckreiniger leicht angefeuchtet abwischen – kein Sprühen direkt auf Elektronik.' },
      { titel: 'Polster auffrischen', beschreibung: 'Sitze und Bodenmatten mit Pol Star besprühen, einarbeiten, mit Mikrofaser nachwischen.' },
      { titel: 'Scheiben innen',    beschreibung: 'Glas Cleaner auf das Tuch (nicht direkt auf die Scheibe), in einer Richtung wischen, zum Schluss Carbon-Tuch für Streifenfreiheit.' },
      { titel: 'Finish',            beschreibung: 'Fußmatten zurück, Innenraum auf vergessene Stellen prüfen, Auto übergabebereit.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'optional',
      platz: 'Trockener Stellplatz, gerne überdacht (Carport, Garage, Tiefgarage).',
      hinweis: 'Für Innenarbeiten brauchen wir kein fließendes Wasser. Eine normale Steckdose ist hilfreich für den Werkstattsauger – wir haben aber Akku-Geräte als Backup dabei.',
    },
    faqs: [
      FAQ_AUSRAEUMEN,
      FAQ_TIERHAARE,
      {
        frage: 'Brauchen Sie Strom von mir?',
        antwort:
          'Eine normale 220V-Steckdose ist hilfreich für den Werkstattsauger. Falls keine in der Nähe ist, kein Problem – wir haben Akku-Sauger und mobile Stromversorgung dabei.',
      },
      FAQ_STELLPLATZ,
      FAQ_DAUER('1,5 Stunden'),
      FAQ_WEGGEHEN,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  innen_premium: {
    slug: 'innen-premium',
    kurzbeschreibung:
      'Tiefe Reinigung des Innenraums inklusive Sitzpolster und Türverkleidungen. Für ein gepflegtes Cockpit-Gefühl.',
    enthalten: [
      'Alles aus Innen Basic',
      'Sitze und Polster shampoonieren / mit Spezialreiniger behandeln',
      'Türverkleidungen gründlich reinigen',
      'Kofferraum ausräumen, saugen und wischen',
      'Lederflächen pflegen (falls vorhanden) – schützt vor Rissen',
      'Lüftungsschlitze und Spaltmaße entstauben',
    ],
    geeignet_fuer: [
      'Familien-Autos mit Krümeln, Flecken, Tierhaaren (Aufpreis je nach Stufe)',
      'Vor dem Verkauf für besseren Eindruck',
      'Wenn der Innenraum „gelebt" aussieht, aber kein extremer Reinigungsbedarf besteht',
    ],
    produkte: [
      { name: 'Koch Chemie Mehrzweckreiniger',  wofuer: 'Großflächig für alle Kunststoffteile.' },
      { name: 'Koch Chemie Pol Star',           wofuer: 'Tiefenreinigung der Stoffsitze und Polster.' },
      { name: 'Koch Chemie Leather Star',       wofuer: 'Lederpflege – reinigt und schützt in einem Schritt, verhindert Risse.' },
      { name: 'Koch Chemie Glass Cleaner',      wofuer: 'Innenscheiben streifenfrei.' },
      { name: 'Fresh Up',                       wofuer: 'Leichte Geruchsneutralisierung am Ende, damit das Auto auch riecht wie sauber.' },
      { name: 'Mikrofasertücher (3 Stück)',     wofuer: 'Getrennt für Polster, Kunststoff und Glas.' },
      { name: 'Detailbürsten',                  wofuer: 'Lüftungslamellen, Knopfränder, Nähte der Sitze.' },
    ],
    geraete: [
      'Profi-Werkstattsauger + Spezialaufsätze',
      'Druckluftpistole für Spalten und Lüftungen',
      'Detailbürsten in verschiedenen Härtegraden',
      'Polster-Aufschäumer für Pol Star',
      'Mikrofaser- und Carbon-Tücher',
    ],
    ablauf: [
      { titel: 'Ausräumen & Druckluft', beschreibung: 'Alles raus, Spalten und Ritzen mit Druckluft ausblasen – auch die Sitzschienen unter dem Sitz, da sammelt sich der meiste Staub.' },
      { titel: 'Aussaugen gründlich',   beschreibung: 'Sitze, Boden, Kofferraum, Hutablage. Sitze nach vorne und nach hinten, damit die Schienen erreichbar sind.' },
      { titel: 'Detailarbeit Spalten',  beschreibung: 'Lüftungslamellen, Knopfränder, Tachoeinfassung und Becherhalter mit Detailbürste und Mehrzweckreiniger.' },
      { titel: 'Kunststoff komplett',   beschreibung: 'Armaturen, Türverkleidungen, Mittelkonsole, B-Säulen und Dachhimmel-Griffe mit Mehrzweckreiniger feucht abwischen.' },
      { titel: 'Sitze tief reinigen',   beschreibung: 'Stoffsitze: Pol Star einarbeiten, mit Bürste leicht einbürsten, mit Mikrofaser auswischen. Lederteile: Leather Star – reinigt und pflegt in einem Schritt.' },
      { titel: 'Kofferraum',            beschreibung: 'Ausräumen, gründlich saugen, Boden und Seitenverkleidungen wischen, Ladekante kontrollieren.' },
      { titel: 'Scheiben rundum',       beschreibung: 'Alle Scheiben innen, auch Heckscheibe und Schiebedach falls vorhanden.' },
      { titel: 'Fresh Up Finish',       beschreibung: 'Leichte Geruchsneutralisierung in den Lüftungsstrom für frisches Innenklima.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'optional',
      platz: 'Trockener Stellplatz, gerne überdacht. Bei längerer Trocknungszeit der Sitze ist Schatten von Vorteil.',
      hinweis: 'Stoffsitze brauchen nach der Reinigung 1–3 Stunden zum Durchtrocknen. Wenn möglich, fahren wir bei trockenem Wetter mit leicht geöffneten Fenstern los.',
    },
    faqs: [
      FAQ_AUSRAEUMEN,
      FAQ_TIERHAARE,
      {
        frage: 'Wie lange dauert das Trocknen nach der Polsterreinigung?',
        antwort:
          'Stoffsitze sind nach 1–3 Stunden trocken. Bei trockenem Wetter und leicht geöffneten Fenstern geht es schneller. Wir vermeiden bewusst zu nassen Auftrag, damit Sie nicht stundenlang warten müssen.',
      },
      {
        frage: 'Haben Sie Erfahrung mit Lederpflege?',
        antwort:
          'Ja, wir nutzen Koch Chemie Leather Star – das ist ein professionelles Reinigungs- und Pflegemittel in einem. Es reinigt sanft, pflegt das Leder und schützt vor Rissen. Wir behandeln auch das Lenkrad und den Schaltknauf, die oft die meiste Pflege brauchen.',
      },
      FAQ_STELLPLATZ,
      FAQ_DAUER('2,5 Stunden'),
      FAQ_WEGGEHEN,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  innen_detail: {
    slug: 'innen-full-detail',
    kurzbeschreibung:
      'Die Königsdisziplin innen: Dampfreiniger, Fugen-Detailwork, Geruchsneutralisierung. Wie neu – ohne Übertreibung.',
    enthalten: [
      'Alles aus Innen Premium',
      'Dampfreinigung von Polstern, Lüftungen und Spalten',
      'Detailpflege aller Fugen, Knöpfe und Spaltmaße',
      'Teppiche und Bodenmatten intensiv mit Sprühextraktion',
      'Geruchsneutralisierung – inkl. Quellsuche',
      'Himmel-Reinigung (Decke innen)',
      'Sicherheitsgurte einzeln gereinigt',
    ],
    geeignet_fuer: [
      'Stark verschmutzte Innenräume',
      'Vor dem Verkauf bei höherwertigen Fahrzeugen',
      'Nach dem Kauf eines Gebrauchtwagens („einmal komplett zurücksetzen")',
      'Bei hartnäckigen Gerüchen (Hund, Sport, alte Flecken)',
    ],
    produkte: [
      { name: 'Koch Chemie Mehrzweckreiniger',  wofuer: 'Großflächig + verdünnt im Dampfreiniger einsetzbar.' },
      { name: 'Koch Chemie Pol Star',           wofuer: 'Polsterreinigung tief – mit Sprühextraktor in den Stoff einarbeiten.' },
      { name: 'Koch Chemie Leather Star',       wofuer: 'Lederpflege rundum, auch Lenkrad und Schaltknauf.' },
      { name: 'Koch Chemie Glass Cleaner',      wofuer: 'Alle Scheiben inkl. Innenseite Heckscheibe und Schiebedach.' },
      { name: 'Fresh Up',                       wofuer: 'Quellenbasierte Geruchsneutralisierung – kein simples Übersprühen.' },
      { name: 'Detailbürsten + Carbon-Tücher',  wofuer: 'Filigrane Stellen, Touchscreens, Hochglanzleisten.' },
    ],
    geraete: [
      'Profi-Dampfreiniger (löst Verkrustungen ohne aggressive Chemie)',
      'Sprühextraktor (Polster: einsprühen → einwirken → wieder absaugen)',
      'Profi-Werkstattsauger + Spezialaufsätze',
      'Druckluftpistole',
      'Detailbürsten (weich für Leder bis hart für Teppich)',
      'UV-Lampe für Quellsuche bei Gerüchen / Flecken',
      'Mikrofaser- und Carbon-Tücher (mehrere Sets)',
    ],
    ablauf: [
      { titel: 'Komplett ausräumen',     beschreibung: 'Fußmatten, Sitzbezüge falls vorhanden, alles raus. Sitze ggf. nach vorne und nach hinten geschoben, um die Schienen frei zu machen.' },
      { titel: 'Druckluft + Bürste tief', beschreibung: 'Lüftungslamellen, Ablagen, Türtaschen, Sicherheitsgurt-Aufroller, Spalten zwischen Sitz und Mittelkonsole.' },
      { titel: 'Aussaugen intensiv',     beschreibung: 'Mit Spezialdüsen jede Ritze, Sitz vor und zurück, Kofferraum und Reserveradmulde.' },
      { titel: 'Dampfreinigung',         beschreibung: 'Lüftungsschlitze, Becherhalter, Türgriffe, Polsterflecken, Sicherheitsgurte (einzeln rausziehen, dämpfen, abwischen).' },
      { titel: 'Polster Sprühextraktion', beschreibung: 'Sitze und Teppiche mit Pol Star + Sprühextraktor in mehreren Durchgängen, bis das aufgenommene Wasser wieder klar ist. Trocknet anders als Shampoo schneller und ohne Stockflecken.' },
      { titel: 'Himmel reinigen',        beschreibung: 'Decke innen vorsichtig mit feuchtem Tuch oder Dampf – nie satt, sonst löst sich die Verklebung.' },
      { titel: 'Kunststoff und Leder',   beschreibung: 'Alle Kunststoffflächen mit Mehrzweckreiniger, alle Lederteile mit Leather Star (auch Lenkrad und Schaltknauf).' },
      { titel: 'Scheiben',               beschreibung: 'Alle Scheiben innen, inklusive der schwer erreichbaren Heckscheibe und Schiebedach.' },
      { titel: 'Geruch neutralisieren',  beschreibung: 'Erst Geruchsquelle suchen (oft Klimaanlage oder Sitz), dann mit Fresh Up gezielt behandeln, nicht einfach übersprühen.' },
      { titel: 'Qualitätskontrolle',     beschreibung: 'Gemeinsam mit Ihnen durchsehen – wenn etwas nicht passt, gehen wir nochmal ran.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'noetig',
      platz: 'Überdachter, trockener Stellplatz dringend empfohlen (Carport / Garage). Mindestens 4 Stunden ohne Witterungseinfluss.',
      hinweis: 'Für die Sprühextraktion und den Dampfreiniger brauchen wir definitiv eine 220V-Steckdose. Wenn keine in der Nähe ist, sagen Sie uns das vorher – wir können dann mit Verlängerung arbeiten oder einen Generator mitbringen.',
    },
    faqs: [
      FAQ_AUSRAEUMEN,
      FAQ_TIERHAARE,
      {
        frage: 'Bekommen Sie auch starke Gerüche raus (Rauch, Hund, Flecken)?',
        antwort:
          'In den meisten Fällen ja, mit der Kombination aus Dampfreinigung und Fresh Up. Bei sehr starkem Nikotingeruch empfehlen wir zusätzlich eine Ozonbehandlung – das ist ein Sonderaufpreis und braucht ca. 4 Stunden Standzeit. Wir besprechen das offen mit Ihnen vorher, denn 100 % Garantie kann seriös niemand geben.',
      },
      {
        frage: 'Was ist Sprühextraktion?',
        antwort:
          'Das Profi-Verfahren für tiefe Polsterreinigung: das Reinigungsmittel wird unter Druck in die Faser gesprüht und sofort wieder mit Schmutz abgesaugt – nicht eingerieben wie bei Shampoo. Vorteil: schnellere Trocknung (1–3 Stunden), keine Stockflecken, deutlich tiefere Reinigung.',
      },
      {
        frage: 'Brauchen Sie Strom von mir?',
        antwort:
          'Ja, für Full Detail unbedingt. Sprühextraktor und Dampfreiniger sind starke Geräte und brauchen eine normale 220V-Steckdose in der Nähe (Verlängerung haben wir dabei). Falls Sie keinen Stromanschluss am Stellplatz haben, sagen Sie uns das vorher – dann bringen wir einen Generator mit.',
      },
      FAQ_STELLPLATZ,
      FAQ_DAUER('4 Stunden'),
      FAQ_WEGGEHEN,
      FAQ_ZAHLUNG,
    ],
    hinweise: [
      'Bei starkem Nikotingeruch empfehlen wir zusätzlich eine Ozonbehandlung – das besprechen wir vorab offen mit Ihnen.',
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  komplett_basic: {
    slug: 'komplett-basic',
    kurzbeschreibung:
      'Außen-Handwäsche kombiniert mit der Innen-Grundreinigung – das beste Preis-Leistungs-Verhältnis dank 30 % Bündelrabatt.',
    enthalten: [
      'Komplette Außenreinigung (siehe Außen-Paket)',
      'Komplette Innenreinigung Basic',
      '30 % Bündelrabatt gegenüber Einzelbuchung',
    ],
    geeignet_fuer: [
      'Wenn das Auto innen und außen einen Frischekick braucht',
      'Regelmäßige Komplettpflege alle 2–3 Monate',
      'Pendler-Autos mit normalem Alltagsschmutz',
    ],
    produkte: [
      { name: 'Außen-Setup: Felgenreiniger, Snow Foam, Green Star, Insektenreiniger', wofuer: 'Komplette Außenreinigung – siehe Detail beim Außen-Paket.' },
      { name: 'Innen-Setup: Mehrzweckreiniger, Pol Star, Glass Cleaner',              wofuer: 'Innenreinigung Basic – Kunststoff, Polster, Glas.' },
      { name: 'Mikrofasertücher + Carbon Tuch',                                       wofuer: 'Strikt getrennt nach Bereich (Lack / Glas / Innen / Polster).' },
      { name: 'Saugstarkes Trockentuch',                                              wofuer: 'Außen-Finish ohne Streifen.' },
    ],
    geraete: [
      'Außen: Hochdruckreiniger, Schaumlanze, 2 Eimer, Waschhandschuh, Felgenbürsten',
      'Innen: Profi-Werkstattsauger, Detailbürsten, Druckluft, Sprühflaschen',
      'Eigener mobiler Wassertank',
      'Mikrofaser-Sets (mehrere Tücher pro Bereich)',
    ],
    ablauf: [
      { titel: 'Felgen + Insekten einsprühen', beschreibung: 'Felgenreiniger und Insektenreiniger einwirken lassen – nutzt die Zeit, in der wir innen arbeiten.' },
      { titel: 'Innen ausräumen & saugen',     beschreibung: 'Fußmatten raus, Sitze und Boden gründlich saugen, Spalten ausblasen.' },
      { titel: 'Außen Schaumbad',              beschreibung: 'Snow Foam einschäumen, einwirken lassen.' },
      { titel: 'Innen weiterarbeiten',         beschreibung: 'Armaturen wischen, Polster auffrischen, Scheiben innen – während außen der Schaum einwirkt.' },
      { titel: 'Außen Handwäsche',             beschreibung: 'Zwei-Eimer-Methode, von oben nach unten. Felgen separat schrubben.' },
      { titel: 'Klarspülen + Trocknen',        beschreibung: 'Komplett abspülen, mit Trockentuch abnehmen.' },
      { titel: 'Finish',                       beschreibung: 'Scheiben außen, Reifenpflege, Türrahmen, Fußmatten zurück – Übergabe.' },
    ],
    voraussetzungen: {
      wasser: 'optional',
      strom: 'optional',
      platz: 'Ebener Stellplatz mit ca. 1 m Platz an jeder Fahrzeugseite. Schatten/Carport ideal.',
      hinweis: 'Wir bringen Wassertank und Akku-Geräte mit. Wasseranschluss und Steckdose sind willkommen, aber nicht zwingend.',
    },
    faqs: [
      FAQ_AUSRAEUMEN,
      {
        frage: 'Brauchen Sie Wasser- und Stromanschluss?',
        antwort:
          'Nein, beides nicht zwingend. Wir haben unseren eigenen Wassertank und Akku-Werkzeuge dabei. Wenn beides vorhanden ist (Außenhahn + Steckdose), ist es für uns natürlich praktisch – sagen Sie uns das einfach vorher.',
      },
      FAQ_STELLPLATZ,
      FAQ_DAUER('3 Stunden'),
      FAQ_WETTER,
      FAQ_WEGGEHEN,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  komplett_premium: {
    slug: 'komplett-premium',
    kurzbeschreibung:
      'Unser beliebtestes Paket: Außenwäsche + tiefe Innenreinigung mit Polsterbehandlung. Spürbar sauberer als gewohnt.',
    enthalten: [
      'Komplette Außenreinigung',
      'Komplette Innenreinigung Premium (Polster, Türen, Kofferraum, Lederpflege)',
      '30 % Bündelrabatt gegenüber Einzelbuchung',
    ],
    geeignet_fuer: [
      'Familienautos und Dienstwagen',
      'Vorbereitung auf Verkauf / Inzahlungnahme',
      'Saisonale Komplettpflege (Frühjahr / Herbst)',
    ],
    produkte: [
      { name: 'Außen-Setup komplett',           wofuer: 'Felgenreiniger, Snow Foam, Green Star, Insektenreiniger, Vorreiniger.' },
      { name: 'Innen-Premium-Setup',            wofuer: 'Mehrzweckreiniger, Pol Star, Leather Star, Glass Cleaner.' },
      { name: 'Fresh Up',                       wofuer: 'Frischer Innenraum-Geruch zum Abschluss.' },
      { name: 'Detailbürsten',                  wofuer: 'Lüftungsschlitze, Nähte, Knopfränder, Tankrahmen.' },
      { name: 'Saugstarkes Trockentuch',        wofuer: 'Streifenfreies Außen-Finish.' },
    ],
    geraete: [
      'Außen: Hochdruckreiniger, Schaumlanze, 2 Eimer mit Grit Guards, Waschhandschuh, Felgenbürsten lang+kurz',
      'Innen: Profi-Werkstattsauger, Polster-Aufschäumer, Detailbürsten, Druckluft',
      'Eigener mobiler Wassertank (ca. 100 L)',
      'Mehrere Mikrofaser-Sets, Carbon-Tücher',
    ],
    ablauf: [
      { titel: 'Felgen + Insekten einsprühen', beschreibung: 'Felgenreiniger und Insektenreiniger satt auftragen.' },
      { titel: 'Innen komplett ausräumen',     beschreibung: 'Alles raus, Druckluft in Spalten und Lüftungen.' },
      { titel: 'Innen intensiv saugen',        beschreibung: 'Sitze nach vorne und hinten, Schienen, Kofferraum, Reserveradmulde.' },
      { titel: 'Außen Schaumbad',              beschreibung: 'Snow Foam einwirken lassen.' },
      { titel: 'Innen Kunststoff + Detail',    beschreibung: 'Armaturen, Türverkleidungen, Lüftungslamellen, Knöpfe mit Detailbürste.' },
      { titel: 'Innen Polster + Leder',        beschreibung: 'Pol Star auf Stoffsitze einarbeiten, Lederteile mit Leather Star reinigen und pflegen.' },
      { titel: 'Außen Handwäsche',             beschreibung: 'Zwei-Eimer-Methode, Felgen schrubben, Türfalze mit Green Star.' },
      { titel: 'Klarspülen + Trocknen',        beschreibung: 'Mit klarem Wasser abspülen, mit Trockentuch ohne Druck abnehmen.' },
      { titel: 'Innen Scheiben + Geruch',      beschreibung: 'Alle Scheiben innen mit Glass Cleaner, Fresh Up als Finish.' },
      { titel: 'Außen Finish',                 beschreibung: 'Scheiben außen, Reifenpflege, Tankdeckel, Übergabe nach gemeinsamer Sichtkontrolle.' },
    ],
    voraussetzungen: {
      wasser: 'optional',
      strom: 'optional',
      platz: 'Trockener Stellplatz mit ca. 1 m Platz rundum. Carport/Garage hilfreich, weil die Sitze nach der Polsterbehandlung 1–3 Stunden trocknen.',
      hinweis: 'Steckdose und Außenwasserhahn willkommen, aber nicht zwingend – wir bringen Wassertank und Akku-Geräte mit.',
    },
    faqs: [
      FAQ_AUSRAEUMEN,
      FAQ_TIERHAARE,
      {
        frage: 'Brauchen Sie Wasser- und Stromanschluss?',
        antwort:
          'Beides nicht zwingend. Wir haben unseren eigenen Wassertank und Akku-Geräte. Wenn Sie aber einen Außenwasserhahn und/oder eine Steckdose haben, sagen Sie uns das gerne – das macht es für uns einfacher.',
      },
      {
        frage: 'Wie lange sind die Sitze danach feucht?',
        antwort:
          'Stoffsitze sind nach 1–3 Stunden trocken. Wir arbeiten bewusst nicht zu nass, damit Sie nicht stundenlang warten müssen. Bei trockenem Wetter und leicht geöffneten Fenstern geht es schneller.',
      },
      FAQ_STELLPLATZ,
      FAQ_DAUER('4 Stunden'),
      FAQ_WETTER,
      FAQ_WEGGEHEN,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  komplett_detail: {
    slug: 'komplett-full-detail',
    kurzbeschreibung:
      'Maximale Aufbereitung außen und innen. Wenn nur das beste Ergebnis zählt – ideal für hochwertige Fahrzeuge oder vor dem Verkauf.',
    enthalten: [
      'Komplette Außenreinigung',
      'Komplette Innenreinigung Full Detail (Dampfreiniger, Fugen, Geruchsneutralisierung)',
      '30 % Bündelrabatt gegenüber Einzelbuchung',
    ],
    geeignet_fuer: [
      'Hochwertige Fahrzeuge und Liebhaberautos',
      'Vor Verkauf oder Inzahlungnahme zum besten Preis',
      'Gebrauchtwagen-Kauf: einmal alles auf Neuzustand bringen',
    ],
    produkte: [
      { name: 'Außen-Setup komplett',           wofuer: 'Felgenreiniger, Snow Foam, Green Star, Insektenreiniger, Vorreiniger.' },
      { name: 'Innen-Full-Detail-Setup',        wofuer: 'Mehrzweckreiniger, Pol Star, Leather Star, Glass Cleaner.' },
      { name: 'Fresh Up',                       wofuer: 'Geruchsneutralisierung mit Quellsuche.' },
      { name: 'Detailbürsten + Carbon-Tücher',  wofuer: 'Filigrane Stellen, Hochglanzleisten, Bildschirme.' },
    ],
    geraete: [
      'Außen: Hochdruckreiniger, Schaumlanze, 2 Eimer mit Grit Guards, Waschhandschuh, Felgenbürsten',
      'Innen: Profi-Dampfreiniger + Sprühextraktor + Werkstattsauger',
      'Druckluftpistole, Detailbürsten in verschiedenen Härtegraden',
      'UV-Lampe für Geruchsquellsuche',
      'Eigener mobiler Wassertank',
      'Mehrere Mikrofaser- und Carbon-Tuch-Sets',
    ],
    ablauf: [
      { titel: 'Felgen + Insekten + Vorreiniger',    beschreibung: 'Außen-Vorbehandlung großzügig auftragen, dann zur Innen-Arbeit.' },
      { titel: 'Innen komplett ausräumen',           beschreibung: 'Alles raus, Sitze in alle Positionen, Druckluft in jede Ritze.' },
      { titel: 'Saugen mit Spezialaufsätzen',        beschreibung: 'Sitze, Boden, Spalten, Hutablage, Reserveradmulde, jeder Becherhalter.' },
      { titel: 'Außen Schaumbad',                    beschreibung: 'Snow Foam komplett, Einwirkzeit nutzen wir innen.' },
      { titel: 'Dampfreinigung innen',               beschreibung: 'Lüftungen, Becherhalter, Sicherheitsgurte einzeln, Polsterflecken, Türgriffe.' },
      { titel: 'Außen Handwäsche',                   beschreibung: 'Zwei-Eimer-Methode, Felgen separat, Türfalze.' },
      { titel: 'Innen Sprühextraktion',              beschreibung: 'Sitze und Teppiche tief reinigen, mehrere Durchgänge bis das Wasser klar zurückkommt.' },
      { titel: 'Außen klarspülen + trocknen',        beschreibung: 'Mit klarem Wasser ab, mit Trockentuch abtupfen.' },
      { titel: 'Innen Kunststoff + Leder + Himmel',  beschreibung: 'Alle Kunststoffe mit Mehrzweckreiniger, Leder mit Leather Star, Himmel vorsichtig dampfreinigen.' },
      { titel: 'Scheiben rundum',                    beschreibung: 'Innen und außen, inklusive Heckscheibe und Schiebedach.' },
      { titel: 'Geruchsneutralisierung',             beschreibung: 'Quelle suchen, mit Fresh Up gezielt behandeln, nicht einfach übersprühen.' },
      { titel: 'Außen Finish + Übergabe',            beschreibung: 'Reifenpflege, Tankdeckel, finale Sichtkontrolle gemeinsam mit Ihnen.' },
    ],
    voraussetzungen: {
      wasser: 'optional',
      strom: 'noetig',
      platz: 'Überdachter, trockener Stellplatz dringend empfohlen. Mindestens 5–6 Stunden ohne Witterungseinfluss.',
      hinweis: 'Für Sprühextraktor und Dampfreiniger ist eine 220V-Steckdose Pflicht. Wenn keine in der Nähe ist, bringen wir einen Generator mit (bitte vorher Bescheid sagen).',
    },
    faqs: [
      FAQ_AUSRAEUMEN,
      FAQ_TIERHAARE,
      {
        frage: 'Was unterscheidet Full Detail von Premium?',
        antwort:
          'Bei Premium reinigen wir die Polster mit Spray + Mikrofaser, bei Full Detail kommt zusätzlich der Sprühextraktor und Dampfreiniger zum Einsatz. Das löst tief eingearbeiteten Schmutz, neutralisiert Gerüche an der Quelle und reinigt auch die Lüftungen und Spalten, die sonst nie sauber werden. Bei einem stark verlebten Auto ist der Unterschied deutlich sichtbar.',
      },
      {
        frage: 'Wie lange dauert es?',
        antwort:
          'Bei einem typischen Pkw ca. 5,5 Stunden reine Arbeitszeit. Bei stark verschmutzten Fahrzeugen oder großen SUVs kann es länger werden – ggf. teilen wir den Termin auf zwei Tage auf, damit wir keine Schnellschüsse machen müssen.',
      },
      {
        frage: 'Brauchen Sie Strom von mir?',
        antwort:
          'Ja, für Full Detail unbedingt – Sprühextraktor und Dampfreiniger sind starke Geräte und brauchen eine normale 220V-Steckdose. Verlängerung haben wir dabei. Falls Sie keinen Anschluss am Stellplatz haben, sagen Sie uns das vorher, dann bringen wir einen Generator mit.',
      },
      {
        frage: 'Bekommen Sie auch starke Gerüche raus?',
        antwort:
          'In den meisten Fällen ja. Bei sehr starkem Nikotingeruch empfehlen wir zusätzlich eine Ozonbehandlung als Sonderaufpreis. Wir besprechen das offen mit Ihnen vorher – 100 % Garantie kann seriös niemand geben, aber unsere Erfolgsquote ist hoch.',
      },
      FAQ_STELLPLATZ,
      FAQ_WETTER,
      FAQ_WEGGEHEN,
      FAQ_ZAHLUNG,
    ],
    hinweise: [
      'Bei stark verschmutzten Fahrzeugen kann der Termin auf zwei Tage verteilt werden – wir besprechen das vorab.',
    ],
  },
};
