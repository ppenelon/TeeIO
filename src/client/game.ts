import * as Phaser from 'phaser';
import * as P2 from 'p2';

import Vector2 from '../shared/Vector2';
import Map from './Map';

export default class Game{

    game: Phaser.Game;
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    map: Map;

    world: P2.World;
    player: P2.Body;

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
        let circleShape = new P2.Circle({ radius: 15 });
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
                let circleShape = new P2.Circle({ radius });
                circleShape.material = wallMaterial;
                circleBody.addShape(circleShape);
                this.world.addBody(circleBody);
            });
            this.map = map;
        });
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
        if(mouse.right.up){
            let direction = this.input.mousePointer.position.clone().subtract(new Vector2(game.player.position[0], game.player.position[1])).normalize();
            let force = 50;
            let move = direction.multiply(new Vector2(force, force));
            game.player.applyImpulse([move.x, move.y]);
            // let player = game.world.bodies.filter(b => b.type !== P2.Body.STATIC)[0];
            // player.position = [this.input.mousePointer.x, this.input.mousePointer.y];
            // player.velocity = [0, 0];
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