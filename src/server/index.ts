import * as express from 'express';
import * as socketio from 'socket.io';
import { createServer } from 'http';
import * as path from 'path';

import { SERVER_PORT, SERVER_HOST } from './config';
import ServerGame from './Game';

const app = express();
const http = createServer(app);
const io = socketio(http);

app.use(express.static(path.resolve('public')));
app.use('/assets', express.static(path.resolve('assets')));

app.get('/*', (req, res) => {
    res.sendFile(path.resolve('public/index.html'));
});

const game = new ServerGame(60);

io.on('connection', (socket) => {
    console.log('User connected');
    game.addPlayer(socket);
});

http.listen({
    host: SERVER_HOST,
    port: SERVER_PORT
}, () => {
    console.log(`Server listening at http://${SERVER_HOST}:${SERVER_PORT}`);
});