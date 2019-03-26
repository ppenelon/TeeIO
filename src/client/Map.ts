import Axios from 'axios';
import * as Phaser from 'phaser'

import { IMapData } from '../shared/interfaces';

export default class Map{

    size: Phaser.Math.Vector2;
    data: number[];

    constructor(x: number, y: number, data: number[]){
        if(data.length !== x*y) throw 'Wrong map data size';
        this.size = new Phaser.Math.Vector2(x, y);
        this.data = data;
    }

    getTile(x: number, y: number){
        if(x < 0 || x >= this.size.x || y < 0 || y >= this.size.y) throw 'Tile position must be in map size';
        return this.data[this.size.x * y + x];
    }

    static async fromWeb(mapName: string){
        try{
            let res = await Axios.get<IMapData>(`/assets/config/${mapName}.json`);
            return new Map(res.data.x, res.data.y, res.data.data);
        }
        catch{
            throw 'Can\'t retrieve map data';
        }
    }
}