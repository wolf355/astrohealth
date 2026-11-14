import express from 'express';
import db from '../config/db.js';
import { verifierEtCreerAlerte } from '../services/alertesService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const {
        id_mesure,
        id_astronaute,
        id_parametre,
        valeur,
        valeur_secondaire,
        horodatage,
        source
    } = req.body;

    if (
        !id_mesure ||
        id_astronaute == null ||
        id_parametre == null ||
        valeur == null ||
        !horodatage ||
        !source
    ) {
        return res.status(400).json({
            message: 'Tous les champs obligatoires doivent être fournis'
        });
    }

    const connection = db.promise();

    try {
        await connection.beginTransaction();

        // 1. Enregistrer la mesure
        await connection.execute(
            `INSERT INTO Mesure (
                id_mesure,
                id_astronaute,
                id_parametre,
                valeur,
                valeur_secondaire,
                horodatage,
                source
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id_mesure,
                id_astronaute,
                id_parametre,
                valeur,
                valeur_secondaire ?? null,
                horodatage,
                source
            ]
        );

        // 2. Vérifier les seuils et créer une alerte si nécessaire
        const alerte = await verifierEtCreerAlerte(
            connection,
            {
                id_mesure,
                id_astronaute,
                id_parametre,
                valeur: Number(valeur),
                valeur_secondaire: valeur_secondaire == null
                    ? null
                    : Number(valeur_secondaire)
            }
        );

        // 3. Récupérer les informations nécessaires pour Socket.IO
        const [infos] = await connection.execute(
            `SELECT p.code, u.nom_code
             FROM Parametre p
             JOIN Astronaute a ON a.id_astronaute = ?
             JOIN Utilisateur u ON u.id_utilisateur = a.id_utilisateur
             WHERE p.id_parametre = ?`,
            [id_astronaute, id_parametre]
        );

        if (infos.length === 0) {
            throw new Error('Informations de mesure introuvables');
        }

        const { code, nom_code } = infos[0];
// Récupérer la date de création de l'alerte
let date_creation = null;
if (alerte) {
    const [alerteInfos] = await connection.execute(
        `SELECT date_creation FROM Alerte WHERE id_alerte = ?`,
        [alerte.id_alerte]
    );
    date_creation = alerteInfos[0].date_creation;
}

        // 4. Confirmer les opérations dans la base de données
        await connection.commit();

        // 5. Envoyer les événements Socket.IO
        const io = req.app.get('io');

        io.emit('nouvelle_mesure', {
            id_astronaute,
            code,
            valeur: Number(valeur),
            horodatage
        });

        if (alerte) {
            io.emit('nouvelle_alerte', {
                id_alerte: alerte.id_alerte,
                id_astronaute,
                nom_code,
                niveau: alerte.niveau,
                message: alerte.message,
                date_creation

            });
        }

        return res.status(201).json({
            message: 'Mesure enregistrée avec succès',
            id_mesure,
            alerte
        });

    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Erreur rollback:', rollbackError);
        }
        console.error(error);
        return res.status(500).json({
            message: "Erreur lors de l'enregistrement de la mesure ou de la création de l'alerte"
        });
    }
});



export default router;