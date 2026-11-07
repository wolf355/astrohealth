import express from 'express';
import db from '../config/db.js';

const router = express.Router();


router.get('/', (req, res) => {
    const sql = `
        SELECT
            a.id_astronaute,
            u.nom_code,
            u.fonction
        FROM astronaute a
        INNER JOIN utilisateur u
            ON a.id_utilisateur = u.id_utilisateur `;

            
    db.query(sql, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                message: 'Erreur lors de la recuperation des astronautes'
            });
        }
        res.status(200).json(results);
    });
});

export default router;