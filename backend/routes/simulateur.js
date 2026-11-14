import express from 'express';
import db from '../config/db.js';
import { randomUUID } from 'node:crypto';
import { verifierEtCreerAlerte } from '../services/alertesService.js';

const router = express.Router();

const ID_ASTRONAUTE_PAR_DEFAUT = 1;
const scenarios = {
    baisse_oxygene: [
        { spo2: 98, fc: 72 },
        { spo2: 96, fc: 80 },
        { spo2: 94, fc: 90 },
        { spo2: 92, fc: 100 },
        { spo2: 91, fc: 108 }
    ],
    normal: [
        { spo2: 98, fc: 72 },
        { spo2: 97, fc: 75 },
        { spo2: 98, fc: 74 },
        { spo2: 98, fc: 73 },
        { spo2: 97, fc: 76 }
    ],
    baisse_oxygene_critique: [
        { spo2: 98, fc: 72 },
        { spo2: 95, fc: 85 },
        { spo2: 92, fc: 95 },
        { spo2: 89, fc: 105 },
        { spo2: 86, fc: 115 }
    ]
};

// Pause entre chaque étape du scénario
const attendre = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

// Générer une date au format local AAAA-MM-JJ HH:MM:SS
function formaterDateLocale(date = new Date()) {
    const pad = (nombre) => String(nombre).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}




async function executerScenario(nom, idAstronaute, io) {
    const connection = db.promise();

    const [parametres] = await connection.execute(
        `SELECT id_parametre, code
         FROM Parametre
         WHERE code IN ('SPO2', 'FC')`
    );

    const ids = Object.fromEntries(
        parametres.map(p => [p.code, p.id_parametre])
    );

    if (!ids.SPO2 || !ids.FC) {
        throw new Error('Paramètres SPO2 ou FC introuvables');
    }

    const [astronautes] = await connection.execute(
        `SELECT u.nom_code
         FROM Astronaute a
         JOIN Utilisateur u ON u.id_utilisateur = a.id_utilisateur
         WHERE a.id_astronaute = ?`,
        [idAstronaute]
    );

    if (astronautes.length === 0) {
        throw new Error('Astronaute introuvable');
    }

    const nom_code = astronautes[0].nom_code;

    // Fermer les alertes actives avant le scénario normal
    if (nom === 'normal') {
        await connection.beginTransaction();

        try {
            await connection.execute(
                `UPDATE Alerte
                 SET statut = 'resolue'
                 WHERE id_astronaute = ?
                 AND statut = 'active'`,
                [idAstronaute]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    const serie = scenarios[nom];

    // Exécuter les étapes progressivement
    for (let i = 0; i < serie.length; i++) {

        if (i > 0) {
            await attendre(1500);
        }

        const horodatage = formaterDateLocale();

        const mesures = [
            {
                code: 'SPO2',
                id_parametre: ids.SPO2,
                valeur: serie[i].spo2
            },
            {
                code: 'FC',
                id_parametre: ids.FC,
                valeur: serie[i].fc
            }
        ];

        const evenements = [];

        await connection.beginTransaction();

        try {
            for (const mesure of mesures) {
                const id_mesure = randomUUID();

                await connection.execute(
                    `INSERT INTO Mesure (
                        id_mesure,
                        id_astronaute,
                        id_parametre,
                        valeur,
                        valeur_secondaire,
                        horodatage,
                        source
                    ) VALUES (?, ?, ?, ?, NULL, ?, ?)`,
                    [
                        id_mesure,
                        idAstronaute,
                        mesure.id_parametre,
                        mesure.valeur,
                        horodatage,
                        'simulateur'
                    ]
                );

                const alerte = await verifierEtCreerAlerte(
                    connection,
                    {
                        id_mesure,
                        id_astronaute: idAstronaute,
                        id_parametre: mesure.id_parametre,
                        valeur: mesure.valeur,
                        valeur_secondaire: null
                    }
                );

                evenements.push({
                    event: 'nouvelle_mesure',
                    payload: {
                        id_astronaute: idAstronaute,
                        code: mesure.code,
                        valeur: mesure.valeur,
                        horodatage
                    }
                });

                if (alerte) {
                    const [infosAlerte] = await connection.execute(
                        `SELECT date_creation
                         FROM Alerte
                         WHERE id_alerte = ?`,
                        [alerte.id_alerte]
                    );

                    evenements.push({
                        event: 'nouvelle_alerte',
                        payload: {
                            id_alerte: alerte.id_alerte,
                            id_astronaute: idAstronaute,
                            nom_code,
                            niveau: alerte.niveau,
                            message: alerte.message,
                            date_creation: infosAlerte[0].date_creation
                        }
                    });
                }
            }

            // Confirmer cette étape avant d'envoyer les événements
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }

        // Envoyer les événements après chaque étape validée
        for (const evenement of evenements) {
            io?.emit(evenement.event, evenement.payload);
        }
    }
}

router.post('/scenario', async (req, res) => {
    const { nom } = req.body;

    if (!scenarios[nom]) {
        return res.status(400).json({
            message: 'Scénario invalide. Utilisez baisse_oxygene, normal ou baisse_oxygene_critique.'
        });
    }

    const idAstronaute = Number(
        req.body.id_astronaute ?? ID_ASTRONAUTE_PAR_DEFAUT
    );

    if (!Number.isInteger(idAstronaute) || idAstronaute <= 0) {
        return res.status(400).json({
            message: 'id_astronaute invalide.'
        });
    }

    // Répondre immédiatement au frontend
    res.status(202).json({
        message: 'Scénario lancé',
        nom,
        id_astronaute: idAstronaute
    });

    // Continuer la simulation en arrière-plan
    const io = req.app.get('io');
    executerScenario(nom, idAstronaute, io)
        .catch(error => {
            console.error('Erreur du simulateur:', error);
        });
});



export default router;