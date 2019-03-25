import * as Phaser from 'phaser';

export default class Game{

    game: Phaser.Game;

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
    }

    private preload(this: Phaser.Scene){
        console.log('PRELOAD');
    }

    private create(this: Phaser.Scene){
        console.log('CREATE');
    }

    private update(this: Phaser.Scene){
        let coef = this.game.input.mousePointer.x / this.game.canvas.width;
        this.cameras.main.setBackgroundColor((coef * 0xFF))
    }
}