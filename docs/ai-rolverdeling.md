# AI-rolverdeling — Nederlandse Taal Studio

Dit project gebruikt twee AI-assistenten met duidelijk gescheiden verantwoordelijkheden.

---

## ChatGPT — Inhoud & taalcorrectie

ChatGPT werkt samen met de docent aan de educatieve content.

**Verantwoordelijkheden:**
- Taalkundige correctheid van het Nederlands en Engelse vertalingen
- CEFR-niveau-indeling (A0, A1, A2, B1, B2) per woord, zin, topic en oefening
- Grammatica-uitleg, regels en voorbeelden
- Werkwoorddata: vervoegingen, regelmaat per vorm (present/past/participle)
- Tags en metadata: themes, grammarTags, tags
- Hergebruik en review van bestaand lesmateriaal van de docent
- Genereren van nieuwe voorbeeldzinnen, woordenlijsten en uitleg in overleg met de docent
- Voorstellen van verbeteringen aan de content

**Beslist over:**
- Welke content juist is en welke gecorrigeerd moet worden
- Welk CEFR-niveau een item krijgt
- Welke tags en thema's bij een item horen
- De volgorde en structuur van het lesprogramma
- Wanneer content de status `human-verified` verdient (altijd in samenspraak met de docent)

---

## Kiro — Techniek & integratie

Kiro werkt in de IDE aan de technische kant van het project.

**Verantwoordelijkheden:**
- Het datamodel (schema) ontwerpen en onderhouden
- React frontend bouwen en aanpassen
- Validatie, imports en referentie-integriteit van data
- Query-helpers en zoekfunctionaliteit
- Consistentiechecks (zijn alle IDs uniek? Kloppen alle verwijzingen?)
- Tests, build-pipeline, deployment
- Technische documentatie

**Doet NIET:**
- Zelfstandig educatieve content genereren, herschrijven of "corrigeren"
- Content op `human-verified` zetten
- Aannemen dat `ai-reviewed` items definitief zijn
- Structurele contentproblemen stil oplossen — meldt ze in plaats daarvan

**Beslist over:**
- Technische architectuur en datastructuur
- Frontend-componenten en UX
- Validatieregels en foutafhandeling
- Performance en code-kwaliteit

---

## Samenwerking in de praktijk

```
┌──────────────┐       herziende datasets (JSON)       ┌──────────────┐
│              │ ─────────────────────────────────────▶ │              │
│   ChatGPT    │                                        │    Kiro      │
│   + docent   │ ◀───── structurele issues / vragen ─── │              │
│              │                                        │              │
│  Inhoud      │                                        │  Techniek    │
│  Taalreview  │                                        │  Validatie   │
│  Niveaus     │                                        │  Frontend    │
│  Tags        │                                        │  Integratie  │
└──────────────┘                                        └──────────────┘
```

### Workflow

1. De docent bespreekt met ChatGPT welke content nodig is of gecorrigeerd moet worden
2. ChatGPT en docent produceren herziene datasets (JSON die het v2-schema volgt)
3. De docent brengt de datasets naar Kiro
4. Kiro valideert de data tegen het schema, meldt eventuele structurele problemen
5. Kiro integreert de data in de app en verwerkt in de frontend
6. De docent reviewt het resultaat in de app

### Conflicten

- Content-beslissingen: ChatGPT + docent winnen altijd
- Technische beslissingen: Kiro wint, tenzij de docent anders beslist
- Bij twijfel: de docent beslist
