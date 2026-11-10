import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
    const { statut } = req.query;
    let sql = `
        SELECT
            al.id_alerte,
            al.id_astronaute,
            u.nom_code,
            al.niveau,
            al.message,
            al.date_creation,
            al.statut
        FROM Alerte al
        INNER JOIN Astronaute a
            ON al.id_astronaute = a.id_astronaute
        INNER JOIN Utilisateur u
            ON a.id_utilisateur = u.id_utilisateur
    `;

    const params = [];
    if (statut) {
        sql += ' WHERE al.statut = ?';
        params.push(statut);
    }
    sql += ' ORDER BY al.date_creation DESC';

    
    db.query(sql, params, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                message: 'Erreur lors de la récupération des alertes'
            });
        }
        res.status(200).json(results);
    });
});


export default router;