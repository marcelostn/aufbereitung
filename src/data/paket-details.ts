import type { PaketTyp } from './preise';
import type { LkwPaketTyp } from './lkw';

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

// ── Nutzfahrzeug-spezifische FAQs ───────────────────────────────────────────
const FAQ_NF_AUSRAEUMEN: PaketFAQ = {
  frage: 'Muss ich Werkzeug, Papiere und Ladegut vorher aus der Kabine räumen?',
  antwort:
    'Ja, bitte. Werkzeug, Bordbuch, Tachoscheiben und persönliche Dinge nehmen Sie am besten vorher heraus – das schützt Ihre Sachen und wir kommen besser an alle Ecken. Was unsicher ist (lose Münzen, Stempel, Tankquittungen), legen wir in eine kleine Box auf den Beifahrersitz, damit nichts verloren geht.',
};

const FAQ_NF_HOF: PaketFAQ = {
  frage: 'Können Sie auch auf unserem Betriebshof aufbereiten?',
  antwort:
    'Sehr gerne. Auf dem Betriebshof ist es für beide Seiten am einfachsten – wir kommen mit Anhänger + Wasser/Strom-Eigenversorgung. Bei mehreren Fahrzeugen vor Ort gibt es ab 3 Fahrzeugen einen Mengenrabatt von 10 % auf die Endsumme.',
};

const FAQ_NF_MAEUSEKOT: PaketFAQ = {
  frage: 'Wir haben Mäusekot in der Kabine – ist das ein Problem?',
  antwort:
    'Kein Problem, das ist bei längerer Standzeit (Saisontraktor, Wochenend-LKW) leider keine Seltenheit. Wir reinigen mit Schutzausrüstung und Desinfektionsmittel – Aufpreis 45 € für die zusätzliche Hygienebehandlung. Sagen Sie uns vorher Bescheid, dann nehmen wir das richtige Material mit.',
};

const FAQ_NF_GERUCH: PaketFAQ = {
  frage: 'Bekommen Sie Diesel-, Schweiß- oder Tierhaltergeruch raus?',
  antwort:
    'Bei Premium und Full Detail in den meisten Fällen ja – wir arbeiten mit Polster-Tiefenreinigung und Geruchsneutralisator. Bei sehr starkem oder eingelebtem Geruch (Jahrzehnte alter LKW, Tiertransporter) empfehlen wir zusätzlich Full Detail oder eine Ozonbehandlung. Wir besprechen das vor Auftragsbeginn offen mit Ihnen.',
};

const FAQ_NF_DOWNTIME: PaketFAQ = {
  frage: 'Wie lange steht mein Fahrzeug?',
  antwort:
    'Reine Arbeitszeit + ca. 30–60 Minuten Trocknung bei den Premium-/Full-Detail-Paketen (Polster nass behandelt). Wir terminieren am besten in eine planbare Standzeit (Wochenende, Wartungstag) – sprechen Sie uns an, wir richten uns nach Ihrem Einsatzplan.',
};

const FAQ_NF_RECHNUNG: PaketFAQ = {
  frage: 'Bekomme ich eine ordentliche Firmenrechnung mit ausgewiesener MwSt.?',
  antwort:
    'Selbstverständlich. Sie erhalten eine §14 UStG-konforme Rechnung mit unserer Steuernummer / USt-IdNr. – per E-Mail als PDF, gerne auch ausgedruckt mit dem Fahrzeug zusammen.',
};

