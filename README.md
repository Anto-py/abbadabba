# Abbadaba — comptabilité indépendant complémentaire (Belgique)

Une PWA simple pour tenir ta comptabilité d'indépendant complémentaire belge : tu prends ton téléphone, tu photographies un ticket, c'est enregistré, archivé dans ton Google Drive et sauvegardé dans un Google Sheet. Le tout sans abonnement mensuel.

> **Profil cible** : indépendant complémentaire belge non assujetti TVA (art. 44 §2). L'app calcule directement les montants déductibles sur la base du TTC.

---

## Ce que l'app fait pour toi

### Saisie rapide depuis le téléphone

- Bouton « + » dans la barre du bas → tu choisis **Dépense**, **Recette** ou **Trajet km**.
- Pour une dépense ou une recette : tu prends la photo du ticket en direct (caméra), ou tu sélectionnes un PDF / une image existante. Tu remplis date, montant, catégorie, description → c'est enregistré.
- Les images > 5 Mo sont automatiquement compressées avant envoi.
- Installable comme une vraie app sur iPhone et Android (PWA — pas besoin de l'App Store).

### Catégories belges préconfigurées

41 catégories typiques de l'indépendant complémentaire belge sont créées au premier login (frais de bureau, déplacements, formation, matériel informatique, téléphone, etc.), chacune avec son **taux de déductibilité par défaut** (100%, 75%, 50%, 31%…).

Tu peux à tout moment :
- modifier le taux d'une catégorie existante (les futures transactions utiliseront le nouveau taux) ;
- ajouter une catégorie personnalisée ;
- supprimer une catégorie (si elle n'est liée à aucune transaction).

### Carnet de bord trajets voiture

- Module dédié pour les frais de déplacement km.
- Taux €/km **historisé** (au 1er janvier 2026 le forfait belge est 0,4259 €/km — déjà initialisé pour toi). Si le taux change, tu ajoutes simplement un nouveau taux avec sa date d'entrée en vigueur ; l'historique est préservé.
- Adresse de domicile enregistrée une fois dans les réglages → utilisée comme point de départ par défaut.
- Bouton **Calculer la distance** : géocodage automatique des adresses (Nominatim) + calcul du trajet routier (OSRM). Le km reste éditable manuellement.
- Aller-retour case à cocher → double automatique.
- Chaque trajet génère **automatiquement une transaction-dépense** liée, avec l'indemnité calculée. Si tu supprimes le trajet, la transaction est aussi supprimée.

### Dashboard visuel

Vue annuelle (sélecteur d'année fiscale) avec :
- **4 cartes synthétiques** : Recettes, Dépenses, Déductible, Imposable (recettes − déductible).
- **Carte « Impôts après déductions »** : Imposable × ton **taux marginal IPP** (éditable d'un clic depuis l'en-tête du dashboard — par défaut 50%, ajustable selon ta tranche).
- **Compteur de transactions** sur l'année.
- **Courbe mensuelle** recettes + déductible cumulés sur l'année.
- **Top catégories** : barres horizontales avec montants par catégorie.

### Liste des transactions

- Filtres par type, catégorie, mois.
- Lien direct vers la preuve dans Google Drive.
- Modification ou suppression d'une transaction (la preuve Drive est aussi supprimée).

### Remise à zéro de fin d'année fiscale

En fin d'année tu peux :
1. **Exporter** : régénère le Google Sheet de l'année + dépose un dump JSON complet dans `Abbadaba/YYYY/`.
2. **Remettre à zéro** : supprime les transactions et trajets de l'année (catégories, taux km, Sheets et preuves Drive **préservés**).
3. **Vider entièrement la DB** : option nucléaire si tu refais une saison complète (Drive intact).

Toutes les actions destructives demandent une double confirmation (taper `RESET` ou `VIDER`).

---

## Comment les sauvegardes fonctionnent (important)

L'app suit une logique « **triple sauvegarde** » pour que tu ne perdes jamais rien, même si l'hébergeur ferme ou si la base de données casse.

### 1. La base de données (DB)

C'est la **source vivante**. Toutes tes transactions, trajets, catégories, taux sont là.
- Si tu changes d'hébergeur, c'est juste un `pg_dump` à exporter et réimporter — ou tu réimportes le JSON exporté en fin d'année.

### 2. Google Drive (preuves physiques)

Toutes les preuves (tickets, factures) sont uploadées **dans TON Google Drive personnel**, dans un dossier `Abbadaba/` créé par l'app elle-même :

```
Abbadaba/
└── 2026/
    ├── depenses/
    │   ├── FOURN_BUR/   ← une sous-catégorie par code
    │   │   └── 2026-03-14_facture-papier.pdf
    │   └── ESSENCE/
    │       └── 2026-03-15_pompe-q8.jpg
    ├── recettes/        ← en vrac (pas de sous-catégorie)
    │   └── 2026-03-20_cours-particulier.pdf
    └── Abbadaba_2026    ← le Google Sheet miroir
```

- Le nom de fichier est **toujours normalisé** : `YYYY-MM-DD_slug.ext` (slug à partir du champ « Nom »).
- **Tu restes propriétaire** de tous tes documents : l'app ne stocke rien sur son propre serveur. Si demain tu désinstalles tout, les preuves restent dans ton Drive.
- L'app utilise l'**OAuth utilisateur** (scope `drive.file`) : elle ne peut voir et modifier **que les fichiers qu'elle a elle-même créés**. Le reste de ton Drive lui est invisible.

### 3. Google Sheets (miroir lisible)

À chaque création / modification / suppression de transaction ou de trajet, l'app **reconstruit automatiquement** un Google Sheet `Abbadaba_YYYY` dans le dossier de l'année, avec trois onglets :

- **TRANSACTIONS** : toutes les lignes (date, type, catégorie, montant, déductible, lien preuve…).
- **TRAJETS** : tous les déplacements voiture.
- **RÉSUMÉ** : totaux annuels + ventilation par catégorie.

Avantages :
- C'est **lisible par un comptable** sans installer quoi que ce soit.
- Tu peux à tout moment ouvrir le Sheet et faire tes propres formules / pivots.
- Si la DB tombe, le Sheet contient déjà 95% de ce qu'il faut pour repartir.

---

## Installer l'app pour soi (gratuit, ~30 min)

> **Niveau requis** : savoir copier-coller, créer un compte sur un site web. Aucune compétence dev nécessaire.

### Combo recommandé en 2026 : Vercel (app) + Neon (base de données)

Les deux ont une offre gratuite suffisante pour un usage personnel (qq centaines de transactions par an + tes documents sur ton propre Drive). Coût annuel : **0 €**.

### Étape 1 — Fork du repo

1. Crée-toi un compte [GitHub](https://github.com) si tu n'en as pas.
2. Va sur [github.com/Anto-py/abbadabba](https://github.com/Anto-py/abbadabba) et clique sur **Fork** (en haut à droite) pour copier le repo dans ton compte.

### Étape 2 — Base de données Neon

1. Crée un compte sur [neon.tech](https://neon.tech) (compte gratuit avec ton GitHub).
2. Crée un nouveau projet : nom `abbadaba`, région la plus proche (Europe → Frankfurt).
3. Une fois créé, copie la **Connection string** (format `postgres://user:pass@…neon.tech/dbname?sslmode=require`). Tu en auras besoin dans une minute.

> Limite gratuite Neon : 500 MB de stockage. Pour de la compta perso = des dizaines de milliers de transactions tiennent dedans. La base se met en veille après 5 min d'inactivité, mais redémarre toute seule en 1-3 s au premier hit suivant.

### Étape 3 — Identifiants Google OAuth

C'est l'étape la plus longue (15 min), à faire une seule fois.

1. Va sur [console.cloud.google.com](https://console.cloud.google.com).
2. Crée un nouveau projet, appelle-le `Abbadaba`.
3. Dans **APIs & Services → Library**, active :
   - Google Drive API
   - Google Sheets API
4. Dans **APIs & Services → OAuth consent screen** :
   - Type : **External** → Create.
   - App name : Abbadaba ; email de support : le tien.
   - Scopes : ajoute `userinfo.email`, `userinfo.profile`, `drive.file`, `spreadsheets`.
   - Test users : ajoute ton email Google.
   - **Publish** : clique sur « Publish App » → status « In Production » (pas besoin de vérification Google parce que les scopes utilisés sont non-sensibles).
5. Dans **APIs & Services → Credentials → + Create Credentials → OAuth client ID** :
   - Type : **Web application**.
   - Authorized JavaScript origins : laisse vide pour l'instant.
   - Authorized redirect URIs : laisse vide pour l'instant — on reviendra après le déploiement Vercel.
   - **Create** → copie le **Client ID** et **Client Secret** quelque part.

### Étape 4 — Déploiement Vercel

1. Crée un compte sur [vercel.com](https://vercel.com) avec ton GitHub.
2. Clique **Add New → Project** → sélectionne ton fork `abbadabba` → **Import**.
3. Dans les réglages d'import :
   - **Root Directory** : clique **Edit** → choisis `abbadaba`.
   - **Framework Preset** : Next.js (auto-détecté).
   - **Environment Variables** : **NE METS RIEN POUR L'INSTANT**. On va le faire via le wizard intégré de l'app au premier démarrage.
4. Clique **Deploy**. Attends ~2 min.
5. Une fois déployé, note l'URL Vercel attribuée (ex : `abbadabba-xxx.vercel.app`).

### Étape 5 — Compléter Google OAuth avec l'URL Vercel

Retourne sur [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → ton OAuth client → **Edit** :

- **Authorized JavaScript origins** : `https://abbadabba-xxx.vercel.app` (l'URL Vercel)
- **Authorized redirect URIs** : `https://abbadabba-xxx.vercel.app/api/auth/callback/google`

→ Save.

### Étape 6 — Configurer les variables via le wizard `/setup`

1. Ouvre `https://abbadabba-xxx.vercel.app/setup` dans ton navigateur. Comme aucune variable n'est définie, l'app te bascule automatiquement sur le wizard.
2. Suis les 6 étapes :
   - **Hébergeur** : sélectionne `Vercel + Neon`.
   - **DATABASE_URL** : colle la connection string Neon.
   - **GOOGLE_CLIENT_ID** et **GOOGLE_CLIENT_SECRET** : tu les as copiés à l'étape 3.
   - **NEXTAUTH_URL** : `https://abbadabba-xxx.vercel.app` (sans `/` à la fin).
   - **ALLOWED_EMAILS** : ton email Google (celui qui aura le droit de se connecter ; en mettre plusieurs séparés par virgule si besoin).
   - **NEXTAUTH_SECRET** : clique **Générer** → c'est rempli automatiquement.
   - **N8n** : laisse vide, tu n'en as pas besoin.
3. À la dernière étape, clique **Copier dans le presse-papier**. Tu obtiens un bloc `.env` complet.

### Étape 7 — Coller les variables dans Vercel

1. Dans Vercel → ton projet → **Settings → Environment Variables**.
2. Colle chaque ligne du bloc copié comme une variable (Vercel propose un mode « Paste from .env » qui prend tout d'un coup).
3. Coche **Production**, **Preview**, **Development** pour chacune.
4. Va dans **Deployments** → sur le dernier déploiement → menu `…` → **Redeploy**.

### Étape 8 — Premier login

1. Attends ~1 min que Vercel redéploie.
2. Ouvre `https://abbadabba-xxx.vercel.app/`.
3. Connecte-toi avec ton compte Google. Au premier login Google te demande l'accès à Drive + Sheets — accepte.
4. Tu arrives sur le dashboard vide. Tes 41 catégories belges et ton taux km 0,4259 €/km sont déjà initialisés.
5. **Installe la PWA sur ton téléphone** : ouvre l'URL sur iPhone Safari ou Chrome Android → menu **Partager → Sur l'écran d'accueil**.

C'est fini, tu peux commencer à saisir tes premières dépenses.

---

## Autres options d'hébergement

| Hébergeur | Free tier 2026 | Verdict |
|---|---|---|
| **Vercel + Neon** | Généreux, custom domain inclus | **Recommandé** |
| **Coolify / VPS perso** | Dépend du VPS (Hostinger ~4 €/mois) | Recommandé si tu veux héberger toi-même |
| **Railway** | Plus de free tier réel (trial $5) | À éviter en gratuit |
| **Supabase** (DB) | Free OK mais auto-pause après 7j d'inactivité | À éviter pour une app utilisée sporadiquement |
| **Render free** | Web service dort 30s après 15min, Postgres free supprimé | À éviter |

Le wizard `/setup` propose des instructions adaptées pour chaque hébergeur.

---

## Personnaliser

### Catégories et taux de déductibilité

Page **Réglages → Catégories** : tu peux modifier le taux par défaut de chaque catégorie. Les anciennes transactions conservent le taux qu'elles avaient à leur création.

### Adresse de domicile (trajets)

Page **Réglages → Domicile** : entrée une fois, utilisée comme point de départ par défaut pour le calcul de distance auto.

### Taux €/km

Page **Réglages → Indemnité km** : ajouter un nouveau taux quand la circulaire belge change le forfait, en précisant la date d'entrée en vigueur. L'historique est conservé, les anciens trajets gardent leur taux d'origine.

### Whitelist d'emails

Modifier la variable d'environnement `ALLOWED_EMAILS` dans Vercel (séparée par des virgules). Redéployer pour appliquer.

---

## Foire aux questions

**Est-ce que mes données sont vraiment privées ?**
Oui. L'app utilise **TON** Google Drive perso pour stocker les preuves (scope `drive.file` : l'app ne voit que les fichiers qu'elle a créés). La DB est sur ton instance Neon, sous ton compte. Personne d'autre que toi (et les emails que tu as whitelistés) n'a accès à l'app.

**Et si Neon ferme demain ?**
Tu exportes le JSON via **Réglages → Fin d'année fiscale → Sauvegarder**. Tes preuves sont déjà dans ton Drive. Tu peux pointer une nouvelle DB en changeant `DATABASE_URL` et réimporter le JSON.

**Est-ce que ça fait la déclaration IPP à ma place ?**
Non. L'app te donne tes **totaux annuels** (recettes, dépenses, déductible, imposable) et une estimation des impôts après déductions selon ton taux marginal — de quoi remplir tes cases TAX-on-web ou aller voir ton comptable. C'est un outil de tenue, pas un logiciel de déclaration.

**Suis-je obligé d'utiliser Google Drive ?**
Pour cette version, oui. Le couplage Drive + Sheets est central. Si tu préfères self-host complet, l'app fonctionne aussi avec un service-account Google Workspace mais il faut adapter le code.

**Comment mettre à jour quand le repo évolue ?**
Sur GitHub, va sur ton fork → **Sync fork → Update branch**. Vercel redéploie automatiquement.

---

## Stack technique (pour les curieux)

- **Frontend** : Next.js 16.2.6 (App Router) + React 19 + Tailwind CSS — PWA via next-pwa.
- **Auth** : NextAuth.js (Google OAuth, JWT, whitelist email).
- **DB** : PostgreSQL + Prisma 7.
- **Storage** : Google Drive API (OAuth utilisateur, scope `drive.file`).
- **Backup** : Google Sheets API (rebuild atomique à chaque modification).
- **Calcul de distance** : Nominatim (géocodage) + OSRM (routage), services publics gratuits.

Voir `CLAUDE.md` et `SPECS.md` pour les détails d'architecture.

---

## Licence

Code source libre — usage personnel et professionnel autorisés. Aucune garantie : tu es responsable de ta propre comptabilité.
