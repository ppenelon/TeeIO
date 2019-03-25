import * as socketio from 'socket.io-client';
import Game from './game';

let socket = socketio();

socket.on('connect', () => console.log('Connected to server!'));

new Game();