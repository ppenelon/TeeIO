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

    hook: {distance: number, position: [number, number], speed: number, max: number, hasHit: boolean, hit: [number, number]};

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
            let radius = (this.game.canvas.width / map.size.x) / 2;
            map.data.forEach((d, i) => {
                if(d !== 1) return;
                let x = (i % map.size.x) * (radius * 2) + radius;
                let y = Math.floor(i / map.size.x) * (radius * 2) + radius;
                let circleBody = new P2.Body({ position: [x, y] });
                let circleShape = new P2.Circle({ radius, collisionGroup: COLLISIONS.WALL, collisionMask: COLLISIONS.PLAYER });
                circleShape.material = wallMaterial;
                circleBody.addShape(circleShape);
                this.world.addBody(circleBody);
            });
            this.map = map;
        });
        // Other
        this.hook = {
            distance: 0,
            position: [0, 0],
            speed: 2000,
            max: 175,
            hasHit: false,
            hit: [0, 0]
        }
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
        // Logic
        let mouse = getMouseClicks(this.input.activePointer.buttons);
        let point: [number, number] = [0, 0];
        if(mouse.right.up){
            if(!game.hook.hasHit || game.hook.distance === game.hook.max){
                // Nouvelle distance du grapin
                game.hook.distance += game.hook.speed * (delta / 1000);
                game.hook.distance = Math.min(game.hook.distance, game.hook.max);
                // Calcul de la nouvelle position du grappin
                let raycastEnd = this.game.input.mousePointer.position.clone();
                raycastEnd.subtract(new Vector2(game.player.position[0], game.player.position[1]));
                raycastEnd.normalize();
                raycastEnd.multiply(new Vector2(game.hook.distance, game.hook.distance));
                raycastEnd.add(new Vector2(game.player.position[0], game.player.position[1]));
                game.hook.position = [raycastEnd.x, raycastEnd.y];
                // Calcul du nouveau Raycast
                let hookRay = new P2.Ray({
                    mode: P2.Ray.CLOSEST,
                    from: game.player.position,
                    to: game.hook.position,
                    collisionMask: COLLISIONS.WALL
                });
                // Récupération du résultat
                let rayResult = new P2.RaycastResult();
                let hasHit = game.world.raycast(rayResult, hookRay);
                if(hasHit){
                    game.hook.hasHit = true;
                    rayResult.getHitPoint(game.hook.hit, hookRay);
                }
            }
            if(game.hook.hasHit){
                let direction = new Vector2(game.hook.hit[0], game.hook.hit[1]).subtract(new Vector2(game.player.position[0], game.player.position[1])).normalize();
                let force = 35;
                let move = direction.multiply(new Vector2(force, force));
                game.player.applyImpulse([move.x, move.y]);
            }
        }
        else if(mouse.right.released){
            game.hook.hasHit = false;
            game.hook.distance = 0;
        }
        // Update
        game.world.step(1 / 60, delta, 10);
        // Draw map
        this.cameras.main.setBackgroundColor(0xE7E7E7);
        game.graphics.clear();
        game.world.bodies.forEach(b => {
            game.graphics.fillStyle(b.type === P2.Body.STATIC ? 0x7E7E7E : 0xFF0000);
            game.graphics.fillCircle(b.position[0], b.position[1], (b.shapes[0] as P2.Circle).radius);
        });
        // Hook
        if(game.hook.hasHit){
            game.graphics.fillStyle(0x00FFFF);
            game.graphics.fillCircle(game.hook.hit[0], game.hook.hit[1], 5);
        }
        if(game.hook.distance > 0){
            game.graphics.lineStyle(2, 0x000000);
            game.graphics.lineBetween(game.player.position[0], game.player.position[1], game.hook.position[0], game.hook.position[1]);
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