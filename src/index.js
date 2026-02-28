import express from "express";
import {matchRouter} from './routes/matches.js';
import 'dotenv/config'; 
const port=8000;
const app = express();

app.use(express.json());

app.get('/',(req,res)=>{
    res.send('Hello from express server');
})

app.use('/matches',matchRouter);

app.listen(port,()=>{
    console.log(`Server running at port ${port}`);
})  