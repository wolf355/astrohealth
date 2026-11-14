# AstroHealth

**Health monitoring and AI assistant for astronauts on space missions.**
Project of team **OrionX** for the NASA Space Apps Challenge 2026 (Ben Guerir), challenge: *Create Health Monitoring Software for Astronauts on Space Missions*.

> AstroHealth is a prototype. It is **not a medical device**. All data in this repository is simulated, and the alert thresholds are indicative and must be validated by medical professionals.

---

## What it does

Astronauts on long missions are far from hospitals, and the link with Earth can be delayed or cut. AstroHealth gives:

- **Astronauts** a personal dashboard: current vital signs with a clear status, charts with the normal range, an active alert banner, a simple recommendation, and a chat with an AI assistant.
- **The ground doctor** a crew overview (status of each astronaut), a table of active alerts, a trends chart with one line per astronaut, and a History page (filter by astronaut, parameter and period).
- **Automatic alerts:** when a measurement crosses a threshold, the server creates an alert (attention or critical).
- **An AI assistant** that explains measurements and alerts in plain language. It never gives a diagnosis, it receives **no personal data** (no name, e-mail or age), and a warning is always shown. If the AI service is unavailable, a fallback mode answers with predefined messages so the application never breaks.

The screens refresh automatically every 5 seconds.

## Tech stack

| Part | Technology |
|---|---|
| Front-end | Angular, Chart.js |
| Back-end | Node.js, Express (REST API) |
| Database | MySQL / MariaDB (12 tables) |
| AI assistant | Language model called from the server (any OpenAI-compatible API) |
| Design | Figma |

## Repository structure

```
astrohealth/
├── backend/     Node.js + Express API (port 3000)
├── frontend/    Angular application (port 4200)
├── database/    SQL scripts and example JSON
└── docs/        Specifications and design documents
```

## Run it locally

### 1. Requirements

- [Node.js](https://nodejs.org) (LTS version)
- [XAMPP](https://www.apachefriends.org) (Apache and MySQL/MariaDB)
- Angular CLI: `npm install -g @angular/cli`
- Git

### 2. Database

1. Open XAMPP and start **Apache** and **MySQL**.
2. Open http://localhost/phpmyadmin.
3. Without selecting any database, click **Import** and import `database/astrohealth_base_complete.sql`. It creates the `astrohealth` database, the 12 tables, the 10 parameters and the 19 default thresholds.
4. Click the `astrohealth` database, then **Import** and import `database/donnees_demo.sql`. It adds the demo mission, 4 astronauts, measurements, alerts and messages. You can run it again at any time to reset the demo data.

### 3. Back-end

```
cd backend
copy .env.example .env
npm install
npm start
```

The server starts on http://localhost:3000. You should see `server running on port 3000` and `connected to astrohealth database!`.

The default `.env` values work with XAMPP:

```
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=astrohealth
```

**AI assistant (optional):** to use a real language model, set `AI_API_KEY` (and, if needed, `AI_MODEL` and `AI_API_URL`) in your `.env` file. Never commit this file. Without a key, the assistant answers in **fallback mode**.

### 4. Front-end

In a second terminal:

```
cd frontend
npm install
ng serve
```

Open http://localhost:4200.

### 5. Try it

1. Choose **Astronaut** to see the personal dashboard. The demo data contains an active SpO2 alert for the astronaut shown.
2. Open the chat (💬) and ask: *What is happening with my oxygen level?*
3. Go back and choose **Ground Doctor** to see the crew overview, the active alerts, and the History page.
4. To trigger a new alert, send a critical SpO2 value for another astronaut (PowerShell example, change `id_mesure` each time):

```
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/mesures -ContentType 'application/json' -Body '{"id_mesure":"demo-0001","id_astronaute":3,"id_parametre":2,"valeur":86,"horodatage":"2026-11-07 16:00:00","source":"simulateur"}'
```

Within 5 seconds the doctor view shows a new critical alert.

## API overview

| Method | Route | Description |
|---|---|---|
| GET | `/api/parametres` | List of monitored parameters with units and normal ranges |
| GET | `/api/astronautes` | List of astronauts |
| GET | `/api/astronautes/:id/mesures/latest` | Latest value of each parameter |
| GET | `/api/astronautes/:id/mesures?parametre=FC&debut=...&fin=...` | Measurements of one parameter over a period |
| POST | `/api/mesures` | Record a measurement (creates an alert if a threshold is crossed) |
| GET | `/api/alertes?statut=active` | Alerts, optionally filtered by status |
| POST | `/api/assistant/chat` | Ask the AI assistant a question |
| GET | `/api/assistant/historique?id_astronaute=1` | Conversation history of an astronaut |

The full specification is in the `docs` folder.

## Data and sources

- **Measurements are simulated.** No real astronaut data is used.
- Normal ranges and alert thresholds are indicative values chosen by the team. 
- The parameters AstroHealth monitors are organized around NASA's Human Research Program framework of the five hazards of human spaceflight (see docs/sources-nasa.md), with the Canadian Space Agency's work on radiation monitoring as additional motivation.

## Use of AI

- **In the product:** the assistant uses a language model to explain measurements and alerts. It receives only anonymous measurements, never gives a diagnosis, and shows a permanent warning.


## Limitations and next steps

- Replace simulated data with real wearable sensors.
- Full offline mode with automatic synchronization when the link with Earth returns.
- Real-time push updates (instead of a 5-second refresh).
- An onboard AI model that works without an Internet connection.
- Personal baselines per astronaut and weekly summaries for the medical team.
- Validation of thresholds with medical professionals.

## Team OrionX

ABBOU Aimrane (Team Owner), Sara Sedki,hajar en-neyah , hicham imlahi , Hamza Koujili
