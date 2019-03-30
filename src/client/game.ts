import * as Phaser from 'phaser';
import * as P2 from 'p2';

import Vector2 from '../shared/Vector2';
import Map from './Map';

const COLLISIONS = {
    WALL: 1 << 0,
    PLAYER: 1 << 1
}

const CONSTANTS = {
    MOVE_SPEED_ACCELERATION: 250,
    HOOK_FORCE: 35,
    BOMB: [[0, 0], [1, 0], ...[1/4, 2/4, 3/4].map(factor => [Math.cos(factor * (Math.PI /2)), Math.sin(factor * (Math.PI /2))]) , [0, 1]] as [number, number][],
    CURVE: [[0, 0], [1, 0], ...[3/4, 2/4, 1/4].map(factor => [1 + Math.cos(Math.PI + (factor * (Math.PI / 2))), 1 + Math.sin(Math.PI + (factor * (Math.PI / 2)))]), [0, 1]] as [number, number][],
    JUMP_RANGE: {
        from: Math.cos(Math.PI + (Math.PI / 4)),
        to: Math.cos(Math.PI + ((Math.PI * 3) / 4))
    }
}

type Key = Phaser.Input.Keyboard.Key;

export default class Game{

    game: Phaser.Game;
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    map: Map;

    world: P2.World;
    player: P2.Body;
    canJump: boolean;

    hook: Hook;

    keys: { left: Key, right: Key, jump: Key };

    constructor(){
        // Game
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
            restitution: 0.05,
            friction: 0.75
        }));
        this.player = new P2.Body({ mass: 5, position: [100, 100], fixedRotation: true });
        let circleShape = new P2.Circle({ radius: 15, collisionGroup: COLLISIONS.PLAYER, collisionMask: COLLISIONS.WALL });
        circleShape.material = playerMaterial;
        this.player.addShape(circleShape);
        this.world.addBody(this.player);
        // Map
        let wallShapeCollision = { collisionGroup: COLLISIONS.WALL, collisionMask: COLLISIONS.PLAYER };
        Map.fromWeb('map1')
        .then(map => {
            let tileSize = new Vector2(this.game.canvas.width / map.size.x, this.game.canvas.height / map.size.y);
            map.data.forEach((d, i) => {
                let tilePosition = new Vector2(
                    (i % map.size.x) * tileSize.x + (tileSize.x / 2),
                    Math.floor(i / map.size.x) * tileSize.y + (tileSize.y / 2)
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
                        s.material = wallMaterial;
                        s.collisionGroup = COLLISIONS.WALL;
                        s.collisionMask = COLLISIONS.PLAYER;
                    });
                }
                else if(shape){
                    shape.material = wallMaterial;
                    body.addShape(shape);
                }
                this.world.addBody(body);
            });
            this.map = map;
        });
        // Hook
        this.hook = new Hook(1750, 175);
        // Other
        this.canJump = false;
    }

    private preload(this: Phaser.Scene, game: Game){
        this.game.canvas.oncontextmenu = () => false;
    }

    private create(this: Phaser.Scene, game: Game){
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
    private update(this: Phaser.Scene, game: Game, time: number, delta: number){
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
                    for(let y = 0; y < game.map.size.y; y++){
                        for(let x = 0; x < game.map.size.x; x++){
                            let tile = game.map.getTile(x, y);
                            if(tile === 0) continue;
                            this.add.sprite((x * 50) + 25, (y * 50) + 25, 'tilemap', tile - 1);
                        }
                    }
                    game.tilemapLoadingState = 2;
                }
                else if(key === 'skin'){
                    game.playerSprite = this.add.sprite(game.player.position[0], game.player.position[1], 'skin');
                    game.skinLoadingState = 2;
                }
            });
            this.load.start();
            game.loaderInitialized = true;
        }

        /**
         * LOGIC
         */
        // Saut
        game.canJump = false;
        let playerRadius = (game.player.shapes[0] as P2.Circle).radius;
        for(let contactEquation of game.world.narrowphase.contactEquations){
            if(contactEquation.bodyA !== game.player && contactEquation.bodyB !== game.player) return;
            let playerContactPoint = contactEquation.bodyA === game.player ? contactEquation.contactPointA : contactEquation.contactPointB;
            if(
                playerContactPoint[0] >= CONSTANTS.JUMP_RANGE.from * playerRadius &&
                playerContactPoint[0] <= CONSTANTS.JUMP_RANGE.to * playerRadius &&
                playerContactPoint[1] > 0){
                    game.canJump = true;
                    break;
            }
        }
        if(game.keys.jump.isDown && game.canJump){
            game.player.velocity[1] = -50;
            game.canJump = false;
        }
        // Déplacements
        if(game.keys.left.isDown && game.keys.right.isUp && game.player.velocity[0] > -50){
            game.player.velocity[0] -= CONSTANTS.MOVE_SPEED_ACCELERATION * (delta / 1000);
            game.player.velocity[0] = Math.max(game.player.velocity[0], -50);
        }
        if(game.keys.right.isDown && game.keys.left.isUp && game.player.velocity[0] < 50){
            game.player.velocity[0] += CONSTANTS.MOVE_SPEED_ACCELERATION * (delta / 1000);
            game.player.velocity[0] = Math.min(game.player.velocity[0], 50);
        }
        // Mouse manager
        let mouse = getMouseClicks(this.input.activePointer.buttons);
        // Hook
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
                let force = CONSTANTS.HOOK_FORCE;
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
                // On met à jour la couleur de la forme en fonction de son groupe
                updateFillColor(s, game.graphics);
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
            game.playerSprite.x = game.player.position[0];
            game.playerSprite.y = game.player.position[1];
        }
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

function updateFillColor(shape: P2.Shape, graphics: Phaser.GameObjects.Graphics){
    if(shape.collisionGroup === COLLISIONS.WALL){
        graphics.fillStyle(0x7E7E7E);
    }
    else if(shape.collisionGroup === COLLISIONS.PLAYER){
        graphics.fillStyle(0xFF0000);
    }
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