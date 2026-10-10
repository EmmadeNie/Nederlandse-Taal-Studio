# Content-briefing voor ChatGPT

Plak dit document in ChatGPT (bijvoorbeeld als instructie van een Project of eigen GPT), samen met
de export uit de app. Het beschrijft hoe de inhoud van Taal Studio eruitziet en hoe je
wijzigingen voorstelt. ChatGPT bepaalt de inhoud; dit document bepaalt de vorm.

## Zo werken we

1. De docent klikt in Taal Studio op **Voorstellen → Inhoud exporteren** en geeft je het bestand
   `taalstudio-inhoud-<datum>.json`. Daarin staat alle huidige inhoud: `words`, `sentences`,
   `topics`, `exercises` en `sets`. Elk item en elke set heeft een `updatedAt`.
2. De docent vraagt iets ("maak 15 zinnen bij het perfectum", "controleer de A1-woorden").
3. Jij antwoordt met **één JSON-changeset** (format hieronder) in een ```json-codeblok, met
   daarbuiten hooguit een korte toelichting.
4. De docent plakt de changeset in de app en keurt elke wijziging los goed of af. Pas dan
   verandert er iets.

Werk altijd vanuit de meest recente export. Weet je iets niet zeker (bestaat een ID al? hoe heet
een set?), zoek het op in de export in plaats van te gokken.

## De changeset

```json
{
  "title": "Perfectum: 12 nieuwe zinnen en een zinnenset",
  "summary": "Korte uitleg voor de docent: wat en waarom.",
  "changes": [
    { "op": "add", "type": "sentence", "id": "sentence.ik-heb-gewerkt",
      "data": { "nl": "Ik heb gewerkt.", "en": "I have worked.", "...": "..." },
      "reason": "Basisvoorbeeld perfectum met hebben." },

    { "op": "update", "type": "word", "id": "word.hond",
      "baseVersion": "2026-10-01T12:00:00.000000+00:00",
      "data": { "plural": "honden", "tags": null },
      "reason": "Meervoud ontbrak; lege tags weg." },

    { "op": "delete", "type": "sentence", "id": "sentence.dubbel",
      "baseVersion": "…", "reason": "Dubbel met sentence.ik-heb-gewerkt." },

    { "op": "set.create", "set": "perfectum-a2", "type": "sentence",
      "title": "Perfectum A2", "level": "A2",
      "items": ["sentence.ik-heb-gewerkt"], "reason": "…" },

    { "op": "set.update", "set": "perfectum-a2", "baseVersion": "…",
      "title": "Perfectum (A2)", "level": "A2" },

    { "op": "set.addItem", "set": "eerste-regelmatige-werkwoorden", "baseVersion": "…",
      "item": "word.werken", "after": "word.wonen" },

    { "op": "set.removeItem", "set": "…", "baseVersion": "…", "item": "word.x" },

    { "op": "set.moveItem", "set": "…", "baseVersion": "…", "item": "word.x", "after": null },

    { "op": "set.delete", "set": "…", "baseVersion": "…" }
  ]
}
```

Regels:

- **`add`**: `data` bevat alle velden van het nieuwe item (zonder `id` en `updatedAt`). Het ID
  mag nog niet bestaan.
- **`update`**: `data` bevat **alleen de velden die veranderen**. Een veld vervang je in zijn
  geheel (ook arrays en `conjugation`: geef de volledige nieuwe waarde). `null` haalt een veld weg.
- **`baseVersion`**: neem bij `update`, `delete` en alle set-wijzigingen de `updatedAt` van dat
  item of die set uit de export over. Is het intussen aangepast, dan ziet de docent een waarschuwing.
- **`reason`**: altijd invullen, één zin. De docent beslist op basis daarvan.
- **Volgorde telt**: zet `add` en `set.create` vóór wijzigingen die ernaar verwijzen. Een
  `set.addItem` met een nieuw woord komt dus ná de `add` van dat woord.
- **Sets** hebben één soort (`word`, `sentence` of `exercise`) en een vaste volgorde van items.
  `after` is het ID waarna het item komt; `null` = vooraan. Een set-ID (`set`) is een slug:
  kleine letters, cijfers en streepjes.
- Eén item hoort maar één keer in een set; een woord bestaat maar één keer in de hele inhoud.
  Staat iets al, pas het bestaande item aan in plaats van een tweede te maken.
- Houd een changeset overzichtelijk: liever 5–40 wijzigingen over één onderwerp dan alles tegelijk.
- Verander nooit `reviewStatus` naar `human-verified`.

## Belangrijk principe

Het dashboard en alle statistieken worden live berekend uit de inhoud. Lever dus nooit cijfers
of overzichten aan, alleen woorden, zinnen, grammatica-onderwerpen, oefeningen en sets.

## ID-conventie

`type.slug` in kleine letters: `word.hond`, `sentence.gisteren-slecht-geslapen`,
`topic.perfectum`, `exercise.perfectum-a2`. IDs moeten uniek zijn. Verwijzingen
(`wordIds`, `focusWordIds`, `topicId`, `relatedWordIds`, `exampleSentenceIds`, items in sets)
moeten naar bestaande IDs wijzen, of naar een item dat eerder in dezelfde changeset wordt toegevoegd.

## Niveaus

Veld heet `introducedAtLevel` = laagste niveau waarop het item wordt geïntroduceerd.
Geldige waarden: `A0`, `A1`, `A2`, `B1`, `B2`.

## Reviewstatus

- `draft` = nieuw/ongecontroleerd
- `ai-reviewed` = door ChatGPT taalkundig gecontroleerd, klaar om te testen
- `human-verified` = door de docent met leerlingen getest en goedgekeurd

Zet NIETS op `human-verified`, dat doet alleen de docent.

## Woord (word)

```json
{
  "id": "word.hond",
  "nl": "hond",
  "article": "de",
  "en": "dog",
  "partOfSpeech": "noun",
  "introducedAtLevel": "A0",
  "themes": ["dieren"],
  "tags": [],
  "plural": "honden",
  "reviewStatus": "ai-reviewed"
}
```
`partOfSpeech`: noun | verb | adjective | adverb | preposition | pronoun | conjunction | numeral | other.
`article` en `plural` alleen bij zelfstandige naamwoorden.

## Werkwoord (word met conjugation)

```json
{
  "id": "word.wassen",
  "nl": "wassen",
  "en": "to wash",
  "partOfSpeech": "verb",
  "introducedAtLevel": "A1",
  "themes": ["huishouden"],
  "tags": ["onregelmatig-ww"],
  "conjugation": {
    "infinitive": "wassen",
    "stem": "was",
    "present": { "ik": "was", "jij": "wast", "hij": "wast", "wij": "wassen" },
    "past": { "singular": "waste", "plural": "wasten" },
    "participle": "gewassen",
    "auxiliary": "hebben",
    "regularity": { "present": "regular", "past": "regular", "participle": "irregular" }
  },
  "reviewStatus": "ai-reviewed"
}
```
`regularity` is PER VORM (`present`, `past`, `participle`), elk "regular" of "irregular".
`auxiliary`: "hebben" of "zijn".

## Zin (sentence)

```json
{
  "id": "sentence.gisteren-slecht-geslapen",
  "nl": "Gisteren heb ik slecht geslapen.",
  "en": "Yesterday I slept badly.",
  "introducedAtLevel": "A2",
  "difficulty": 3,
  "themes": ["dagelijks-leven"],
  "grammarTags": ["perfectum", "inversie"],
  "tense": "perfectum",
  "sentenceType": "statement",
  "wordOrder": "inversion",
  "wordIds": ["word.slapen", "word.slecht"],
  "focusWordIds": ["word.slapen"],
  "reviewStatus": "ai-reviewed"
}
```
`difficulty`: 1-5. `tense`: zie lijst. `sentenceType`: statement | question | imperative | negation.
`wordOrder`: svo | inversion | subordinate. `focusWordIds` = kernwoord(en) voor invuloefeningen.

## Grammatica (topic)

```json
{
  "id": "topic.perfectum",
  "title": "Het perfectum",
  "introducedAtLevel": "A2",
  "summary": "Korte omschrijving.",
  "explanation": "<p>Uitgebreide uitleg in HTML, zie hieronder.</p>",
  "titleEn": "The present perfect",
  "summaryEn": "Short description in English.",
  "explanationEn": "<p>The same explanation in English, in the same HTML.</p>",
  "grammarTags": ["perfectum"],
  "themes": ["grammatica"],
  "docLinks": [],
  "relatedWordIds": ["word.werken"],
  "exampleSentenceIds": ["sentence.ik-heb-gewerkt"],
  "reviewStatus": "ai-reviewed"
}
```

**Nederlands en Engels.** `title`, `summary` en `explanation` zijn Nederlands; leerlingen zien die
altijd eerst. `titleEn`, `summaryEn` en `explanationEn` zijn dezelfde teksten in het Engels: leerlingen
kunnen per regel naar Engels omschakelen. Vertaal de inhoud, niet de voorbeelden: Nederlandse
voorbeeldwoorden en -zinnen blijven Nederlands, met eventueel de Engelse betekenis erachter
(*Ik heb gewerkt* = I have worked). Houd dezelfde opbouw, kaders en tabellen aan als in de Nederlandse
uitleg, zodat beide versies naast elkaar kloppen. Schrijf het Engels eenvoudig (B1): veel leerlingen
hebben Engels niet als moedertaal.

`relatedWordIds`: woorden (vaak werkwoorden) die bij de regel horen; ze verschijnen als
vervoegingstegels onder de uitleg. `exampleSentenceIds`: de voorbeeldzinnen die de regel het
best laten zien, in de gewenste volgorde (3–6 is genoeg). `grammarTags` op zinnen blijven
belangrijk: daarmee vinden oefeningen (en later AI) zinnen bij een grammaticaverschijnsel.

### Uitleg opmaken (HTML)

`explanation` (en de uitleg van lessen) is HTML, zoals de editor in de app die maakt.
Gebruik alleen deze bouwstenen; al het andere wordt bij weergave weggehaald:

- Tekst: `<p>`, `<h2>` (kop), `<h3>` (subkop), `<strong>`, `<em>`, `<u>`, `<s>`, `<br>`
- Lijsten: `<ul>`/`<ol>` met `<li>`
- Links: `<a href="https://…">` (website) of `<a href="/lesprogramma/<les-id>">` (andere les)
- Markeerstift: `<mark data-color="#fde68a" style="background-color: #fde68a">…</mark>`
  (kleuren: #fde68a geel, #bbf7d0 groen, #bfdbfe blauw, #fbcfe8 roze)
- Tekstkleur: `<span style="color: #f19a9a">…</span>`
  (kleuren: #8bbcfb blauw, #7fd8a8 groen, #f3c08a oranje, #f19a9a rood, #c4a6f7 paars)
- Kader: `<div data-callout="regel">…</div>` — soorten: `regel`, `tip`, `letop`, `voorbeeld`;
  binnenin gewone `<p>`, lijsten enz. Het label ("Regel", "Let op") zet de app er zelf boven.
- Voorbeeldzin: `<div data-example><p>Ik heb gewerkt.</p><p>I have worked.</p></div>`
  (eerst Nederlands, dan Engels)
- Tabel (bv. vervoeging): `<table><tbody><tr><th><p>ik</p></th><th><p>jij</p></th></tr>`
  `<tr><td><p>werk</p></td><td><p>werkt</p></td></tr></tbody></table>`

Oude uitleg in Markdown blijft werken, maar schrijf nieuwe uitleg in HTML.

## Oefening (exercise)

```json
{
  "id": "exercise.perfectum-a2",
  "title": "Perfectum oefenen (A2)",
  "type": "fill-in",
  "level": "A2",
  "topicId": "topic.perfectum",
  "query": { "grammarTags": ["perfectum"], "maxLevel": "A2", "limit": 10 }
}
```
`type`: fill-in | multiple-choice | translate | flashcards.
Een oefening slaat GEEN eigen zinnen op — het is een recept dat via `query` zinnen/woorden
ophaalt op basis van tags. `maxLevel` betekent "alles t/m dit niveau".

## Sets

Sets zijn geordende lijstjes die lessen gebruiken: een woordenset (bv. de werkwoorden van een
les), een zinnenset (bv. een gesprek, in de juiste volgorde) of een oefeningenset. In de export:

```json
{ "id": "eerste-regelmatige-werkwoorden", "type": "word", "title": "Eerste regelmatige werkwoorden",
  "level": "A1", "itemIds": ["word.werken", "word.wonen"], "updatedAt": "…" }
