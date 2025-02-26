# Adrenaline Concert - Application Next.js

Cette application Next.js permet aux utilisateurs de participer à l'expérience "Adrénaline Max" en s'inscrivant et en téléchargeant leur billet de concert.

## Structure du Projet

L'application suit une architecture moderne avec Next.js App Router:

```
adrenaline-concert/
├── public/
│   ├── fonts/              # Dossier pour les polices personnalisées (optionnel)
│   │   ├── evangelion.woff2
│   │   ├── din-regular.woff2
│   │   └── din-bold.woff2
│   ├── images/
│   │   └── dnb-logo.png
│   └── videos/
│       └── matt-intro.mp4
├── src/
│   ├── app/
│   │   ├── (frontoffice)/  # Groupe de routes pour le site public
│   │   │   ├── page.tsx    # Page d'accueil (route: /)
│   │   │   ├── video/
│   │   │   │   └── page.tsx
│   │   │   ├── registration/
│   │   │   │   └── page.tsx
│   │   │   └── confirmation/
│   │   │       └── page.tsx
│   │   ├── api/            # API endpoints
│   │   │   └── users/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   ├── layout.tsx      # Layout global
│   │   └── favicon.ico
│   ├── components/
│   │   └── common/
│   │       ├── Button.jsx
│   │       ├── Checkbox.jsx
│   │       ├── ErrorModals.jsx
│   │       ├── FileUpload.jsx  # Version simplifiée avec appareil photo natif
│   │       ├── HeartbeatLine.jsx
│   │       ├── Input.jsx
│   │       ├── LogoHeader.jsx
│   │       └── PopupModal.jsx
│   ├── styles/
│   │   ├── animations.css
│   │   ├── fonts.js        # Configuration des polices (Google Fonts ou locales)
│   │   ├── globals.css
│   │   └── theme.js
│   ├── lib/
│   │   └── db.ts           # Configuration de la base de données MongoDB
│   └── models/
│       └── User.ts         # Modèle utilisateur
├── middleware.ts           # Middleware pour gestion de routes
├── prisma/
│   └── schema.prisma       # Schéma Prisma pour MongoDB
├── .env
├── .env.local              # Variables d'environnement locales
├── next.config.js
├── package.json
└── tailwind.config.js
```

## Parcours Utilisateur

L'application suit le parcours utilisateur suivant :

1. **Page d'accueil** - Écran d'introduction avec le logo et le bouton pour commencer
2. **Page vidéo** - Présentation de la vidéo de Matt
3. **Page d'inscription** - Formulaire en plusieurs étapes :
   - Saisie des informations personnelles
   - Upload du billet (utilise l'appareil photo natif ou l'upload de fichier)
   - Acceptation des conditions
4. **Page de confirmation** - Confirmation de la participation

## Fonctionnalités techniques

- **Design responsive** adapté aux mobiles
- **Animations et transitions** pour une expérience utilisateur immersive
- **Validation de formulaire** avec gestion des erreurs
- **Capture de photo** via l'appareil photo natif ou upload de fichier
- **Gestion des modaux d'erreur** pour différents cas d'utilisation
- **Structure de routes organisée** pour le frontoffice

## Options de polices

L'application propose deux options pour les polices :

1. **Polices personnalisées** (option recommandée)
   - Placer les fichiers `evangelion.woff2`, `din-regular.woff2` et `din-bold.woff2` dans `/src/fonts/`
   - Ou alternativement dans `/public/fonts/` en ajustant les chemins dans `fonts.js`

2. **Google Fonts** (option temporaire)
   - Utilise Orbitron comme substitut pour Evangelion
   - Utilise Inter comme substitut pour DIN

## Démarrage du projet

1. **Installation des dépendances**
   ```bash
   npm install
   ```

2. **Configuration de la base de données**
   - Assurez-vous d'avoir configuré le fichier `.env.local` avec votre chaîne de connexion MongoDB
   ```
   DATABASE_URL="mongodb+srv://username:password@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority"
   ```

3. **Génération du client Prisma**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Lancement en mode développement**
   ```bash 
   npm run dev