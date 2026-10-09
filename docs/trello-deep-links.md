# Trello deep links

Elke pagina in de app heeft een eigen adres. Zo kun je op een Trello-kaart (of in een
bericht) een link zetten die de leerling direct op het juiste onderwerp opent.

## Hoe je een link maakt

De makkelijkste manier: open het onderwerp in de app, klik op **🔗 Kopieer link** onderaan
de grammatica-kaart, en plak die link op het Trello-kaartje. Klaar.

Je kunt links ook met de hand opbouwen (zie hieronder).

## Pagina's

| Pad | Opent |
|-----|-------|
| `/leerpad` | Mijn leerpad (leerling) |
| `/dashboard` | Dashboard (docent/reviewer) |
| `/lesprogramma` | Lesprogramma |
| `/leerpaden/<leerling>` | Leerpad van een leerling, bv. `/leerpaden/dimitrios` |
| `/bibliotheek/woorden` | Bibliotheek → Woordenschat |
| `/bibliotheek/werkwoorden` | Bibliotheek → Werkwoorden |
| `/bibliotheek/zinnen` | Bibliotheek → Zinnen |
| `/bibliotheek/grammatica` | Bibliotheek → Grammatica |
| `/bibliotheek/grammatica/<onderwerp>` | Eén grammatica-onderwerp, bv. `/bibliotheek/grammatica/perfectum` |
| `/bibliotheek/oefeningen` | Bibliotheek → Oefeningen |
| `/feedback` | Feedback-overzicht |
| `/gebruikers` | Gebruikers (docent) |

## Filters (achter het vraagteken)

**Grammatica** — `grammar=<tag>` opent het eerste onderwerp met die grammaticatag, bv.
`/bibliotheek/grammatica?grammar=perfectum`

**Zinnen**
- `grammar=<tag>` — bv. `perfectum`, `inversie`, `modale-werkwoorden`
- `level=<niveau>` — `A0` t/m `B2`
- `theme=<thema>` — bv. `eten`, `dieren`
- `tense=<tijd>` — bv. `perfectum`, `tegenwoordige-tijd`

**Woordenschat** — `level=<niveau>`, `theme=<thema>`, `pos=<woordsoort>` (noun/verb/adjective/...), `search=<tekst>`

**Werkwoorden** — `level=<niveau>`, `type=fully-regular` of `type=has-irregular`, `search=<tekst>`

## Voorbeelden voor Trello-kaarten

| Kaartje | Link |
|---------|------|
| "De of het" | `https://mijntaalstudio.nl/bibliotheek/grammatica/de-het` |
| "Het perfectum" | `https://mijntaalstudio.nl/bibliotheek/grammatica?grammar=perfectum` |
| "Oefen perfectum-zinnen A2" | `https://mijntaalstudio.nl/bibliotheek/zinnen?grammar=perfectum&level=A2` |
| "Woorden: Eten (A0)" | `https://mijntaalstudio.nl/bibliotheek/woorden?theme=eten&level=A0` |
| "Onregelmatige werkwoorden" | `https://mijntaalstudio.nl/bibliotheek/werkwoorden?type=has-irregular` |

## Oude links

Links in de oude vorm (`?page=topics&topic=topic.de-het`, `?page=sentences&…`) blijven
werken: de app zet ze bij het openen automatisch om naar het nieuwe pad.

## Hoe het werkt (technisch)

- Het pad bepaalt de pagina (`src/routes.js`), de query string de filters
  (`src/hooks/useUrlParams.js`). Terug/vooruit in de browser werkt.
- `vercel.json` stuurt elk pad naar de app, zodat herladen geen 404 geeft.
- Onbekende paden vallen terug op de startpagina (leerling: `/leerpad`, docent: `/dashboard`).
- De topic-id's staan in `src/data/topics.json` (veld `id`), bv. `topic.perfectum` → pad `/bibliotheek/grammatica/perfectum`.
