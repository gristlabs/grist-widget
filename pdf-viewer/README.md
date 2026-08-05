# PDF Viewer — Widget Grist avancé

Visionneuse PDF avancée pour [Grist](https://www.getgrist.com), basée sur [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla).

## Fonctionnalités

- Rendu haute fidélité (PDF.js 4.4)
- Vignettes de pages, signets, plan du document
- Calques OCG (activation/désactivation)
- Annotations PDF en lecture (liens, formulaires)
- Recherche plein texte avec surlignage
- Zoom (auto, largeur, page entière, 50 %–300 %)
- Rotation des pages
- Téléchargement et impression
- **Mode 2 écrans** : s'ouvre en fenêtre indépendante, se met à jour en temps réel quand vous changez de ligne dans Grist

## Installation pas à pas

### Étape 1 — Activer GitHub Pages sur votre dépôt

1. Allez sur `https://github.com/VOTRE-COMPTE/map`
2. Cliquez sur **Settings** (onglet en haut à droite)
3. Dans le menu gauche, cliquez sur **Pages**
4. Sous *Source*, choisissez **Deploy from a branch**
5. Branch : **`main`** · Dossier : **`/ (root)`**
6. Cliquez **Save**
7. Attendez 1–2 minutes puis vérifiez que l'URL suivante fonctionne :
   ```
   https://VOTRE-COMPTE.github.io/map/pdf-viewer/
   ```
   *(remplacez `VOTRE-COMPTE` par votre identifiant GitHub)*

---

### Étape 2 — Préparer votre table Grist

Votre table doit contenir une colonne avec **l'URL du PDF** ou une **pièce jointe**.

Exemple de structure minimale :

| Nom du document | URL du PDF |
|---|---|
| Contrat 2024 | `https://exemple.com/contrat.pdf` |
| Rapport annuel | `https://exemple.com/rapport.pdf` |

---

### Étape 3 — Ajouter le widget dans Grist

1. Dans votre document Grist, cliquez sur le bouton **Ajouter un widget** (icône `+` en haut à droite du tableau de bord)
2. Choisissez **Widget personnalisé**
3. Dans le champ *URL du widget*, collez :
   ```
   https://VOTRE-COMPTE.github.io/map/pdf-viewer/index.html
   ```
4. Sous *Accès*, choisissez **Lire la table**
5. Cliquez **Confirmer**

---

### Étape 4 — Configurer le widget

1. Le widget affiche un bouton **"Ouvrir le PDF"** et un lien **⚙ Paramètres**
2. Cliquez sur **⚙ Paramètres**
3. Sélectionnez la **colonne** qui contient l'URL ou la pièce jointe
4. Choisissez le **type** : `URL (texte)` ou `Pièce jointe Grist`
5. Cliquez **Enregistrer**

---

### Étape 5 — Utilisation

1. **Cliquez sur une ligne** de votre table dans Grist
2. Le widget détecte automatiquement le PDF de cette ligne
3. Cliquez sur **"Ouvrir le PDF"** → une fenêtre s'ouvre avec le viewer complet
4. **Déplacez cette fenêtre sur votre deuxième écran**
5. Revenez dans Grist et cliquez sur une autre ligne → le PDF change automatiquement dans la fenêtre ouverte

---

## Utilisation sur 2 écrans

```
Écran 1 (Grist)                    Écran 2 (Viewer PDF)
┌──────────────────────┐           ┌──────────────────────┐
│  Votre table Grist   │           │  ┌────────────────┐  │
│  ┌────────────────┐  │  live     │  │  PDF.js viewer │  │
│  │ Widget lanceur │──┼──────────▶│  │  plein écran   │  │
│  │ [Ouvrir PDF]   │  │           │  └────────────────┘  │
│  └────────────────┘  │           │                      │
│                      │           │  Se met à jour       │
│  ← Cliquez ici       │           │  automatiquement     │
│    pour changer      │           │  quand vous changez  │
│    de ligne          │           │  de ligne →          │
└──────────────────────┘           └──────────────────────┘
```

---

## Raccourcis clavier (dans la fenêtre viewer)

| Touche | Action |
|---|---|
| `←` `↑` | Page précédente |
| `→` `↓` | Page suivante |
| `Home` | Première page |
| `End` | Dernière page |
| `Ctrl+F` | Ouvrir la recherche |
| `Entrée` | Résultat suivant |
| `Maj+Entrée` | Résultat précédent |

---

## Licence

MIT — libre d'utilisation, de modification et de redistribution.  
Basé sur [PDF.js](https://mozilla.github.io/pdf.js/) (Apache 2.0 / Mozilla).
