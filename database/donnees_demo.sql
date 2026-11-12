-- ============================================================
-- Donnees de demonstration pour AstroHealth
-- Genere a partir de database/astrohealth_exemple.json
-- ============================================================

USE `astrohealth`;

SET FOREIGN_KEY_CHECKS = 0;

-- Table `mission`
INSERT INTO `mission` (`id_mission`, `nom_mission`, `environnement`, `date_debut`, `date_fin`) VALUES (1, 'Artemis-X', 'vaisseau', '2026-09-27', '2027-03-26') ON DUPLICATE KEY UPDATE `id_mission` = `id_mission`;

-- Table `utilisateur`
INSERT INTO `utilisateur` (`id_utilisateur`, `nom_code`, `email`, `mot_de_passe_hash`, `role`, `fonction`, `date_creation`) VALUES (1, 'Alex Moreau', 'alex.moreau@astrohealth.example', '$2b$10$EXEMPLE_DE_HASH_FICTIF_A_REMPLACER_PAR_BCRYPT_000000000000', 'commandant', 'commandant', '2026-09-20T09:00:00') ON DUPLICATE KEY UPDATE `id_utilisateur` = `id_utilisateur`;
INSERT INTO `utilisateur` (`id_utilisateur`, `nom_code`, `email`, `mot_de_passe_hash`, `role`, `fonction`, `date_creation`) VALUES (2, 'Sara Khan', 'sara.khan@astrohealth.example', '$2b$10$EXEMPLE_DE_HASH_FICTIF_A_REMPLACER_PAR_BCRYPT_000000000000', 'astronaute', 'specialiste de mission', '2026-09-20T09:00:00') ON DUPLICATE KEY UPDATE `id_utilisateur` = `id_utilisateur`;
INSERT INTO `utilisateur` (`id_utilisateur`, `nom_code`, `email`, `mot_de_passe_hash`, `role`, `fonction`, `date_creation`) VALUES (3, 'Leo Tanaka', 'leo.tanaka@astrohealth.example', '$2b$10$EXEMPLE_DE_HASH_FICTIF_A_REMPLACER_PAR_BCRYPT_000000000000', 'astronaute', 'pilote', '2026-09-20T09:00:00') ON DUPLICATE KEY UPDATE `id_utilisateur` = `id_utilisateur`;
INSERT INTO `utilisateur` (`id_utilisateur`, `nom_code`, `email`, `mot_de_passe_hash`, `role`, `fonction`, `date_creation`) VALUES (4, 'Mia Rossi', 'mia.rossi@astrohealth.example', '$2b$10$EXEMPLE_DE_HASH_FICTIF_A_REMPLACER_PAR_BCRYPT_000000000000', 'astronaute', 'ingenieur de vol', '2026-09-20T09:00:00') ON DUPLICATE KEY UPDATE `id_utilisateur` = `id_utilisateur`;
INSERT INTO `utilisateur` (`id_utilisateur`, `nom_code`, `email`, `mot_de_passe_hash`, `role`, `fonction`, `date_creation`) VALUES (5, 'Dr. Maya Chen', 'maya.chen@astrohealth.example', '$2b$10$EXEMPLE_DE_HASH_FICTIF_A_REMPLACER_PAR_BCRYPT_000000000000', 'medecin', 'chirurgien de vol', '2026-09-20T09:00:00') ON DUPLICATE KEY UPDATE `id_utilisateur` = `id_utilisateur`;

-- Table `astronaute`
INSERT INTO `astronaute` (`id_astronaute`, `id_utilisateur`, `id_mission`, `age`, `sexe`, `poids`, `taille`) VALUES (1, 1, 1, 45, 'M', 78.5, 180) ON DUPLICATE KEY UPDATE `id_astronaute` = `id_astronaute`;
INSERT INTO `astronaute` (`id_astronaute`, `id_utilisateur`, `id_mission`, `age`, `sexe`, `poids`, `taille`) VALUES (2, 2, 1, 38, 'F', 62, 168) ON DUPLICATE KEY UPDATE `id_astronaute` = `id_astronaute`;
INSERT INTO `astronaute` (`id_astronaute`, `id_utilisateur`, `id_mission`, `age`, `sexe`, `poids`, `taille`) VALUES (3, 3, 1, 41, 'M', 82, 185) ON DUPLICATE KEY UPDATE `id_astronaute` = `id_astronaute`;
INSERT INTO `astronaute` (`id_astronaute`, `id_utilisateur`, `id_mission`, `age`, `sexe`, `poids`, `taille`) VALUES (4, 4, 1, 36, 'F', 58.5, 165) ON DUPLICATE KEY UPDATE `id_astronaute` = `id_astronaute`;

