import * as Phaser from 'phaser';
import * as P2 from 'p2';

import Map from './Map';
import Player from '../shared/game/Player';
import Game from '../shared/game/Game';
import Materials from '../shared/game/Materials';

const COLLISIONS = {
    WALL: 1 << 0,
    PLAYER: 1 << 1
}

const CONSTANTS = {
    BOMB: [[0, 0], [1, 0], ...[1/4, 2/4, 3/4].map(factor => [Math.cos(factor * (Math.PI /2)), Math.sin(factor * (Math.PI /2))]) , [0, 1]] as [number, number][],
    CURVE: [[0, 0], [1, 0], ...[3/4, 2/4, 1/4].map(factor => [1 + Math.cos(Math.PI + (factor * (Math.PI / 2))), 1 + Math.sin(Math.PI + (factor * (Math.PI / 2)))]), [0, 1]] as [number, number][],
}

type Key = Phaser.Input.Keyboard.Key;

const Vector2 = Phaser.Math.Vector2;
type Vector2 = Phaser.Math.Vector2;

export default class ClientGame{

    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    map: Map;

    phaser: Phaser.Game;
    player: Player;
    game: Game;

    keys: {
        left: Key;
        right: Key;
        jump: Key;
    }

    constructor(){
        // Game
        let that = this;
        this.phaser = new Phaser.Game({
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            scene: {
                preload: function(){ that.preload.call(this, that) },
                create: function(){ that.create.call(this, that) },
                update: function(time: number, delta: number){ that.update.call(this, that, time, delta) }
            },
            banner: true
        });
        // Framework
        this.game = new Game(true);
        this.player = new Player({ x: 100, y: 100 }, true);
        this.game.addPlayer(this.player);
        // Map
        let wallShapeCollision = { collisionGroup: COLLISIONS.WALL, collisionMask: COLLISIONS.PLAYER };
        Map.fromWeb('map1')
        .then(map => {
            let tileSize = new Vector2(map.tileSize.x, map.tileSize.y);
            map.data.forEach((d, i) => {
                let tilePosition = new Vector2(
                    (i % map.mapSize.x) * tileSize.x + (tileSize.x / 2),
                    Math.floor(i / map.mapSize.x) * tileSize.y + (tileSize.y / 2)
                );
                let shape: P2.Shape;
                let vertices: [number, number][] = null;
                switch(d){
                    case 1: // BOX
                        shape = new P2.Box({ width: tileSize.x, height: tileSize.y, ...wallShapeCollision });
                        break;
                    case 2: // BOMB - TOP - RIGHT
                        vertices = CONSTANTS.BOMB.map(v => [v[0], -v[1]]) as [number, number][];
                        tilePosition.x -= tileSize.x / 2;
                        tilePosition.y += tileSize.y / 2;
                        break;
                    case 3: // BOMB - BOTTOM - RIGHT
                        vertices = CONSTANTS.BOMB.map(v => [v[0], v[1]]) as [number, number][];
                        tilePosition.x -= tileSize.x / 2;
                        tilePosition.y -= tileSize.y / 2;
                        break;
                    case 4: // BOMB - BOTTOM - LEFT
                        vertices = CONSTANTS.BOMB.map(v => [-v[0], v[1]]) as [number, number][];
                        tilePosition.x += tileSize.x / 2;
                        tilePosition.y -= tileSize.y / 2;
                        break;
                    case 5: // BOMB - TOP - LEFT
                        vertices = CONSTANTS.BOMB.map(v => [-v[0], -v[1]]) as [number, number][];
                        tilePosition.x += tileSize.x / 2;
                        tilePosition.y += tileSize.y / 2;
                        break;
                    case 6: // CURVE - TOP - RIGHT
                        vertices = CONSTANTS.CURVE.map(v => [v[0], -v[1]]) as [number, number][];
                        tilePosition.x -= tileSize.x / 2;
                        tilePosition.y += tileSize.y / 2;
                        break;
                    case 7: // CURVE - BOTTOM - RIGHT
                        vertices = CONSTANTS.CURVE.map(v => [v[0], v[1]]) as [number, number][];
                        tilePosition.x -= tileSize.x / 2;
                        tilePosition.y -= tileSize.y / 2;
                        break;
                    case 8: // CURVE - BOTTOM - LEFT
                        vertices = CONSTANTS.CURVE.map(v => [-v[0], v[1]]) as [number, number][];
                        tilePosition.x += tileSize.x / 2;
                        tilePosition.y -= tileSize.y / 2;
                        break;
                    case 9: // CURVE - TOP - LEFT
                        vertices = CONSTANTS.CURVE.map(v => [-v[0], -v[1]]) as [number, number][];
                        tilePosition.x += tileSize.x / 2;
                        tilePosition.y += tileSize.y / 2;
                        break;
                    default: // EMPTY
                        return;
                }
                let body = new P2.Body({ position: [tilePosition.x, tilePosition.y] });
                if(vertices){
                    vertices = vertices.map(v => [v[0] * tileSize.x, v[1] * tileSize.y]) as [number, number][];
                    body.fromPolygon(vertices);
                    body.shapes.map(s => {
                        s.material = Materials.WALL;
                        s.collisionGroup = COLLISIONS.WALL;
                        s.collisionMask = COLLISIONS.PLAYER;
                    });
                }
                else if(shape){
                    shape.material = Materials.WALL;
                    body.addShape(shape);
                }
                this.game.world.addBody(body);
            });
            this.map = map;
        });
    }

