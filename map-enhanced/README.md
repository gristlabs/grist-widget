# Map Enhanced — Widget Carte pour Grist

Fork amélioré du widget Carte officiel de [Grist](https://www.getgrist.com/).

## URL du widget

```
https://bigorneau15652.github.io/map/map-enhanced/index.html
```

## Fonctionnalités

- **Couleur des épingles** par ligne (colonne dédiée : code HEX ou nom de couleur en français/anglais)
- **Étiquette automatique** à la sélection d'une ligne (titre en gras + description)
- **Retours à la ligne** dans la description (`\n` ou saut de ligne réel dans la cellule)
- **15 fonds de carte** : OSM, Esri Street, satellite, topo, cyclable (CyclOSM), sombre (CartoDB Dark), etc.
- **Zoom initial configurable** (curseur de 1 à 20)
- **Sélection bidirectionnelle** : cliquer une épingle sélectionne la ligne dans le tableau, et vice-versa

## Installation

1. Dans Grist, ajoutez un **Widget personnalisé**
2. Collez l'URL ci-dessus
3. Niveau d'accès : **Lire la table**
4. Mappez les colonnes dans le Panneau Créateur

## Colonnes

| Colonne | Type | Obligatoire |
|---|---|:---:|
| `Name` | Texte | ✅ |
| `Longitude` | Numérique | ✅ |
| `Latitude` | Numérique | ✅ |
| `Description` | Texte | ❌ |
| `Color` | Texte | ❌ |

### Couleurs acceptées

**HEX** : `#FF0000`, `#43A047`…

**Noms** : `rouge` `vert` `bleu` `bleu marine` `bleu ciel` `jaune` `orange` `violet` `rose` `gris` `marron` `turquoise` `vert foncé` `blanc` `noir` *(et leurs équivalents anglais)*

## Configuration bidirectionnelle (carte ↔ tableau ↔ fiche)

Pour que tous les widgets se synchronisent mutuellement :
- Widget Carte → Sélection des données → **Aucun**
- Widget Tableau → Sélection des données → **Aucun**
- Widget Fiche → Sélection des données → **Aucun**

Tous partagent alors le curseur de page Grist.

## Données de démonstration

Un fichier `demo_data.csv` est inclus dans ce dépôt (10 monuments parisiens avec coordonnées, descriptions et couleurs).

## Fonds de carte disponibles

| Fond de carte | Clé API requise |
|---|:---:|
| Esri Street Map | ❌ |
| OpenStreetMap Standard | ❌ |
| OpenStreetMap France | ❌ |
| Humanitaire HOT | ❌ |
| CyclOSM (cyclable) | ❌ |
| Itinéraires cyclables Waymarked | ❌ |
| OpenTopoMap | ❌ |
| CartoDB Positron | ❌ |
| CartoDB Dark Matter | ❌ |
| CartoDB Voyager | ❌ |
| Esri Satellite | ❌ |
| Esri World Topo | ❌ |
| Transports publics Thunderforest | ✅ gratuite |
| Tracestrack Topo | ✅ gratuite |
| Personnalisée (URL manuelle) | — |

## Auteur

[@bigorneau15652](https://github.com/bigorneau15652)
