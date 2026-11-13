# Règles des couleurs et des alertes

Projet AstroHealth. Ce document dit comment une mesure devient **verte, orange ou rouge**,
et quand une **alerte** est créée. Les valeurs viennent de la table `seuil`
(fichier `database/astrohealth_base_complete.sql`).

## 1. Les trois niveaux

| Couleur | Niveau | Sens |
|---|---|---|
| Vert | normal | aucun seuil franchi |
| Orange | `attention` | le seuil d'attention est franchi |
| Rouge | `critique` | le seuil critique est franchi |

## 2. Quand une valeur est verte, orange ou rouge

Chaque ligne de la table `seuil` définit une **zone acceptable** pour un paramètre et un niveau :

- `seuil_min` : valeur minimale acceptable (`NULL` = pas de minimum)
- `seuil_max` : valeur maximale acceptable (`NULL` = pas de maximum)

Un seuil est **franchi** quand la valeur est **strictement** en dehors de la zone :

```
franchi  si  valeur < seuil_min   ou   valeur > seuil_max
```

Une valeur égale à la limite n'est pas un franchissement (SpO2 = 92 % reste vert, 91 % est orange).

Pour chaque mesure :

1. on teste les seuils `critique` : si l'un est franchi, la mesure est **rouge** ;
2. sinon on teste les seuils `attention` : si l'un est franchi, la mesure est **orange** ;
3. sinon la mesure est **verte**.

### Seuils par défaut (`id_astronaute = NULL`)

| Paramètre | Unité | Attention : franchi si | Critique : franchi si |
|---|---|---|---|
| FC (fréquence cardiaque) | bpm | < 50 ou > 120 | < 40 ou > 140 |
| SPO2 (saturation en oxygène) | % | < 92 | < 88 |
| TEMP (température) | °C | < 35 ou > 38 | < 34 ou > 39 |
| TA (tension) | mmHg | systolique > 140 ou diastolique > 90 | systolique > 180 ou diastolique > 120 |
| FR (fréquence respiratoire) | resp/min | < 10 ou > 25 | < 8 ou > 30 |
| SOMMEIL | h | < 5 | < 4 |
| RADIATION | mSv/jour | > 1,0 | > 2,0 |
| EXERCICE | min/jour | < 30 ou > 300 | aucun seuil critique |
| GLYCEMIE | mg/dL | < 65 ou > 140 | < 54 ou > 250 |
| HUMEUR | score 1 à 5 | < 2,5 | < 1,5 |

Les seuils d'attention viennent du cahier des charges (tableau 4). Les seuils critiques
et ceux des paramètres hors cahier des charges sont des **valeurs indicatives de l'équipe**.

### Seuil personnalisé

Si un astronaute a un seuil à lui (`seuil.id_astronaute` renseigné) pour un paramètre et un niveau,
il **remplace** le seuil par défaut pour cet astronaute. Sinon, le seuil par défaut s'applique.

### Plage normale et couleur

La colonne `parametre.plage_normale_min / plage_normale_max` ne sert **qu'à l'affichage**
(la bande verte « Normal range 60-100 » des graphiques). Elle ne décide pas de la couleur.
La couleur dépend uniquement des seuils. Exemple : FC = 108 bpm est au-dessus de la plage normale (100)
mais sous le seuil d'attention (120) : la valeur reste **verte**.

## 3. La tension (deux valeurs)

La tension est enregistrée dans une seule mesure :

- `valeur` = pression **systolique**
- `valeur_secondaire` = pression **diastolique**

Dans la table `seuil` : `seuil_max` s'applique à la systolique, `seuil_secondaire_max` à la diastolique.

Règle : **un seul dépassement suffit**. La mesure prend le niveau le plus grave des deux.

| Mesure (systolique / diastolique) | Résultat |
|---|---|
| 118 / 78 | vert |
| 145 / 85 | orange (systolique > 140) |
| 125 / 95 | orange (diastolique > 90) |
| 150 / 125 | rouge (diastolique > 120), même si la systolique n'est qu'orange |
| 185 / 80 | rouge (systolique > 180) |

Il n'y a pas de seuil minimum pour la tension : une tension trop basse ne déclenche pas d'alerte.
Si `valeur_secondaire` est vide, seule la systolique est testée.

