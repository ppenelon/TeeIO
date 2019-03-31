import * as socketio from 'socket.io-client';
import ClientGame from './Game';

let socket = socketio();

socket.on('connect', () => console.log('Connected to server!'));
socket.on('JOINED', () => console.log('Room joined !'));

new ClientGame();