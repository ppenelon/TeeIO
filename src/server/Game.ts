import * as P2 from 'p2';
import { Socket } from 'socket.io';

import Game from '../shared/game/Game';
import Player from '../shared/game/Player';

const GameLoop = require('node-gameloop');

export default class ServerGame{

    game: Game;
    gameloop: number;

    players: { player: Player, socket: Socket }[];

    constructor(ticksPerSeconds: number){
        this.game = new Game(true);
        this.gameloop = GameLoop.setGameLoop((delta: number) => this.update(delta), 1000 / ticksPerSeconds);
        this.players = [];
    }

    update(delta: number){
        this.game.updateWorld(delta);
    }

    addPlayer(socket: Socket){
        let player = new Player({ x: 100, y: 100}, true);
        this.players.push({
            player: player,
            socket: socket
        });
        this.game.addPlayer(player);
        socket.emit('JOINED');
    }
}