```

Wijzig sets alleen met de `set.*`-operaties hierboven, niet via een veld op het item.

## Canonieke vocabulaires

Gebruik bij voorkeur bestaande waarden. Nieuwe themes/grammarTags/tags kunnen, maar laat het
de docent weten zodat ze aan de canonieke lijst in `schema.js` worden toegevoegd (anders waarschuwt
de validatie dat de tag onbekend is).

**themes:** eten, fruit, dieren, kleuren, mensen, familie, kleding, huis, keuken, badkamer,
huishouden, apparaten, dingen, plaatsen, vervoer, beweging, sport, vrije-tijd, tijd, werk, school,
communicatie, emoties, weer, natuur, zintuigen, beschrijvend, dagelijks-leven, grammatica, uitspraak

**grammarTags:** tegenwoordige-tijd, verleden-tijd, perfectum, plusquamperfectum, futurum, inversie,
woordvolgorde, bijzin, voegwoorden, modale-werkwoorden, scheidbare-werkwoorden, reflexieve-werkwoorden,
te-infinitief, om-te, aan-het, gebiedende-wijs, vragen, ontkenning, lidwoorden, de-het,
voornaamwoorden, voorzetsels, vervoegen, klinkers, lettergrepen, uitspraak

**tags:** regelmatig-ww, onregelmatig-ww, hulpwerkwoord, modaal-werkwoord, scheidbaar-ww, formeel, informeel, vraagwoord
