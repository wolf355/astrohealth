-- ============================================================
-- AstroHealth : base de données complète (schéma v3)
-- SGBD : MySQL / MariaDB (InnoDB)
--
-- Ce fichier unique remplace tous les scripts précédents :
-- création des 12 tables, 17 clés étrangères, 10 paramètres
-- et 19 seuils par défaut.
--
-- À importer UNE SEULE FOIS, sur un serveur où la base
-- `astrohealth` n'existe pas encore (phpMyAdmin > Importer).
-- Valeurs des seuils : indicatives, à valider par une source médicale.
-- ============================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `astrohealth` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `astrohealth`;

-- ------------------------------------------------------------
-- 1. Tables
-- ------------------------------------------------------------

CREATE TABLE `utilisateur` (
  `id_utilisateur` int PRIMARY KEY AUTO_INCREMENT,
  `nom_code` varchar(30) UNIQUE NOT NULL COMMENT 'Nom affiche a ecran (fictif pour la demo). Ne jamais envoyer a IA (BNF11)',
  `email` varchar(100) UNIQUE NOT NULL,
  `mot_de_passe_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL COMMENT 'astronaute / medecin / commandant / admin',
  `fonction` varchar(40) NULL COMMENT 'Fonction a bord : commandant, pilote, ingenieur de vol, chirurgien...',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `mission` (
  `id_mission` int PRIMARY KEY AUTO_INCREMENT,
  `nom_mission` varchar(50) NOT NULL,
  `environnement` varchar(30) COMMENT 'station / vaisseau / base lunaire',
  `date_debut` date,
  `date_fin` date
) ENGINE=InnoDB;

CREATE TABLE `astronaute` (
  `id_astronaute` int PRIMARY KEY AUTO_INCREMENT,
  `id_utilisateur` int UNIQUE NOT NULL,
  `id_mission` int,
  `age` int,
  `sexe` char(1),
  `poids` decimal(5,2) COMMENT 'kg',
  `taille` decimal(5,2) COMMENT 'cm',
  CONSTRAINT `fk_astronaute_utilisateur` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`),
  CONSTRAINT `fk_astronaute_mission` FOREIGN KEY (`id_mission`) REFERENCES `mission` (`id_mission`)
) ENGINE=InnoDB;

CREATE TABLE `parametre` (
  `id_parametre` int PRIMARY KEY AUTO_INCREMENT,
  `code` varchar(10) UNIQUE NOT NULL COMMENT 'FC, SPO2, TEMP, TA, FR, SOMMEIL, RADIATION, EXERCICE, GLYCEMIE, HUMEUR',
  `libelle` varchar(50) NOT NULL,
  `unite` varchar(15),
  `plage_normale_min` decimal(8,2),
  `plage_normale_max` decimal(8,2)
) ENGINE=InnoDB;

CREATE TABLE `mesure` (
  `id_mesure` varchar(36) PRIMARY KEY COMMENT 'UUID genere cote client (mode hors ligne)',
  `id_astronaute` int NOT NULL,
  `id_parametre` int NOT NULL,
  `valeur` decimal(8,2) NOT NULL,
  `valeur_secondaire` decimal(8,2) COMMENT 'ex : tension diastolique',
  `horodatage` datetime NOT NULL,
  `source` varchar(20) NOT NULL COMMENT 'capteur / simulateur / saisie manuelle',
  `synchronisee` boolean NOT NULL DEFAULT false,
  INDEX `mesure_index_0` (`id_astronaute`, `id_parametre`, `horodatage`),
  CONSTRAINT `fk_mesure_astronaute` FOREIGN KEY (`id_astronaute`) REFERENCES `astronaute` (`id_astronaute`),
  CONSTRAINT `fk_mesure_parametre` FOREIGN KEY (`id_parametre`) REFERENCES `parametre` (`id_parametre`)
) ENGINE=InnoDB;

