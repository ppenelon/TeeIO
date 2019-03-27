import * as Phaser from 'phaser';
import * as P2 from 'p2';

import Vector2 from '../shared/Vector2';
import Map from './Map';

const COLLISIONS = {
    WALL: 1 << 0,
    PLAYER: 1 << 1
}

export default class Game{

    game: Phaser.Game;
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    map: Map;

    world: P2.World;
    player: P2.Body;

    hook: Hook;

    constructor(){
        let that = this;
        this.game = new Phaser.Game({
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
        // Physics
        this.world = new P2.World({ gravity: [0, 9.81] });
        let wallMaterial = new P2.Material();
        let playerMaterial = new P2.Material();
        this.world.addContactMaterial(new P2.ContactMaterial(playerMaterial, wallMaterial, {
            restitution: .1
        }));
        this.player = new P2.Body({ mass: 5, position: [155, 150] });
        let circleShape = new P2.Circle({ radius: 15, collisionGroup: COLLISIONS.PLAYER, collisionMask: COLLISIONS.WALL });
        circleShape.material = playerMaterial;
        this.player.addShape(circleShape);
        this.world.addBody(this.player);
        // Map creation
        Map.fromWeb('map1')
        .then(map => {
            let tile = new Vector2(this.game.canvas.width / map.size.x, this.game.canvas.height / map.size.y);
            map.data.forEach((d, i) => {
                let shape: P2.Shape;
                let x: number, y: number;
                let wallShapeCollision = { collisionGroup: COLLISIONS.WALL, collisionMask: COLLISIONS.PLAYER };
                switch(d){
                    case 1: // CIRCLE
                        x = (i % map.size.x) * tile.x + (tile.x / 2);
                        y = Math.floor(i / map.size.x) * tile.y + (tile.y / 2);
                        shape = new P2.Circle({ radius: tile.x / 2, ...wallShapeCollision });
                        break;
                    case 2: // SQUARE
                        x = (i % map.size.x) * tile.x + (tile.x / 2);
                        y = Math.floor(i / map.size.x) * tile.y + (tile.y / 2);
                        shape = new P2.Box({ width: tile.x, height: tile.y, ...wallShapeCollision });
                        break;
                    default: // EMPTY
                        return;
                }
                shape.material = wallMaterial;
                let body = new P2.Body({ position: [x, y] });
                body.addShape(shape);
                this.world.addBody(body);
            });
            this.map = map;
        });
        // Other
        this.hook = new Hook(1750, 175);
    }

    private preload(this: Phaser.Scene, game: Game){
        this.game.canvas.oncontextmenu = () => false;
    }

    private create(this: Phaser.Scene, game: Game){
        game.graphics = this.add.graphics();
        game.text = this.add.text(20, this.game.canvas.height - 35, 'Loading map...');
    }

    private update(this: Phaser.Scene, game: Game, time: number, delta: number){
        // Check if map loaded
        if(game.map && game.text){
            game.text.destroy()
            game.text = null;
        }
        if(game.text) return;
        /**
         * LOGIC
         */
        let mouse = getMouseClicks(this.input.activePointer.buttons);
        if(mouse.right.up){
            if(!game.hook.fired || (game.hook.fired && !game.hook.recalled && !game.hook.hit)){
                // Si c'est un nouveau tir, on déclenche le grappin
                if(!game.hook.fired){
                    // Calcul de la nouvelle direction du grappin
                    game.hook.direction.setFromObject(
                        this.game.input.mousePointer.position.clone()
                        .subtract(new Vector2(game.player.position[0], game.player.position[1]))
                        .normalize()
                    );
                    // Déclenchement du grappin
                    game.hook.fired = true;
                    // On lui attribue la position du joueur
                    game.hook.position.setFromObject(new Vector2(game.player.position[0], game.player.position[1]));
                }
                // On sauvegarde son ancienne position pour savoir si le mouvement a touché quelque chose
                let oldPosition = game.hook.position.clone();
                // Mise à jour de la position du grappin
                game.hook.position = game.hook.position.add(
                    game.hook.direction.clone()
                    .multiply(
                        new Vector2(game.hook.speed, game.hook.speed)
                        .multiply(new Vector2(delta / 1000))
                    )
                );
                // Création du nouveau Raycast
                let hookRay = new P2.Ray({
                    mode: P2.Ray.CLOSEST,
                    from: [oldPosition.x, oldPosition.y],
                    to: [game.hook.position.x, game.hook.position.y],
                    collisionMask: COLLISIONS.WALL
                });
                // Résultat du Raycast
                let rayResult = new P2.RaycastResult();
                let hasHit = game.world.raycast(rayResult, hookRay);
                // Si ça a touché quelque chose
                if(hasHit){
                    let point: [number, number] = [0, 0];
                    rayResult.getHitPoint(point, hookRay);
                    game.hook.hit = new Vector2(point[0], point[1]);
                }
                else{ // Si ça n'a pas touché on regarde si le grappin n'est pas allé trop loin
                    let distancePlayerHook = new Vector2(game.player.position[0], game.player.position[1]).distance(game.hook.position);
                    if(distancePlayerHook >= game.hook.maxDistance){
                        // On rappelle le grappin
                        game.hook.recalled = true;
                    }
                }
            }
            // Si on a touché quelque chose
            if(game.hook.hit){
                let direction = new Vector2(game.hook.hit.x, game.hook.hit.y).subtract(new Vector2(game.player.position[0], game.player.position[1])).normalize();
                let force = 28;
                let move = direction.multiply(new Vector2(force, force));
                game.player.applyImpulse([move.x, move.y]);
            }
        }
        else if(mouse.right.released){
            game.hook.reset();
        }

        /**
         * PHYSICS
         */
        game.world.step(1 / 60, delta, 10);

        /**
         * DRAW
         */
        game.graphics.clear();
        this.cameras.main.setBackgroundColor(0xE7E7E7);
        // Hook
        if(game.hook.hit){
            game.graphics.fillStyle(0x00FFFF);
            game.graphics.fillCircle(game.hook.hit.x, game.hook.hit.y, 5);
        }
        if(game.hook.fired && !game.hook.recalled){
            game.graphics.lineStyle(2, 0x000000);
            game.graphics.lineBetween(
                game.player.position[0],
                game.player.position[1],
                (game.hook.hit && game.hook.hit.x) || game.hook.position.x,
                (game.hook.hit && game.hook.hit.y) || game.hook.position.y
            );
        }
        // Draw physic bodies
        game.world.bodies.forEach(b => {
            b.shapes.forEach(s => {
                // Couleur en fonction du type
                if(s.collisionGroup === COLLISIONS.WALL){
                    game.graphics.fillStyle(0x7E7E7E);
                }
                else if(s.collisionGroup === COLLISIONS.PLAYER){
                    game.graphics.fillStyle(0xFF0000);
                }
                // Dessin de la forme
                if(b.shapes[0] instanceof P2.Circle){
                    let circle = b.shapes[0] as P2.Circle;
                    game.graphics.fillCircle(b.position[0], b.position[1], circle.radius);
                }
                else if(b.shapes[0] instanceof P2.Box){
                    let box = b.shapes[0] as P2.Box;
                    game.graphics.fillRect(b.position[0] - (box.width / 2), b.position[1] - (box.height / 2), box.width, box.height);
                }
            });
        });
    }
}

let oldState: {left: {up: boolean, pressed: boolean, released: boolean}, right: {up: boolean, pressed: boolean, released: boolean}} = null;
function getMouseClicks(buttons: number){
    let leftUp = buttons % 2 === 1;
    let rightUp = (buttons >> 1) % 2 === 1;
    oldState = {
        left: {
            up: leftUp,
            pressed: (!oldState && leftUp) || (oldState && !oldState.left.up && leftUp),
            released: oldState && oldState.left.up && !leftUp
        },
        right: {
            up: rightUp,
            pressed: (!oldState && rightUp) || (oldState && !oldState.right.up && rightUp),
            released: oldState && oldState.right.up && !rightUp
        }
    };
    return oldState;
}

class Hook {

    maxDistance: number;
    speed: number;

    position: Vector2;
    direction: Vector2;
    hit: Vector2;

    fired: boolean;
    recalled: boolean;

    constructor(speed: number, maxDistance: number){
        this.maxDistance = maxDistance;
        this.speed = speed;
        this.position = new Vector2();
        this.direction = new Vector2();
        this.hit = null;
        this.fired = false;
        this.recalled = false;
    }

    reset(){
        this.hit = null;
        this.direction.set(0);
        this.position.set(0);
        this.fired = false;
        this.recalled = false;
    }
}