// ── LKW / Traktor / Transporter – Detailseiten ──────────────────────────────
export const LKW_PAKET_DETAILS: Record<LkwPaketTyp, PaketDetail> = {

  // ────────────────────────────────────────────────────────────────────────────
  lkw_basic: {
    slug: 'lkw-basic',
    kurzbeschreibung:
      'Sicht­auffrischung für die Fahrerkabine: aussaugen, Armaturen entstauben, Scheiben innen. Das richtige Paket vor der Vorführung beim TÜV oder bei wenig Zeit zwischen zwei Touren.',
    enthalten: [
      'Komplettes Aussaugen Fahrer-/Beifahrerbereich + Boden',
      'Armaturen und Mittelkonsole feucht abwischen',
      'Lenkrad, Schalthebel, Türgriffe reinigen',
      'Scheiben innen streifenfrei',
      'Fußmatten ausklopfen und aussaugen',
      'Liegeplatte oberflächlich (sofern vorhanden, keine Polsterbehandlung)',
    ],
    geeignet_fuer: [
      'Vor TÜV / SP / UVV-Vorführung – sauberer Eindruck im Cockpit',
      'Zwischenreinigung bei Fahrerwechsel',
      'Wenn Zeit knapp ist, aber der Wagen wieder „präsentabel" wirken soll',
    ],
    produkte: [
      { name: 'Koch Chemie Top Star',           wofuer: 'Innenraumreiniger für Armaturen, Kunststoff und Türverkleidungen – ohne Glanzbildung, daher rutschsicher am Lenkrad.' },
      { name: 'Koch Chemie Plast Star',         wofuer: 'Kunststoffpflege für Armaturenträger und Türverkleidungen – matter Auffrischer, kein „Plastik-Look".' },
      { name: 'Glasreiniger',                   wofuer: 'Streifenfrei für die großen Frontscheiben, auch bei Sonneneinstrahlung.' },
      { name: 'Mikrofasertücher (mehrere)',     wofuer: 'Getrennt für Armaturen, Glas und Lenkrad – keine Kreuzkontamination.' },
    ],
    geraete: [
      'Profi-Werkstattsauger mit langer Düse für Spalten',
      'Druckluft-Bläser für Lüftungsschlitze und Schalter',
      'Mikrofasertücher in vier Farben (Bereichstrennung)',
    ],
    ablauf: [
      { titel: 'Vorbereitung & Sichtprüfung', beschreibung: 'Wir gehen die Kabine mit Ihnen kurz durch: lose Sachen, sensible Bereiche, Tachoscheiben. Fußmatten raus, Sitze in Reinigungsposition.' },
      { titel: 'Aussaugen', beschreibung: 'Komplette Saugarbeit: Sitzritzen, Boden, Liegeplatte, Fußraum, Pedalbereich, hinter den Sitzen. Mit der langen Düse auch zwischen Sitz und Konsole.' },
      { titel: 'Armaturen & Bedienelemente', beschreibung: 'Cockpit feucht abwischen, Lenkrad und Schaltgriff entfetten, Türgriffe und Bedienelemente einzeln nachreinigen.' },
      { titel: 'Scheiben innen', beschreibung: 'Front-, Seiten- und Heckscheibe innen mit Glasreiniger und Profi-Tuch – streifenfrei und ohne Schlieren.' },
      { titel: 'Endkontrolle', beschreibung: 'Gemeinsame Endabnahme. Fußmatten zurück, Sitze in Fahrposition, Schlüssel zurück.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'optional',
      platz: 'Ebener Stand auf Hof, Werkstatt oder Parkplatz. Wir brauchen nur Platz, um die Türen weit zu öffnen.',
      hinweis: 'Wir kommen sehr gerne auf Ihren Betriebshof. Strom ist für Basic nicht zwingend nötig – ein 220V-Anschluss in der Nähe ist nice-to-have, kein Muss.',
    },
    faqs: [
      FAQ_DAUER('1,5 Std.'),
      FAQ_NF_AUSRAEUMEN,
      FAQ_NF_HOF,
      FAQ_NF_RECHNUNG,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  lkw_premium: {
    slug: 'lkw-premium',
    kurzbeschreibung:
      'Die gründliche Innenaufbereitung der Fahrerkabine: alles aus Basic plus Polster- und Teppichreinigung, Armaturenpflege, Liegeplatte. Das passende Paket nach längerer Strecke oder Fahrerwechsel.',
    enthalten: [
      'Alles aus Basic (Aussaugen, Armaturen, Scheiben)',
      'Sitzpolster reinigen (Stoff oder Kunstleder, je nach Ausstattung)',
      'Türverkleidungen tief reinigen',
      'Liegeplatte aufbereiten inkl. Matratzenoberfläche',
      'Bodenmatten und Teppichbereiche shampoonieren',
      'Lüftungslamellen entstauben',
      'Geruchsneutralisierung mit Frische-Spray',
    ],
    geeignet_fuer: [
      'Nach längerer Tour / Auslandsfahrt',
      'Bei Fahrerwechsel – der neue Fahrer übernimmt ein „frisches" Cockpit',
      'Vor wichtigen Kundenterminen, bei denen Sie den LKW vorfahren',
    ],
    produkte: [
      { name: 'Koch Chemie Top Star',           wofuer: 'Universal-Innenraumreiniger für Kunststoffe, Türverkleidungen und Armaturen.' },
      { name: 'Koch Chemie Pol Star',           wofuer: 'Polsterreiniger für Sitze, Liegeplatte und Bodenmatten – mit Sprühextraktor in den Stoff einarbeiten.' },
      { name: 'Koch Chemie Leather Star',       wofuer: 'Lederpflege für Kunstleder-Sitzbezüge und Lenkradkränze – reinigt und konserviert in einem Schritt.' },
      { name: 'Koch Chemie Plast Star',         wofuer: 'Matte Pflege für Armaturenträger und Türverkleidungen.' },
      { name: 'Glasreiniger',                   wofuer: 'Streifenfrei für alle Scheiben innen.' },
      { name: 'Geruchsneutralisator',           wofuer: 'Bindet Geruchsmoleküle statt sie nur zu überdecken – frischer Cockpitgeruch ohne aufdringliches Parfum.' },
    ],
    geraete: [
      'Profi-Werkstattsauger',
      'Sprühextraktor für Polster (einsprühen → einwirken → wieder absaugen)',
      'Druckluft-Bläser für Lüftungen und Schalter',
      'Bürsten in 3 Härtegraden für Polsterstoff',
      'Mikrofasertücher in vier Farben',
    ],
    ablauf: [
      { titel: 'Vorbereitung & Sichtprüfung', beschreibung: 'Wir gehen die Kabine mit Ihnen durch, fotografieren auf Wunsch den Ausgangszustand und besprechen empfindliche Stellen.' },
      { titel: 'Vorreinigung', beschreibung: 'Grobschmutz raus, Fußmatten heraus, Sitze in Reinigungsposition.' },
      { titel: 'Aussaugen (gründlich)', beschreibung: 'Sitzritzen, Liegeplatte unter der Matratze, Fußraum, hinter den Sitzen, Ablagefächer.' },
      { titel: 'Polster-Behandlung', beschreibung: 'Sitze und Liegeplatte mit Pol Star und Sprühextraktor: einsprühen, einwirken, wieder absaugen. Mehrere Durchgänge bis das aufgenommene Wasser klar bleibt.' },
      { titel: 'Türverkleidungen & Armaturen', beschreibung: 'Vom Himmel abwärts: Türverkleidung, Mittelkonsole, Schalter, Lüftungslamellen, Becherhalter.' },
      { titel: 'Lederpflege', beschreibung: 'Lenkrad, Schaltknauf, ggf. Sitzbezüge mit Leather Star nachpflegen.' },
      { titel: 'Scheiben & Endkontrolle', beschreibung: 'Scheiben innen streifenfrei. Gemeinsame Endabnahme – Sie sitzen einmal Probe.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'noetig',
      platz: 'Ebener Stellplatz, Türen müssen weit auf. Idealerweise eine Halle oder ein Carport für Wetterschutz – wir können aber auch im Freien arbeiten.',
      hinweis: 'Für den Sprühextraktor brauchen wir eine 220V-Steckdose in der Nähe. Verlängerung haben wir dabei. Wenn keine Steckdose erreichbar ist, sagen Sie uns vorher Bescheid – wir bringen einen Generator mit.',
    },
    faqs: [
      FAQ_DAUER('3 Std.'),
      FAQ_NF_DOWNTIME,
      FAQ_NF_AUSRAEUMEN,
      FAQ_NF_GERUCH,
      FAQ_NF_HOF,
      FAQ_NF_RECHNUNG,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  lkw_detail: {
    slug: 'lkw-full-detail',
    kurzbeschreibung:
      'Die komplette Kabinen-Aufbereitung – alles aus Premium plus Dampfreinigung, Polster-Sprühextraktion in mehreren Durchgängen und gezielte Geruchsneutralisierung. Das richtige Paket vor Verkauf, Übergabe oder nach langer Standzeit.',
    enthalten: [
      'Alles aus Premium (Polster, Türen, Armaturen, Leder)',
      'Dampfreinigung Polster, Lüftungen und Fugen',
      'Polster-Sprühextraktion in mehreren Durchgängen',
      'Liegeplatte und Matratze tief aufbereiten',
      'Sicherheitsgurte einzeln reinigen',
      'Himmel reinigen (Vorsicht bei Stoff)',
      'Gezielte Geruchsneutralisierung an der Quelle (nicht nur Spray)',
      'Sonderaufpreis Mäusekot / Schimmel / Lebensmittelreste auf Wunsch',
    ],
    geeignet_fuer: [
      'Vor dem Verkauf oder der Übergabe an den Käufer',
      'Nach jahrelanger Nutzung oder Fahrerwechsel-Mehrfach-Belegung',
      'Wenn Geruch (Diesel, Nikotin, Tier) tief im Stoff sitzt',
      'Nach längerer Standzeit – Saisonbetrieb, Reservefahrzeug',
    ],
    produkte: [
      { name: 'Koch Chemie Top Star',           wofuer: 'Universal-Innenraumreiniger als Basis.' },
      { name: 'Koch Chemie Pol Star',           wofuer: 'Polsterreinigung tief – mit Sprühextraktor in den Stoff einarbeiten, mehrere Durchgänge.' },
      { name: 'Koch Chemie Leather Star',       wofuer: 'Lederpflege für Sitze, Lenkrad, Schaltknauf.' },
      { name: 'Koch Chemie Glass Cleaner',      wofuer: 'Streifenfrei für alle Scheiben innen.' },
      { name: 'Geruchsneutralisator (professionell)', wofuer: 'Bindet Moleküle, ersetzt sie nicht nur. Wirkung hält Wochen.' },
      { name: 'Desinfektionsreiniger',          wofuer: 'Für Lenkrad, Türgriffe, Schalter – Hygienestufe nach Bedarf.' },
    ],
    geraete: [
      'Profi-Werkstattsauger',
      'Sprühextraktor für Polster (mehrere Durchgänge)',
      'Profi-Dampfreiniger (löst tief sitzenden Schmutz in Polster und Lüftungen)',
      'Druckluft-Bläser für Lüftungslamellen und Fugen',
      'Polsterbürsten in 3 Härtegraden',
      'Mikrofasertücher in vier Farben (Bereichstrennung)',
    ],
    ablauf: [
      { titel: 'Bestandsaufnahme', beschreibung: 'Wir gehen die Kabine ausführlich mit Ihnen durch. Auf Wunsch Fotodokumentation des Ausgangszustands. Sonderzustände (Mäusekot, Schimmel, Lebensmittelreste) besprechen und mit passendem Aufpreis ansetzen.' },
      { titel: 'Vorreinigung & Aussaugen', beschreibung: 'Grobschmutz, Bodenmatten heraus, Fußraum und alle Ablagen leeren. Komplette Saugarbeit inkl. unter der Liegeplatte.' },
      { titel: 'Dampfreinigung', beschreibung: 'Lüftungen, Fugen, Spalten, Schalter, Türholme und Pedale werden mit Heißdampf gereinigt – löst Fett und Schmutz, der mit Tuch unerreichbar ist.' },
      { titel: 'Polster Sprühextraktion', beschreibung: 'Sitze, Liegeplatte und Bodenmatten mit Pol Star + Sprühextraktor in mehreren Durchgängen. Wir machen weiter, bis das aufgenommene Wasser wieder klar ist.' },
      { titel: 'Himmel & Säulen', beschreibung: 'Vorsichtige Reinigung des Dachhimmels – kein Druck auf den Schaumkern, damit sich nichts ablöst.' },
      { titel: 'Gurte & Detail-Bereiche', beschreibung: 'Sicherheitsgurte einzeln herausziehen und reinigen. Becherhalter, Aschenbecher, Türablagen – jede Ecke.' },
      { titel: 'Leder & Cockpit', beschreibung: 'Lenkrad, Schaltknauf und Lederbezüge mit Leather Star nachpflegen.' },
      { titel: 'Geruchsbehandlung', beschreibung: 'An der Quelle: Polster gezielt mit Geruchsneutralisator. Bei sehr starken Fällen Ozonbehandlung als Sonderaufpreis.' },
      { titel: 'Scheiben & Endkontrolle', beschreibung: 'Alle Scheiben innen streifenfrei. Gemeinsame Endabnahme mit Ihnen.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'noetig',
      platz: 'Ebener Stellplatz mit weit zu öffnenden Türen. Halle oder Carport ist ideal (Wetter, Trocknung), Freiluft geht auch.',
      hinweis: '220V-Steckdose Pflicht – Sprühextraktor und Dampfreiniger sind starke Geräte. Wenn am Stellplatz keine Steckdose erreichbar ist, sagen Sie uns vorher Bescheid, dann bringen wir einen Generator mit.',
    },
    faqs: [
      FAQ_DAUER('5 Std.'),
      FAQ_NF_DOWNTIME,
      FAQ_NF_MAEUSEKOT,
      FAQ_NF_GERUCH,
      FAQ_NF_AUSRAEUMEN,
      FAQ_NF_HOF,
      FAQ_NF_RECHNUNG,
      FAQ_ZAHLUNG,
    ],
    hinweise: [
      'Bei extrem verlebten oder kontaminierten Kabinen (z. B. Mäusekot großflächig, starker Schimmel) kann der Termin auf zwei Tage verteilt werden – wir besprechen das vorher.',
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  traktor_basic: {
    slug: 'traktor-basic',
    kurzbeschreibung:
      'Sichtbare Auffrischung der Traktorkabine: aussaugen, Armaturen entstauben, Scheiben innen. Ideal nach Erntearbeit oder vor der Vorführung.',
    enthalten: [
      'Komplettes Aussaugen Boden, Sitz, Beifahrer-Notsitz',
      'Armaturen, Lenkrad, Joystick und Bedienpanels feucht abwischen',
      'Scheiben innen rundum streifenfrei (Front, Heck, Seiten, Dach falls verglast)',
      'Fußmatten ausklopfen und aussaugen',
      'Türrahmen und Dichtungen reinigen',
    ],
    geeignet_fuer: [
      'Nach Erntesaison – Staub und Erntereste raus',
      'Vor TÜV / Vorführung beim Händler',
      'Vor Verkauf einer kürzlichen Maschine',
    ],
    produkte: [
      { name: 'Koch Chemie Top Star',           wofuer: 'Innenraumreiniger für die typische Mischung aus Staub, Schmieröl und Fett auf Armaturen.' },
      { name: 'Koch Chemie Plast Star',         wofuer: 'Kunststoffpflege für Armaturenträger und Verkleidungen – matt, nicht glänzend (rutschsicher).' },
      { name: 'Glasreiniger',                   wofuer: 'Streifenfrei für die typisch großen Traktor-Verglasungen.' },
      { name: 'Mikrofasertücher (mehrere)',     wofuer: 'Getrennt für Armaturen, Glas und Lenkrad.' },
    ],
    geraete: [
      'Profi-Werkstattsauger',
      'Druckluft-Bläser für Tasten, Bedienpanels und Lüftungsschlitze',
      'Lange Sauger-Düse für Spalten unter dem Sitz',
      'Mikrofasertücher in vier Farben',
    ],
    ablauf: [
      { titel: 'Vorbereitung', beschreibung: 'Sichtprüfung, lose Werkzeuge und Papiere raus, Sitz in Reinigungsposition. Bei Drehsitz: in beide Endpositionen.' },
      { titel: 'Aussaugen', beschreibung: 'Boden, Sitz, Notsitz, Ablagen, unter dem Sitz. Mit der langen Düse auch in die Bedienpanel-Fugen.' },
      { titel: 'Armaturen & Bedienelemente', beschreibung: 'Cockpit komplett: Joystick, Schalthebel, Tasten, Bedienpanels, Sicherungsfach.' },
      { titel: 'Druckluft für Fugen', beschreibung: 'Tasten, Schalter, Lüftungslamellen – mit Druckluft den Feinstaub austreiben, danach absaugen.' },
      { titel: 'Scheiben innen', beschreibung: 'Alle Verglasungen innen (auch Dachscheibe falls vorhanden) – streifenfrei.' },
      { titel: 'Endkontrolle', beschreibung: 'Gemeinsame Endabnahme.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'optional',
      platz: 'Ebener Stand, Tür/Stufe muss frei sein. Hof, Halle oder Feld-Rand – alles möglich.',
      hinweis: 'Wir kommen sehr gerne direkt auf den Hof. Strom ist bei Basic nicht zwingend, aber ein Anschluss in der Nähe ist nice-to-have.',
    },
    faqs: [
      FAQ_DAUER('1,5 Std.'),
      FAQ_NF_AUSRAEUMEN,
      FAQ_NF_HOF,
      FAQ_NF_RECHNUNG,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  traktor_premium: {
    slug: 'traktor-premium',
    kurzbeschreibung:
      'Die gründliche Kabinen-Aufbereitung beim Traktor: alles aus Basic plus Polster- und Bodenmatten-Reinigung, Lüftungen, Türverkleidungen. Frische Kabine für die neue Saison.',
    enthalten: [
      'Alles aus Basic (Aussaugen, Armaturen, Scheiben)',
      'Sitzpolster reinigen (Stoff oder Kunstleder)',
      'Türverkleidungen / Innenseiten tief reinigen',
      'Bodenmatten shampoonieren',
      'Notsitz und Ablagen aufbereiten',
      'Lüftungslamellen entstauben',
      'Geruchsneutralisierung',
    ],
    geeignet_fuer: [
      'Nach längerer Erntesaison',
      'Vor neuer Saison (Frühjahrs-Frischekur)',
      'Bei Fahrerwechsel auf dem Hof',
    ],
    produkte: [
      { name: 'Koch Chemie Top Star',           wofuer: 'Universal-Innenraumreiniger.' },
      { name: 'Koch Chemie Pol Star',           wofuer: 'Polsterreiniger für Sitz und Bodenmatten – Sprühextraktor sorgt für tiefe Reinigung.' },
      { name: 'Koch Chemie Leather Star',       wofuer: 'Lederpflege für Lenkrad und Lederbezüge.' },
      { name: 'Koch Chemie Plast Star',         wofuer: 'Matte Pflege für Armaturen und Verkleidungen.' },
      { name: 'Glasreiniger',                   wofuer: 'Streifenfrei für alle Verglasungen.' },
      { name: 'Geruchsneutralisator',           wofuer: 'Bindet Gerüche statt zu überdecken.' },
    ],
    geraete: [
      'Profi-Werkstattsauger',
      'Sprühextraktor für Polster',
      'Druckluft-Bläser',
      'Bürsten in 3 Härtegraden',
      'Mikrofasertücher in vier Farben',
    ],
    ablauf: [
      { titel: 'Vorbereitung', beschreibung: 'Sichtprüfung, lose Sachen raus, Sitz in Reinigungsposition. Bei Drehsitz beide Endpositionen.' },
      { titel: 'Vorreinigung & Aussaugen', beschreibung: 'Grobschmutz raus, Bodenmatten heraus, komplettes Aussaugen inkl. Sitzritzen und Ablagen.' },
      { titel: 'Polster Sprühextraktion', beschreibung: 'Sitz und Bodenmatten mit Pol Star + Sprühextraktor in mehreren Durchgängen.' },
      { titel: 'Türen & Armaturen', beschreibung: 'Türverkleidungen, Konsole, Joystick, Tasten – jede Ecke mit passendem Mittel.' },
      { titel: 'Lederpflege', beschreibung: 'Lenkrad und Lederbezüge mit Leather Star.' },
      { titel: 'Lüftungen & Geruchsbehandlung', beschreibung: 'Lüftungslamellen entstauben, Geruchsneutralisator zielgerichtet.' },
      { titel: 'Scheiben & Endkontrolle', beschreibung: 'Scheiben innen streifenfrei, gemeinsame Endabnahme.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'noetig',
      platz: 'Ebener Stand, Tür/Stufe frei. Halle ist ideal, geht aber auch im Freien bei trockenem Wetter.',
      hinweis: 'Für den Sprühextraktor 220V-Steckdose Pflicht. Verlängerung haben wir dabei. Wenn keine Steckdose erreichbar ist, sagen Sie uns vorher Bescheid, dann bringen wir einen Generator mit.',
    },
    faqs: [
      FAQ_DAUER('3 Std.'),
      FAQ_NF_DOWNTIME,
      FAQ_NF_AUSRAEUMEN,
      FAQ_NF_GERUCH,
      FAQ_NF_HOF,
      FAQ_NF_RECHNUNG,
      FAQ_ZAHLUNG,
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  transporter_basic: {
    slug: 'transporter-basic',
    kurzbeschreibung:
      'Innenreinigung Fahrerhaus + Aussaugen Laderaum: das passende Paket für Handwerker-Transporter, Lieferfahrzeuge und Wochenend-Reset.',
    enthalten: [
      'Komplettes Aussaugen Fahrer-/Beifahrerbereich',
      'Armaturen, Lenkrad, Schalthebel reinigen',
      'Scheiben innen streifenfrei',
      'Fußmatten ausklopfen und aussaugen',
      'Laderaum aussaugen und ausfegen',
      'Trennwand/Trennnetz oberflächlich abwischen',
    ],
    geeignet_fuer: [
      'Handwerker-Transporter – wöchentlicher Reset',
      'Lieferfahrzeuge zwischen zwei Aufträgen',
      'Vor Übergabe an einen Kollegen',
    ],
    produkte: [
      { name: 'Koch Chemie Top Star',           wofuer: 'Innenraumreiniger für Armaturen.' },
      { name: 'Koch Chemie Plast Star',         wofuer: 'Kunststoffpflege.' },
      { name: 'Glasreiniger',                   wofuer: 'Streifenfrei für alle Scheiben.' },
      { name: 'Mikrofasertücher (mehrere)',     wofuer: 'Getrennt für Bereiche.' },
    ],
    geraete: [
      'Profi-Werkstattsauger mit langer Düse',
      'Besen + Kehrblech für Laderaum-Vorreinigung',
      'Druckluft-Bläser',
      'Mikrofasertücher in vier Farben',
    ],
    ablauf: [
      { titel: 'Vorbereitung', beschreibung: 'Sichtprüfung. Werkzeug, Material und persönliche Sachen aus dem Laderaum nehmen (so weit möglich).' },
      { titel: 'Laderaum auskehren', beschreibung: 'Grobschmutz, Sägespäne, Verpackungsreste mit Besen raus, dann komplett aussaugen.' },
      { titel: 'Fahrerhaus aussaugen', beschreibung: 'Sitze, Boden, Fußraum, Sitzritzen, hinter den Sitzen.' },
      { titel: 'Armaturen & Bedienelemente', beschreibung: 'Cockpit feucht abwischen, Lenkrad und Schaltknauf entfetten.' },
      { titel: 'Scheiben innen', beschreibung: 'Streifenfrei rundum, auch Heckklappenscheibe falls vorhanden.' },
      { titel: 'Endkontrolle', beschreibung: 'Gemeinsame Endabnahme, Fußmatten zurück.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'optional',
      platz: 'Ebener Stellplatz, Heck-/Schiebetüren müssen sich frei öffnen lassen.',
      hinweis: 'Strom ist für Basic nicht zwingend, aber praktisch. Wir kommen sehr gerne auf den Betriebshof.',
    },
    faqs: [
      FAQ_DAUER('2 Std.'),
      FAQ_NF_AUSRAEUMEN,
      FAQ_NF_HOF,
      FAQ_NF_RECHNUNG,
      FAQ_ZAHLUNG,
    ],
    hinweise: [
      'Bei stark verschmutztem Laderaum (Farbe, Kleber, Bauschutt) bitte vorher Bescheid geben – ggf. Aufpreis „Extreme Verschmutzung" 30 €.',
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  transporter_premium: {
    slug: 'transporter-premium',
    kurzbeschreibung:
      'Komplette Innenaufbereitung Fahrerhaus + Laderaum: Polsterbehandlung im Fahrerhaus, Laderaum gründlich, Trennwand-Aufbereitung. Vor Verkauf, nach langer Tour oder zur Frühjahrskur.',
    enthalten: [
      'Alles aus Basic (Aussaugen Fahrerhaus, Laderaum, Scheiben)',
      'Sitzpolster reinigen (Sprühextraktion)',
      'Türverkleidungen tief reinigen',
      'Bodenmatten shampoonieren',
      'Laderaumboden feucht aufbereiten',
      'Trennwand/Trennnetz und Laderaumwände reinigen',
      'Lüftungslamellen entstauben',
      'Geruchsneutralisierung',
    ],
    geeignet_fuer: [
      'Vor Verkauf oder Übergabe',
      'Nach langer Auslandsfahrt / Auslieferungstour',
      'Frühjahrskur für die Flotte',
    ],
    produkte: [
      { name: 'Koch Chemie Top Star',           wofuer: 'Universal-Innenraumreiniger.' },
      { name: 'Koch Chemie Pol Star',           wofuer: 'Polsterreiniger für Sitze und Bodenmatten.' },
      { name: 'Koch Chemie Leather Star',       wofuer: 'Lederpflege.' },
      { name: 'Koch Chemie Green Star',         wofuer: 'Universalreiniger für Laderaumboden und Trennwand.' },
      { name: 'Glasreiniger',                   wofuer: 'Streifenfrei für alle Scheiben.' },
      { name: 'Geruchsneutralisator',           wofuer: 'Bindet Gerüche.' },
    ],
    geraete: [
      'Profi-Werkstattsauger',
      'Sprühextraktor für Polster',
      'Bürsten in 3 Härtegraden',
      'Druckluft-Bläser',
      'Mikrofasertücher in vier Farben',
    ],
    ablauf: [
      { titel: 'Vorbereitung', beschreibung: 'Sichtprüfung, Werkzeug und Material aus Laderaum nehmen.' },
      { titel: 'Laderaum vorbereiten', beschreibung: 'Auskehren, dann aussaugen. Trennwand/Trennnetz prüfen.' },
      { titel: 'Fahrerhaus aussaugen', beschreibung: 'Komplette Saugarbeit inkl. Sitzritzen, Ablagen, unter den Sitzen.' },
      { titel: 'Polster Sprühextraktion', beschreibung: 'Sitze und Bodenmatten mit Pol Star + Sprühextraktor.' },
      { titel: 'Laderaum feucht', beschreibung: 'Laderaumboden mit Green Star + Bürste; Wände abwischen; Trennwand reinigen.' },
      { titel: 'Türen & Armaturen', beschreibung: 'Türverkleidungen, Konsole, Schalter, Lüftungen.' },
      { titel: 'Lederpflege & Cockpit', beschreibung: 'Lenkrad und Lederteile mit Leather Star.' },
      { titel: 'Geruchsbehandlung', beschreibung: 'Geruchsneutralisator zielgerichtet ins Polster und in den Laderaum.' },
      { titel: 'Scheiben & Endkontrolle', beschreibung: 'Scheiben innen streifenfrei, gemeinsame Endabnahme.' },
    ],
    voraussetzungen: {
      wasser: 'wir',
      strom: 'noetig',
      platz: 'Ebener Stellplatz, Heck-/Schiebetüren frei öffenbar. Halle/Carport ideal, geht aber auch im Freien.',
      hinweis: '220V-Steckdose Pflicht für Sprühextraktor. Verlängerung haben wir dabei. Wenn nicht erreichbar, vorher Bescheid geben – wir bringen einen Generator mit.',
    },
    faqs: [
      FAQ_DAUER('3,5 Std.'),
      FAQ_NF_DOWNTIME,
      FAQ_NF_GERUCH,
      FAQ_NF_MAEUSEKOT,
      FAQ_NF_AUSRAEUMEN,
      FAQ_NF_HOF,
      FAQ_NF_RECHNUNG,
      FAQ_ZAHLUNG,
    ],
    hinweise: [
      'Bei extrem verschmutztem Laderaum (Farbe, Bauschutt eingearbeitet) kann ein Aufpreis „Extreme Verschmutzung" 30 € nötig sein – wir besprechen das vor Auftragsbeginn.',
    ],
  },
};
