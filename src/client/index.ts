import * as socketio from 'socket.io-client';

let socket = socketio();

socket.on('connect', () => console.log('Connected to server!'));