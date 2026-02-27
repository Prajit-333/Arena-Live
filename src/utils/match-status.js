import {MATCH_STATUS} from '../validation/matches';

export function getMatchStatus(startTime, endTime,now=new Date()){
    startTime=new Date(startTime);
    endTime=new Date(endTime);
    now=new Date(now);
    if(startTime > now){
        return MATCH_STATUS.SCHEDULED;
    }
    if(endTime < now){
        return MATCH_STATUS.FINISHED;
    }
    return MATCH_STATUS.LIVE;  
}