CREATE TABLE `seuil` (
  `id_seuil` int PRIMARY KEY AUTO_INCREMENT,
  `id_parametre` int NOT NULL,
  `id_astronaute` int COMMENT 'NULL = seuil par defaut',
  `seuil_min` decimal(8,2),
  `seuil_max` decimal(8,2),
  `seuil_secondaire_max` decimal(8,2) COMMENT 'Limite haute de la valeur secondaire (ex : tension diastolique)',
  `niveau` varchar(20) NOT NULL COMMENT 'attention / critique',
  `modifie_par` int,
  `date_modification` datetime,
  CONSTRAINT `fk_seuil_parametre` FOREIGN KEY (`id_parametre`) REFERENCES `parametre` (`id_parametre`),
  CONSTRAINT `fk_seuil_astronaute` FOREIGN KEY (`id_astronaute`) REFERENCES `astronaute` (`id_astronaute`),
  CONSTRAINT `fk_seuil_utilisateur` FOREIGN KEY (`modifie_par`) REFERENCES `utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB;

CREATE TABLE `ligne_de_base` (
  `id_ligne_base` int PRIMARY KEY AUTO_INCREMENT,
  `id_astronaute` int NOT NULL,
  `id_parametre` int NOT NULL,
  `moyenne` decimal(8,2),
  `ecart_type` decimal(8,2),
  `date_calcul` datetime,
  CONSTRAINT `fk_ligne_base_astronaute` FOREIGN KEY (`id_astronaute`) REFERENCES `astronaute` (`id_astronaute`),
  CONSTRAINT `fk_ligne_base_parametre` FOREIGN KEY (`id_parametre`) REFERENCES `parametre` (`id_parametre`)
) ENGINE=InnoDB;

CREATE TABLE `alerte` (
  `id_alerte` varchar(36) PRIMARY KEY COMMENT 'UUID genere cote client (mode hors ligne)',
  `id_astronaute` int NOT NULL,
  `id_mesure` varchar(36) UNIQUE NOT NULL COMMENT 'Une mesure declenche 0 ou 1 alerte',
  `niveau` varchar(20) NOT NULL COMMENT 'attention / critique',
  `message` varchar(255),
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active / acquittee / resolue',
  `acquittee_par` int,
  `synchronisee` boolean NOT NULL DEFAULT false,
  CONSTRAINT `fk_alerte_astronaute` FOREIGN KEY (`id_astronaute`) REFERENCES `astronaute` (`id_astronaute`),
  CONSTRAINT `fk_alerte_mesure` FOREIGN KEY (`id_mesure`) REFERENCES `mesure` (`id_mesure`),
  CONSTRAINT `fk_alerte_utilisateur` FOREIGN KEY (`acquittee_par`) REFERENCES `utilisateur` (`id_utilisateur`)
) ENGINE=InnoDB;

CREATE TABLE `recommandation` (
  `id_recommandation` varchar(36) PRIMARY KEY COMMENT 'UUID genere cote client (mode hors ligne)',
  `id_alerte` varchar(36) NOT NULL,
  `texte` varchar(255) NOT NULL,
  `type` varchar(30) COMMENT 'repos / hydratation / contact medecin / nouvelle mesure',
  `synchronisee` boolean NOT NULL DEFAULT false,
  CONSTRAINT `fk_recommandation_alerte` FOREIGN KEY (`id_alerte`) REFERENCES `alerte` (`id_alerte`)
) ENGINE=InnoDB;

CREATE TABLE `ressenti` (
  `id_ressenti` varchar(36) PRIMARY KEY COMMENT 'UUID',
  `id_astronaute` int NOT NULL,
  `type` varchar(20) NOT NULL COMMENT 'fatigue / douleur / humeur',
  `niveau` int NOT NULL COMMENT '1 a 5',
  `commentaire` varchar(255),
  `horodatage` datetime NOT NULL,
  `synchronisee` boolean NOT NULL DEFAULT false,
  CONSTRAINT `fk_ressenti_astronaute` FOREIGN KEY (`id_astronaute`) REFERENCES `astronaute` (`id_astronaute`)
) ENGINE=InnoDB;

CREATE TABLE `message_ia` (
  `id_message` varchar(36) PRIMARY KEY COMMENT 'UUID',
  `id_astronaute` int NOT NULL,
  `id_alerte` varchar(36),
  `role_message` varchar(20) NOT NULL COMMENT 'utilisateur / assistant',
  `contenu` text NOT NULL,
  `horodatage` datetime NOT NULL,
  `mode` varchar(20) COMMENT 'IA / secours',
  `synchronisee` boolean NOT NULL DEFAULT false,
  CONSTRAINT `fk_message_ia_astronaute` FOREIGN KEY (`id_astronaute`) REFERENCES `astronaute` (`id_astronaute`),
  CONSTRAINT `fk_message_ia_alerte` FOREIGN KEY (`id_alerte`) REFERENCES `alerte` (`id_alerte`)
) ENGINE=InnoDB;

CREATE TABLE `rapport` (
  `id_rapport` int PRIMARY KEY AUTO_INCREMENT,
  `id_astronaute` int COMMENT 'NULL = rapport equipage',
  `type` varchar(20) NOT NULL COMMENT 'quotidien / hebdomadaire',
  `periode_debut` date,
  `periode_fin` date,
  `contenu` text,
  `date_generation` datetime,
  CONSTRAINT `fk_rapport_astronaute` FOREIGN KEY (`id_astronaute`) REFERENCES `astronaute` (`id_astronaute`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. Paramètres (10 lignes, dont glycémie, humeur, radiations)
-- ------------------------------------------------------------
INSERT INTO `parametre` (`code`, `libelle`, `unite`, `plage_normale_min`, `plage_normale_max`) VALUES
('FC',        'Fréquence cardiaque',         'bpm',        60.00, 100.00),
('SPO2',      'Saturation en oxygène',       '%',          95.00, 100.00),
('TEMP',      'Température corporelle',      '°C',         36.10,  37.20),
('TA',        'Tension artérielle',          'mmHg',       90.00, 120.00),
('FR',        'Fréquence respiratoire',      'resp/min',   12.00,  20.00),
('SOMMEIL',   'Durée de sommeil',            'h',           6.00,   9.00),
('RADIATION', 'Dose de radiations',          'mSv/jour',    0.00,   0.80),
('EXERCICE',  'Durée d''exercice physique',  'min/jour',  120.00, 150.00),
('GLYCEMIE',  'Glycémie',                    'mg/dL',      70.00, 100.00),
('HUMEUR',    'Humeur (score de 1 à 5)',     'score',       3.00,   5.00);

-- ------------------------------------------------------------
-- 3. Seuils par défaut (id_astronaute = NULL), 19 lignes
--    Niveau attention : cahier des charges, tableau 4.
--    Niveau critique et paramètres hors cahier des charges :
--    valeurs indicatives de l'équipe.
--    Tension : seuil_max = systolique, seuil_secondaire_max = diastolique.
-- ------------------------------------------------------------
INSERT INTO `seuil` (`id_parametre`, `id_astronaute`, `seuil_min`, `seuil_max`, `seuil_secondaire_max`, `niveau`, `modifie_par`, `date_modification`)
SELECT p.id_parametre, NULL, s.seuil_min, s.seuil_max, s.seuil_secondaire_max, s.niveau, NULL, NOW()
FROM (
  SELECT 1 AS ord, 'FC' AS code, 50.00 AS seuil_min, 120.00 AS seuil_max, CAST(NULL AS DECIMAL(8,2)) AS seuil_secondaire_max, 'attention' AS niveau
  UNION ALL SELECT  2, 'FC',        40.00, 140.00, NULL, 'critique'
  UNION ALL SELECT  3, 'SPO2',      92.00, 100.00, NULL, 'attention'
  UNION ALL SELECT  4, 'SPO2',      88.00, 100.00, NULL, 'critique'
  UNION ALL SELECT  5, 'TEMP',      35.00,  38.00, NULL, 'attention'
  UNION ALL SELECT  6, 'TEMP',      34.00,  39.00, NULL, 'critique'
  UNION ALL SELECT  7, 'TA',        NULL,  140.00, 90.00,  'attention'
  UNION ALL SELECT  8, 'TA',        NULL,  180.00, 120.00, 'critique'
  UNION ALL SELECT  9, 'FR',        10.00,  25.00, NULL, 'attention'
  UNION ALL SELECT 10, 'FR',         8.00,  30.00, NULL, 'critique'
  UNION ALL SELECT 11, 'SOMMEIL',    5.00,  NULL,  NULL, 'attention'
  UNION ALL SELECT 12, 'SOMMEIL',    4.00,  NULL,  NULL, 'critique'
  UNION ALL SELECT 13, 'RADIATION',  0.00,   1.00, NULL, 'attention'
  UNION ALL SELECT 14, 'RADIATION',  0.00,   2.00, NULL, 'critique'
  UNION ALL SELECT 15, 'EXERCICE',  30.00, 300.00, NULL, 'attention'
  UNION ALL SELECT 16, 'GLYCEMIE',  65.00, 140.00, NULL, 'attention'
  UNION ALL SELECT 17, 'GLYCEMIE',  54.00, 250.00, NULL, 'critique'
  UNION ALL SELECT 18, 'HUMEUR',     2.50,   5.00, NULL, 'attention'
  UNION ALL SELECT 19, 'HUMEUR',     1.50,   5.00, NULL, 'critique'
) AS s
JOIN `parametre` p ON p.code = s.code
ORDER BY s.ord;

-- ------------------------------------------------------------
-- Vérifications (à lancer ensuite) : 12 tables, 17 liens, 10 et 19 lignes
-- SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'astrohealth';
-- SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'astrohealth';
-- SELECT COUNT(*) FROM parametre;
-- SELECT COUNT(*) FROM seuil;