-- Table `seuil`
INSERT INTO `seuil` (`id_seuil`, `id_parametre`, `id_astronaute`, `seuil_min`, `seuil_max`, `seuil_secondaire_max`, `niveau`, `modifie_par`, `date_modification`) VALUES (20, 1, 1, 50, 110, NULL, 'attention', 5, '2026-11-05T10:15:00') ON DUPLICATE KEY UPDATE `id_seuil` = `id_seuil`;

-- Table `ligne_de_base`
INSERT INTO `ligne_de_base` (`id_ligne_base`, `id_astronaute`, `id_parametre`, `moyenne`, `ecart_type`, `date_calcul`) VALUES (1, 1, 1, 72, 5, '2026-11-06T23:00:00') ON DUPLICATE KEY UPDATE `id_ligne_base` = `id_ligne_base`;
INSERT INTO `ligne_de_base` (`id_ligne_base`, `id_astronaute`, `id_parametre`, `moyenne`, `ecart_type`, `date_calcul`) VALUES (2, 1, 2, 98, 0.8, '2026-11-06T23:00:00') ON DUPLICATE KEY UPDATE `id_ligne_base` = `id_ligne_base`;

-- Table `mesure`
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('f38b2ffc-80a4-4f5a-91c9-bc701e7ea419', 1, 1, 72, NULL, '2026-11-07T08:00:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('f3f49249-dc28-4f90-a5ae-c7978306d03b', 1, 2, 98, NULL, '2026-11-07T08:00:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('e5121482-3929-4d22-a255-accb1a466884', 1, 4, 118, 76, '2026-11-07T08:00:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('6bad6be2-8e7a-46e9-9f19-950499dd251d', 1, 7, 0.45, NULL, '2026-11-07T12:00:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('d7a7a3cc-8c3d-4f16-9293-de8fc88b2875', 1, 1, 108, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('7dabe929-c4a3-44bf-86cd-75e9bb049a79', 1, 3, 36.9, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('70eb9a0a-9626-4ae6-85e8-18fac0433cbd', 1, 2, 91, NULL, '2026-11-07T14:32:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('14aa4e71-9d3c-4dec-80a6-1f933d6c51e3', 1, 2, 93, NULL, '2026-11-07T14:40:00', 'saisie manuelle', 0) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('1919e93a-d117-45ad-8988-93101c593af5', 2, 6, 4.5, NULL, '2026-11-07T14:10:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('e4163207-d094-4996-82f0-ee99731c9452', 2, 1, 76, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('5071950e-adec-4f11-bd83-6e77af67d461', 2, 2, 97, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('59001ac9-4063-49bc-a5b0-0a2d35d14880', 2, 3, 36.7, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('5b4c8012-ede7-4d0c-bfb8-8309fadb8908', 3, 1, 69, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('bef7e268-ffe9-46ab-a058-1ccace1d62e0', 3, 2, 99, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('b91dddd9-1389-4372-a341-738c837a7935', 3, 3, 36.6, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('89be9c1c-8eb5-440f-96f4-488157241955', 4, 1, 73, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('24114258-751b-4c83-89a0-47dc4ac87fc0', 4, 2, 98, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('b766ff10-b437-4db5-a511-49bbe060a724', 4, 3, 36.8, NULL, '2026-11-07T14:30:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;
INSERT INTO `mesure` (`id_mesure`, `id_astronaute`, `id_parametre`, `valeur`, `valeur_secondaire`, `horodatage`, `source`, `synchronisee`) VALUES ('d9090b89-0655-4096-8f1a-8a1d93d20470', 1, 2, 86, NULL, '2026-11-06T22:10:00', 'simulateur', 1) ON DUPLICATE KEY UPDATE `id_mesure` = `id_mesure`;

-- Table `alerte`
INSERT INTO `alerte` (`id_alerte`, `id_astronaute`, `id_mesure`, `niveau`, `message`, `date_creation`, `statut`, `acquittee_par`, `synchronisee`) VALUES ('7608d942-5d11-4a9d-9e6c-9992b5fb12e0', 1, '70eb9a0a-9626-4ae6-85e8-18fac0433cbd', 'attention', 'SpO2 basse : 91 % (seuil d''alerte : moins de 92 %).', '2026-11-07T14:32:00', 'active', NULL, 1) ON DUPLICATE KEY UPDATE `id_alerte` = `id_alerte`;
INSERT INTO `alerte` (`id_alerte`, `id_astronaute`, `id_mesure`, `niveau`, `message`, `date_creation`, `statut`, `acquittee_par`, `synchronisee`) VALUES ('e41686cd-6616-4227-9737-14726c167229', 2, '1919e93a-d117-45ad-8988-93101c593af5', 'attention', 'Sommeil insuffisant : 4,5 h (seuil d''alerte : moins de 5 h).', '2026-11-07T14:10:00', 'active', NULL, 1) ON DUPLICATE KEY UPDATE `id_alerte` = `id_alerte`;
INSERT INTO `alerte` (`id_alerte`, `id_astronaute`, `id_mesure`, `niveau`, `message`, `date_creation`, `statut`, `acquittee_par`, `synchronisee`) VALUES ('de0279e1-7f9a-4098-8df0-5f2595f19a51', 1, 'd9090b89-0655-4096-8f1a-8a1d93d20470', 'critique', 'SpO2 critique : 86 % (seuil critique : moins de 88 %).', '2026-11-06T22:10:00', 'resolue', 5, 1) ON DUPLICATE KEY UPDATE `id_alerte` = `id_alerte`;

-- Table `recommandation`
INSERT INTO `recommandation` (`id_recommandation`, `id_alerte`, `texte`, `type`, `synchronisee`) VALUES ('cd73de00-81a0-4a05-ace9-da661dcf884c', '7608d942-5d11-4a9d-9e6c-9992b5fb12e0', 'Refaites une mesure de SpO2 dans 10 minutes.', 'nouvelle mesure', 1) ON DUPLICATE KEY UPDATE `id_recommandation` = `id_recommandation`;
INSERT INTO `recommandation` (`id_recommandation`, `id_alerte`, `texte`, `type`, `synchronisee`) VALUES ('e01c683e-99a4-4df0-9de3-a361c0099eba', '7608d942-5d11-4a9d-9e6c-9992b5fb12e0', 'Si la SpO2 reste sous 92 %, contactez le médecin au sol.', 'contact medecin', 1) ON DUPLICATE KEY UPDATE `id_recommandation` = `id_recommandation`;
INSERT INTO `recommandation` (`id_recommandation`, `id_alerte`, `texte`, `type`, `synchronisee`) VALUES ('864fa3f3-eab0-4e9b-a5ed-0de47db4304d', 'e41686cd-6616-4227-9737-14726c167229', 'Prévoyez une période de repos et un coucher plus tôt ce soir.', 'repos', 1) ON DUPLICATE KEY UPDATE `id_recommandation` = `id_recommandation`;
INSERT INTO `recommandation` (`id_recommandation`, `id_alerte`, `texte`, `type`, `synchronisee`) VALUES ('90624fe3-6b82-46c9-982f-b0f1423674a6', 'de0279e1-7f9a-4098-8df0-5f2595f19a51', 'Contactez immédiatement le médecin au sol.', 'contact medecin', 1) ON DUPLICATE KEY UPDATE `id_recommandation` = `id_recommandation`;

-- Table `ressenti`
INSERT INTO `ressenti` (`id_ressenti`, `id_astronaute`, `type`, `niveau`, `commentaire`, `horodatage`, `synchronisee`) VALUES ('8350a73f-7aac-419f-bb75-9e0fed1d9d16', 1, 'fatigue', 3, 'Légère fatigue après la séance d''exercice.', '2026-11-07T13:00:00', 1) ON DUPLICATE KEY UPDATE `id_ressenti` = `id_ressenti`;
INSERT INTO `ressenti` (`id_ressenti`, `id_astronaute`, `type`, `niveau`, `commentaire`, `horodatage`, `synchronisee`) VALUES ('93550840-067f-4cfc-8e1f-d3d9849acfb5', 2, 'humeur', 2, 'Nuit courte, humeur basse.', '2026-11-07T14:15:00', 1) ON DUPLICATE KEY UPDATE `id_ressenti` = `id_ressenti`;

-- Table `message_ia`
INSERT INTO `message_ia` (`id_message`, `id_astronaute`, `id_alerte`, `role_message`, `contenu`, `horodatage`, `mode`, `synchronisee`) VALUES ('d1711cbd-2106-419e-840d-31b5397a7623', 1, '7608d942-5d11-4a9d-9e6c-9992b5fb12e0', 'utilisateur', 'Pourquoi ma SpO2 est-elle basse ?', '2026-11-07T14:35:00', 'IA', 1) ON DUPLICATE KEY UPDATE `id_message` = `id_message`;
INSERT INTO `message_ia` (`id_message`, `id_astronaute`, `id_alerte`, `role_message`, `contenu`, `horodatage`, `mode`, `synchronisee`) VALUES ('85f184e0-b464-4554-b675-299b0c83e786', 1, '7608d942-5d11-4a9d-9e6c-9992b5fb12e0', 'assistant', 'Votre SpO2 est de 91 %, sous le seuil d''alerte de 92 %. Je ne peux pas poser de diagnostic. Refaites une mesure dans 10 minutes. Si elle reste basse, contactez le médecin au sol. Je ne remplace pas un médecin.', '2026-11-07T14:35:00', 'IA', 1) ON DUPLICATE KEY UPDATE `id_message` = `id_message`;
INSERT INTO `message_ia` (`id_message`, `id_astronaute`, `id_alerte`, `role_message`, `contenu`, `horodatage`, `mode`, `synchronisee`) VALUES ('b7a1774f-1a42-421e-aba4-c70ee306f0c4', 2, 'e41686cd-6616-4227-9737-14726c167229', 'utilisateur', 'Pourquoi ai-je une alerte de sommeil ?', '2026-11-07T14:20:00', 'secours', 1) ON DUPLICATE KEY UPDATE `id_message` = `id_message`;
INSERT INTO `message_ia` (`id_message`, `id_astronaute`, `id_alerte`, `role_message`, `contenu`, `horodatage`, `mode`, `synchronisee`) VALUES ('2475263c-7854-4014-aded-c86a9f4fb02b', 2, 'e41686cd-6616-4227-9737-14726c167229', 'assistant', 'Réponse prédéfinie (mode de secours) : l''alerte de sommeil se déclenche sous 5 heures par nuit. Essayez de vous reposer. Je ne remplace pas un médecin.', '2026-11-07T14:20:00', 'secours', 1) ON DUPLICATE KEY UPDATE `id_message` = `id_message`;

-- Table `rapport`
INSERT INTO `rapport` (`id_rapport`, `id_astronaute`, `type`, `periode_debut`, `periode_fin`, `contenu`, `date_generation`) VALUES (1, NULL, 'quotidien', '2026-11-07', '2026-11-07', 'Équipage Artemis-X, jour 42 : 2 alertes d''attention (SpO2 basse pour Alex Moreau, sommeil insuffisant pour Sara Khan). Les autres paramètres sont dans la plage normale.', '2026-11-07T18:00:00') ON DUPLICATE KEY UPDATE `id_rapport` = `id_rapport`;
INSERT INTO `rapport` (`id_rapport`, `id_astronaute`, `type`, `periode_debut`, `periode_fin`, `contenu`, `date_generation`) VALUES (2, 1, 'hebdomadaire', '2026-11-01', '2026-11-07', 'Semaine du 1er au 7 novembre : fréquence cardiaque stable autour de 72 bpm, deux baisses de SpO2 : 86 % le 6 novembre (alerte résolue) et 91 % le 7 novembre.', '2026-11-07T18:05:00') ON DUPLICATE KEY UPDATE `id_rapport` = `id_rapport`;

SET FOREIGN_KEY_CHECKS = 1;
