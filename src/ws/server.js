import { WebSocket} from "ws";
import { WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const matchSubscribers=new Map();

function subscribe(matchId,socket){
    if(!matchSubscribers.has(matchId)){
        matchSubscribers.set(matchId,new Set());
    }
    matchSubscribers.get(matchId).add(socket);
    return () => {
        matchSubscribers.get(matchId).delete(socket);
        if(matchSubscribers.get(matchId).size===0){
            matchSubscribers.delete(matchId);
        }
    }
}
function unsubscribe(matchId,socket){
    const subscribers=matchSubscribers.get(matchId);
    if(!subscribers) return;
    subscribers.delete(socket);
    if(subscribers.size===0){
        matchSubscribers.delete(matchId);
    }

}

function cleanupSubscriptions(socket){
    const subscriptions=socket.subscriptions||[];
    for(const matchId of subscriptions){
        unsubscribe(matchId,socket);
    }
    socket.subscriptions=null;
}

function sendJson(socket,payload){
    if(socket.readyState===WebSocket.OPEN){
        socket.send(JSON.stringify(payload));
    }
}

function broadcastToAll(wss,payload){
    for(const client of wss.clients){
        if(client.readyState===WebSocket.OPEN){    
            client.send(JSON.stringify(payload));
        }
    }  return;
}
function broadcastToMatch(matchId,payload){
    const subscribers=matchSubscribers.get(matchId);
    if(!subscribers || subscribers.size===0) return;

    const message=JSON.stringify(payload);
    for(const client of subscribers){
        if(client.readyState===WebSocket.OPEN){
            client.send(message);
        }
    }
}

function handleMessage(socket,data){
    let message;
    try{
        message=JSON.parse(data.toString());
        if(message?.type==="subscribe" && Number.isInteger(message.matchId)){
            subscribe(message.matchId,socket);
            socket.subscriptions.add(message.matchId);
            sendJson(socket,{type:'subscribed',matchId:message.matchId});
            return;
        }
        if(message?.type==="unsubscribe" && Number.isInteger(message.matchId)){
            unsubscribe(message.matchId,socket);
            socket.subscriptions.delete(message.matchId);
            sendJson(socket,{type:'unsubscribed',matchId:message.matchId});
            return;
        }

    }catch(error){
        sendJson(socket,{type:'error',message:'Invalid JSON'});
    }
}

//using the same http server created by the express to act as a websocket server insted of providing new port for the websocket 
export function attachWebSocketServer(server){
    const wss=new WebSocketServer({server,path:'/ws',maxPayload:1024*1024});
    wss.on('connection',async(socket,req)=>{
        
        socket.isAlive=true;
        socket.on('pong',()=>{
            socket.isAlive=true;
        });

        socket.subscriptions=new Set();
        socket.on('message',(data)=>handleMessage(socket,data));
        socket.on('close',()=>{
            cleanupSubscriptions(socket);
        });

        sendJson(socket,{type:'Welcome'});

        socket.on('error',()=>{
            socket.terminate();
        });
        socket.on('close',()=>{
            cleanupSubscriptions(socket);
        });
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
        broadcastToAll(wss,{type:'matchCreated',data:match})
    }


    function broadcastCommentary(matchId,comment){
        broadcastToMatch(matchId,{type:'commentary',data:comment});
    }
    return {broadcastMatchCreated,broadcastCommentary};

}