# Simulateur AstroHealth

Petit script Node.js qui **génère des mesures physiologiques** pour l'équipage et les envoie au back-end.
Il sert à faire la démonstration sans vrais capteurs.

## Prérequis

- Node.js 18 ou plus (`node --version`)
- Aucune installation de paquet (pas de `npm install`)
- Pour un vrai envoi : le back-end doit tourner (par défaut sur `http://localhost:3000`)

## Lancer le simulateur

Depuis la **racine du projet** (le dossier `astrohealth`) :

```
node simulator/simulator.js --dry                      # test : affiche sans rien envoyer
node simulator/simulator.js                            # journée normale, envoi à l'API
node simulator/simulator.js --scenario=oxygene         # scénario de démonstration
```

Arrêter : `Ctrl+C`.

> Conseil : toujours tester avec `--dry` d'abord. Sans `--dry`, chaque ligne ajoute une vraie mesure
> dans la base (et peut créer des alertes).

## Options

| Option | Valeur par défaut | Effet |
|---|---|---|
| `--dry` | désactivé | affiche les mesures sans les envoyer |
| `--scenario=normal` | `normal` | valeurs normales avec un léger bruit, tourne sans fin |
| `--scenario=oxygene` | | baisse d'oxygène, puis arrêt automatique (25 envois) |
| `--cible=2` | `1` | astronaute touché par le scénario (1 = Alex) |
| `--interval=1000` | `2000` | délai entre deux séries, en millisecondes |
| `--api=URL` | `http://localhost:3000/api/mesures` | adresse de l'API (ou variable `API_URL`) |

## Routes de l'API appelées

Une seule : **`POST /api/mesures`**, une requête par mesure.

Le simulateur n'utilise pas `POST /api/simulateur/scenario` : le scénario se lance en ligne de commande.
Il n'utilise pas non plus Socket.IO (c'est le back-end qui émet `nouvelle_mesure` et `nouvelle_alerte`).

### Corps envoyé (JSON)

```json
{
  "id_mesure": "b3f1c2a0-5d7e-4c1a-9a43-0e2f6c8d1a77",
  "id_astronaute": 1,
  "id_parametre": 2,
  "code_parametre": "SPO2",
  "valeur": 91,
  "valeur_secondaire": null,
  "horodatage": "2026-11-12T14:32:05.120Z",
  "source": "simulateur",
  "synchronisee": false
}
```

Les noms de champs sont ceux de la table `mesure`. `code_parametre` est ajouté pour faciliter le travail du back-end.
`id_mesure` est un UUID généré par le simulateur (mode hors ligne).

## Ce qui est simulé

| Paramètre | `id_parametre` | Fréquence d'envoi |
|---|---|---|
| FC (bpm) | 1 | à chaque série |
| SPO2 (%) | 2 | à chaque série |
| TEMP (°C) | 3 | à chaque série |
| SOMMEIL (h) | 6 | une seule fois, au démarrage |

Les `id_parametre` suivent l'ordre d'insertion de la table `parametre`. Si l'ordre change, modifier l'objet `PARAMETRES` en haut du script.

### Équipage (valeurs de base)

| `id_astronaute` | Nom | FC | SpO2 | Temp | Sommeil |
|---|---|---|---|---|---|
| 1 | Alex Moreau | 72 | 98 | 36,8 | 7,2 |
| 2 | Sara Khan | 76 | 97 | 36,7 | 4,5 |
| 3 | Leo Tanaka | 69 | 99 | 36,6 | 7,0 |
| 4 | Mia Rossi | 73 | 98 | 36,8 | 6,8 |

À vérifier : ces `id_astronaute` doivent exister dans la base. Sinon, modifier le tableau `EQUIPAGE` dans `simulator.js`.

## Scénario « oxygene » (démonstration)

Sur l'astronaute ciblé (Alex par défaut), en 20 séries :

- SpO2 : 98 % → 85 %
- FC : 72 → 108 bpm
- les autres astronautes restent normaux

Résultat attendu avec les seuils par défaut (voir `docs/regles-alertes.md`) :

1. SpO2 passe sous 92 % : alerte **attention** (orange)
2. SpO2 passe sous 88 % : alerte **critique** (rouge)
3. Au démarrage, Sara a 4,5 h de sommeil : alerte **attention** sur le sommeil

La fréquence cardiaque d'Alex reste sous 120 bpm : elle ne déclenche pas d'alerte.