## 4. Quand une alerte est créée

Une alerte est créée quand une mesure est **orange ou rouge**. Une mesure verte ne crée jamais d'alerte.

Une alerte contient : l'astronaute, la mesure, le paramètre, le niveau (`attention` ou `critique`),
un message, la date, et le statut `active`.

- Une mesure déclenche **au plus une alerte** (`alerte.id_mesure` est unique).
- Le back-end émet l'événement Socket.IO `nouvelle_alerte` à chaque alerte créée.
- Une recommandation (`recommandation`) est associée à l'alerte (repos, hydratation, contact médecin, nouvelle mesure).

### Éviter la pluie d'alertes

Le simulateur envoie une mesure toutes les 2 secondes. Pour ne pas créer une alerte à chaque mesure :

- Si une alerte `active` existe déjà pour le **même astronaute** et le **même paramètre**, avec un niveau **égal ou supérieur**,
  on **ne crée pas** de nouvelle alerte.
- Si le niveau **monte** (attention puis critique), on **crée** une nouvelle alerte.
- Si le niveau est repassé à vert, puis franchit de nouveau un seuil, on **crée** une nouvelle alerte.

## 5. Quel niveau l'emporte ?

**Le plus grave gagne** : `critique` > `attention` > normal.

| Cas | Résultat |
|---|---|
| Une mesure franchit un seuil attention **et** un seuil critique (ex. SpO2 = 85 %) | **critique** |
| Deux seuils du même niveau sont franchis (ex. tension : systolique et diastolique) | ce niveau, **une seule** alerte |
| Un astronaute a plusieurs paramètres dans des couleurs différentes | sa carte prend la couleur la plus grave de ses dernières valeurs |
| Un seuil personnalisé existe | il remplace le seuil par défaut du même niveau |

Exemple : Alex a SpO2 = 91 % (orange) et FC = 108 (vert). Sa carte est **orange**.
Avec SpO2 = 85 %, elle devient **rouge**.

## 6. Pseudo-code

```js
function niveauMesure(mesure, seuils) {
  // seuils : lignes de la table seuil pour ce paramètre
  // (déjà filtrées : seuil de l'astronaute s'il existe, sinon seuil par défaut)
  for (const niveau of ['critique', 'attention']) {
    const franchi = seuils
      .filter((s) => s.niveau === niveau)
      .some((s) =>
        (s.seuil_min != null && mesure.valeur < s.seuil_min) ||
        (s.seuil_max != null && mesure.valeur > s.seuil_max) ||
        (s.seuil_secondaire_max != null && mesure.valeur_secondaire != null &&
         mesure.valeur_secondaire > s.seuil_secondaire_max)
      );
    if (franchi) return niveau;   // critique testé en premier : le plus grave gagne
  }
  return 'normal';
}
```

## 7. Ce que donne le scénario de démonstration

Le simulateur fait descendre la SpO2 d'Alex de 98 % à 85 % :

| SpO2 | Couleur | Alerte |
|---|---|---|
| 98 % à 92 % | vert | aucune |
| 91 % à 88 % | orange | alerte `attention` |
| moins de 88 % | rouge | alerte `critique` |

Sara Khan a 4,5 h de sommeil : orange (seuil attention < 5 h), alerte `attention`.

## 8. Points à valider avec l'équipe

1. **Maquette du médecin** : la SpO2 d'Alex à 91 % y est rouge (« Critical »). Avec ces règles, 91 % est **orange** ;
   le rouge commence sous 88 %. Soit on change la maquette, soit on relève le seuil critique (par exemple < 92).
2. **Maquette** : FC = 108 apparaît en rouge. Avec ces règles, elle est **verte** (seuil attention à 120).
3. **Règle anti-doublon** (section 4) : à confirmer avec le back-end.
4. **Alerte qui se ferme** : pour le MVP, l'alerte reste `active` jusqu'à ce que le médecin la modifie
   (`PUT /api/alertes/:id`). Une résolution automatique au retour à la normale est possible plus tard.
5. **Tension basse** : aucun seuil minimum aujourd'hui. À ajouter si l'équipe le veut.
