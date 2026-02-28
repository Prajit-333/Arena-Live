import express from "express";
import {matchRouter} from './routes/matches.js';
import 'dotenv/config'; 
import http from 'http';
import { attachWebSocketServer } from "../ws/server.js";

const port=8000;
const app = express();

const server=http.createServer(app);

const {broadcastMatchCreated}=attachWebSocketServer(server);
app.locals.broadcastMatchCreated=broadcastMatchCreated;


app.use(express.json());

app.get('/',(req,res)=>{
    res.send('Hello from express server');
})

app.use('/matches',matchRouter);

server.listen(port,()=>{//changed to server.listen
    console.log(`Server running at port ${port}`);
})  
