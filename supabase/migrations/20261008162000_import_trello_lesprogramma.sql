-- One-time import of the lesprogramma from the Trello board (126 cards, exported 2026-10-08).
-- Trello lists 'A', 'To do' and 'Doing' go to lane A. Idempotent via trello_card_id.

insert into public.lesson_lanes (name, position) values ('Algemeen', 1), ('A', 2), ('B', 3);

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 1, 'Leestoets A2', 'A2', array['Toetsen']::text[],
    '[mediatheek.steunpuntvluchtelingendebilt.nl](https://mediatheek.steunpuntvluchtelingendebilt.nl/examens/a2-voorbeeldexamens-lezen/)',
    '[{"label": "mediatheek.steunpuntvluchtelingendebilt.nl", "url": "https://mediatheek.steunpuntvluchtelingendebilt.nl/examens/a2-voorbeeldexamens-lezen/"}]'::jsonb, '6ac3aec20a7c32245ceb443f'
  from public.lesson_lanes where name = 'Algemeen'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 2, 'Overzicht van alle werkwoordsvormen', 'A2', array['Grammatica']::text[],
    'overzicht en regels:  [Google Doc](https://docs.google.com/document/d/1p9QiCyP_7ZAKGKDp0qT15R8emplVBgmfvhqVanMt5Uo/edit?tab=t.0)

LET OP: we hebben nog niet alle vormen behandeld (gebiedende wijs en reflectieve werkwoorden)

Zoals je ziet kunnen werkwoord soorten zowel regelmatig als onregelmatig. Sommige werkwoorden zijn in de ene tijdsvorm wel regelmatig en in de andere tijdsvorm niet.

In de bijlage een bestand waar we nog meer in detail gaan op de verschillende werkwoordsvormen en hun vervoegingen.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1p9QiCyP_7ZAKGKDp0qT15R8emplVBgmfvhqVanMt5Uo/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb4451'
  from public.lesson_lanes where name = 'Algemeen'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 3, 'Nederlands voor hoogopgeleide', null, '{}'::text[],
    '[drive.google.com](https://drive.google.com/file/d/1tyaxGie5s3Uq4kviePV12sJtGBGmF4kV/view?usp=sharing)',
    '[{"label": "drive.google.com", "url": "https://drive.google.com/file/d/1tyaxGie5s3Uq4kviePV12sJtGBGmF4kV/view?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4493'
  from public.lesson_lanes where name = 'Algemeen'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 4, 'Woordenlijst A2 -> B1', 'A2', array['Woordenschat']::text[],
    'Een nieuwe lijst woorden! Als je een dagelijkse oefening wilt kun je deze in quizlet zetten.',
    '[]'::jsonb, '6ac3aec20a7c32245ceb43df'
  from public.lesson_lanes where name = 'Algemeen'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 1, 'Woordenschat B1', 'B1', array['Woordenschat']::text[],
    '[detaalschool.com](https://detaalschool.com/category/b1-woordenlijsten/)',
    '[{"label": "detaalschool.com", "url": "https://detaalschool.com/category/b1-woordenlijsten/"}]'::jsonb, '6ac3aec20a7c32245ceb4475'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 2, 'verhaaltjes schrijven over de filmpjes in ca 300 woorden per filmpje', 'B1', array['Oefenen', 'Woordenschat']::text[],
    'Kun je na het kijken van elk filmpje een leuk verhaaltje schrijven?

Voorbeeld voor onderstaande video: Ik vond de levensles over lelijke tattoo nemen het leukst omdat ik zelf ook tattoo heb. Ik vond deze levensles eigenlijk een beetje verwarrend en hij slaat denk ik nergens op. Zelf heb ik ook een tattoo die ik niet al te serieus moet nemen. Als ik naar mijn tattoo kijk denk ik terug aan vroeger en dan wordt ik blij. Ik vraag me soms wel af wat andere mensen ervan vinden. Eigelijk denk ik dat deze meneer met deze les een grap maakt. Uiteindelijk is de boodschap van dit filmpje denk ik dat je het leven niet al te serieus moet nemen en dat lachen altijd goed is :)

[https://www.youtube.com/watch?v=In-PapxgmYM](https://www.youtube.com/watch?v=In-PapxgmYM "smartCard-embed")',
    '[{"label": "Video · YouTube", "url": "https://www.youtube.com/watch?v=In-PapxgmYM"}]'::jsonb, '6ac3aec20a7c32245ceb44ab'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 3, 'dubbel infinitief: Zien vliegen', 'B1', array['Grammatica']::text[],
    'theorie dubbel infinitief en hulpwerkwoorden:

 [Google Doc](https://docs.google.com/document/d/1jNhPLyrTHjaAyj0irRwQLLq0MRVhJM-OjpsTDD1jEbA/edit?tab=t.0)

maak deze oefeningen:

 [Google Doc](https://docs.google.com/document/d/1W6AD9tuuXjOMzzTV0jui7ZrwhFSEGO6s3MI8btpfys0/edit?tab=t.0#heading=h.1ucz39ppbqy8)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1jNhPLyrTHjaAyj0irRwQLLq0MRVhJM-OjpsTDD1jEbA/edit?tab=t.0"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1W6AD9tuuXjOMzzTV0jui7ZrwhFSEGO6s3MI8btpfys0/edit?tab=t.0#heading=h.1ucz39ppbqy8"}]'::jsonb, '6ac3aec20a7c32245ceb44b1'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 4, 'te na bepaalde werkwoorden', 'B1', array['Grammatica']::text[],
    'Kijk hier naar de hulpwerkwoorden waarbij je te nodig hebt bij het infinitief: [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/te-na-bepaalde-werkwoorden)

en maak vervolgens deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1hBG0sqr70zIaOZipPmnUi_t89hKmj0qExaZREmAolq8/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/te-na-bepaalde-werkwoorden"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1hBG0sqr70zIaOZipPmnUi_t89hKmj0qExaZREmAolq8/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb449f'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 5, 'Er naar toe gaan of erheen gaan?', 'B1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/ernaartoe-erheen)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/ernaartoe-erheen"}]'::jsonb, '6ac3aec20a7c32245ceb4487'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 6, 'Passieve zinnen', 'B1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/passieve-zinnen)

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1ndgpojGaEt5vbobbXJBBKCqFp-w1a3Wp_Agu9Eel5Zw/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/passieve-zinnen"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1ndgpojGaEt5vbobbXJBBKCqFp-w1a3Wp_Agu9Eel5Zw/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb448a'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 7, 'Zinnen met te hulpwerkwoorden', 'B1', array['Oefenen']::text[],
    '[Google Doc](https://docs.google.com/document/d/1XVk6eXSBUxnV3y79OdGpRfJes401ovn2tJrJShf1wSY/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1XVk6eXSBUxnV3y79OdGpRfJes401ovn2tJrJShf1wSY/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44c9'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 8, 'Artistieke vrijheid in woordvolgorde', 'B1', '{}'::text[],
    '[Google Doc](https://docs.google.com/document/d/19N4z-_SpvGcRG7usJYVHHZHZAEutPPW002nDur7avJo/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/19N4z-_SpvGcRG7usJYVHHZHZAEutPPW002nDur7avJo/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44c6'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 9, 'plusquam perfectum', 'B1', array['Grammatica']::text[],
    'lees de theorie:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/plusquamperfectum)

