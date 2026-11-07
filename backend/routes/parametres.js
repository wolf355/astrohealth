import express from 'express' ;
import db from '../config/db.js';

const router = express.Router();

router.get('/' , (req, res)=>{
    const sql = 'SELECT * FROM parametre';
    
    db.query(sql, (error, results)=>{
        if (error){
            console.error(error);
            return res.status(500).json({
                message: 'erreur lors de la recuperation des parametres'
            });
        }
        res.status(200).json(results);
    });
});

export default router;
