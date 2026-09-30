# Le Marathon du Marathon (multi-mobile)

Vote ludique à 4 : chacun vote en secret sur son téléphone, l'hôte affiche les révélations.
Règles, déroulé et design repris de la V1 (`reference/marathon-du-marathon-v1.html`).

Stack : Next.js 15 (App Router) · Supabase (Postgres + Realtime) · Vercel.

## Pages
- `/` : créer / rejoindre une salle (on y revient automatiquement tant qu'on n'a pas quitté sa salle) + « Découvrir les marathons ».
- `/marathons` : carte + liste. `/marathons/[slug]` : fiche détaillée (photo, parcours, trajet ; ranking et notes perso stockés en local).
- `/room/CODE` : la salle de vote. Avant l'ouverture : règles + « Conclave bientôt ouvert ».

## Catalogue des marathons
Liste fixée en amont dans la table Supabase `catalog` (source : base Notion « Choix marathon »).
À l'ouverture du Conclave, les marathons de la salle sont copiés depuis le catalogue.
```bash
npm run catalog   # (re)génère data/marathons.json (coordonnées, photos Wikipedia)
npm run seed      # envoie data/marathons.json dans Supabase
```
Migration à exécuter une fois dans le SQL Editor : `supabase/migration_002_catalog.sql`.

## Règles de cette version
Qualifs : 5 choix par joueur, 10 qualifiés. Finale : 10 points (7 max par marathon) ;
carton rouge joué : 5 points (4 max par marathon).

## Sécurité (secret des bulletins)
- Le navigateur (clé `anon`) ne peut que **lire** `rooms`, `players`, `marathons` (+ Realtime dessus).
- `ballots`, `player_private` (token + carton rouge), `room_secrets` (tirages), `room_history` (annulation) :
  RLS activée **sans aucune policy** → illisibles depuis un navigateur.
- Toutes les écritures passent par `src/app/api/**` avec la clé `service_role`, après vérification de `(playerId, token)`.
- Le token est généré côté serveur et stocké dans le `localStorage` du joueur (pas d'auth).
- Tout tirage au sort est calculé côté serveur (`src/lib/engine.ts`) ; l'écran n'anime que le résultat déjà décidé.
- Seul « qui a voté » est public (`rooms.state.voted`), jamais le contenu ni le carton.

Écart volontaire avec le brief : `card_used` est dans `player_private` et non `players`, pour qu'il ne fuite pas via Realtime.

## Installation locale
```bash
npm install
cp .env.example .env.local   # puis remplir les 3 variables
npm run dev
```

## Base Supabase
1. Créer un projet sur supabase.com.
2. SQL Editor → coller `supabase/schema.sql` → Run.
3. Project Settings → API : copier l'URL, la clé `anon`, la clé `service_role`.

## Déploiement Vercel
1. Pousser le repo sur GitHub.
2. Vercel → Add New Project → importer le repo (preset Next.js détecté).
3. Environment Variables (Production + Preview) :
   | Nom | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL du projet |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `anon` |
   | `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` (secrète) |
4. Deploy. Partager `https://ton-app.vercel.app`, chacun crée/rejoint avec le code à 5 caractères.

## État d'avancement
Fait : tout le déroulé de la V1 en multi-mobile — qualifs (avec tirage au sort place par place), plaidoiries
(chrono partagé), éliminations (égalités, carton rouge, tirage entre cartons), finale (dépouillement bulletin par bulletin,
égalité : sprint 30 s / main levée / tirage), écran de fin, Annuler, Recommencer, thème clair/sombre.
Vérifié par une partie simulée complète (4 joueurs) contre Supabase.

Le joueur revient automatiquement dans sa salle (onglet Vote) tant qu'il ne l'a pas quittée ; l'hôte peut la supprimer.

À faire : écran « TV » dédié (lecture seule), onglet Accueil (liste des marathons).

## Structure
```
supabase/schema.sql          tables + RLS + Realtime
src/lib/engine.ts            règles (qualifs, élims, carton, finale), tirages serveur
src/lib/game.ts             machine à états de la partie (actions de l'hôte)
src/lib/history.ts           « Annuler la dernière action »
src/lib/server.ts            auth joueur, erreurs, helpers routes
src/app/api/rooms/**         routes API (service role)
src/components/*             onglets Marathons / Conclave, thème, dossards
reference/                   V1 HTML d'origine
```
