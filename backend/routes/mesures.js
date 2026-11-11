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

        // Verifier les seuils et creer une alerte si necessaire
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

        //  Confirmation de toutes les operations
        await connection.commit();
        return res.status(201).json({
            message: 'Mesure enregistree avec succes',
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
        message: "Erreur lors de l'enregistrement de la mesure ou de la creation de l'alerte"
    });
}
});




export default router;