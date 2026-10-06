# Nederlandse Taal Studio — Projectoverzicht

_Laatst bijgewerkt: oktober 2026_

## Waar gaat dit over

Nederlandse Taal Studio is een app ter ondersteuning van het lesprogramma van een
docent Nederlands als tweede taal (NT2). De docent geeft les aan leerlingen op
verschillende CEFR-niveaus (A0 t/m B2) en heeft al een werkende setup met Trello en
Google Docs. Deze app vervangt dat niet, maar voegt de laag toe die daar ontbreekt.

## Het probleem dat we oplossen

De bestaande setup werkt goed:

- **Trello** als lesprogramma: per leerling een bord, met lijsten (lanes) voor grof niveau
  (Algemeen / A / B) en labels voor fijn niveau (A1, A2, B1, B2) plus categorie (bv. Woordenschat).
- **Google Docs** gekoppeld aan Trello-kaarten, met theorie en oefeningen per onderwerp.

Wat ontbreekt is iets wat Trello niet kan: **per onderwerp interactief kunnen oefenen,
idealiter met AI-gegenereerde oefeningen.** Dat is de kern van wat deze app toevoegt.

## De kerngedachte: herbruikbare bouwblokken

In plaats van voor elke oefening losse content te maken, bouwen we een bibliotheek van
herbruikbare, getagde bouwblokken. Een oefening is geen opgeslagen set vragen, maar een
**recept** dat de juiste bouwblokken ophaalt op basis van tags.

Voorbeeld: de oefening "Perfectum oefenen (A2)" zegt niet _welke_ zinnen, maar vraagt
"geef me zinnen met de tag `perfectum` tot en met niveau A2". Een zin die je één keer
opslaat, kan zo in meerdere oefeningen opduiken.

### De vier bouwblokken

1. **Woorden** (`words`) — woordenschat. Zelfstandige naamwoorden, bijvoeglijke
   naamwoorden en werkwoorden (met volledige vervoeging). Getagd op thema en niveau.
2. **Zinnen** (`sentences`) — voorbeeld- en oefenzinnen. Rijk gemetadateerd met tijd,
   zinstype, woordvolgorde, kernwoorden en moeilijkheidsgraad, zodat oefeningen er
   gericht uit kunnen putten.
3. **Grammatica** (`topics`) — theorie-onderwerpen zoals Het perfectum, Inversie,
   Modale werkwoorden. Gekoppeld aan zinnen via grammaticatags.
4. **Oefeningen** (`exercises`) — recepten die query'en op de andere drie.

## Huidige stand (oktober 2026)

### Wat er staat

- **React + Vite app** met een dashboard en browsers voor woorden, werkwoorden, zinnen,
  grammatica en oefeningen. Filters op niveau, thema, grammatica, tijd, zinstype en meer.
- **v2 datamodel** vastgelegd in `src/data/schema.js`, met:
  - Gestandaardiseerde IDs (`type.slug`, bv. `word.hond`, `topic.perfectum`)
  - `introducedAtLevel` — expliciet het laagste niveau waarop iets wordt geïntroduceerd
  - Werkwoordregelmaat **per vorm** (present / past / participle) in plaats van één boolean
  - Canonieke lijsten voor themes, grammarTags en tags
  - Uitgebreide zin-metadata voor oefeninggeneratie
  - `reviewStatus`: draft → ai-reviewed → human-verified

### Dataset-omvang (indicatief, nog in review)

| Dataset        | Items |
|----------------|-------|
| Woorden (kern) | 16    |
| Woorden (thema)| 83    |
| Werkwoorden    | 33    |
| Zinnen         | 9     |
| Grammatica     | 7     |
| Oefeningen     | 5     |

> De content is momenteel grotendeels `ai-reviewed` en wordt door de docent en ChatGPT
> herzien. Niets is nog `human-verified`. Zie `docs/ai-rolverdeling.md`.

## Wat er nog niet is (toekomstige richting)

Dit zijn ideeën die besproken zijn maar nog niet gebouwd. Ze staan hier zodat de visie
bewaard blijft, niet als toezegging.

- **AI-oefeningengenerator** per onderwerp — de belangrijkste toegevoegde waarde. Bv. bij
  "Het perfectum" automatisch invuloefeningen of meerkeuzevragen genereren uit de
  getagde bouwblokken.
- **Interactieve oefeningen** daadwerkelijk kunnen maken (nu tonen we alleen de recepten
  en hoeveel content ze matchen).
- **Huiswerk inleveren** door leerlingen.
- **Chatbot / tutor** voor vragen van leerlingen.
- **Content-reviewpijplijn** waarbij AI content checkt op fouten en tags voorstelt,
  waarna de docent bevestigt (het `reviewStatus`-veld is hier al op voorbereid).
- **Koppeling met Trello** via de Trello API, zodat lesonderwerpen uit Trello automatisch
  als oefenbare onderwerpen in de app verschijnen.

## Belangrijke beslissingen tot nu toe

- **Trello blijft bestaan.** De app is een aanvulling, geen vervanging.
- **JSON als opslag** om mee te starten; later eventueel een database.
- **React** als frontend.
- **Oefeningen zijn dynamisch** (query op tags), niet handmatig samengesteld.
- **Inhoud en techniek zijn gescheiden rollen** — zie `docs/ai-rolverdeling.md`.
- Modale werkwoorden worden als grammatica-topic op **A1** geïntroduceerd.

## Mappenstructuur

```
src/
  data/
    schema.js          # v2 datamodel: types, ID-conventie, vocabulaires
    index.js           # merge van datasets + query-helpers
    words.json         # kern-woordenschat
    words-thema.json   # themawoordenschat
    words-verbs.json   # werkwoorden met vervoegingen
    sentences.json     # voorbeeld-/oefenzinnen
    topics.json        # grammatica-onderwerpen
    exercises.json     # oefening-recepten
  components/           # React-componenten (browsers, dashboard, filters)
docs/
  project-overzicht.md # dit bestand
  ai-rolverdeling.md   # wie doet wat
.kiro/
  steering/
    content-ownership.md # vastgelegde afspraak voor Kiro per sessie
```
