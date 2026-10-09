# Content-briefing voor ChatGPT

Kopieer dit naar ChatGPT als context bij het aanleveren van content voor Nederlandse Taal Studio.
Dit beschrijft de technische vorm die de app verwacht. ChatGPT bepaalt de inhoud; dit document
bepaalt alleen het format zodat de data meteen past.

## Belangrijk principe

Het dashboard en alle statistieken zijn **afgeleiden** van de data, geen aparte data. Tellingen
per niveau, kwaliteitsindicatoren en coverage worden live berekend uit de JSON. Je hoeft dus
nooit cijfers of overzichten aan te leveren — alleen de inhoud (woorden, zinnen, topics,
oefeningen). De app rekent de rest uit.

## De zes databestanden

| Bestand | Inhoud |
|---------|--------|
| `words.json` | kern-woordenschat (zelfst. nw., bijv. nw.) |
| `words-thema.json` | themawoordenschat |
| `words-verbs.json` | werkwoorden (met volledige vervoeging) |
| `sentences.json` | voorbeeld-/oefenzinnen |
| `topics.json` | grammatica-onderwerpen |
| `exercises.json` | oefening-recepten (query's op tags) |

## ID-conventie

`type.slug` in kleine letters: `word.hond`, `sentence.gisteren-slecht-geslapen`,
`topic.perfectum`, `exercise.perfectum-a2`. IDs moeten uniek zijn. Verwijzingen
(`wordIds`, `focusWordIds`, `topicId`) moeten naar bestaande IDs wijzen.

## Niveaus

Veld heet `introducedAtLevel` = laagste niveau waarop het item wordt geïntroduceerd.
Geldige waarden: `A0`, `A1`, `A2`, `B1`, `B2`.

## Reviewstatus

- `draft` = nieuw/ongecontroleerd
- `ai-reviewed` = door ChatGPT taalkundig gecontroleerd, klaar om te testen
- `human-verified` = door de docent met leerlingen getest en goedgekeurd

Zet NIETS op `human-verified` — dat doet alleen de docent.

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
`sets` (optioneel): zinnen die bij elkaar horen, bv. een gesprek uit een les:
`"sets": ["mijn-eerste-ontmoetingsgesprek"]` (kleine letters, streepjes). Een les met die
set toont precies die zinnen, in de volgorde van het bestand — zet de zinnen van een
gesprek dus in de juiste volgorde achter elkaar.

## Grammatica (topic)

```json
{
  "id": "topic.perfectum",
  "title": "Het perfectum",
  "introducedAtLevel": "A2",
  "summary": "Korte omschrijving.",
  "explanation": "Uitgebreide uitleg (mag \\n voor nieuwe regels).",
  "grammarTags": ["perfectum"],
  "themes": ["grammatica"],
  "docLinks": [],
  "reviewStatus": "ai-reviewed"
}
```

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

## Canonieke vocabulaires

Gebruik bij voorkeur bestaande waarden. Nieuwe themes/grammarTags/tags kunnen, maar laat het
de docent weten zodat ze aan de canonieke lijst in `schema.js` worden toegevoegd (anders waarschuwt
de validatie dat de tag onbekend is).

**themes:** eten, fruit, dieren, kleuren, mensen, familie, kleding, huis, keuken, badkamer,
huishouden, apparaten, dingen, plaatsen, vervoer, beweging, sport, vrije-tijd, werk, school,
communicatie, emoties, weer, natuur, zintuigen, beschrijvend, dagelijks-leven, grammatica, uitspraak

**grammarTags:** tegenwoordige-tijd, verleden-tijd, perfectum, plusquamperfectum, futurum, inversie,
woordvolgorde, bijzin, voegwoorden, modale-werkwoorden, scheidbare-werkwoorden, reflexieve-werkwoorden,
te-infinitief, om-te, aan-het, gebiedende-wijs, vragen, ontkenning, lidwoorden, de-het,
voornaamwoorden, voorzetsels, vervoegen, klinkers, lettergrepen, uitspraak

**tags:** regelmatig-ww, onregelmatig-ww, hulpwerkwoord, modaal-werkwoord, scheidbaar-ww, formeel, informeel

## Aanleveren

Lever per bestand een volledige, geldige JSON-array aan (of de hele set). De docent zet het in
de app; de validatie (`node scripts/validate-data.mjs`) controleert IDs, referenties, niveaus,
tags, vervoegingen en enums voordat het live gaat.
