# 🇳🇱 Nederlandse Taal Studio

Content management systeem voor Nederlands als tweede taal (NT2). Herbruikbare, getagde bouwblokken (woorden, zinnen, grammatica) die dynamisch worden gecombineerd tot oefeningen.

## Quick start

```bash
npm install
supabase start          # lokale Supabase in Docker
cp .env.example .env.local   # vul URL + publishable/anon key in (staan in `supabase status`)
npm run dev
```

Open http://localhost:5173. Inloggen gaat met een magic link; lokaal komen de
mails binnen in Mailpit op http://127.0.0.1:54324.

## Gebruikers & rollen

Inloggen via Supabase Auth (magic link). Elke gebruiker heeft een profiel met een rol:

| Rol        | Mag                                                              |
|------------|------------------------------------------------------------------|
| `docent`   | Alles zien, alle feedback verwijderen, rollen toekennen, feedback importeren |
| `reviewer` | Alle feedback zien, eigen feedback geven/verwijderen             |
| `leerling` | Eigen feedback geven/zien/verwijderen                            |

- Nieuwe gebruikers worden automatisch `leerling`; de docent past rollen aan op de pagina **Gebruikers**.
- De **allereerste** gebruiker wordt automatisch `docent`.
- Rechten worden afgedwongen in de database (RLS), zie `supabase/migrations/`.
- Content (woorden, zinnen, …) staat nog steeds in JSON; alleen gebruikers en feedback staan in Supabase.

## Supabase (hosted)

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Zet in het Supabase-dashboard onder Authentication → URL Configuration de
Site URL op het productie-adres en voeg `<adres>/**` toe aan de Redirect URLs.

## Documentatie

- [Projectoverzicht](docs/project-overzicht.md) — wat we bouwen en waarom
- [AI-rolverdeling](docs/ai-rolverdeling.md) — wie doet wat (ChatGPT vs Kiro)

## Tech stack

- React + Vite
- JSON datasets voor content
- Supabase (Auth + Postgres) voor gebruikers en feedback
- Datamodel: `src/data/schema.js`
