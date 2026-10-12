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

    { "op": "set.delete", "set": "…", "baseVersion": "…" },

    { "op": "vocab.add", "kind": "theme", "value": "seizoenen",
      "reason": "Voor lente, zomer, herfst en winter." }
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
- Verander nooit `reviewStatus` naar `human-verified` en laat `verifiedBy`/`verifiedAt` weg: die zet de app
  als iemand een zin heeft nagekeken. Pas je zo'n zin aan, dan vervalt dat keurmerk vanzelf.
- **Opmerkingen van de nakijker**: soms krijg je een lijst zinnen met `watKloptNiet` en `opmerking`.
  Maak dan een changeset die precies die punten verbetert (meestal `parts`/`pronouns`).
- **Nieuwe thema's en tags**: gebruik bij `themes`, `tags` en `grammarTags` alleen waarden uit
  `vocabularies` in de export. Is er echt een nieuwe nodig, zet dan vóór de eerste wijziging die hem
  gebruikt een `vocab.add` (`kind`: `theme`, `tag` of `grammarTag`; `value`: kleine letters, cijfers
  en streepjes). Die wijzigingen wachten dan tot de docent de nieuwe waarde heeft goedgekeurd.

## Lessen (kaartjes op het Lesprogramma-bord)

De export bevat ook het bord: `lanes` (de kolommen, van links naar rechts), `labels` en `lessons`
(per baan van boven naar beneden, met `order`). Een les in de export:

```json
{
  "id": "d4787bdb-7598-4b14-9263-a57e429bed23",
  "updatedAt": "2026-10-10T22:52:09.95+00:00",
  "laneId": "9d845284-…", "lane": "A", "order": 1,
  "title": "Werkwoorden vervoegen",
  "level": "A1",
  "labelIds": ["c162de31-…"], "labels": ["Oefenen"],
  "explanation": "<p>Uitleg in HTML, zoals bij grammatica.</p>",
  "links": [{ "label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/…" }],
  "wordLists": [{ "set": "eerste-regelmatige-werkwoorden" }, { "theme": "dieren", "level": "A1", "upTo": true }],
  "sentenceLists": [{ "set": "mijn-eerste-zinnen-a0" }],
  "topicIds": ["topic.perfectum"],
  "verbIds": ["word.werken", "word.wonen"],
  "attachments": ["werkblad.pdf"]
}
```

- `wordLists` / `sentenceLists`: lijstjes in de les. Elk lijstje is een "recept": een `set`
  (aanbevolen, geordend) en/of filters `theme`, `level` (+ `upTo: true` = t/m dat niveau);
  woordenlijsten ook `partOfSpeech`, zinnenlijsten ook `grammarTag`.
- `topicIds`: grammatica-onderwerpen; `verbIds`: werkwoorden die als vervoegingstegels getoond worden.
- `labelIds`: alleen bestaande labels uit `labels`. `attachments` (bestanden) zijn alleen ter info;
  die kun je niet wijzigen.
- Les-ID's zijn vaste ID's uit de database: gebruik ze zoals ze in de export staan. Een nieuwe les
  krijgt pas een ID als de docent hem goedkeurt, dus je kunt in hetzelfde voorstel niet naar een nieuwe
  les verwijzen.

Wijzigingen (in dezelfde changeset als woorden en sets):

```json
{ "op": "lesson.add", "lane": "<laneId>", "after": "<lessonId> | null",
  "data": { "title": "Werkwoorden oefenen", "level": "A1", "labelIds": [],
            "explanation": "<p>…</p>", "links": [], "wordLists": [], "sentenceLists": [],
            "topicIds": [], "verbIds": ["word.werken"] },
  "reason": "…" }

{ "op": "lesson.update", "id": "<lessonId>", "baseVersion": "<updatedAt>",
  "data": { "title": "Nieuwe titel", "verbIds": ["word.werken", "word.koken"] },
  "reason": "…" }

{ "op": "lesson.update", "id": "<lessonId>", "baseVersion": "<updatedAt>",
  "lane": "<laneId>", "after": null, "data": {}, "reason": "Naar boven in baan A." }
```

- `after`: de les waarna hij komt in die baan; `null` = bovenaan; weglaten bij `lesson.add` = onderaan.
  Bij `lesson.update` alleen `lane`/`after` meegeven als de les moet verplaatsen.
- `data` bij een update bevat alleen wat verandert; een veld vervang je in zijn geheel (geef bij een
  lijst de hele nieuwe lijst). `null` maakt een veld leeg.
