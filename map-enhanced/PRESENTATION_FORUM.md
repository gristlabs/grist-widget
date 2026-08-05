# Widget Carte Améliorée pour Grist — *Map Enhanced*

> Widget communautaire — fork amélioré du widget Carte officiel de Grist  
> URL : `https://bigorneau15652.github.io/map/map-enhanced/index.html`  
> Code source : https://github.com/bigorneau15652/map/tree/main/map-enhanced

---

## Qu'est-ce que ce widget apporte ?

Le widget **Carte** officiel de Grist est fonctionnel mais limité. Ce fork y ajoute plusieurs fonctionnalités demandées par la communauté :

| Fonctionnalité | Widget officiel | Map Enhanced |
|---|:---:|:---:|
| Affichage de toutes les épingles | ✅ | ✅ |
| Sélection bidirectionnelle carte ↔ tableau | ✅ | ✅ |
| Zoom initial configurable | ❌ | ✅ |
| Couleur des épingles par ligne (colonne dédiée) | ❌ | ✅ |
| Étiquette automatique à la sélection | ❌ | ✅ |
| Description sur 2 lignes dans l'étiquette | ❌ | ✅ |
| Retour à la ligne dans la description (`\n`) | ❌ | ✅ |
| 15 fonds de carte au choix | ❌ | ✅ |
| Géocodage (adresse → coordonnées) | ✅ | ❌ |

---

## Fonds de carte disponibles (15)

Sans clé API :
- Esri Street Map
- OpenStreetMap Standard
- OpenStreetMap France (détaillée)
- Humanitaire HOT
- CyclOSM (vélo)
- Itinéraires cyclables Waymarked
- OpenTopoMap (courbes de niveau)
- CartoDB Positron (fond clair minimaliste)
- CartoDB Dark Matter (fond sombre)
- CartoDB Voyager
- Esri Satellite (imagerie aérienne)
- Esri World Topo Map

Avec clé API gratuite :
- Transports publics Thunderforest *(clé gratuite sur thunderforest.com)*
- Tracestrack Topo *(clé gratuite sur tracestrack.com)*
- Personnalisée (URL manuelle)

---

## Installation

1. Dans Grist, créez ou sélectionnez un widget **Personnalisé**
2. Collez l'URL suivante :
   ```
   https://bigorneau15652.github.io/map/map-enhanced/index.html
   ```
3. Niveau d'accès : **Lire la table**

---

## Colonnes à mapper

| Colonne | Type | Obligatoire | Description |
|---|---|:---:|---|
| `Name` | Texte | ✅ | Titre affiché dans l'étiquette |
| `Longitude` | Numérique | ✅ | Longitude décimale |
| `Latitude` | Numérique | ✅ | Latitude décimale |
| `Description` | Texte | ❌ | Texte secondaire dans l'étiquette |
| `Color` | Texte | ❌ | Couleur de l'épingle (HEX ou nom) |

### Couleurs acceptées pour la colonne Color

**Code HEX** : `#FF0000`, `#43A047`, `#1565C0`…

**Noms français** : `rouge` `vert` `bleu` `bleu marine` `bleu ciel` `jaune` `orange` `violet` `rose` `gris` `marron` `turquoise` `vert foncé` `blanc` `noir`

**Noms anglais** : `red` `green` `blue` `navy` `yellow` `orange` `purple` `pink` `grey` `brown` `teal` `dark green` `white` `black`

---

## Options de configuration

Ouvrez le panneau de configuration (⚙️ dans Grist) pour accéder à :

- **Afficher les étiquettes** : active/désactive l'ouverture automatique de l'étiquette lors de la sélection d'une ligne
- **Zoom initial** : niveau de zoom maximum lors de l'ajustement automatique (1–20)
- **Fond de carte** : sélection parmi 15 fonds de carte

---

## Configuration recommandée pour la sélection bidirectionnelle

Pour que le tableau, la carte et la fiche se mettent à jour mutuellement :

1. Widget **Carte** → "Sélection des données" → **Aucun**
2. Widget **Tableau** → "Sélection des données" → **Aucun**
3. Widget **Fiche** → "Sélection des données" → **Aucun**

Tous les widgets partagent alors le même curseur de page. Un clic sur une épingle sélectionne la ligne correspondante dans le tableau et met à jour la fiche, et vice-versa.

---

## Exemples de formules pour la Description

Concaténer plusieurs champs avec retours à la ligne :
```python
f"Réf. : {$Reference}\nStatut : {$Statut}\nContact : {$Contact}"
```

---

## Retours et contributions

Ce widget est open-source. N'hésitez pas à :
- Signaler des bugs ou suggérer des améliorations via les **Issues GitHub**
- Proposer des modifications via **Pull Request**
- Partager vos retours sur ce fil du forum

🔗 **Dépôt GitHub** : https://github.com/bigorneau15652/map
