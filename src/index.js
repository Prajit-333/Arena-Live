import express from "express";
import {matchRouter} from './routes/matches.js';
import {commentaryRouter} from './routes/commentary.js';
import 'dotenv/config'; 
import http from 'http';
import { attachWebSocketServer } from "../src/ws/server.js";
import { securityMiddleware } from "./arcjet.js";

const port=8000;
const app = express();

const server=http.createServer(app);

const {broadcastMatchCreated,broadcastCommentary}=attachWebSocketServer(server);
app.locals.broadcastMatchCreated=broadcastMatchCreated;
app.locals.broadcastCommentary=broadcastCommentary;

//app.use(securityMiddleware);
app.use(express.json());

app.get('/',(req,res)=>{
    res.send('Hello from express server');
})

app.use('/matches',matchRouter);
app.use('/matches/:id/commentary',commentaryRouter);

server.listen(port,()=>{//changed to server.listen
    console.log(`Server running at port ${port}`);
})  
