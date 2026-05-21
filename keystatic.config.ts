import { config, fields, singleton } from '@keystatic/core';

const paketFelder = {
  name:         fields.text({ label: 'Paketname' }),
  bruttoPreis:  fields.number({ label: 'Preis brutto (€)', validation: { min: 0 } }),
  dauer:        fields.text({ label: 'Dauer (z. B. "1,5 h")' }),
  beschreibung: fields.text({ label: 'Beschreibung', multiline: true }),
};

export default config({
  storage: { kind: 'local' },

  ui: {
    brand: { name: 'Autoaufbereitung Admin' },
    navigation: {
      Firma: ['firma'],
      Preise: ['preise', 'aufpreise', 'lkw'],
    },
  },

  singletons: {
    // ─── Firmendaten ───────────────────────────────────────────────────────────
    firma: singleton({
      label: 'Firmendaten',
      path: 'src/data/firma',
      format: { data: 'json' },
      schema: {
        name:          fields.text({ label: 'Firmenname' }),
        inhaber:       fields.text({ label: 'Inhaber (Vor- und Nachname)' }),
        strasse:       fields.text({ label: 'Straße + Hausnummer' }),
        plz:           fields.text({ label: 'PLZ' }),
        ort:           fields.text({ label: 'Ort' }),
        telefon:       fields.text({ label: 'Telefonnummer (für WhatsApp-Button)' }),
        email:         fields.text({ label: 'E-Mail-Adresse' }),
        ustIdNr:       fields.text({ label: 'USt-IdNr. (nach Anmeldung ausfüllen)' }),
        steuernummer:  fields.text({ label: 'Steuernummer (Finanzamt, z. B. 060/123/12345)' }),
        iban:          fields.text({ label: 'IBAN (für Rechnungen per Überweisung)' }),
        bank:          fields.text({ label: 'Bank (z. B. Volksbank Cloppenburg)' }),
        einzugsgebiet: fields.text({ label: 'Einzugsgebiet (Beschreibung für Webseite)' }),
      },
    }),

    // ─── PKW-Preise ────────────────────────────────────────────────────────────
    preise: singleton({
      label: 'PKW-Preise',
      path: 'src/data/preise',
      format: { data: 'json' },
      schema: {
        aussen:           fields.object(paketFelder, { label: 'Außenreinigung' }),
        innen_basic:      fields.object(paketFelder, { label: 'Innen Basic' }),
        innen_premium:    fields.object(paketFelder, { label: 'Innen Premium' }),
        innen_detail:     fields.object(paketFelder, { label: 'Innen Full Detail' }),
        komplett_basic:   fields.object(paketFelder, { label: 'Komplett Basic' }),
        komplett_premium: fields.object(paketFelder, { label: 'Komplett Premium' }),
        komplett_detail:  fields.object(paketFelder, { label: 'Komplett Full Detail' }),
      },
    }),

    // ─── Aufpreise & Fahrtkosten ───────────────────────────────────────────────
    aufpreise: singleton({
      label: 'Aufpreise & Fahrtkosten',
      path: 'src/data/aufpreise',
      format: { data: 'json' },
      schema: {
        tierhaare_leicht: fields.number({ label: 'Tierhaare leicht (€)',              validation: { min: 0 } }),
        tierhaare_mittel: fields.number({ label: 'Tierhaare mittel (€)',              validation: { min: 0 } }),
        tierhaare_stark:  fields.number({ label: 'Tierhaare stark (€)',               validation: { min: 0 } }),
        kindersitz:       fields.number({ label: 'Kindersitz pro Stück (€)',          validation: { min: 0 } }),
        nikotin:          fields.number({ label: 'Nikotingeruch-Aufpreis (€)',        validation: { min: 0 } }),
        maeusekot:             fields.number({ label: 'Mäusekot / Nagerbefall (€)',          validation: { min: 0 } }),
        extreme_verschmutzung: fields.number({ label: 'Extreme Verschmutzung (€)',           validation: { min: 0 } }),
        schimmel:              fields.number({ label: 'Schimmel / Feuchtigkeit (€)',         validation: { min: 0 } }),
        lebensmittel:          fields.number({ label: 'Lebensmittel- / Bioabfall-Reste (€)', validation: { min: 0 } }),
        suv_zuschlag:     fields.number({ label: 'SUV-Zuschlag  (0.15 = 15 %)',       validation: { min: 0, max: 1 } }),
        van_zuschlag:     fields.number({ label: 'Van/Bus-Zuschlag  (0.30 = 30 %)',   validation: { min: 0, max: 1 } }),
        lang_zuschlag:    fields.number({ label: 'Langversion-Zuschlag (0.20 = 20 %)',validation: { min: 0, max: 1 } }),
        frei_radius_km:   fields.number({ label: 'Kostenloser Radius (km)',           validation: { min: 0 } }),
        km_preis:         fields.number({ label: 'Preis pro km über Freigrenze (€)', validation: { min: 0 } }),
      },
    }),

    // ─── LKW / Traktor / Transporter ──────────────────────────────────────────
    lkw: singleton({
      label: 'LKW / Traktor / Transporter',
      path: 'src/data/lkw',
      format: { data: 'json' },
      schema: {
        stundensatz_netto:   fields.number({ label: 'Stundensatz netto (€/h)',     validation: { min: 0 } }),
        material_pro_stunde: fields.number({ label: 'Materialpauschale (€/h)',     validation: { min: 0 } }),
        mindest_netto:       fields.number({ label: 'Mindestpauschale netto (€)',  validation: { min: 0 } }),
        pakete: fields.array(
          fields.object({
            key:         fields.text({ label: 'Interner Schlüssel (bitte nicht ändern!)' }),
            name:        fields.text({ label: 'Anzeigename' }),
            stunden:     fields.number({ label: 'Arbeitsstunden',       validation: { min: 0 } }),
            bruttoPreis: fields.number({ label: 'Preis brutto (€)',     validation: { min: 0 } }),
            dauer:       fields.text({ label: 'Dauer (z. B. "1,5 h")' }),
          }),
          {
            label: 'Pakete',
            itemLabel: (props) => (props.fields.name as { value?: string }).value ?? 'Paket',
          }
        ),
      },
    }),
  },
});
