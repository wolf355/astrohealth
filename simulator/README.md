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
node simulator/simulator.js --sommeil                  # envoie aussi le sommeil (dont Sara à 4,5 h)
node simulator/simulator.js --scenario=oxygene         # scénario de démonstration
```

Arrêter : `Ctrl+C`.

> Conseil : toujours tester avec `--dry` d'abord. Sans `--dry`, chaque ligne ajoute une vraie mesure
> dans la base (et peut créer des alertes).

## Options

| Option | Valeur par défaut | Effet |
|---|---|---|
| `--dry` | désactivé | affiche les mesures sans les envoyer |
| `--sommeil` | désactivé | envoie aussi le sommeil de chaque astronaute (dont Sara à 4,5 h). Sans cette option, le sommeil n'est pas envoyé |
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
  "horodatage": "2026-11-13 14:32:05",
  "source": "simulateur",
  "synchronisee": false
}
```

Les noms de champs sont ceux de la table `mesure`. `code_parametre` est ajouté pour faciliter le travail du back-end.
`id_mesure` est un UUID généré par le simulateur (mode hors ligne).

`horodatage` est en heure locale, au format `AAAA-MM-JJ HH:MM:SS` (format attendu par la base).

## Ce qui est simulé

| Paramètre | `id_parametre` | Fréquence d'envoi |
|---|---|---|
| FC (bpm) | 1 | à chaque série |
| SPO2 (%) | 2 | à chaque série |
| TEMP (°C) | 3 | à chaque série |
| SOMMEIL (h) | 6 | une seule fois, au démarrage, **seulement avec `--sommeil`** |

Les `id_parametre` suivent l'ordre d'insertion de la table `parametre`. Si