    private preload(this: Phaser.Scene, game: ClientGame){
        this.game.canvas.oncontextmenu = () => false;
    }

    private create(this: Phaser.Scene, game: ClientGame){
        game.keys = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        }
        game.graphics = this.add.graphics();
        game.text = this.add.text(20, this.game.canvas.height - 35, 'Loading map...');
    }

    tilemapLoadingState: number;
    skinLoadingState: number;
    loaderInitialized: boolean;
    playerSprite: Phaser.GameObjects.Sprite;
    private update(this: Phaser.Scene, game: ClientGame, time: number, delta: number){
        // Check if map loaded
        if(game.map && game.text){
            game.text.destroy()
            game.text = null;
        }
        if(game.text) return;

        // Loader
        if(game.tilemapLoadingState === undefined) game.tilemapLoadingState = 0;
        if(game.tilemapLoadingState === 0){
            this.load.spritesheet('tilemap', '/assets/sprites/tilemap.png', { frameWidth: 50, frameHeight: 50 });
            game.tilemapLoadingState = 1;
        }

        // Skin
        if(game.skinLoadingState === undefined) game.skinLoadingState = 0;
        if(game.skinLoadingState === 0){
            this.load.image('skin', '/assets/sprites/skin.png');
            game.skinLoadingState = 1;
        }        

        // Loader (Nécessaire pour le chargement dynamique des textures)
        if(game.loaderInitialized === undefined) game.loaderInitialized = false;
        if(!game.loaderInitialized){
            this.load.addListener(Phaser.Loader.Events.FILE_COMPLETE, (key: string, type: string, ressource: Phaser.Textures.Texture) => {
                if(key === 'tilemap'){ 
                    for(let y = 0; y < game.map.mapSize.y; y++){
                        for(let x = 0; x < game.map.mapSize.x; x++){
                            let tile = game.map.getTile(x, y);
                            if(tile === 0) continue;
                            this.add.sprite((x * 50) + 25, (y * 50) + 25, 'tilemap', tile - 1);
                        }
                    }
                    game.tilemapLoadingState = 2;
                }
                else if(key === 'skin'){
                    game.playerSprite = this.add.sprite(game.player.body.position[0], game.player.body.position[1], 'skin');
                    game.skinLoadingState = 2;
                }
            });
            this.load.start();
            game.loaderInitialized = true;
        }

        /**
         * LOGIC
         */
        // Player controls
        game.player.controller = {
            buttons: (
                (game.keys.left.isDown ? 1 << 0 : 0) +
                (game.keys.right.isDown ? 1 << 1 : 0) +
                (game.keys.jump.isDown ? 1 << 2 : 0) +
                ((this.input.activePointer.buttons >> 1) === 1 % 2 ? 1 << 3 : 0)
            ),
            mouseDirection: game.phaser.input.mousePointer.position.clone().subtract(new Vector2(game.player.body.position[0], game.player.body.position[1])).normalize()
        }

        // World update (logic + physic)
        game.game.updateWorld(delta);

        /**
         * DRAW
         */
        // Clear
        game.graphics.clear();
        this.cameras.main.setBackgroundColor(0xE7E7E7);
        // Hook
        let hook = game.player.hook;
        if(hook.hit){
            game.graphics.fillStyle(0x00FFFF);
            game.graphics.fillCircle(hook.hit.x, hook.hit.y, 5);
        }
        if(hook.fired && !hook.recalled){
            game.graphics.lineStyle(2, 0x000000);
            game.graphics.lineBetween(
                game.player.body.position[0],
                game.player.body.position[1],
                (hook.hit && hook.hit.x) || hook.position.x,
                (hook.hit && hook.hit.y) || hook.position.y
            );
        }
        // Draw physic bodies
        game.game.world.bodies.forEach(b => {
            b.shapes.forEach(s => {
                // On met à jour la couleur de la forme en fonction de son groupe
                if(s.collisionGroup === COLLISIONS.WALL){
                    game.graphics.fillStyle(0x7E7E7E);
                }
                else if(s.collisionGroup === COLLISIONS.PLAYER){
                    game.graphics.fillStyle(0xFF0000);
                }
                // Dessin de la forme
                if(s instanceof P2.Circle){
                    game.graphics.fillCircle(b.position[0], b.position[1], s.radius);
                }
                else if(s instanceof P2.Box){
                    game.graphics.fillRect(b.position[0] - (s.width / 2), b.position[1] - (s.height / 2), s.width, s.height);
                }
                else if(s instanceof P2.Convex){
                    game.graphics.beginPath();
                    s.vertices.forEach((v, i) => {
                        if(i === 0)
                            game.graphics.moveTo(b.position[0] + s.position[0] + v[0], b.position[1] + s.position[1] + v[1]);
                        else
                            game.graphics.lineTo(b.position[0] + s.position[0] + v[0], b.position[1] + s.position[1] + v[1]);
                    });
                    game.graphics.closePath();
                    game.graphics.fillPath();
                }
            });
        });
        // Skin update
        if(game.skinLoadingState === 2){
            game.playerSprite.x = game.player.body.position[0];
            game.playerSprite.y = game.player.body.position[1];
        }
    }
}