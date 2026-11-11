import { randomUUID } from 'node:crypto';

// Verifier si une mesure depasse un seuil
function depasseSeuil(mesure, seuil) {
    // Cas special tension arterielle
    if (mesure.code === 'TA') {
        const systoliqueDepassee =
            seuil.seuil_max != null &&
            mesure.valeur > seuil.seuil_max;
        const diastoliqueDepassee =
            seuil.seuil_secondaire_max != null &&
            mesure.valeur_secondaire != null &&
            mesure.valeur_secondaire > seuil.seuil_secondaire_max;

        return systoliqueDepassee || diastoliqueDepassee;
    }

    return (
        (seuil.seuil_min != null && mesure.valeur < seuil.seuil_min) || (seuil.seuil_max != null && mesure.valeur > seuil.seuil_max));
}

// Creer une recommandation selon le niveau
function obtenirRecommandation(niveau, code) {
    if (niveau === 'critique') {
        return {
            type: 'contact_medecin',
            texte: 'Contactez immediatement le medecin de la mission'
        };
    }

    if (['FC', 'TEMP', 'FR'].includes(code)) {
        return {
            type: 'repos',
            texte: 'Prenez du repos et surveillez votre etat de sante.'
        };
    }
    return {
        type: 'nouvelle_mesure',
        texte: 'Effectuez une nouvelle mesure pour verifier cette valeur.'
    };
}

// Verifier les seuils et creer une alerte si necessaire
export async function verifierEtCreerAlerte(connection, mesure) {
    const [seuils] = await connection.execute(
        `SELECT s.*, p.code
         FROM Seuil s
         JOIN Parametre p ON s.id_parametre = p.id_parametre
         WHERE s.id_parametre = ?
         AND (s.id_astronaute = ? OR s.id_astronaute IS NULL)`,
        [mesure.id_parametre, mesure.id_astronaute]
    );

    // Priorite aux seuils specifiques à l'astronaute
    const seuilsSpecifiques = seuils.filter(
    s => s.id_astronaute != null &&
         Number(s.id_astronaute) === Number(mesure.id_astronaute));

    const seuilsAUtiliser = seuilsSpecifiques.length > 0
        ? seuilsSpecifiques
        : seuils.filter(s => s.id_astronaute === null);

    // Vérifier critique avant attention
    seuilsAUtiliser.sort((a, b) => {
    const priorite = {
        critique: 0,
        attention: 1
    };
    return priorite[a.niveau.toLowerCase()] -
           priorite[b.niveau.toLowerCase()];
});



    const seuilDepasse = seuilsAUtiliser.find(
        seuil => depasseSeuil(
            { ...mesure, code: seuil.code },
            seuil
        )
    );

    if (!seuilDepasse) return null;

    const niveau = seuilDepasse.niveau.toLowerCase();
    const idAlerte = randomUUID();

    
    const message = seuilDepasse.code === 'TA'
    ? `Valeur anormale détectée pour TA : ${mesure.valeur}/${mesure.valeur_secondaire}`
    : `Valeur anormale détectée pour ${seuilDepasse.code} : ${mesure.valeur};`

    await connection.execute(
        `INSERT INTO Alerte
         (id_alerte, id_astronaute, id_mesure, niveau, message)
         VALUES (?, ?, ?, ?, ?)`,
        [
            idAlerte,
            mesure.id_astronaute,
            mesure.id_mesure,
            niveau,
            message
        ]
    );

    const recommandation = obtenirRecommandation(
        niveau,
        seuilDepasse.code
    );

    await connection.execute(
        `INSERT INTO Recommandation
         (id_recommandation, id_alerte, texte, type)
         VALUES (?, ?, ?, ?)`,
        [
            randomUUID(),
            idAlerte,
            recommandation.texte,
            recommandation.type
        ]
    );
    return { id_alerte: idAlerte, niveau, message };
}