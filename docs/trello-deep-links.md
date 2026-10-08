# Trello deep links

De app leest de URL om te bepalen welke pagina open is en welke filters actief zijn.
Zo kun je op een Trello-kaart een link zetten die de leerling direct op het juiste
onderwerp opent. Geen AI nodig, puur URL-parameters.

## Hoe je een link maakt

De makkelijkste manier: open het onderwerp in de app, klik op **🔗 Kopieer link** onderaan
de grammatica-kaart, en plak die link op het Trello-kaartje. Klaar.

Je kunt links ook met de hand opbouwen (zie hieronder).

## De basis

```
https://JOUW-APP.vercel.app/?page=<pagina>&<filter>=<waarde>
```

Vervang `JOUW-APP.vercel.app` door je echte Vercel-URL.

## Pagina's (`page`)

| Waarde | Opent |
|--------|-------|
| `dashboard` | Dashboard |
| `words` | Woordenschat |
| `verbs` | Werkwoorden |
| `sentences` | Zinnen |
| `topics` | Grammatica |
| `exercises` | Oefeningen |
| `feedback` | Feedback-overzicht |

## Filters per pagina

**Grammatica (`page=topics`)**
- `topic=<id>` — opent en scrollt naar een specifiek onderwerp, bv. `topic=topic.de-het`
- `grammar=<tag>` — opent het eerste onderwerp met die grammaticatag, bv. `grammar=perfectum`

**Zinnen (`page=sentences`)**
- `grammar=<tag>` — bv. `perfectum`, `inversie`, `modale-werkwoorden`
- `level=<niveau>` — `A0` t/m `B2`
- `theme=<thema>` — bv. `eten`, `dieren`
- `tense=<tijd>` — bv. `perfectum`, `tegenwoordige-tijd`

**Woordenschat (`page=words`)**
- `level=<niveau>`, `theme=<thema>`, `pos=<woordsoort>` (noun/verb/adjective/...), `search=<tekst>`

**Werkwoorden (`page=verbs`)**
- `level=<niveau>`, `type=fully-regular` of `type=has-irregular`, `search=<tekst>`

## Voorbeelden voor Trello-kaarten

| Kaartje | Link |
|---------|------|
| "De of het" | `?page=topics&topic=topic.de-het` |
| "Het perfectum" | `?page=topics&grammar=perfectum` |
| "Oefen perfectum-zinnen A2" | `?page=sentences&grammar=perfectum&level=A2` |
| "Woorden: Eten (A0)" | `?page=words&theme=eten&level=A0` |
| "Onregelmatige werkwoorden" | `?page=verbs&type=has-irregular` |

## Hoe het werkt (technisch)

- De URL is de bron van waarheid. Bij laden leest de app de parameters en zet de juiste
  pagina + filters. Terug/vooruit in de browser werkt ook.
- Onbekende of ongeldige waarden vallen terug op standaard (dashboard, geen filter).
- De topic-id's staan in `src/data/topics.json` (veld `id`), bv. `topic.perfectum`.
  De grammaticatags staan in `src/data/schema.js` onder `GRAMMAR_TAGS`.
