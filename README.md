# AutoAufbereitung Cloppenburg – Webseite

Lokale Firmen-Webseite mit integriertem Preisrechner. Gebaut mit Astro + Tailwind + React.

## Setup

```bash
npm install
npm run dev        # Entwicklungsserver auf http://localhost:4321
npm run build      # Statische Dateien in dist/
npm run test       # Kalkulationslogik-Tests
npm run check      # TypeScript + Astro-Diagnostik
```

## Inhalte ändern

### Preise anpassen

Alle Preise stehen zentral in `src/data/` – nur dort ändern:

| Datei          | Inhalt                                              |
|----------------|-----------------------------------------------------|
| `preise.ts`    | PKW-Pakete (Außen, Innen, Komplett)                 |
| `aufpreise.ts` | Tierhaare, Kindersitz, Nikotin, Fahrzeugzuschläge, Fahrtkosten |
| `lkw.ts`       | LKW / Traktor / Transporter Innenraum               |
| `firma.ts`     | Firmenname, Telefon, E-Mail, Adresse                |

### Firmenname / Kontaktdaten ändern

`src/data/firma.ts` öffnen, alle `TODO`-Felder ausfüllen. Die Daten erscheinen automatisch in Header, Footer, Kontaktseite, Impressum und Datenschutz.

### Texte auf Seiten ändern

Seiten liegen in `src/pages/*.astro`. Platzhalter-Texte auf "Über uns", Impressum und Datenschutz sind mit `TODO` markiert.

### Bilder ersetzen

Eigene Fotos in `public/images/` ablegen (JPG, max. 1600px, < 300 KB). Dateinamen aus `public/images/README.md` beachten.

## Vor dem Go-Live (Pflicht)

1. `src/data/firma.ts` – Firmenname, Adresse, Telefon, E-Mail, USt-IdNr. ausfüllen
2. `src/pages/impressum.astro` – alle TODO-Blöcke mit echten Pflichtangaben füllen (§ 5 DDG)
3. `src/pages/datenschutz.astro` – Datenschutzerklärung vervollständigen (ggf. anwaltlich prüfen)
4. `astro.config.mjs` – `site:` auf echte Domain setzen
5. `public/robots.txt` – Sitemap-URL anpassen
6. Bilder in `public/images/` ersetzen (eigene Fotos)

## Phase 2 (später)

- Hosting auf Vercel oder Netlify (kostenlos für statische Sites)
- Echtes Kontaktformular via Web3Forms / Formspree statt `mailto:` (Hinweis in `kontakt.astro`)
- Buchungssystem mit Kalender
- Galerie mit Vorher/Nachher-Fotos

## Projektstruktur

```
src/
├── components/    Wiederverwendbare Bausteine (Header, Footer, Preisrechner)
├── data/          Alle Preise & Firmendaten (Single Source of Truth)
├── layouts/       BaseLayout mit SEO, Head, Header, Footer
├── lib/           calc.ts (Preislogik) + Vitest-Tests
├── pages/         Seiten (eine Datei = eine Route)
└── styles/        Tailwind

public/
├── images/        Bilder (austauschbar, README.md beachten)
└── robots.txt
```
