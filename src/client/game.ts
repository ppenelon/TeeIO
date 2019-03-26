import * as Phaser from 'phaser';
import Map from './Map';

export default class Game{

    game: Phaser.Game;
    text: Phaser.GameObjects.Text;
    map: Map;

    constructor(){
        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            scene: {
                preload: this.preload,
                create: this.create,
                update: this.update
            },
            banner: true
        });
        // Map creation
        Map.fromWeb('map1')
        .then(map => {
            this.map = map;
        });
    }

    private preload(this: Phaser.Scene){
        console.log('PRELOAD');
    }

    private create(this: Phaser.Scene){
        console.log('CREATE');
        game.text = this.add.text(20, this.game.canvas.height - 35, 'Loading map...');
    }

    private update(this: Phaser.Scene){
        let coef = this.game.input.mousePointer.x / this.game.canvas.width;
        this.cameras.main.setBackgroundColor((coef * 0xFF))
        // Check if map loaded
        if(game.map && game.text){
            game.text.destroy()
            game.text = null;
        }
        if(game.text) return;
    }
}