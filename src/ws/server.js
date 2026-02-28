import { WebSocket} from "ws";
import { WebSocketServer } from "ws";

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

    wss.on('connection',(socket)=>{
        sendJson(socket,{type:'welcome'});

        socket.on('error',console.error)
    });
    
    function broadcastMatchCreated(match){
        broadcast(wss,{type:'matchCreated',data:match})
    }
    return {broadcastMatchCreated};

}