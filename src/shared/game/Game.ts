import * as P2 from 'p2';
import Player from './Player';
import Map from './Map';
import Materials from './Materials';

export default class Game{

    isServer: boolean;
    world: P2.World;
    players: Player[];
    map: Map;

    // Todo, options qui indique si on charge la map (json + tilemap) asynchronement
    constructor(isServer: boolean){
        this.isServer = isServer;
        this.world = new P2.World({ gravity: [0, 9.81] });
        this.setMaterials();
        this.players = [];
        this.map = new Map();
    }

    private setMaterials(){
        this.world.addContactMaterial(new P2.ContactMaterial(Materials.PLAYER, Materials.WALL, {
            friction: 0.75,
            restitution: 0.05
        }));
    }

    addPlayer(player: Player){
        this.world.addBody(player.body);
        this.players.push(player);
    }

    updateWorld(delta: number){
        // Logic
        this.players.forEach(player => player.update(delta));
        // Physics
        this.world.step(1 / 60, delta, 10);
    }
}