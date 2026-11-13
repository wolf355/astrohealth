// AstroHealth - Simulateur de mesures
// Aucune dépendance : Node.js 18 ou plus suffit.
//
// Exemples :
//   node simulator/simulator.js --dry                      (affiche sans envoyer)
//   node simulator/simulator.js                            (journée normale, envoi à l'API)
//   node simulator/simulator.js --sommeil                  (envoie aussi le sommeil, dont Sara à 4,5 h)
//   node simulator/simulator.js --scenario=oxygene         (baisse de SpO2 d'Alex)
//   node simulator/simulator.js --interval=1000 --api=http://localhost:3000/api/mesures

const { randomUUID } = require('crypto');

// ---------- Options ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);
const API_URL = args.api || process.env.API_URL || 'http://localhost:3000/api/mesures';
const INTERVAL_MS = Number(args.interval || 2000);
const SCENARIO = args.scenario || 'normal'; // normal | oxygene
const DRY_RUN = Boolean(args.dry);
const AVEC_SOMMEIL = Boolean(args.sommeil); // le sommeil n'est envoyé que sur demande
const CIBLE = Number(args.cible || 1); // astronaute touché par le scénario

// ---------- Paramètres (ids = ordre d'insertion dans la table parametre) ----------
const PARAMETRES = {
  FC:    { id: 1, unite: 'bpm', decimales: 0 },
  SPO2:  { id: 2, unite: '%',   decimales: 0 },
  TEMP:  { id: 3, unite: '°C',  decimales: 1 },
  SOMMEIL: { id: 6, unite: 'h', decimales: 1 },
};

// ---------- Équipage (valeurs de base, comme sur les maquettes) ----------
// ATTENTION : vérifier que ces id_astronaute existent dans le JSON d'exemple.
const EQUIPAGE = [
  { id: 1, nom: 'Alex Moreau', FC: 72, SPO2: 98, TEMP: 36.8, SOMMEIL: 7.2 },
  { id: 2, nom: 'Sara Khan',   FC: 76, SPO2: 97, TEMP: 36.7, SOMMEIL: 4.5 },
  { id: 3, nom: 'Leo Tanaka',  FC: 69, SPO2: 99, TEMP: 36.6, SOMMEIL: 7.0 },
  { id: 4, nom: 'Mia Rossi',   FC: 73, SPO2: 98, TEMP: 36.8, SOMMEIL: 6.8 },
];

// ---------- Outils ----------
const bruit = (amplitude) => (Math.random() - 0.5) * 2 * amplitude;
const arrondir = (v, d) => Number(v.toFixed(d));
const limiter = (v, min, max) => Math.min(max, Math.max(min, v));

// Heure locale au format "AAAA-MM-JJ HH:MM:SS" (format attendu par la base)
function horodatageLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Scénario "oxygène" : SpO2 98 -> 85 et FC 72 -> 108 en ETAPES ticks
const ETAPES = 20;
function progression(tick) {
  return Math.min(1, tick / ETAPES);
}

function valeurs(astro, tick) {
  let fc = astro.FC + bruit(3);
  let spo2 = astro.SPO2 + bruit(0.6);
  let temp = astro.TEMP + bruit(0.1);

  if (SCENARIO === 'oxygene' && astro.id === CIBLE) {
    const p = progression(tick);
    spo2 = astro.SPO2 - p * 13 + bruit(0.4);
    fc = astro.FC + p * 36 + bruit(2);
  }
  return {
    FC: arrondir(limiter(fc, 40, 180), 0),
    SPO2: arrondir(limiter(spo2, 70, 100), 0),
    TEMP: arrondir(limiter(temp, 35, 40), 1),
  };
}

function creerMesure(astro, code, valeur) {
  return {
    id_mesure: randomUUID(),        // UUID généré côté client (mode hors ligne)
    id_astronaute: astro.id,
    id_parametre: PARAMETRES[code].id,
    code_parametre: code,           // pratique pour le back-end
    valeur,
    valeur_secondaire: null,
    horodatage: horodatageLocal(),
    source: 'simulateur',
    synchronisee: false,
  };
}

async function envoyer(mesure, astro) {
  const ligne = `${astro.nom.padEnd(12)} ${mesure.code_parametre.padEnd(8)} ${mesure.valeur}`;
  if (DRY_RUN) {
    console.log(`[dry] ${ligne}`);
    return;
  }
  try {
    const rep = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mesure),
    });
    console.log(`[${rep.status}] ${ligne}`);
  } catch (e) {
    console.log(`[ERREUR] ${ligne} -> API injoignable (${API_URL})`);
  }
}

// ---------- Programme principal ----------
async function main() {
  console.log(`Simulateur AstroHealth | scénario : ${SCENARIO} | ${DRY_RUN ? 'DRY-RUN' : API_URL}`);
  console.log(`Une série de mesures toutes les ${INTERVAL_MS} ms. Ctrl+C pour arrêter.\n`);

  // Le sommeil est envoyé une seule fois au démarrage, et seulement avec --sommeil
  // (sinon le sommeil de Sara à 4,5 h recréerait une alerte à chaque lancement)
  if (AVEC_SOMMEIL) {
    for (const astro of EQUIPAGE) {
      await envoyer(creerMesure(astro, 'SOMMEIL', astro.SOMMEIL), astro);
    }
  }

  let tick = 0;
  const duree = SCENARIO === 'oxygene' ? ETAPES + 5 : Infinity;

  const timer = setInterval(async () => {
    tick += 1;
    for (const astro of EQUIPAGE) {
      const v = valeurs(astro, tick);
      for (const code of ['FC', 'SPO2', 'TEMP']) {
        await envoyer(creerMesure(astro, code, v[code]), astro);
      }
    }
    if (tick >= duree) {
      clearInterval(timer);
      console.log('\nScénario terminé.');
    }
  }, INTERVAL_MS);
}

main();