extra uitleg over de plusquam-perfectum staat hier op pagina 7:  [Google Doc](https://docs.google.com/document/d/1p9QiCyP_7ZAKGKDp0qT15R8emplVBgmfvhqVanMt5Uo/edit?tab=t.0)

en maak deze oefeningen onderaan het bestand:  [Google Doc](https://docs.google.com/document/d/1clbGsO74ZjJWpVctHaOUajkbeaTQACRWFzs0FJRAD_0/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/plusquamperfectum"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1p9QiCyP_7ZAKGKDp0qT15R8emplVBgmfvhqVanMt5Uo/edit?tab=t.0"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1clbGsO74ZjJWpVctHaOUajkbeaTQACRWFzs0FJRAD_0/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44b7'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 10, 'Leesoefeningen B1', null, array['Oefenen']::text[],
    '[https://nt2taalmenu.nl/wp-content/uploads/b1-lezen/NT2\_teksten\_lezen_B1.pdf](https://nt2taalmenu.nl/wp-content/uploads/b1-lezen/NT2_teksten_lezen_B1.pdf "")

invul puzzles:  [Google Doc](https://docs.google.com/document/d/1rXpoziM4_nwqIk3ck0wswi9v13SSQHTBvyjCdc8_wR4/edit?tab=t.0)',
    '[{"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/wp-content/uploads/b1-lezen/NT2\\_teksten\\_lezen_B1.pdf"}, {"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/wp-content/uploads/b1-lezen/NT2_teksten_lezen_B1.pdf"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1rXpoziM4_nwqIk3ck0wswi9v13SSQHTBvyjCdc8_wR4/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb444e'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 11, 'Recap B1 niveau: Zinnen met voegwoorden en woordvolgorde', 'B1', array['RECAP']::text[],
    '[Google Doc](https://docs.google.com/document/d/1ofPg9FAFnV4Uh8eWjEm53slx65cRmDpFtXouMy4BnzM/edit?usp=sharing)

 [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/conjuncties-en-woordvolgorde-nederlands)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1ofPg9FAFnV4Uh8eWjEm53slx65cRmDpFtXouMy4BnzM/edit?usp=sharing"}, {"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/conjuncties-en-woordvolgorde-nederlands"}]'::jsonb, '6ac3aec20a7c32245ceb44cc'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 12, 'Voornaamwoorden en hun functie in de zin', 'B1', array['Grammatica']::text[],
    'Voornaamwoorden zijn opzich zelf al een functie. Maar daarnaast nemen ze ook een andere rol in de zin.

Wij praten over het weer. Wij is hier een voornaamwoord maar het is ook het onderwerp.

Jij belt mij. Mij is een voornaamwoord maar het is hier ook het lijdend voorwerp. Wie bel je? Mij.

Neem de theorie door:  [Google Doc](https://docs.google.com/document/d/1Tn_Fy2QHIJmBpRmSLfiWUm6mcl7Y2ESRSY2t7JUsS5o/edit?usp=sharing)

En maak de oefeningen aan het einde van het document.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1Tn_Fy2QHIJmBpRmSLfiWUm6mcl7Y2ESRSY2t7JUsS5o/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4433'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 13, 'Aanvullende woordenlijst B1 / B2', 'B1', array['Woordenschat']::text[],
    '',
    '[]'::jsonb, '6ac3aec20a7c32245ceb44a2'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 14, 'Lijdend of meewerkenvoorwerp herkennen', 'B1', array['Grammatica']::text[],
    '[https://docs.google.com/document/d/1jR9sSnut6cO28JWr9fQ2hQUdu0m2Pv08olQrI_SQ8JA/edit?usp=sharing](https://docs.google.com/document/d/1jR9sSnut6cO28JWr9fQ2hQUdu0m2Pv08olQrI_SQ8JA/edit?usp=sharing "")',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1jR9sSnut6cO28JWr9fQ2hQUdu0m2Pv08olQrI_SQ8JA/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4472'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 15, 'recap: erop eronder erover eraan erom', 'B1', array['RECAP']::text[],
    '[Google Doc](https://docs.google.com/document/d/1rvtX_wbTpKdMx-ZeUKaqHvqV68883c0tRddptoXXLdg/edit?tab=t.0)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1rvtX_wbTpKdMx-ZeUKaqHvqV68883c0tRddptoXXLdg/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb4478'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 16, 'waar + werkwoord + prepositie', 'B1', array['Grammatica']::text[],
    'uitleg:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/waar-prepositie)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/waar-prepositie"}]'::jsonb, '6ac3aec20a7c32245ceb4442'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 17, 'Engelse werkwoorden vervoegen', 'B1', array['Grammatica']::text[],
    'theorie:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/invloed-uit-het-engels-werkwoorden)

kijk in het werkwoorden overzicht op de laatste pagina: [Google Doc](https://docs.google.com/document/d/1p9QiCyP_7ZAKGKDp0qT15R8emplVBgmfvhqVanMt5Uo/edit?usp=sharing)

maak deze oefeningen: [https://docs.google.com/document/d/1sdnbheDlma58LiWEQ8M2qvw80KT20EbZHLzBbtktLuM/edit?usp=sharing](https://docs.google.com/document/d/1sdnbheDlma58LiWEQ8M2qvw80KT20EbZHLzBbtktLuM/edit?usp=sharing "")',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/invloed-uit-het-engels-werkwoorden"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1p9QiCyP_7ZAKGKDp0qT15R8emplVBgmfvhqVanMt5Uo/edit?usp=sharing"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1sdnbheDlma58LiWEQ8M2qvw80KT20EbZHLzBbtktLuM/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44c0'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 18, 'Oefeningen over de Waterschappen', 'B1', array['Begrijpend lezen']::text[],
    '[Google Doc](https://docs.google.com/document/d/1AvWlJr_S6jax7FX7W0mHbGtqFDqHFbmZSsoamVA0L8k/edit?tab=t.0)

Maak eerst alle oefeningen uit deel 1

@masoncurtis6 We bekijken volgende keer samen de filmpjes.

Bekijk de reel. Neem de tijd voor elk filmpje. Het zijn er 4.  [npokennis.nl](https://npokennis.nl/story/572/wat-doet-een-waterschap)

Bekijk het filmpje. Heb je hier iets nieuws geleerd ten opzichte van de reel?  [schooltv.nl](https://schooltv.nl/video-item/nieuwsuur-in-de-klas-wat-doet-een-waterschap?utm_source=chatgpt.com)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1AvWlJr_S6jax7FX7W0mHbGtqFDqHFbmZSsoamVA0L8k/edit?tab=t.0"}, {"label": "npokennis.nl", "url": "https://npokennis.nl/story/572/wat-doet-een-waterschap"}, {"label": "schooltv.nl", "url": "https://schooltv.nl/video-item/nieuwsuur-in-de-klas-wat-doet-een-waterschap?utm_source=chatgpt.com"}]'::jsonb, '6ac3aec20a7c32245ceb44a5'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 19, 'Lees oefeningen B1 - deel 2', 'B1', array['Begrijpend lezen']::text[],
    '[https://nt2taalmenu.nl/wp-content/uploads/b1-lezen/geschiedenis/lezen\_B1\_Geschiedenis\_van\_Nederland.pdf](https://nt2taalmenu.nl/wp-content/uploads/b1-lezen/geschiedenis/lezen_B1_Geschiedenis_van_Nederland.pdf "")',
    '[{"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/wp-content/uploads/b1-lezen/geschiedenis/lezen\\_B1\\_Geschiedenis\\_van\\_Nederland.pdf"}, {"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/wp-content/uploads/b1-lezen/geschiedenis/lezen_B1_Geschiedenis_van_Nederland.pdf"}]'::jsonb, '6ac3aec20a7c32245ceb436d'
  from public.lesson_lanes where name = 'B'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 1, 'Werkwoorden vervoegen', 'A1', array['Oefenen']::text[],
    'Make all exercises in the correct order. Take your time, there is no need to make them all at once.

  [nt2taalmenu.nl](https://nt2taalmenu.nl/nt2-a1-grammatica-menuwerkwoorden/)',
    '[{"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/nt2-a1-grammatica-menuwerkwoorden/"}]'::jsonb, '6ac3aec20a7c32245ceb435e'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 2, 'speel de spel! Preposities', null, array['Oefenen']::text[],
    '[Wordwall-spel](https://wordwall.net/nl/resource/16263995/woordenschat/preposities-wonen)',
    '[{"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/16263995/woordenschat/preposities-wonen"}]'::jsonb, '6ac3aec20a7c32245ceb43cd'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 3, 'Woorden: Eten', null, array['Woordenschat']::text[],
    '[Google Doc](https://docs.google.com/document/d/1JKiHoBr6WZKLP7ncWSdy_C35Cvmb4qZQ9TcmxALPtbA/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1JKiHoBr6WZKLP7ncWSdy_C35Cvmb4qZQ9TcmxALPtbA/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4406'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 4, 'Woorden: Dieren', null, array['Woordenschat']::text[],
    '[Google Doc](https://docs.google.com/document/d/117AwliGKVefcQhKQq7Aww6T9rnpfJC0iZIvAVZ7jL5k/edit?tab=t.0)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/117AwliGKVefcQhKQq7Aww6T9rnpfJC0iZIvAVZ7jL5k/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb4403'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 5, 'Woorden: Apparaten', null, array['Woordenschat']::text[],
    '[https://docs.google.com/document/d/1SHgd0UVKnL8iQQfeBk7ODpbpW_Ls8WWy3gRKxwFU39M/edit?usp=sharing](https://docs.google.com/document/d/1SHgd0UVKnL8iQQfeBk7ODpbpW_Ls8WWy3gRKxwFU39M/edit?usp=sharing "")',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1SHgd0UVKnL8iQQfeBk7ODpbpW_Ls8WWy3gRKxwFU39M/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb440c'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 6, 'Woorden: Kleuren', null, array['Woordenschat']::text[],
    '[Google Doc](https://docs.google.com/document/d/1h0gIAuOFXNKXJvar_G9gEc5qOdzMbyeF8-2x8YPtve4/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1h0gIAuOFXNKXJvar_G9gEc5qOdzMbyeF8-2x8YPtve4/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4400'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 7, 'Woorden: Mensen', null, array['Woordenschat']::text[],
    '[Google Sheet](https://docs.google.com/spreadsheets/d/16D5hPTFVjn-7lvjpG0AZE_9BC4KiTyehwMuEKRHKJHM/edit?gid=1901480534#gid=1901480534)',
    '[{"label": "Google Sheet", "url": "https://docs.google.com/spreadsheets/d/16D5hPTFVjn-7lvjpG0AZE_9BC4KiTyehwMuEKRHKJHM/edit?gid=1901480534#gid=1901480534"}]'::jsonb, '6ac3aec20a7c32245ceb441e'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 8, 'Woorden: Nummers', null, array['Woordenschat']::text[],
    '[https://docs.google.com/document/d/1616FNMqVdwaApIEsU3gN_tiNiVY4i15HWJv9g6pcZqA/edit?usp=sharing](https://docs.google.com/document/d/1616FNMqVdwaApIEsU3gN_tiNiVY4i15HWJv9g6pcZqA/edit?usp=sharing "")',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1616FNMqVdwaApIEsU3gN_tiNiVY4i15HWJv9g6pcZqA/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4424'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 9, 'Woorden: Plekken', null, array['Woordenschat']::text[],
    '[Google Doc](https://docs.google.com/document/d/1_e3nhqAXsi8urkHRUDO3xrPpf22hEZ31s0Jpzadz13o/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1_e3nhqAXsi8urkHRUDO3xrPpf22hEZ31s0Jpzadz13o/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4439'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 10, 'oefening meervoudsvormen', 'A1', array['Oefenen']::text[],
    '**oefening over meervoudsvormen**

Schrijf de volgende woorden in hun meervoudsvorm.

Bonus: translate the words.

Laars, paard, straat, raaf, draad, haak, vaat, schaap, baard, blaar, poot, kaars, boom, wiel, been, roos, stoel, hoorn, muur, oor, boot, duim, vuur, ploeg, zaak, kaart,',
    '[]'::jsonb, '6ac3aec20a7c32245ceb4367'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 11, 'Perfectum: Mijn eerste zinnen in de verleden tijd', 'A1', array['Grammatica']::text[],
    '[Google Doc](https://docs.google.com/document/d/1U5rKc7-4oRePCHO_BMqTvPbNrXWv7FtBTN8EfrK3BuU/edit?usp=sharing)

Kijk naar deze werkwoorden en de theorie',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1U5rKc7-4oRePCHO_BMqTvPbNrXWv7FtBTN8EfrK3BuU/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4382'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 12, 'Mijn eerste werkwoorden - verleden tijd', 'A1', array['Grammatica']::text[],
    '[Google Doc](https://docs.google.com/document/d/14SVbK-zGB9RSW2SrDQtm6BfE79OnrucUye_eYbBSa1Q/edit?usp=sharing)

 [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/verleden-tijd-imperfectum)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/14SVbK-zGB9RSW2SrDQtm6BfE79OnrucUye_eYbBSa1Q/edit?usp=sharing"}, {"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/verleden-tijd-imperfectum"}]'::jsonb, '6ac3aec20a7c32245ceb4361'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 13, 'Oefening vraagwoorden', 'A1', array['Oefenen']::text[],
    '',
    '[]'::jsonb, '6ac3aec20a7c32245ceb4412'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 14, 'reflexieve werkwoorden oefenen', 'A1', array['Oefenen']::text[],
    'in oefening 2 komt elk reflexieve werkwoord uit het lijstje 2x terug. Zo kun je de woordjes goed oefenen:  [Google Doc](https://docs.google.com/document/d/198XM8rkd62Af38Az-hcXvNwZu-Pss3oCXfWwCyiCIJM/edit?tab=t.0)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/198XM8rkd62Af38Az-hcXvNwZu-Pss3oCXfWwCyiCIJM/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb44b4'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 15, 'Mijn eerste voegwoorden (conjuncties)', 'A1', array['Woordenschat']::text[],
    'Leer de voegwoorden uit je hoofd:  [Google Doc](https://docs.google.com/document/d/1iVV4gL63oCYOSHSoU7IC7JvUME-BTrgzV_iaJBxVin8/edit?usp=sharing)

Als je wilt kun je de oefening maken.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1iVV4gL63oCYOSHSoU7IC7JvUME-BTrgzV_iaJBxVin8/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43b2'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 16, 'vragen stellen', 'A1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/vragen-stellen)

 [Google Doc](https://docs.google.com/document/d/1LRTtrpbpEGd_iQcEBa1zCLMXR5DZjAKOVQaE3bXQKSY/edit?usp=sharing)

Als de oefeningen in bovenstaande link te makkelijk zijn mag je ze overslaan en alleen oefening 4 maken',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/vragen-stellen"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1LRTtrpbpEGd_iQcEBa1zCLMXR5DZjAKOVQaE3bXQKSY/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43c7'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 17, 'Werkwoorden tegenwoordige tijd (en verleden tijd)', 'A1', array['Grammatica', 'Oefenen']::text[],
    'theorie: [https://thedutchonlineacademy.com/grammar/werkwoorden-tegenwoordige-tijd](https://thedutchonlineacademy.com/grammar/werkwoorden-tegenwoordige-tijd "")

Maak de oefeningen uit het boekje.

Leer deze regelmatige werkwoorden uit je hoofd:  [Google Doc](https://docs.google.com/document/d/10mtE7yFgF2HcHR5grvo93w-KIUyXHuBzmvP_-st3dW0/edit?usp=sharing)

Maak ook deze oefeningen op pagina 1 (tegenwoordige tijd = present tense):  [Google Doc](https://docs.google.com/document/d/1hrXu-z_07LIy6GBWZYXfVO-KfWwFOsMqRyoKPIxnu6k/edit?tab=t.0).

Google the word if you do not know what they mean.',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/werkwoorden-tegenwoordige-tijd"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/10mtE7yFgF2HcHR5grvo93w-KIUyXHuBzmvP_-st3dW0/edit?usp=sharing"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1hrXu-z_07LIy6GBWZYXfVO-KfWwFOsMqRyoKPIxnu6k/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb43f4'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 18, 'toen (conjunctie)', 'A1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/toen-in-het-nederlands)

maak de oefeningen:  [Google Doc](https://docs.google.com/document/d/1A2VwLm_ohwdp21aDmn2yndSXj44sDZSa8hs-xOFESzY/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/toen-in-het-nederlands"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1A2VwLm_ohwdp21aDmn2yndSXj44sDZSa8hs-xOFESzY/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43d6'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 19, 'Woorden: Dingen', null, array['Woordenschat']::text[],
    '[Google Doc](https://docs.google.com/document/d/11041g77ZKWMD1ALErom7f2lGh2D1OpIVVvED3M4ltig/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/11041g77ZKWMD1ALErom7f2lGh2D1OpIVVvED3M4ltig/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4415'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 20, 'Speel een spel! Dieren', 'A1', array['Oefenen']::text[],
    'speel deze spel over dieren:  [Wordwall-spel](https://wordwall.net/nl/resource/36442434/dieren)

nog een spel [Wordwall-spel](https://wordwall.net/nl/resource/15360745/woordenschat/dieren-2-groep-5)

boerderij dieren  [Wordwall-spel](https://wordwall.net/nl/resource/56386349/thema-boerderij-dieren)',
    '[{"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/36442434/dieren"}, {"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/15360745/woordenschat/dieren-2-groep-5"}, {"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/56386349/thema-boerderij-dieren"}]'::jsonb, '6ac3aec20a7c32245ceb443c'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 21, 'geen en niet', 'A1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/niet-en-geen)

Maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1eqejv8RV0PsBdvxCWKGl4GfvMsx0CSbSZnG-CZQ12PI/edit?usp=sharing)

Maak deze oefeningen:  [jufmelis.nl](https://www.jufmelis.nl/extra/niet-of-geen/niet-of-geen-1)

indefiniet substantief (EN: `indefinite noun`):  **een zelfstandig naamwoord dat niet naar een specifieke zaak verwijst**. In de zin "De jongen heeft een fiets." is fiets een onbepaald zelfstandig naamwoord en verwijst niet naar een specifieke fiets.',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/niet-en-geen"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1eqejv8RV0PsBdvxCWKGl4GfvMsx0CSbSZnG-CZQ12PI/edit?usp=sharing"}, {"label": "jufmelis.nl", "url": "https://www.jufmelis.nl/extra/niet-of-geen/niet-of-geen-1"}]'::jsonb, '6ac3aec20a7c32245ceb43a9'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 22, 'Woorden: Familie', null, array['Woordenschat']::text[],
    '[Google Sheet](https://docs.google.com/spreadsheets/d/16D5hPTFVjn-7lvjpG0AZE_9BC4KiTyehwMuEKRHKJHM/edit?gid=1901480534#gid=1901480534)',
    '[{"label": "Google Sheet", "url": "https://docs.google.com/spreadsheets/d/16D5hPTFVjn-7lvjpG0AZE_9BC4KiTyehwMuEKRHKJHM/edit?gid=1901480534#gid=1901480534"}]'::jsonb, '6ac3aec20a7c32245ceb441b'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 23, 'onregelmatige werkwoorden tt komen hebben zijn', 'A1', array['Grammatica']::text[],
    'Leer deze woorden als je ze niet al kent en maak de oefeningen in de link:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/tegenwoordige-tijd-onregelmatig)

Maak deze oefeningen:

 [Google Doc](https://docs.google.com/document/d/12nLiHDzyz6YgODH5hrtu599lW_pdLHu-5VsRs_J9VAQ/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/tegenwoordige-tijd-onregelmatig"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/12nLiHDzyz6YgODH5hrtu599lW_pdLHu-5VsRs_J9VAQ/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43a6'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 24, 'Voorzetsels oefenen: De glas staat OP de tafel.', 'A1', array['Oefenen']::text[],
    'Kijk naar de bijlage. Ik heb de oefeningen voor preposities uit het boekje gefilterd.

Ik heb hier extra uitleg over preposities!  [Google Doc](https://docs.google.com/document/d/1QmSgvNJeOdcIyDiautPRVMXPvVPdpvBEG5IeB83ZsYU/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1QmSgvNJeOdcIyDiautPRVMXPvVPdpvBEG5IeB83ZsYU/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43e5'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 25, 'aan het + infinitief', 'A1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/aan-het-infinitief)

Maak ook deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1uEN-YrRLPWDNyccpjohECjLq09zvp9sAwvZfqORi_hI/edit?usp=sharing)

Let op: oefening 4 hoef je niet te maken!',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/aan-het-infinitief"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1uEN-YrRLPWDNyccpjohECjLq09zvp9sAwvZfqORi_hI/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43e8'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 26, 'reflectieve werkwoorden; zij haasten zich', 'A1', array['Grammatica']::text[],
    'Lees de theorie:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/reflexieve-werkwoorden)

Elk persoonsvorm heeft zijn eigen reflexieve voornaamwoord. Ook zie je dat de persoonsvorm gewoon dezelfde vervoeging als de tegenwoordige tijd heeft.

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1tSMHeNOohgopZ-9NRcwSaAN__UKdK5AQKNeDPSjeis8/edit?usp=sharing)

- **Ik** vergis **me**
- **Jij** vergist **je**
- **Hij/zij/het/u** vergist **zich**
- **Wij** vergissen **ons**
- **Jullie** vergissen **je**
- **Zij** vergissen **zich**',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/reflexieve-werkwoorden"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1tSMHeNOohgopZ-9NRcwSaAN__UKdK5AQKNeDPSjeis8/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43ca'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 27, 'de pronoom (voornaamwoord)', 'A1', array['Grammatica']::text[],
    '[https://thedutchonlineacademy.com/grammar/pronomen](https://thedutchonlineacademy.com/grammar/pronomen "")

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1kXd1RqX91nA8tuMoPp7aNchWA0RynLt-CvNqFyDkErM/edit?tab=t.0)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/pronomen"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1kXd1RqX91nA8tuMoPp7aNchWA0RynLt-CvNqFyDkErM/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb4391'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 28, 'Persoonlijke voornaamwoorden', 'A1', array['Grammatica']::text[],
    '[Google Doc](https://docs.google.com/document/d/1E97K_1AB3HBkTyUi636zDB5dDvPlTJFVZN1hNieC9zc/edit?tab=t.0)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1E97K_1AB3HBkTyUi636zDB5dDvPlTJFVZN1hNieC9zc/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb435b'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 29, 'perfectum: Ik heb gewerkt', 'A1', array['Grammatica']::text[],
    'Kijk nog eens naar de theorie: [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/perfectum)

Maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1Vj3DAhrTygZ04KawVBwynX5TL_Iak3ncmBToDqMZ4lw/edit?usp=sharing)

Leer deze werkwoorden uit je hoofd kennen:  [Google Sheet](https://docs.google.com/spreadsheets/d/16D5hPTFVjn-7lvjpG0AZE_9BC4KiTyehwMuEKRHKJHM/edit?gid=1251695000#gid=1251695000)

### **Extra voorbeelden:**

1. **Met een zinsdeel:**
   - Wij hebben in het bos gewandeld.
   - Hij heeft naar muziek geluisterd.
   - Zij heeft de hele dag hard gewerkt.
2. **Zonder een zinsdeel:**
   - Wij hebben gewandeld.
   - Hij heeft geluisterd.
   - Zij heeft gewerkt.',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/perfectum"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1Vj3DAhrTygZ04KawVBwynX5TL_Iak3ncmBToDqMZ4lw/edit?usp=sharing"}, {"label": "Google Sheet", "url": "https://docs.google.com/spreadsheets/d/16D5hPTFVjn-7lvjpG0AZE_9BC4KiTyehwMuEKRHKJHM/edit?gid=1251695000#gid=1251695000"}]'::jsonb, '6ac3aec20a7c32245ceb439d'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 30, 'Leer je eerste preposities', 'A1', array['Grammatica']::text[],
    'Leer de preposities die behoren bij A0. [https://docs.google.com/document/d/1qv6LDDgdd3hfHzz48tN15YeCnXA2w-r3uxYD40-Aixg/edit?usp=sharing](https://docs.google.com/document/d/1qv6LDDgdd3hfHzz48tN15YeCnXA2w-r3uxYD40-Aixg/edit?usp=sharing "")',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1qv6LDDgdd3hfHzz48tN15YeCnXA2w-r3uxYD40-Aixg/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4370'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 31, 'Preposities oefenen', null, array['Oefenen', 'Woordenschat']::text[],
    'Maak deze oefeningen: [https://docs.google.com/document/d/1uSKXdojyR-0ieSP6SjLSLoHCM2TSpJKi4J-COeNj6W0/edit?usp=sharing](https://docs.google.com/document/d/1uSKXdojyR-0ieSP6SjLSLoHCM2TSpJKi4J-COeNj6W0/edit?usp=sharing "")

speel deze spel:  [Wordwall-spel](https://wordwall.net/nl/resource/16263995/woordenschat/preposities-wonen)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1uSKXdojyR-0ieSP6SjLSLoHCM2TSpJKi4J-COeNj6W0/edit?usp=sharing"}, {"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/16263995/woordenschat/preposities-wonen"}]'::jsonb, '6ac3aec20a7c32245ceb4379'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 32, 'Woorden: bijvoegelijk naamwoorden', null, array['Woordenschat']::text[],
    'leer deze bijvoegelijke naamwoorden. De volgende keer gaan wij hier wat oefeningen mee maken [Google Doc](https://docs.google.com/document/d/1G-7KDPgpMIxUuqyxSyogSP6VDiR9MH47qdy03IknMFI/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1G-7KDPgpMIxUuqyxSyogSP6VDiR9MH47qdy03IknMFI/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb442a'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 33, 'woord volgorde en inversie (persoonsvorm)', 'A1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/inversie)

Maak de oefeningen. De makkelijke oefeningen mag je overslaan. [Google Doc](https://docs.google.com/document/d/1jjW2eh67lZbxElObfowgoQScu0ZIwQQLNyei4xypIO4/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/inversie"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1jjW2eh67lZbxElObfowgoQScu0ZIwQQLNyei4xypIO4/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43b5'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 34, 'het verschil tussen heel en veel', 'A1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/het-verschil-tussen-veel-en-heel)

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1LpJUi09d0we6ub-0IX7Ds94N-xnmeFPj9q7mvteheMo/edit?usp=sharing)

vergeet niet dat **Heel** als **adjectief** kan veranderen naar **hele**.

Het **hele** voetbalteam is naar spanje.

Een **heel** mooi schilderij.',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/het-verschil-tussen-veel-en-heel"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1LpJUi09d0we6ub-0IX7Ds94N-xnmeFPj9q7mvteheMo/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43ac'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 35, 'Werkwoorden: Hebben, zijn, willen en gaan', 'A1', array['Oefenen']::text[],
    '[Google Doc](https://docs.google.com/document/d/1uKrOWz2ShWXEcK14LoSI2xnOEcJFAG2_ybO478VuMwo/edit?usp=sharing)

Kijk naar de werkwoorden en maak de oefeningen',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1uKrOWz2ShWXEcK14LoSI2xnOEcJFAG2_ybO478VuMwo/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb437c'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 36, 'werkwoorden doet staan slaan zien gaan', 'A1', array['Grammatica']::text[],
    'Leer alle vervoegingen uit je hoofd: [Google Doc](https://docs.google.com/document/d/1SccTyDigzRK1ig14rS-Lp7JpNzyMjIBH7BS6YxvhC7s/edit?usp=sharing)

maak het huiswerk! De oefeningen zijn uitgebreid.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1SccTyDigzRK1ig14rS-Lp7JpNzyMjIBH7BS6YxvhC7s/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43a0'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 37, 'Woordenlijst Compleet A0', null, array['Woordenschat', 'Toetsen']::text[],
    'Leer deze woorden uit je hoofd. Succes! Hoeft niet allemaal voor de volgende keer.

Het is belangrijk dat je ook leert of het de of het woorden zijn.',
    '[]'::jsonb, '6ac3aec20a7c32245ceb442d'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 38, 'modale werkwoorden: kunnen mogen willen moeten hoeven', 'A1', array['Grammatica']::text[],
    'leer deze modale werkwoorden en maak de oefeningen:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/modale-werkwoorden)

maak deze oefeningen A1:

 [nt2taalmenu.nl](https://nt2taalmenu.nl/nt2-a1-grammatica-menumodalewerkwoorden/)

maak deze oefeningen A2: [https://docs.google.com/document/d/10krDFUawbJisDB8sgmXuq\_PujHyGfP0dqn3pf\_vWP70/edit?tab=t.0](https://docs.google.com/document/d/10krDFUawbJisDB8sgmXuq_PujHyGfP0dqn3pf_vWP70/edit?tab=t.0 "")',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/modale-werkwoorden"}, {"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/nt2-a1-grammatica-menumodalewerkwoorden/"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/10krDFUawbJisDB8sgmXuq\\_PujHyGfP0dqn3pf\\_vWP70/edit?tab=t.0"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/10krDFUawbJisDB8sgmXuq_PujHyGfP0dqn3pf_vWP70/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb43b8'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 39, 'Schrijfoefening: omschrijf jouw ideale vakantie in 15 zinnen. Maak er een leuk verhaaltje van.', null, array['Oefenen']::text[],
    '',
    '[]'::jsonb, '6ac3aec20a7c32245ceb437f'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 40, 'Zinsconstructie en hulpwerkwoorden', 'A1', array['Grammatica']::text[],
    'Bekijk de schema’s en maak de oefeningen

A0 (Cata, skip this one)

 [Google Doc](https://docs.google.com/document/d/1mj2iXO1tVmeU2QbJwhEhSYBz05FmPhTIcoWMpbJUmds/edit?usp=sharing)

A1 (their are a lot of exercizes, skip if its to repetative for you)

 [Google Doc](https://docs.google.com/document/d/1fpdBlSKixDqmRSKwS5CFSTatI3oCtlcnwQ1C1KXG6kY/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1mj2iXO1tVmeU2QbJwhEhSYBz05FmPhTIcoWMpbJUmds/edit?usp=sharing"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1fpdBlSKixDqmRSKwS5CFSTatI3oCtlcnwQ1C1KXG6kY/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4409'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 41, 'Zitten staan of liggen?', 'A1', array['Grammatica']::text[],
    'Lees dit artikel als je van lezen houdt: [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/articles/positiewerkwoorden-eigenlijk-heel-logisch)

en anders kun je hier de uitleg bekijken en een paar oefeningen maken:  [Google Doc](https://docs.google.com/document/d/1Mmucluklt1yXUOycpyCqi_NjSGJCTUUg3KUzZvCT0iE/edit?tab=t.0)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/articles/positiewerkwoorden-eigenlijk-heel-logisch"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1Mmucluklt1yXUOycpyCqi_NjSGJCTUUg3KUzZvCT0iE/edit?tab=t.0"}]'::jsonb, '6ac3aec20a7c32245ceb444b'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 42, 'leesoefeningen A2', 'A2', array['Oefenen']::text[],
    '[taalswitch.nl](https://taalswitch.nl/training/lezen-op-a2/)

[https://nt2taalmenu.nl/wp-content/uploads/a2-lezen/NT2\_teksten\_lezen_A2.pdf](https://nt2taalmenu.nl/wp-content/uploads/a2-lezen/NT2_teksten_lezen_A2.pdf "")',
    '[{"label": "taalswitch.nl", "url": "https://taalswitch.nl/training/lezen-op-a2/"}, {"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/wp-content/uploads/a2-lezen/NT2\\_teksten\\_lezen_A2.pdf"}, {"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/wp-content/uploads/a2-lezen/NT2_teksten_lezen_A2.pdf"}]'::jsonb, '6ac3aec20a7c32245ceb4445'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 43, 'Het verschil tussen huis en thuis', 'A2', array['Grammatica']::text[],
    'de theorie:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/huis-of-thuis)

extra exercises [https://docs.google.com/document/d/1lp2wHesDkJoeRT7XKRnqgBEfZrBuk6_wpkK7SPAxB4U/edit?usp=sharing](https://docs.google.com/document/d/1lp2wHesDkJoeRT7XKRnqgBEfZrBuk6_wpkK7SPAxB4U/edit?usp=sharing "")',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/huis-of-thuis"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1lp2wHesDkJoeRT7XKRnqgBEfZrBuk6_wpkK7SPAxB4U/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4457'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 44, 'scheidbare werkwoorden ook in het perfectum EN imperfectum !', 'A2', array['Grammatica']::text[],
    'scheidbare werkwoorden scheiden:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/scheidbare-werkwoorden)

scheidbare werkwoorden in het perfectum: [https://thedutchonlineacademy.com/grammar/scheidbare-werkwoorden-in-het-perfectum](https://thedutchonlineacademy.com/grammar/scheidbare-werkwoorden-in-het-perfectum "")

maak deze oefeningen.  [Google Doc](https://docs.google.com/document/d/1_yezsezEAXchN0A6Ia_qBrGen0RJ3NghFuh0YyxFaKQ/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/scheidbare-werkwoorden"}, {"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/scheidbare-werkwoorden-in-het-perfectum"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1_yezsezEAXchN0A6Ia_qBrGen0RJ3NghFuh0YyxFaKQ/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4427'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 45, 'Schrijfoefening: Omschrijf jouw afgelopen vakantie in 15 zinnen. Gebruik overwegen de verleden tijd (ik las een boek).', null, array['Oefenen']::text[],
    '',
    '[]'::jsonb, '6ac3aec20a7c32245ceb43af'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 46, 'Oefenen Niet en geen', 'A1', array['Oefenen']::text[],
    'Als je deze oefening niet wilt maken mag je hem direct naar rechts swipen!',
    '[]'::jsonb, '6ac3aec20a7c32245ceb43fa'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 47, 'Speel een spel! Niet en geen', null, array['Oefenen']::text[],
    '[Wordwall-spel](https://wordwall.net/nl/resource/15077174/niet-of-geen)',
    '[{"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/15077174/niet-of-geen"}]'::jsonb, '6ac3aec20a7c32245ceb43dc'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 48, 'Conjuncties en werkvolgorde', 'A2', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/conjuncties-en-woordvolgorde-nederlands)

Maak deze oefeningen over conjuncties:  [Google Doc](https://docs.google.com/document/d/1mxA6i9L-dP08JjPMFNXnzC9pTPuYYAi1IgugH2D2Ii8/edit?tab=t.0#heading=h.t7xa1yt3xo0p)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/conjuncties-en-woordvolgorde-nederlands"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1mxA6i9L-dP08JjPMFNXnzC9pTPuYYAi1IgugH2D2Ii8/edit?tab=t.0#heading=h.t7xa1yt3xo0p"}]'::jsonb, '6ac3aec20a7c32245ceb4421'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 49, 'lijst van reflectieve werkwoorden', 'A2', array['Woordenschat']::text[],
    '[https://thedutchonlineacademy.com/grammar/lijst-reflexieve-werkwoorden](https://thedutchonlineacademy.com/grammar/lijst-reflexieve-werkwoorden "")',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/lijst-reflexieve-werkwoorden"}]'::jsonb, '6ac3aec20a7c32245ceb447b'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 50, 'TE + adjectief: Ik vind het leuk om te voetballen', 'A2', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/te-met-adjectieven)

maak een paar oefeningen:  [Google Doc](https://docs.google.com/document/d/12DustIj7dbNIWRrm8Jf10OJ1jJbnPZy5xoNmpGnV6bo/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/te-met-adjectieven"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/12DustIj7dbNIWRrm8Jf10OJ1jJbnPZy5xoNmpGnV6bo/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb438b'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 51, 'Sterke en zwakke werkwoorden', 'A2', array['Grammatica']::text[],
    'Lijst van sterke werkwoorden:  [Google Sheet](https://docs.google.com/spreadsheets/d/1Cmw_sUZxiW9aXUgnLLSjil2gBADeR2irTAwgi2HSzYA/edit?usp=sharing)

oefeningen sterke werkwoorden:  [Google Doc](https://docs.google.com/document/d/1svet3gUdvEfVgufyHoQoAf46rpzdCEoA7YsVCOgH9SU/edit?usp=sharing)',
    '[{"label": "Google Sheet", "url": "https://docs.google.com/spreadsheets/d/1Cmw_sUZxiW9aXUgnLLSjil2gBADeR2irTAwgi2HSzYA/edit?usp=sharing"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1svet3gUdvEfVgufyHoQoAf46rpzdCEoA7YsVCOgH9SU/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4385'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 52, 'Werkwoorden: verleden tijd', 'A2', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/verleden-tijd-imperfectum)

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1xlhCz7-w9chwRtcEdikZ6IkDik08OnxZZDpjdjwJm58/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/verleden-tijd-imperfectum"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1xlhCz7-w9chwRtcEdikZ6IkDik08OnxZZDpjdjwJm58/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43d9'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 53, 'Lijst van scheidbare werkwoorden', 'A2', array['Woordenschat']::text[],
    'hier vind je een overzichtje van alle werkwoorden:  [Google Doc](https://docs.google.com/document/d/1GQdY-wNBb4FpR7fHvAL7gyHBeBIzt3dY0BzBou8XnF0/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1GQdY-wNBb4FpR7fHvAL7gyHBeBIzt3dY0BzBou8XnF0/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4418'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 54, 'Nog meer perfectum oefeningen', 'A1', array['Oefenen']::text[],
    'Het is goed om het perfectum te blijven oefenen. Het is erg belangrijk in de Nederlandse taal.

Ken je het woord niet? Zoek gerust de vertaling op.',
    '[]'::jsonb, '6ac3aec20a7c32245ceb440f'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 55, 'werkwoorden oefenen', 'A1', array['Oefenen']::text[],
    'Hier is een lijst van 100 regelmatige werkwoorden. Leer ze uit je hoofd:

 [Google Doc](https://docs.google.com/document/d/1R-YADQWKtrIb5tRz4vVEilBsZ-8OXKX_ZJg7hYxSmWU/edit?usp=sharing)

print de oefeningen uit en maak ze met een pen. [Google Doc](https://docs.google.com/document/d/1hrXu-z_07LIy6GBWZYXfVO-KfWwFOsMqRyoKPIxnu6k/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1R-YADQWKtrIb5tRz4vVEilBsZ-8OXKX_ZJg7hYxSmWU/edit?usp=sharing"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1hrXu-z_07LIy6GBWZYXfVO-KfWwFOsMqRyoKPIxnu6k/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4499'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 56, 'de en het woorden (basisregels)', 'A1', '{}'::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/de-of-het)

voorbeelden:  [Google Sheet](https://docs.google.com/spreadsheets/d/16D5hPTFVjn-7lvjpG0AZE_9BC4KiTyehwMuEKRHKJHM/edit?gid=1410993553#gid=1410993553)

maak deze opdrachten:  [Google Doc](https://docs.google.com/document/d/17VnWCOsS04hswT9F1NXsRHa5lKCHiaKq9vUUzkKmTcg/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/de-of-het"}, {"label": "Google Sheet", "url": "https://docs.google.com/spreadsheets/d/16D5hPTFVjn-7lvjpG0AZE_9BC4KiTyehwMuEKRHKJHM/edit?gid=1410993553#gid=1410993553"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/17VnWCOsS04hswT9F1NXsRHa5lKCHiaKq9vUUzkKmTcg/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4388'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 57, 'praten over de toekomst', 'A1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/praten-over-de-toekomst-zullen)

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1rCrQCBjYjDiDIn81Obw9w0fi5r_DTffn4Pr6jFmjvGU/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/praten-over-de-toekomst-zullen"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1rCrQCBjYjDiDIn81Obw9w0fi5r_DTffn4Pr6jFmjvGU/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43be'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 58, 'die dit dat deze', 'A1', array['Grammatica']::text[],
    '[https://thedutchonlineacademy.com/grammar/die-deze-dat](https://thedutchonlineacademy.com/grammar/die-deze-dat "")

 [Google Doc](https://docs.google.com/document/d/10oRqQPLkypChGHQ_dwlqaaaxByKsxxZt4h_DM2h9BhA/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/die-deze-dat"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/10oRqQPLkypChGHQ_dwlqaaaxByKsxxZt4h_DM2h9BhA/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb438e'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 59, 'adjectieven: met e of zonder e', 'A1', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/adjectieven-met-of-zonder-e)

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1qFB4V_cWoMsPoBhL0TaWPABiarPjpIcMoyAjrQv0p8M/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/adjectieven-met-of-zonder-e"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1qFB4V_cWoMsPoBhL0TaWPABiarPjpIcMoyAjrQv0p8M/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4394'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 60, 'combinaties van medeklinkers: schrijven, winst, staat, klimt', null, array['Spreken']::text[],
    '[https://nt2taalmenu.nl/nt2-a1-klanken-combinaties/](https://nt2taalmenu.nl/nt2-a1-klanken-combinaties/ "")',
    '[{"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/nt2-a1-klanken-combinaties/"}]'::jsonb, '6ac3aec20a7c32245ceb4373'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 61, 'speel een spel! Modale werkwoorden', null, array['Oefenen']::text[],
    'speel deze spel:  [Wordwall-spel](https://wordwall.net/nl/resource/65532191/modale-werkwoorden)

speel ook deze spel, dit is tevens een goede oefening voor woordvolgorde:  [Wordwall-spel](https://wordwall.net/nl/resource/26109809/zinnen-met-modale-werkwoorden)

en deze:  [Wordwall-spel](https://wordwall.net/nl/resource/37946794/modale-werkwoorden-kunnen-zullen-moeten-mogen-gaan-willen)',
    '[{"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/65532191/modale-werkwoorden"}, {"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/26109809/zinnen-met-modale-werkwoorden"}, {"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/37946794/modale-werkwoorden-kunnen-zullen-moeten-mogen-gaan-willen"}]'::jsonb, '6ac3aec20a7c32245ceb43d0'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 62, 'Er op 5 manieren', 'A1', array['Grammatica']::text[],
    'Bekijk het overzicht van alle 5 manieren om ER te gebruiken  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/er-overzicht)

maak alle oefeningen over ER:  [Google Doc](https://docs.google.com/document/d/1HEV884CXAxgIM2E3Ke9dQlHe9zlM5HwXFUi3v927ERI/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/er-overzicht"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1HEV884CXAxgIM2E3Ke9dQlHe9zlM5HwXFUi3v927ERI/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4397'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 63, 'Alle negetaties: soms vaak ooit -> Nooit, ergens -> Nergens', 'A1', array['Woordenschat']::text[],
    'Weet je nog wanneer je niet en geen moet gebruiken? toets je kennis door deze oefeningen te herhalen:  [Google Doc](https://docs.google.com/document/d/1eqejv8RV0PsBdvxCWKGl4GfvMsx0CSbSZnG-CZQ12PI/edit?tab=t.0)

Maar er zijn meer negataties. Bekijk het overzicht hier en maak de oefeningen.

 [Google Doc](https://docs.google.com/document/d/1fw8p83kN3jpncaVu33wE-CX6YJjSZNUPhKm94Molg5g/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1eqejv8RV0PsBdvxCWKGl4GfvMsx0CSbSZnG-CZQ12PI/edit?tab=t.0"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1fw8p83kN3jpncaVu33wE-CX6YJjSZNUPhKm94Molg5g/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43fd'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 64, 'comparetieven: mooi - mooier', 'A1', array['Grammatica']::text[],
    'Kijk hier naar de theorie:  [Google Doc](https://docs.google.com/document/d/1o8Uhqw_ZhZsoABfeoPbe0pN2mD_4qzzIYgZrJfQr7tQ/edit?tab=t.0#heading=h.allcrdp7t4r4)

maak de oefeningen onderaan deze pagina:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/comparatief-en-superlatief-in-het-nederlands-vergelijkingen)

maak hier nog wat extra oefeningen:  [Google Doc](https://docs.google.com/document/d/1W_kFz1X-WKe9UsQvEkjXHPiQ3NqaI74Ohp7C6V1XGvQ/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1o8Uhqw_ZhZsoABfeoPbe0pN2mD_4qzzIYgZrJfQr7tQ/edit?tab=t.0#heading=h.allcrdp7t4r4"}, {"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/comparatief-en-superlatief-in-het-nederlands-vergelijkingen"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1W_kFz1X-WKe9UsQvEkjXHPiQ3NqaI74Ohp7C6V1XGvQ/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb439a'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 65, 'Fijn / fine', 'A1', array['Woordenschat']::text[],
    'Neem zelf de theorie door en bedenk 5 zinnen waarmee je het woordje Fijn juist gebruik. [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/fine-fijn)

translate to dutch:

1. I am fine.
2. We had a nice dinner together.
3. This is a great example of a good answer.
4. That was a nice day at the beach.
5. My grandmother has very thin hair.
6. I feel fine now, thank you.
7. It was a fine evening with music and friends.
8. I had a nice time in spain but Its fine that it’s over now.
9. This is a nice pen, I like writing with it.
10. I’m not great, but I’m fine.',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/fine-fijn"}]'::jsonb, '6ac3aec20a7c32245ceb43f1'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 66, 'Woorden: Het lichaam', 'A1', array['Woordenschat']::text[],
    'Leer deze woorden uit je hoofd. Hier heb je een csv. kun je dit importeren zo? of mag je maar 2 kolommen…

[Lichaamsdelen.csv](https://trello.com/1/cards/67d86cc6d7b892b6df927e98/attachments/67d86d55a5a9c6179036bcb7/download/Lichaamsdelen.csv "")',
    '[{"label": "trello.com", "url": "https://trello.com/1/cards/67d86cc6d7b892b6df927e98/attachments/67d86d55a5a9c6179036bcb7/download/Lichaamsdelen.csv"}]'::jsonb, '6ac3aec20a7c32245ceb43bb'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 67, 'verwijzen naar dingen', 'A1', array['Grammatica']::text[],
    '[https://thedutchonlineacademy.com/grammar/verwijzen-naar-dingen](https://thedutchonlineacademy.com/grammar/verwijzen-naar-dingen "")

Het is belangrijk dat je ook leert of het de of het woorden zijn. Maak daarom alle oefeningen:  [Google Doc](https://docs.google.com/document/d/1KiUOIvZ3YPzJssw88VlIhFrbK6773nUz65_02VnOUtE/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/verwijzen-naar-dingen"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1KiUOIvZ3YPzJssw88VlIhFrbK6773nUz65_02VnOUtE/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43e2'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 68, 'Speel een spel! Het lichaam', null, array['Oefenen']::text[],
    '[Wordwall-spel](https://wordwall.net/nl/resource/12958062/woordenschat/het-lichaam)',
    '[{"label": "Wordwall-spel", "url": "https://wordwall.net/nl/resource/12958062/woordenschat/het-lichaam"}]'::jsonb, '6ac3aec20a7c32245ceb43d3'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 69, 'Leer de onregelmatige werkwoorden uit je hoofd', 'A1', array['Woordenschat']::text[],
    'Leer de vooltooid deeltijd worden (PEFECTUM) uit je hoofd: [Google Doc](https://docs.google.com/document/d/1uxu11OHIzT3uKpmWvl5JJzZ3CkQURWOEIx9jImAHjq4/edit?usp=sharing)

another way to learn words bij hart is just to do alot of exercises and repetition.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1uxu11OHIzT3uKpmWvl5JJzZ3CkQURWOEIx9jImAHjq4/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4448'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 70, 'Recap: Hebben of zijn? (Perfectum)', 'A1', array['Oefenen']::text[],
    '[Google Doc](https://docs.google.com/document/d/1ftYkm1gzWGq6vStW4Z161Qu91g2r0HwLH8M2DKdfFg4/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1ftYkm1gzWGq6vStW4Z161Qu91g2r0HwLH8M2DKdfFg4/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44bd'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 71, 'Tussentijdse stand: Alle theorie tot nu toe', 'A1', array['Oefenen', 'RECAP']::text[],
    'Vertaal de rest van de zinnen.  [Google Doc](https://docs.google.com/document/d/1tkmbSM_c5NMUXYiPaVtZ4jFQUDvU3NmR3ogTKG3iJ8s/edit?usp=sharing) Kijk maar hoever je komt. Je hoeft ze niet allemaal te doen. We kunnen er woensdag ook een paar tijdens de les vertalen.

Met deze zinnen oefen je ook de woorden die je met de A1 lijst hebt moeten leren.

Je hoeft ze nog niet in quizlet te stoppen. maar als je dat wilt, heb ik in de bijlage de .csv gevoegd.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1tkmbSM_c5NMUXYiPaVtZ4jFQUDvU3NmR3ogTKG3iJ8s/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43c1'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 72, 'Om te om te --> Wat betekent dit nou allemaal?', 'A2', array['Grammatica']::text[],
    '[Google Doc](https://docs.google.com/document/d/1P5f6XSk919Ase7P0QCpYQu_iz_zap3eJHLoqxcYT0KQ/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1P5f6XSk919Ase7P0QCpYQu_iz_zap3eJHLoqxcYT0KQ/edit?usp=sharing"}]'::jsonb, '6ac3bb9bbe3de06ddb4c24db'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 73, 'Recap: Praten over het verleden', 'A2', array['Grammatica']::text[],
    'de theorie nogmaals [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/imperfectum)Maak de oefeningen onderaan de link.

oefeningen voor de verleden tijd:

 [jufmelis.nl](https://www.jufmelis.nl/werkwoordspelling/pv-verleden-tijd-door-elkaar/pv-verleden-tijd-door-elkaar-1)

 [jufmelis.nl](https://www.jufmelis.nl/werkwoordspelling/pv-verleden-tijd-meervoud/persoonsvorm-verleden-tijd-meervoud-1)

 [taal-oefenen.nl](https://www.taal-oefenen.nl/taal-groep-7/werkwoorden/verleden-tijd/stamregel-1-zwakke-werkwoorden-het-woord-verandert-niet)

oefeningen voor de voltooid deelwoord

 [taal-oefenen.nl](https://www.taal-oefenen.nl/taal-groep-7/werkwoorden/voltooid-deelwoord)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/imperfectum"}, {"label": "jufmelis.nl", "url": "https://www.jufmelis.nl/werkwoordspelling/pv-verleden-tijd-door-elkaar/pv-verleden-tijd-door-elkaar-1"}, {"label": "jufmelis.nl", "url": "https://www.jufmelis.nl/werkwoordspelling/pv-verleden-tijd-meervoud/persoonsvorm-verleden-tijd-meervoud-1"}, {"label": "taal-oefenen.nl", "url": "https://www.taal-oefenen.nl/taal-groep-7/werkwoorden/verleden-tijd/stamregel-1-zwakke-werkwoorden-het-woord-verandert-niet"}, {"label": "taal-oefenen.nl", "url": "https://www.taal-oefenen.nl/taal-groep-7/werkwoorden/voltooid-deelwoord"}]'::jsonb, '6ac3aec20a7c32245ceb43a3'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 74, 'Lijst van Perfectum', 'A2', array['Woordenschat']::text[],
    'Hier is een mooi compleet lijst van Perfectum woorden. Het is goed om deze te oefenen.',
    '[]'::jsonb, '6ac3aec20a7c32245ceb43eb'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 75, 'voorzetsel "om"', 'A2', array['Grammatica', 'RECAP']::text[],
    'lees de theorie opnieuw en houdt het erbij terwijl je de oefeningen maakt:  [Google Doc](https://docs.google.com/document/d/1Dc0J1EUHQ_BF5GFg1urW8op71cw3aeC6dNGJDvYSJPs/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1Dc0J1EUHQ_BF5GFg1urW8op71cw3aeC6dNGJDvYSJPs/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44ae'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 76, 'Leuk, lekker of mooi?', 'A2', array['Woordenschat']::text[],
    'Kijk naar de voorbeelden en maak de oefeningen onderin de pagina [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/leuk-mooi-en-lekker)

 [Google Doc](https://docs.google.com/document/d/1_meyabzG7Sf7sl-WP-FCbK0QXvOZhqlMYgTnvXD0_iA/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/leuk-mooi-en-lekker"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1_meyabzG7Sf7sl-WP-FCbK0QXvOZhqlMYgTnvXD0_iA/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4481'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 77, 'Woordvolgorde bijwoorden TeMPo/oTeMP', 'A2', array['Grammatica']::text[],
    '[https://thedutchonlineacademy.com/grammar/woordvolgorde-bijwoorden-tempo-is-niet-alles](https://thedutchonlineacademy.com/grammar/woordvolgorde-bijwoorden-tempo-is-niet-alles "")',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/woordvolgorde-bijwoorden-tempo-is-niet-alles"}]'::jsonb, '6ac3aec20a7c32245ceb4430'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 78, 'perfectum of imperfectum?', 'A2', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/het-verschil-tussen-perfectum-en-imperfectum)

 [Google Doc](https://docs.google.com/document/d/1H3bOpXnMa5wRcgE2zDxPhA2TCDyZAqnxP75rCvKTfvI/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/het-verschil-tussen-perfectum-en-imperfectum"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1H3bOpXnMa5wRcgE2zDxPhA2TCDyZAqnxP75rCvKTfvI/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb446f'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 79, 'alleen, maar en pas', 'A2', array['Grammatica']::text[],
    'de theorie:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/alleen-maar-en-pas)

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/126reQJsky4mqv3P4xqiBzEwJjGtof2w3SR6wjhmCc8Y/edit?usp=sharing)

`In het Engels zou je ''only'' gebruiken, maar in het Nederlands zul je moeten kiezen tussen ''alleen'', ''maar'' en ''pas''. Wees voorzichtig met kwantiteitswoorden.`',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/alleen-maar-en-pas"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/126reQJsky4mqv3P4xqiBzEwJjGtof2w3SR6wjhmCc8Y/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4454'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 80, 'extra oefeningen: hulpwerkwoorden, dubbel infinitief, verleden tijd en reflexieve werkwoorden', 'A2', array['Oefenen']::text[],
    '[Google Doc](https://docs.google.com/document/d/1X8A6hRptvv9s6Xj0VxA3CJBnrGqU7gQQZq_WqrnN-Gs/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1X8A6hRptvv9s6Xj0VxA3CJBnrGqU7gQQZq_WqrnN-Gs/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44ba'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 81, 'Schrijfoefening XL: Omschrijf je droomhuis in een paar honderd woorden!', 'A2', array['Oefenen']::text[],
    '### **Schrijfoefening: Mijn ideale huis** 🏡

📌 **Opdracht:**
Beschrijf jouw ideale huis. Waar staat het? Hoe ziet het eruit? Welke kamers zijn er? Wat doe je daar op een gewone dag?

**👉 Gebruik in je tekst:**
       ✅ _De/het_: Beschrijf objecten die je ziet of gebruikt.

- Voorbeeld: "Het strand waar ik naartoe ga, is prachtig."
  ✅ _Die/dat/deze_: Vergelijk dingen of verwijs naar iets.
- Voorbeeld: "Deze dag is beter dan die van gisteren."
  ✅ _Welk(e)_: Stel een vraag in je tekst.
- Voorbeeld: "Welke activiteiten zou jij kiezen?"
  ✅ _Bijvoeglijke naamwoorden met -e_: Beschrijf mensen, plaatsen of dingen.
- Voorbeeld: "We zitten in een gezellig café."
  ✅ _Aan het + infinitief_: Beschrijf een activiteit die bezig is.
- Voorbeeld: "Mijn vrienden zijn muziek aan het maken."
  ✅ _Preposities_: Gebruik voorzetsels om locaties of tijd aan te geven.
- Voorbeeld: "We zitten op een terras aan het water."
  ✅ _Vragen stellen_: Stel minstens één vraag in je tekst.
- Voorbeeld: "Hoe zou jij jouw perfecte dag doorbrengen?"
  ✅ _Meervoudsvormen_: Gebruik meervouden in je beschrijvingen.
- Voorbeeld: "De mensen in de stad lachen en praten."
  ✅ _Perfectum_: Beschrijf iets dat je al gedaan hebt.
- Voorbeeld: "Ik heb nog nooit zo’n mooie zonsondergang gezien."
  ✅ _Verleden tijd_: Vertel iets over een eerdere ervaring.
- Voorbeeld: "Vorig jaar maakte ik een lange wandeling in de bergen."

💡 **Tip:** Probeer zoveel mogelijk van deze structuren natuurlijk in je verhaal te verwerken.

Veel schrijfplezier! ✍️😊',
    '[]'::jsonb, '6ac3aec20a7c32245ceb43c4'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 82, 'Imperatief: Kom snel!', 'A2', array['Grammatica']::text[],
    'de theorie:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/imperatief-en-vriendelijke-bevelen)

maak deze oefeningen:  [Google Doc](https://docs.google.com/document/d/1b1b2TcAUJ9xreZyVoqo3eygliHPu3Td2PCPMaTBauj4/edit?usp=sharing)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/imperatief-en-vriendelijke-bevelen"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1b1b2TcAUJ9xreZyVoqo3eygliHPu3Td2PCPMaTBauj4/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4469'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 83, 'Kennen of weten?', 'A2', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/kennen-vs-weten)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/kennen-vs-weten"}]'::jsonb, '6ac3aec20a7c32245ceb448d'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 84, '2 jaar of 2 jaren?', 'A2', array['Grammatica']::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/jaar-of-jaren)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/jaar-of-jaren"}]'::jsonb, '6ac3aec20a7c32245ceb4490'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 85, 'Op naar B1 niveau!', 'A2', '{}'::text[],
    'Studiewijzer',
    '[]'::jsonb, '6ac3aec20a7c32245ceb4496'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 86, 'Examen spreken', 'A2', array['Toetsen']::text[],
    '',
    '[]'::jsonb, '6ac3aec20a7c32245ceb445a'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 87, 'Best of de beste ..?', 'A2', array['Grammatica']::text[],
    '[https://thedutchonlineacademy.com/grammar/best-niet-de-beste](https://thedutchonlineacademy.com/grammar/best-niet-de-beste "")

Ik ben de beste speler.

Ik ben best een goed speler.',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/best-niet-de-beste"}]'::jsonb, '6ac3aec20a7c32245ceb446c'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 88, 'Emoties', null, '{}'::text[],
    '[Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/emoties-vocabulaire)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/emoties-vocabulaire"}]'::jsonb, '6ac3aec20a7c32245ceb4463'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 89, 'Het verschil tussen: toen, wanneer en als', 'A2', array['Grammatica']::text[],
    'de theorie: [https://thedutchonlineacademy.com/grammar/het-verschil-tussen-toen-wanneer-en-als](https://thedutchonlineacademy.com/grammar/het-verschil-tussen-toen-wanneer-en-als "")',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/het-verschil-tussen-toen-wanneer-en-als"}]'::jsonb, '6ac3aec20a7c32245ceb4466'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 90, 'Hoe gebruik je zou?', 'A2', array['Grammatica']::text[],
    'De theorie:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/hoe-gebruik-je-zou)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/hoe-gebruik-je-zou"}]'::jsonb, '6ac3aec20a7c32245ceb4460'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 91, 'Recap: Er op 5 manieren', 'A2', array['RECAP']::text[],
    'ER kwantiteit: [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/er-2-er-kwantiteit)

ER passief: [https://thedutchonlineacademy.com/grammar/er-4-er-passieve-zinnen](https://thedutchonlineacademy.com/grammar/er-4-er-passieve-zinnen "")

ER + prepositie  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/untitled-entry-2019-07-23-at-07-29-14-nl)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/er-2-er-kwantiteit"}, {"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/er-4-er-passieve-zinnen"}, {"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/untitled-entry-2019-07-23-at-07-29-14-nl"}]'::jsonb, '6ac3aec20a7c32245ceb4484'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 92, 'verschil tussen want en omdat', 'A2', array['Oefenen', 'RECAP']::text[],
    '[https://thedutchonlineacademy.com/grammar/want-versus-omdat](https://thedutchonlineacademy.com/grammar/want-versus-omdat "")',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/want-versus-omdat"}]'::jsonb, '6ac3aec20a7c32245ceb447e'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 93, 'XL: grammaticale thema''s combineren en woordvolgorde', 'A2', array['Oefenen', 'RECAP']::text[],
    'recap theorie grammatica:  [Google Doc](https://docs.google.com/document/d/1IWcHNFPhFgQjmG7jVAREmBHpUxXGZteT56tU-Uko7Oo/edit?usp=sharing)

Maak de oefeningen. Houdt per thema de recap erbij van het document hierboven:  [Google Doc](https://docs.google.com/document/d/1FS27XoeegR-anmTXmk2-V1a6ytXFfCQPUZzRglxPsmo/edit?usp=sharing)

@masoncurtis6 kijk maar hoever je komt en we gaan dit aankomende les uitgebreid behandelen.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1IWcHNFPhFgQjmG7jVAREmBHpUxXGZteT56tU-Uko7Oo/edit?usp=sharing"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1FS27XoeegR-anmTXmk2-V1a6ytXFfCQPUZzRglxPsmo/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44a8'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 94, 'A2 zinnen oefenen in Quizlet', 'A2', array['RECAP']::text[],
    'In dit document staan 4 lijstjes zinnen. Het zijn eigenlijk 2 lijstjes. Maar er lijst heeft een makkelijke en een uitgebreide variant.

 [Google Doc](https://docs.google.com/document/d/1GFLjCRmAv72T2zixQFswKcGBbPwWVWNPDuhZEELe1AE/edit?usp=sharing)

Deel 1 - Makkelijk

Deel 1 - Uitbreiding

Deel 2 - Makkelijk

Deel 2 - Uitbreiding',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1GFLjCRmAv72T2zixQFswKcGBbPwWVWNPDuhZEELe1AE/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb449c'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 95, 'RECAP: Werkwoorden met voorzetselgroepen', 'A2', array['Oefenen']::text[],
    'Hier vind je de theorie over werkwoorden en voorzetselgroepen met wat oefeningen:  [Google Doc](https://docs.google.com/document/d/19Yxp63NqH5EaNWyRPalmj2kNgMmtSk_mqONWbxP6zkA/edit?usp=sharing)

Je leert hiermee herkennen of delen van de zin “verplicht” en hoe belangrijk de voorzetselgroep is voor de betekenis/context van de zin. Dit heeft te maken met waar je de voorzetselgroep wilt plaatsen in de zin.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/19Yxp63NqH5EaNWyRPalmj2kNgMmtSk_mqONWbxP6zkA/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb44c3'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 96, 'hun of hen?', 'A2', array['Grammatica']::text[],
    'de theorie:  [Theorie · Dutch Online Academy](https://thedutchonlineacademy.com/grammar/hun-of-hen)',
    '[{"label": "Theorie · Dutch Online Academy", "url": "https://thedutchonlineacademy.com/grammar/hun-of-hen"}]'::jsonb, '6ac3aec20a7c32245ceb445d'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 97, 'klanken oefenen', 'A1', array['Spreken']::text[],
    '[Google Doc](https://docs.google.com/document/d/1cO5gPpDCXm5Vo09YMoMf0JNVUwkjbsq68ifBR-3FEBQ/edit?usp=sharing)',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1cO5gPpDCXm5Vo09YMoMf0JNVUwkjbsq68ifBR-3FEBQ/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb4376'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 98, 'lettergrepen, klinkers en tweeklanken', null, array['Spreken']::text[],
    '[Google Doc](https://docs.google.com/document/d/1IJfR4B5PTxaw3i9fasjmHlnY75e4VINTsffa2cR7lMI/edit?tab=t.0#heading=h.lxvpbgmxgm2h)

maak deze oefeningen:   [Google Doc](https://docs.google.com/document/d/1v9PaiL_DCnxjVoKm4gdPvGWkaL480dGhG7DzBgMiALk/edit?usp=sharing)

kijk deze video:

[https://www.youtube.com/watch?v=5u3PnPfS4AA](https://www.youtube.com/watch?v=5u3PnPfS4AA "smartCard-embed")',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1IJfR4B5PTxaw3i9fasjmHlnY75e4VINTsffa2cR7lMI/edit?tab=t.0#heading=h.lxvpbgmxgm2h"}, {"label": "Google Doc", "url": "https://docs.google.com/document/d/1v9PaiL_DCnxjVoKm4gdPvGWkaL480dGhG7DzBgMiALk/edit?usp=sharing"}, {"label": "Video · YouTube", "url": "https://www.youtube.com/watch?v=5u3PnPfS4AA"}]'::jsonb, '6ac3aec20a7c32245ceb436a'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 99, 'Oefenen met spreken', null, array['Oefenen']::text[],
    '',
    '[]'::jsonb, '6ac3aec20a7c32245ceb43ee'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 100, 'Leesoefeningen A1', 'A1', array['Begrijpend lezen']::text[],
    '[https://nt2taalmenu.nl/wp-content/uploads/a1-lezen/NT2\_A1\_Lezen\_Teksten\_-PDF.pdf](https://nt2taalmenu.nl/wp-content/uploads/a1-lezen/NT2_A1_Lezen_Teksten_-PDF.pdf "")',
    '[{"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/wp-content/uploads/a1-lezen/NT2\\_A1\\_Lezen\\_Teksten\\_-PDF.pdf"}, {"label": "nt2taalmenu.nl", "url": "https://nt2taalmenu.nl/wp-content/uploads/a1-lezen/NT2_A1_Lezen_Teksten_-PDF.pdf"}]'::jsonb, '6ac3aec20a7c32245ceb4358'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 101, 'Spreekoefeningen A0- A1', 'A1', array['Spreken']::text[],
    '[Wordwall-spel](https://wordwall.net/nl-nl/community/spreken-a0-a1)',
    '[{"label": "Wordwall-spel", "url": "https://wordwall.net/nl-nl/community/spreken-a0-a1"}]'::jsonb, '6ac3aec20a7c32245ceb4364'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 102, 'Oefeningen Compleet A1', 'A1', array['Oefenen']::text[],
    'Kijk maar hoever je komt en welke je wilt overslaan. Het is een goede oefening om dit uit te printen en in te vullen. Je kunt de prints volgende keer mee naar de les nemen',
    '[]'::jsonb, '6ac3aec20a7c32245ceb4436'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;

insert into public.lessons (lane_id, position, title, level, categories, explanation, links, trello_card_id)
  select id, 103, 'Mijn eerste ontmoetingsgesprek', null, array['Woordenschat']::text[],
    '[Google Doc](https://docs.google.com/document/d/1mbIDHWs_xnJNH3pwat5i0M06ELRMNtdGpBde6yETVmg/edit?usp=sharing)  Learn these sentences by heart.',
    '[{"label": "Google Doc", "url": "https://docs.google.com/document/d/1mbIDHWs_xnJNH3pwat5i0M06ELRMNtdGpBde6yETVmg/edit?usp=sharing"}]'::jsonb, '6ac3aec20a7c32245ceb43f7'
  from public.lesson_lanes where name = 'A'
  on conflict (trello_card_id) do nothing;
