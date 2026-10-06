# Content ownership & rolverdeling

De educatieve content en de techniek zijn gescheiden verantwoordelijkheden.

## Wie doet wat

**De gebruiker (docent) + ChatGPT bepalen de inhoud:**
- Taalkundige correctheid van Nederlands en vertalingen
- CEFR-niveau-indeling (A0/A1/A2/B1/B2)
- Grammatica-uitleg en voorbeelden
- Werkwoorddata (vervoegingen, regelmaat per vorm)
- Tags en metadata (themes, grammarTags, tags)
- Hergebruik van bestaand lesmateriaal i.p.v. onnodig regenereren

**Kiro doet de techniek:**
- Validatie, imports, referentie-integriteit
- Queries, tests, consistentiechecks
- Implementatie tegen het schema

## Regels voor Kiro

1. Genereer, herschrijf, breid uit of "corrigeer" GEEN educatieve content op eigen initiatief.
2. Zet NIETS op `reviewStatus: "human-verified"` — alleen de docent doet dat.
3. Ga er niet van uit dat bestaande `ai-reviewed` items definitief zijn; sommige moeten nog gecorrigeerd worden.
4. Als je een structureel probleem in content of schema ziet: MELD het, pas het niet stil aan.
5. Zodra de gebruiker herziene datasets aanlevert is je rol primair technische integratie.

## Vastgelegde inhoudelijke beslissingen

- Modale werkwoorden als grammatica-topic worden geïntroduceerd op **A1**.
- Werkwoordregelmaat wordt per vorm/tijd gemodelleerd (`present`, `past`, `participle`), niet met één globale boolean.

## Structurele basis

Het huidige v2-datamodel (`src/data/schema.js`) is de structurele basis. Zie dat bestand voor de canonieke
velddefinities, ID-conventie, niveaus, reviewstatussen en de vocabulaires THEMES / GRAMMAR_TAGS / TAGS.
