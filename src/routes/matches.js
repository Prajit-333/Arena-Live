import {Router} from 'express';
import {createMatchSchema,listMatchesQuerySchema} from '../validation/matches.js';
import {db} from '../db/db.js';
import {matches} from '../db/schema.js';
import {getMatchStatus} from '../utils/match-status.js';
import {desc} from 'drizzle-orm';

export const matchRouter=Router();

matchRouter.get('/',async (req,res)=>{

    const parsed=listMatchesQuerySchema.safeParse(req.query);
    console.log(parsed);
    if(!parsed.success){
        return res.status(400).json({error:"invalid query",details:JSON.stringify(parsed.error)});
    }
    const limit=parsed.data.limit;

    try{
        const data=await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit);
        res.json({data});
    }catch(e){
        res.status(500).json({error:"failed to fetch matches",details:JSON.stringify(e)});
    }
});

matchRouter.post('/',async (req,res)=>{
    const parsed=createMatchSchema.safeParse(req.body);
    console.log(parsed);
    if(!parsed.success){
        return res.status(400).json({error:"invalid payload ",details:JSON.stringify(parsed.error)});
    }
    try{
        const matchData={...parsed.data,matchStatus:getMatchStatus(parsed.data.startTime,parsed.data.endTime)};
        const [event]= await db.insert(matches).values(matchData).returning();
        res.status(201).json({data:event});

    }catch(error){
        console.error(error);
        return res.status(500).json({error:"failed to create match",details:JSON.stringify(error)});
    }
}); 