- Lessen verwijderen, banen of labels aanmaken kan niet via een changeset: stel dat voor in je toelichting.
- Leerpaden van leerlingen staan niet in de export en kun je niet wijzigen.

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
**Werkwoord zonder perfectum** (zoals *zullen*): laat `participle`, `auxiliary` én
`regularity.participle` alle drie weg; verzin geen vormen. De app toont ze dan als "n.v.t.".
Laat ze alleen weg als het werkwoord echt geen voltooid deelwoord heeft.

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

### Zinsdelen (`parts`)

`parts` markeert stukjes van de Nederlandse zin, **in de volgorde waarin ze in de zin staan**, elk met een
rol. De app gebruikt ze voor werkwoordoefeningen: het werkwoord invullen ("Ik ___ in een café. (werken)")
en later de zin omzetten naar een ander onderwerp ("Hij ___ in een café." → werkt).
Een zin komt in de invuloefening ("Vervoegen → In zinnen") als de **persoonsvorm** een `wordId` heeft
van een werkwoord met een vervoegingstabel, en in de tegenwoordige tijd staat. Geef de persoonsvorm
dus altijd een `wordId`, ook bij hulpwerkwoorden.

```json
"nl": "Gisteren heb ik slecht geslapen.",
"parts": [
  { "text": "heb", "role": "persoonsvorm", "wordId": "word.hebben" },
  { "text": "ik", "role": "onderwerp", "person": "1sg" },
  { "text": "geslapen", "role": "werkwoord", "wordId": "word.slapen" }
]
```

```json
"nl": "Ik bel mijn moeder vanavond op.",
"parts": [
  { "text": "Ik", "role": "onderwerp", "person": "1sg" },
  { "text": "bel", "role": "persoonsvorm", "wordId": "word.opbellen" },
  { "text": "op", "role": "scheidbaar-deel", "wordId": "word.opbellen" }
]
```

Regels:

- `text` staat **letterlijk** zo in `nl` (hoofdletters en spelling gelijk, zonder leestekens), en de
  stukjes staan in volgorde van links naar rechts. Komt hetzelfde woord twee keer voor, dan telt het eerste
  na het vorige zinsdeel.
- Markeer nu deze rollen:
  - `persoonsvorm`: de vervoegde vorm (precies één per hoofdzin; in een bijzin ook die van de bijzin), met
    `wordId` van het werkwoord (ook als dat een hulpwerkwoord is: `word.hebben`, `word.zijn`, `word.moeten`);
  - `werkwoord`: de overige werkwoorden van het gezegde (voltooid deelwoord, infinitief), met `wordId`;
  - `scheidbaar-deel`: het losse deel van een scheidbaar werkwoord (*op* in *bel … op*), met de `wordId`
    van het hele werkwoord (`word.opbellen`);
  - `onderwerp`: het hele onderwerp (*Ik*, *Het weer*, *Mijn broer*), met `person`:
    `1sg` (ik), `2sg` (jij/je/u), `3sg` (hij/zij/het/een enkelvoudig zelfstandig naamwoord),
    `1pl` (wij/we), `2pl` (jullie), `3pl` (zij mv./een meervoud).
- Een `wordId` bij een werkwoorddeel moet een bestaand werkwoord zijn. Bestaat het werkwoord nog niet,
  voeg het dan eerst toe (`add`), of laat dat werkwoorddeel weg.
- Overige rollen bestaan al voor later en mogen ook: `lijdend-voorwerp`, `meewerkend-voorwerp`,
  `voorzetselvoorwerp`, `naamwoordelijk-deel`, `bijwoordelijke-bepaling`. Gebruik ze alleen als daarom
  gevraagd wordt.
- **Bijzinnen**: markeer ook in een bijzin het onderwerp, de persoonsvorm en de overige werkwoorden, met
  `"clause": "bijzin"` erbij. Zonder `clause` hoort een zinsdeel bij de hoofdzin.
- Een update van `parts` vervangt de hele lijst; geef dus altijd alle zinsdelen van die zin mee.

### Voornaamwoorden (`pronouns`)

`pronouns` markeert de voornaamwoorden **die met de persoon meeveranderen**, in volgorde van links naar
rechts. Een voornaamwoord kan ook een zinsdeel zijn (*Ik* is onderwerp én persoonlijk voornaamwoord); dan
staat het in beide lijsten. De app gebruikt dit om een zin om te zetten naar een ander onderwerp
(*Ik was **mijn** handen* → *Hij wast **zijn** handen*) en voor voornaamwoord-oefeningen.

