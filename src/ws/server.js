import { WebSocket} from "ws";
import { WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket,payload){
    if(socket.readyState===WebSocket.OPEN){
        socket.send(JSON.stringify(payload));
    }
}

function broadcast(wss,payload){
    for(const client of wss.clients){
        if(client.readyState===WebSocket.OPEN){    
            client.send(JSON.stringify(payload));
        }
    }  return;
}

//using the same http server created by the express to act as a websocket server insted of providing new port for the websocket 
export function attachWebSocketServer(server){
    const wss=new WebSocketServer({server,path:'/ws',maxPayload:1024*1024});
    wss.on('connection',async(socket,req)=>{
        if(wsArcjet){
            try{
                const decision=await wsArcjet.protect(req);
                if(decision.isDenied()){
                    const code=decision.reason.isRateLimit()?1013:1008;
                    const reason=decision.reason.isRateLimit()?"Rate limit exceeded":"Access denied";
                    socket.close(code,reason);
                    return;
                }
            }catch(e){
                console.error('Ws connection error');
                socket.close(1011,"server security error");
                return;
            }
        }

        socket.isAlive=true;
        socket.on('pong',()=>{
            socket.isAlive=true;
        });
        sendJson(socket,{type:'welcome'});

        socket.on('error',console.error)
    });

    const interval=setInterval(()=>{
        wss.clients.forEach((client)=>{
            if(client.isAlive===false)return client.terminate();// If they didn't pong back since last time, kill the connection
            client.isAlive=false;// Assume they are dead until they prove otherwise
            client.ping();// Send the Ping
    })},30000);
    
    wss.on('close',()=>{
        clearInterval(interval);
    });

    function broadcastMatchCreated(match){
        broadcast(wss,{type:'matchCreated',data:match})
    }
    return {broadcastMatchCreated};

}