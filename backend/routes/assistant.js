import express from 'express';
import crypto from 'crypto';
import db from '../config/db.js';

const router = express.Router();

const SYSTEM_PROMPT =
  "You are the health assistant of an astronaut monitoring app. You only explain the measurements " +
  "and alerts you are given. You never give a medical diagnosis and never prescribe treatment. " +
  "Keep answers short (3 or 4 sentences) and calm. Suggest simple safe actions (rest, re-measure, " +
  "hydrate). For a critical alert, tell the astronaut to contact the ground doctor immediately. " +
  "If you are asked something unrelated to health monitoring, say you can only help with the " +
  "measurements and alerts. Answer in the language of the question.";

/**
 * Helper to execute db.query as a Promise, preserving the project's callback-based db.query.
 */
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

/**
 * Isolated function to call the AI provider.
 * Uses native fetch with configurable API key and endpoint.
 * Throws or returns null if unavailable/unconfigured.
 */
export async function appelerIA(messages) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('AI_API_KEY is not configured');
  }

  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 350
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`AI API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Empty response from AI service');
    }

    return content.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Builds the prompt context according to rule BNF11:
 * ONLY vital signs (code, value, secondary value, unit, normal range, timestamp),
 * active alerts (level, message, timestamp), and recent trends for alerted parameters (last 5 values).
 * NEVER includes name, email, age, or any personal identifying info.
 */
function construireContexte(mesures, alertes, historiqueParametresAlerte = {}) {
  let context = 'VITAL SIGNS MEASUREMENTS (Latest values & normal ranges):\n';
  if (mesures.length === 0) {
    context += 'No recent measurements recorded.\n';
  } else {
    for (const m of mesures) {
      const dateStr = m.horodatage ? new Date(m.horodatage).toISOString().replace('T', ' ').slice(0, 19) : 'N/A';
      const secVal = m.valeur_secondaire != null ? ` / ${m.valeur_secondaire}` : '';
      const unit = m.unite ? ` ${m.unite}` : '';
      const normalRange = (m.plage_normale_min != null && m.plage_normale_max != null)
        ? ` [Normal range: ${m.plage_normale_min} - ${m.plage_normale_max}${unit}]`
        : '';
      context += `- ${m.code} (${m.libelle || m.code}): ${m.valeur}${secVal}${unit}${normalRange} recorded at ${dateStr}\n`;
    }
  }

  context += '\nACTIVE ALERTS:\n';
  if (alertes.length === 0) {
    context += 'None. All monitored parameters are currently nominal.\n';
  } else {
    for (const a of alertes) {
      const dateStr = a.date_creation ? new Date(a.date_creation).toISOString().replace('T', ' ').slice(0, 19) : 'N/A';
      context += `- [${a.niveau.toUpperCase()}] ${a.message} (${dateStr})\n`;

      const paramCode = a.code_parametre;
      if (paramCode && historiqueParametresAlerte[paramCode] && historiqueParametresAlerte[paramCode].length > 0) {
        const hist = historiqueParametresAlerte[paramCode];
        const unit = a.unite ? ` ${a.unite}` : '';
        const histStr = hist.map(h => {
          const t = h.horodatage ? new Date(h.horodatage).toISOString().replace('T', ' ').slice(11, 19) : '';
          const sec = h.valeur_secondaire != null ? `/${h.valeur_secondaire}` : '';
          return `${h.valeur}${sec}${unit} at ${t}`;
        }).join(' -> ');
        context += `  Recent trend for ${paramCode} (last ${hist.length} values, chronological): ${histStr}\n`;
      }
    }
  }

  return context;
}

/**
 * Fallback message generator for 'secours' mode.
 * Adapts to French or English questions and active alert severity.
 * Strips any trailing dot from the database alert message to avoid double punctuation ("..").
 */
function genererReponseSecours(question, alertesActives) {
  const isFrench = /[éàèêëîïôöùûüç]|\b(pourquoi|comment|qu|est-ce|mesure|mon|ma|mes|alerte|santé|oxygène|coeur|pouls|sommeil)\b/i.test(question);

  const cleanMessage = (msg) => (msg ? msg.trim().replace(/\.+$/, '') : '');

  if (isFrench) {
    if (alertesActives && alertesActives.length > 0) {
      const premiereAlerte = alertesActives[0];
      const messageNettoye = cleanMessage(premiereAlerte.message);
      if (premiereAlerte.niveau === 'critique') {
        return `Je ne parviens pas à joindre le service d'IA pour le moment. Une alerte critique est active : ${messageNettoye}. Contactez immédiatement le médecin au sol.`;
      }
      return `Je ne parviens pas à joindre le service d'IA pour le moment. Alerte active : ${messageNettoye}. Reposez-vous, reprenez votre mesure dans 10 minutes et contactez le médecin au sol si la situation ne s'améliore pas.`;
    }
    return "Je ne parviens pas à joindre le service d'IA pour le moment. Vos dernières mesures sont affichées sur votre tableau de bord. Si une alerte est active, reposez-vous, reprenez votre mesure dans 10 minutes et contactez le médecin au sol si la situation ne s'améliore pas.";
  }

  if (alertesActives && alertesActives.length > 0) {
    const premiereAlerte = alertesActives[0];
    const messageNettoye = cleanMessage(premiereAlerte.message);
    if (premiereAlerte.niveau === 'critique') {
      return `I cannot reach the AI service right now. An active critical alert is in place: ${messageNettoye}. Please contact the ground doctor immediately.`;
    }
    return `I cannot reach the AI service right now. An active alert is in place: ${messageNettoye}. Please rest, re-measure in 10 minutes, and contact the ground doctor if it does not improve.`;
  }
  return "I cannot reach the AI service right now. Your latest values are shown on the dashboard. If an alert is active, rest, re-measure in 10 minutes and contact the ground doctor if it does not improve.";
}