```json
"nl": "Ik bel mijn moeder vanavond op, omdat ik haar mis.",
"parts": [
  { "text": "Ik",  "role": "onderwerp",       "person": "1sg" },
  { "text": "bel", "role": "persoonsvorm",    "wordId": "word.opbellen" },
  { "text": "op",  "role": "scheidbaar-deel", "wordId": "word.opbellen" },
  { "text": "ik",  "role": "onderwerp",       "person": "1sg", "clause": "bijzin" },
  { "text": "mis", "role": "persoonsvorm",    "wordId": "word.missen", "clause": "bijzin" }
],
"pronouns": [
  { "text": "Ik",   "type": "persoonlijk", "person": "1sg" },
  { "text": "mijn", "type": "bezittelijk", "person": "1sg" },
  { "text": "ik",   "type": "persoonlijk", "person": "1sg", "clause": "bijzin" },
  { "text": "haar", "type": "persoonlijk", "person": "3sg", "clause": "bijzin" }
]
```

- `type`: `persoonlijk` (ik, je, hij, me, hem, haar, ons, ze…), `bezittelijk` (mijn, je/jouw, zijn, haar,
  ons/onze, jullie, hun…) of `wederkerend` (me, je, zich, ons…). Aanwijzende, vragende, betrekkelijke en
  onbepaalde voornaamwoorden (die, wie, wat, iemand) markeer je niet.
- `person`: dezelfde codes als bij het onderwerp: de persoon waar het voornaamwoord naar verwijst
  (*haar* in "ik mis haar" = `3sg`; *ze* als meervoud = `3pl`).
- Let op dubbelzinnige woorden: *zijn* (werkwoord of bezittelijk), *haar* (haar op je hoofd of voornaamwoord),
  *je* (persoonlijk of bezittelijk), *ze* (enkelvoud of meervoud). Markeer alleen wat écht een voornaamwoord is,
  met de juiste soort.
- `clause: "bijzin"` zoals bij de zinsdelen. Een update van `pronouns` vervangt de hele lijst.

## Grammatica, spelling en uitspraak (topic)

```json
{
  "id": "topic.perfectum",
  "title": "Het perfectum",
  "category": "grammar",
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

**Categorie.** `category` is `grammar` (grammatica), `spelling` of `pronunciation` (uitspraak).
Standaard is `grammar`: een onderwerp zonder `category` (ook in oudere exports en changesets) telt als
grammatica. Het is één soort item (`topic.*`), dus ID's en koppelingen blijven hetzelfde; de categorie
bepaalt alleen onder welk tabblad het staat. Kies de categorie op basis van de inhoud, niet op basis van
tags. Voorbeelden:

```json
{ "op": "add", "type": "topic", "id": "topic.onbeklemtoonde-e",
  "data": { "title": "De onbeklemtoonde e (sjwa)", "titleEn": "The unstressed e (schwa)",
            "category": "pronunciation", "introducedAtLevel": "A2", "…": "…" },
  "reason": "Eigen onderwerp voor de sjwa." }

{ "op": "update", "type": "topic", "id": "topic.lettergrepen", "baseVersion": "…",
  "data": { "category": "spelling" }, "reason": "Lettergrepen gaan over spelling." }
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

De actuele lijsten staan in de export onder `vocabularies` (`themes`, `tags`, `grammarTags`); die zijn
leidend. Hieronder de lijsten zoals ze begonnen. Gebruik bestaande waarden; een nieuwe waarde voeg je
toe met `vocab.add` (zie de changeset). Hernoemen of verwijderen kan niet via een changeset: stel
dat voor in je toelichting.

**themes:** eten, fruit, dieren, kleuren, mensen, familie, kleding, huis, keuken, badkamer,
huishouden, apparaten, dingen, plaatsen, vervoer, beweging, sport, vrije-tijd, tijd, werk, school,
communicatie, emoties, weer, natuur, zintuigen, beschrijvend, dagelijks-leven, grammatica, uitspraak

**grammarTags:** tegenwoordige-tijd, verleden-tijd, perfectum, plusquamperfectum, futurum, inversie,
woordvolgorde, bijzin, voegwoorden, modale-werkwoorden, scheidbare-werkwoorden, reflexieve-werkwoorden,
te-infinitief, om-te, aan-het, gebiedende-wijs, vragen, ontkenning, lidwoorden, de-het,
voornaamwoorden, voorzetsels, vervoegen, klinkers, lettergrepen, uitspraak

**tags:** regelmatig-ww, onregelmatig-ww, hulpwerkwoord, modaal-werkwoord, scheidbaar-ww, formeel, informeel, vraagwoord
