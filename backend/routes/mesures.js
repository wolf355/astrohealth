import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.post('/', (req, res) => {
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
    const sql = `
        INSERT INTO Mesure (
            id_mesure,
            id_astronaute,
            id_parametre,
            valeur,
            valeur_secondaire,
            horodatage,
            source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        id_mesure,
        id_astronaute,
        id_parametre,
        valeur,
        valeur_secondaire ?? null,
        horodatage,
        source
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                message: "Erreur lors de l'enregistrement de la mesure"
            });
        }
        res.status(201).json({
            message: 'Mesure enregistrée avec succès',
            id_mesure
        });
    });
});



export default router;