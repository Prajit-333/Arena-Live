import {Router} from 'express';
export const commentaryRouter=Router({mergeParams:true});
import {matchIdParamSchema} from '../validation/matches.js';
import {createCommentarySchema,listCommentaryQuerySchema} from '../validation/commentary.js';
import {db} from '../db/db.js';
import {commentary} from '../db/schema.js';
import {desc} from 'drizzle-orm';
import {eq} from 'drizzle-orm';


const MAX_LIMIT=100;
commentaryRouter.get('/',async (req,res)=>{
    const paramsResult=matchIdParamSchema.safeParse(req.params);
    if(!paramsResult.success){
        return res.status(400).json({error:'Invalid match id',details:paramsResult.error.issues});
    }

    const queryResult=listCommentaryQuerySchema.safeParse(req.query);
    if(!queryResult.success){
        return res.status(400).json({error:'Invalid query parameters',details:queryResult.error.issues});
    }
    try{
        const {id:matchId}=paramsResult.data;
        const {limit=10}=queryResult.data;

        const safeLimit=Math.min(limit,MAX_LIMIT);
        const results= await db.select().from(commentary).where(eq(commentary.matchId,matchId)).orderBy(desc(commentary.createdAt)).limit(safeLimit);
        res.json({data:results});

    }catch(error){
        console.error(error);
        return res.status(500).json({error:'Failed to fetch commentary',details:JSON.stringify(error)});
    }
});

commentaryRouter.post("/", async (req, res) => {
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
        return res.status(400).json({
            error: "invalid match id",
            details: paramsResult.error.issues
        });
    }

    const bodyResult = createCommentarySchema.safeParse(req.body);
    if (!bodyResult.success) {
        return res.status(400).json({
            error: "invalid payload",
            details: bodyResult.error.issues
        });
    }

    try {
        const { minutes, ...rest } = bodyResult.data;

        const [result] = await db
            .insert(commentary)
            .values({
                matchId: paramsResult.data.id,
                minutes,
                ...rest
            })
            .returning();

        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(result.matchId, result);
        }

        res.status(201).json({ data: result });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "failed to create commentary",
            details: JSON.stringify(error)
        });
    }
});