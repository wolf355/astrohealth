import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import parametresRouter from './routes/parametres.js';
import astronautesRouter from './routes/astronautes.js';
import alertesRouter from './routes/alertes.js';
import mesuresRouter from './routes/mesures.js';
import assistantRouter from './routes/assistant.js';


dotenv.config();
const app = express();

//middlewares before all routes 
app.use(cors());
app.use(express.json());


app.use('/api/parametres' , parametresRouter);
app.use('/api/astronautes', astronautesRouter);
app.use ('/api/alertes' , alertesRouter);
app.use('/api/mesures', mesuresRouter);
app.use('/api/assistant', assistantRouter);
//test route 
app.get('/' , (req, res)=>{
    res.send('astrohealth API is running!');
});

// start server (app)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>{
    console.log(`server running on port ${PORT}`);
});

