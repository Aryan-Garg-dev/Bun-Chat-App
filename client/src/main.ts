import { type Message, Event } from "./types";

const element = {
  id : (id: string) => document.getElementById(id),
}

const sendButton = element.id("send-message") as (HTMLButtonElement | null);
const messageInput = element.id("message-input") as (HTMLInputElement | null);
const chatList = element.id("chat-list");
const bottom = element.id("bottom");

const socket = new WebSocket("ws://localhost:8080");

interface Chat {
  content: string,
  author: string,
  createdAt: string,
}

let userId: string;
let chats: Chat[] = [];

const scrollToBottom = () => {
  bottom?.scrollIntoView({ behavior: "smooth" });
};

const addChat = (chat: Chat)=>{
  if (!chat.author) return;
  const mine = chat.author === userId;
  console.log(mine);
  
  const chatBubble = document.createElement("div");
  chatBubble.classList.add(mine ? "chat-bubble" : "chat-bubble-others");
  
  const chatMessage = document.createElement("div");
  chatMessage.classList.add("chat-msg");
  chatMessage.textContent = chat.content;
  
  const chatTime = document.createElement("div");
  chatTime.classList.add("chat-time");
  chatTime.textContent = chat.createdAt;

  chatBubble.appendChild(chatMessage);
  chatBubble.appendChild(chatTime);
  chatList?.appendChild(chatBubble);

  requestAnimationFrame(() => {
    scrollToBottom();
  });
}

const disableSendButton = ()=>{
  if (!sendButton) return;
  const msg = messageInput?.value;
  if (!msg) sendButton.disabled = true;
  else sendButton.disabled = false;
}

messageInput?.addEventListener("input", disableSendButton);
messageInput?.addEventListener("change", disableSendButton);
messageInput?.addEventListener("blur", disableSendButton);
window?.addEventListener("DOMContentLoaded", ()=>messageInput?.focus())

socket.addEventListener("open", (event)=>{
  const enterChatMessage: Message = {
    type: Event.EnterChat,
    payload: {}
  }
  socket.send(JSON.stringify(enterChatMessage));

  const sendMessage = ()=>{
    const msg = messageInput?.value;
    if (!msg || !userId) return;
    if (sendButton?.disabled) return;
    const now = new Date();
    const message: Message = {
      type: Event.Broadcast,
      payload: {
        content: msg,
        createdAt: now,
      }
    }
    socket.send(JSON.stringify(message));
    messageInput.value = "";
  }

  window.addEventListener('keydown', (event)=>{
    if (event.key === "Enter"){
      event.preventDefault();
      sendMessage();
    } 
  })

  sendButton?.addEventListener('click', sendMessage);
})

socket.addEventListener("message", (event)=>{
  const msg = event.data;
  let message: Message;

  try {
    message = JSON.parse(msg);
  } catch(e){
    console.error("Wrong format");
    return;
  }

  switch(message.type){
    case Event.EnterChat: {
      if (message.payload.author && message.payload.self){
        userId = message.payload.author;
        console.log(`${userId} joined the chat`);
      } 
      break;
    }

    case Event.Broadcast: {
      if (message.payload.author && message.payload.content && message.payload.createdAt){
        const chat: Chat = {
          author: message.payload.author,
          content: message.payload.content,
          createdAt: new Date(message.payload.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }),
        }
        console.log({
          chatAuthorId: chat.author,
          userId,
        })
        chats.push(chat);
        addChat(chat);
      }
      break;
    }

    case Event.ExitChat: {
      if (message.payload.author){
        userId = message.payload.author;
        console.log(`${userId} left the chat`);
      } 
      break;
    }
  }
})

socket.addEventListener("close", (event)=>{
  console.log('Server connection closed');
})




