export enum Event {
  Broadcast="broadcast",
  ExitChat="exit-chat",
  EnterChat="enter-chat"
}

export enum Subsciptions {
  Chat="chat"
}

export interface WebsocketData {
  socketId: string,
}

export interface Message {
  type: Event,
  payload: {
    author?: string,
    content?: string,
    createdAt?: Date,
    self?: boolean
  } 
}