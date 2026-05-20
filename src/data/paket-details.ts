import type { PaketTyp } from './preise';

export interface PaketDetail {
  slug: string;
  kurzbeschreibung: string;
  enthalten: string[];
  geeignet_fuer: string[];
  hinweise?: string[];
}

export const PAKET_DETAILS: Record<PaketTyp, PaketDetail> = {
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
  },
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
  },
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
  },
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
    hinweise: [
      'Bei starkem Nikotingeruch empfehlen wir zusätzlich eine Ozonbehandlung – das besprechen wir vorab offen mit Ihnen.',
    ],
  },
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
  },
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
  },
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
    hinweise: [
      'Bei stark verschmutzten Fahrzeugen kann der Termin auf zwei Tage verteilt werden – wir besprechen das vorab.',
    ],
  },
};
