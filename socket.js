// socket.js
const { Server } = require('socket.io');

let io;
const userSockets = new Map();

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.URL_CLIENT,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        socket.on('user_connected', (userId) => {
            userSockets.set(userId, socket.id);
            console.log('User connected:', userId);
        });

        socket.on('disconnect', () => {
            for (let [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log('User disconnected:', userId);
                    break;
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const getUserSockets = () => userSockets;

module.exports = { initializeSocket, getIO, getUserSockets };