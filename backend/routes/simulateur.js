import express from 'express';
import db from '../config/db.js';
import { randomUUID } from 'node:crypto';
import { verifierEtCreerAlerte } from '../services/alertesService.js';

const router = express.Router();
const ID_ASTRONAUTE = 1;

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
    ]
};

router.post('/scenario', async (req, res) => {
    const { nom } = req.body;
    if (!scenarios[nom]) {
        return res.status(400).json({
            message: 'Scénario invalide. Utilisez baisse_oxygene ou normal.'
        });
    }

    const connection = db.promise();

    try {
        await connection.beginTransaction();
        // 1. Récupérer les IDs des paramètres
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

        // 2. Récupérer le nom de code de l'astronaute
        const [astronautes] = await connection.execute(
            `SELECT u.nom_code
             FROM Astronaute a
             JOIN Utilisateur u ON u.id_utilisateur = a.id_utilisateur
             WHERE a.id_astronaute = ?`,
            [ID_ASTRONAUTE]
        );

        if (astronautes.length === 0) {
            throw new Error('Astronaute introuvable');
        }

        const nom_code = astronautes[0].nom_code;
        const mesuresGenerees = [];
        const alertesGenerees = [];
        const evenements = [];
        const serie = scenarios[nom];

        // 3. Générer et enregistrer les mesures
        const debut = Date.now() - (serie.length - 1) * 1000;
        for (let i = 0; i < serie.length; i++) {
            const horodatage = new Date(debut + i * 1000)
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ');
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

            for (const mesure of mesures) {
                const id_mesure = randomUUID();

                // Enregistrer la mesure
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
                        ID_ASTRONAUTE,
                        mesure.id_parametre,
                        mesure.valeur,
                        horodatage,
                        'simulateur'
                    ]
                );

                // Vérifier les seuils et créer une alerte
                const alerte = await verifierEtCreerAlerte(
                    connection,
                    {
                        id_mesure,
                        id_astronaute: ID_ASTRONAUTE,
                        id_parametre: mesure.id_parametre,
                        valeur: mesure.valeur,
                        valeur_secondaire: null
                    }
                );

                mesuresGenerees.push({
                    id_mesure,
                    code: mesure.code,
                    valeur: mesure.valeur,
                    horodatage
                });

                evenements.push({
                    event: 'nouvelle_mesure',
                    payload: {
                        id_astronaute: ID_ASTRONAUTE,
                        code: mesure.code,
                        valeur: mesure.valeur,
                        horodatage
                    }
                });

                // Préparer l'événement d'alerte
                if (alerte) {
                    const [infosAlerte] = await connection.execute(
                        `SELECT date_creation
                         FROM Alerte
                         WHERE id_alerte = ?`,
                        [alerte.id_alerte]
                    );

                    const date_creation = infosAlerte[0].date_creation;

                    const payload = {
                        id_alerte: alerte.id_alerte,
                        id_astronaute: ID_ASTRONAUTE,
                        nom_code,
                        niveau: alerte.niveau,
                        message: alerte.message,
                        date_creation
                    };

                    alertesGenerees.push(payload);
                    evenements.push({
                        event: 'nouvelle_alerte',
                        payload
                    });
                }
            }
        }

        // 4. Confirmer toutes les opérations
        await connection.commit();

        // 5. Envoyer les événements Socket.IO
        const io = req.app.get('io');

        if (io) {
            for (const evenement of evenements) {
                io.emit(evenement.event, evenement.payload);
            }
        }

        return res.status(201).json({
            message: `Scénario ${nom} exécuté avec succès`,
            nom,
            id_astronaute: ID_ASTRONAUTE,
            nombre_mesures: mesuresGenerees.length,
            mesures: mesuresGenerees,
            alertes: alertesGenerees
        });

    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Erreur rollback:', rollbackError);
        }
        console.error(error);
        return res.status(500).json({
            message: 'Erreur lors de l’exécution du scénario'
        });
    }
});



export default router;