/**
 * POST /api/assistant/chat
 * Body: { "id_astronaute": 1, "question": "..." }
 * Response: { "reponse": "...", "mode": "IA", "id_message": "..." }
 */
router.post('/chat', async (req, res) => {
  const { id_astronaute, question } = req.body;

  // 1. Validation
  if (id_astronaute == null || !question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      message: 'id_astronaute et question sont obligatoires'
    });
  }

  if (question.length > 500) {
    return res.status(400).json({
      message: 'La question ne doit pas dépasser 500 caractères'
    });
  }

  try {
    // 2. Fetch latest measurements for this astronaut with normal ranges
    const sqlMesures = `
      SELECT
          p.id_parametre,
          p.code AS code,
          p.libelle,
          p.unite,
          p.plage_normale_min,
          p.plage_normale_max,
          m.valeur,
          m.valeur_secondaire,
          m.horodatage
      FROM parametre p
      INNER JOIN mesure m
          ON p.id_parametre = m.id_parametre
      WHERE m.id_astronaute = ?
        AND m.id_mesure = (
            SELECT m2.id_mesure
            FROM mesure m2
            WHERE m2.id_astronaute = m.id_astronaute
              AND m2.id_parametre = m.id_parametre
            ORDER BY m2.horodatage DESC
            LIMIT 1
        )
      ORDER BY p.code;
    `;
    const dernieresMesures = await queryAsync(sqlMesures, [id_astronaute]);

    // 3. Fetch active alerts for this astronaut with associated parameter info
    const sqlAlertes = `
      SELECT
          al.id_alerte,
          al.id_astronaute,
          al.niveau,
          al.message,
          al.date_creation,
          al.statut,
          m.id_parametre,
          p.code AS code_parametre,
          p.libelle AS libelle_parametre,
          p.unite
      FROM alerte al
      INNER JOIN mesure m ON al.id_mesure = m.id_mesure
      INNER JOIN parametre p ON m.id_parametre = p.id_parametre
      WHERE al.id_astronaute = ?
        AND al.statut = 'active'
      ORDER BY al.date_creation DESC;
    `;
    const alertesActives = await queryAsync(sqlAlertes, [id_astronaute]);

    // ID of the most recent active alert, if any
    const idAlerteActive = alertesActives.length > 0 ? alertesActives[0].id_alerte : null;

    // 4. For each distinct parameter in alert, fetch its last 5 measurements
    const historiqueParametresAlerte = {};
    const parametresVus = new Set();

    for (const a of alertesActives) {
      if (a.id_parametre && !parametresVus.has(a.id_parametre)) {
        parametresVus.add(a.id_parametre);
        const sqlHist = `
          SELECT
              m.valeur,
              m.valeur_secondaire,
              m.horodatage
          FROM mesure m
          WHERE m.id_astronaute = ?
            AND m.id_parametre = ?
          ORDER BY m.horodatage DESC
          LIMIT 5;
        `;
        const rows = await queryAsync(sqlHist, [id_astronaute, a.id_parametre]);
        // Put in chronological order (oldest to newest)
        historiqueParametresAlerte[a.code_parametre] = rows.reverse();
      }
    }

    // 5. Build BNF11 compliant context (vital signs only, zero personal data)
    const contexteSante = construireContexte(dernieresMesures, alertesActives, historiqueParametresAlerte);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${contexteSante}\n\nAstronaut question:\n${question.trim()}`
      }
    ];

    // 6. Attempt AI call with fallback to secours
    let reponse = '';
    let mode = 'IA';

    try {
      reponse = await appelerIA(messages);
    } catch (aiError) {
      console.warn('AI call failed or key absent, switching to secours mode:', aiError.message);
      mode = 'secours';
      reponse = genererReponseSecours(question, alertesActives);
    }

    // 7. Record messages in database (table message_ia)
    // Add 1 second to assistant message to guarantee strict chronological order in history
    const now = new Date();
    const assistantTimestamp = new Date(now.getTime() + 1000);
    const idMessageUser = crypto.randomUUID();
    const idMessageAssistant = crypto.randomUUID();

    const insertSql = `
      INSERT INTO message_ia (
          id_message,
          id_astronaute,
          id_alerte,
          role_message,
          contenu,
          horodatage,
          mode,
          synchronisee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Insert user question
    await queryAsync(insertSql, [
      idMessageUser,
      id_astronaute,
      idAlerteActive,
      'utilisateur',
      question.trim(),
      now,
      mode,
      false
    ]);

    // Insert assistant answer (with +1000ms timestamp)
    await queryAsync(insertSql, [
      idMessageAssistant,
      id_astronaute,
      idAlerteActive,
      'assistant',
      reponse,
      assistantTimestamp,
      mode,
      false
    ]);

    return res.status(200).json({
      reponse,
      mode,
      id_message: idMessageAssistant
    });
  } catch (err) {
    console.error('Error handling chat request:', err);
    return res.status(500).json({
      message: 'Erreur interne du serveur lors du traitement de la demande'
    });
  }
});

/**
 * GET /api/assistant/historique?id_astronaute=1
 * Renvoie les messages de l'astronaute triés par date (role_message, contenu, horodatage, mode).
 */
router.get('/historique', (req, res) => {
  const { id_astronaute } = req.query;

  if (!id_astronaute) {
    return res.status(400).json({
      message: 'id_astronaute est obligatoire'
    });
  }

  const sql = `
    SELECT
        id_message,
        id_astronaute,
        id_alerte,
        role_message,
        contenu,
        horodatage,
        mode,
        synchronisee
    FROM message_ia
    WHERE id_astronaute = ?
    ORDER BY horodatage ASC, id_message ASC;
  `;

  db.query(sql, [id_astronaute], (error, results) => {
    if (error) {
      console.error('Erreur récupération historique:', error);
      return res.status(500).json({
        message: "Erreur lors de la récupération de l'historique des messages"
      });
    }

    res.status(200).json(results);
  });
});

export default router;
