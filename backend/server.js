import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import parametresRouter from './routes/parametres.js';
import astronautesRouter from './routes/astronautes.js';
import alertesRouter from './routes/alertes.js';
import mesuresRouter from './routes/mesures.js';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import assistantRouter from './routes/assistant.js';
import simulateurRouter from './routes/simulateur.js';

dotenv.config();
const app = express();



const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
app.set('io', io);




//middlewares before all routes 
app.use(cors());
app.use(express.json());


app.use('/api/parametres' , parametresRouter);
app.use('/api/astronautes', astronautesRouter);
app.use ('/api/alertes' , alertesRouter);
app.use('/api/mesures', mesuresRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/simulateur', simulateurRouter);
//test route 
app.get('/' , (req, res)=>{
    res.send('astrohealth API is running!');
});

// start server (app)
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});

