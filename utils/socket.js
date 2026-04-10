import { Server } from 'socket.io';
import Chat from '../models/Chat.js';

const onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) onlineUsers.set(userId, socket.id);

    socket.on('join_chat', (chatId) => socket.join(chatId));

    socket.on('send_message', async ({ chatId, senderId, text }) => {
      const chat = await Chat.findById(chatId);
      if (!chat) return;
      const msg = { sender: senderId, text, isRead: false };
      chat.messages.push(msg);
      chat.lastMessage = text;
      chat.lastMessageAt = new Date();
      await chat.save();
      io.to(chatId).emit('receive_message', { chatId, message: msg });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
    });
  });

  return io;
};

export const getOnlineUsers = () => onlineUsers;
