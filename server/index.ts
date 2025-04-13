import { randomUUIDv7 as uuid, type ServerWebSocket } from "bun";
import { type Message, type WebsocketData, Event, Subsciptions } from "./types";

const users = new Map<string, ServerWebSocket<WebsocketData>>();

const server = Bun.serve({
  port: 8080,
  fetch(req, server){
    const data: WebsocketData = {
      socketId: uuid(),
    } 
    const success = server.upgrade(req, { data })
    if (!success) return;
    return new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    async message(ws: ServerWebSocket<WebsocketData>, msg: string) {
      const author = ws.data.socketId;
      let message: Message ;
      try {
        message = JSON.parse(msg.toString());
      } catch(e){
        console.log('Wrong format');
        return;
      }

      switch(message.type){
        case Event.EnterChat: {
          console.log(`${author} entered the chat`);
          return;
        }

        case Event.Broadcast: {
          const newMessage: Message = {
            type: Event.Broadcast,
            payload: {
              author: ws.data.socketId,
              content: message.payload.content,
              createdAt: message.payload.createdAt,
            }
          }
          ws.publish(Subsciptions.Chat, JSON.stringify(newMessage));
          ws.send(JSON.stringify(newMessage));
          return;
        }
      }

    }, 
    async open(ws: ServerWebSocket<WebsocketData>) {
      users.set(ws.data.socketId, ws);
      ws.subscribe(Subsciptions.Chat);
      const author = ws.data.socketId;
      const newMessage: Message = {
        type: Event.EnterChat,
        payload: { author, createdAt: new Date(), self: true }
      }
      ws.send(JSON.stringify(newMessage));
      console.log(`Connection opened and ${ws.data.socketId} subscribed on chat`)
    },

    async close(ws: ServerWebSocket<WebsocketData>, code: number, msg: string) {
      users.delete(ws.data.socketId);
      const message: Message = {
        type: Event.ExitChat,
        payload: {
          content: `${ws.data.socketId} exited the chat`,
          createdAt: new Date(),
          author: ws.data.socketId,
        }
      };
      ws.publish(Subsciptions.Chat, JSON.stringify(message));
    } 
  }
})

console.log(`Listening on ${server.hostname}:${server.port}`);