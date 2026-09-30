# Le Marathon du Marathon (multi-mobile)

Vote ludique à 4 : chacun vote en secret sur son téléphone, l'hôte affiche les révélations.
Règles, déroulé et design repris de la V1 (`reference/marathon-du-marathon-v1.html`).

Stack : Next.js 15 (App Router) · Supabase (Postgres + Realtime) · Vercel.

## Deux onglets
1. **Marathons** : la liste (l'hôte la colle au format `Ville ; critère ; critère`).
2. **Conclave** : le vote. Tant que l'hôte n'a pas ouvert le Conclave : les règles + « Conclave bientôt ouvert ».

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
Fait : schéma + RLS, création/jonction de salle, liste des marathons, ouverture du Conclave, Realtime,
compteur « x/y ont voté », validation serveur des bulletins, annulation (snapshots), moteur de règles porté de la V1.

À faire : écrans de vote (qualifs, élims + carton, finale), écran hôte de révélation (dépouillement pas à pas,
tirages), plaidoiries + chrono, écran de fin.

## Structure
```
supabase/schema.sql          tables + RLS + Realtime
src/lib/engine.ts            règles (qualifs, élims, carton, finale), tirages serveur
src/lib/history.ts           « Annuler la dernière action »
src/lib/server.ts            auth joueur, erreurs, helpers routes
src/app/api/rooms/**         routes API (service role)
src/components/*             onglets Marathons / Conclave, thème, dossards
reference/                   V1 HTML d'origine
```
