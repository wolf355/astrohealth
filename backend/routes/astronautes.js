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




router.get('/:id/mesures/latest', (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            p.Code AS code,
            m.valeur,
            m.valeur_secondaire,
            m.horodatage
        FROM Parametre p
        INNER JOIN Mesure m
            ON p.id_parametre = m.id_parametre
        WHERE m.id_astronaute = ?
          AND m.id_mesure = (
              SELECT m2.id_mesure
              FROM Mesure m2
              WHERE m2.id_astronaute = m.id_astronaute
                AND m2.id_parametre = m.id_parametre
              ORDER BY m2.horodatage DESC
              LIMIT 1
          )
        ORDER BY p.Code; `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                message: 'Erreur lors de la recuperation des dernieres mesures'
            });
        }

        res.status(200).json(results);
    });
});




router.get('/:id/mesures', (req, res) => {
    const { id } = req.params;
    const { parametre, debut, fin } = req.query;

    if (!parametre || !debut || !fin) {
        return res.status(400).json({
            message: 'parametre, debut et fin sont obligatoires'
        });
    }
    
    const sql = `
        SELECT
            p.Code AS code,
            m.valeur,
            m.valeur_secondaire,
            m.horodatage
        FROM Mesure m
        INNER JOIN Parametre p
            ON m.id_parametre = p.id_parametre
        WHERE m.id_astronaute = ?
          AND p.Code = ?
          AND m.horodatage BETWEEN ? AND ?
        ORDER BY m.horodatage ASC
    `;

    db.query(sql, [id, parametre, debut, fin], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                message: 'Erreur lors de la récupération des mesures'
            });
        }
        res.status(200).json(results);
    });
});


export default router;