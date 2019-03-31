import Axios from 'axios';
import * as Phaser from 'phaser'

import { IMapData } from '../shared/interfaces';

export default class Map{

    mapSize: Phaser.Math.Vector2;
    tileSize: Phaser.Math.Vector2;
    data: number[];

    constructor(mapData: IMapData){
        if(mapData.data.length !== mapData.mapSize.x * mapData.mapSize.y) throw 'Wrong map data size';
        this.mapSize = new Phaser.Math.Vector2(mapData.mapSize);
        this.tileSize = new Phaser.Math.Vector2(mapData.tileSize);
        this.data = mapData.data;
    }

    getTile(x: number, y: number){
        if(x < 0 || x >= this.mapSize.x || y < 0 || y >= this.mapSize.y) throw 'Tile position must be in map size';
        return this.data[this.mapSize.x * y + x];
    }

    static async fromWeb(mapName: string){
        try{
            let res = await Axios.get<IMapData>(`/assets/config/${mapName}.json`);
            return new Map(res.data);
        }
        catch{
            throw 'Can\'t retrieve map data';
        }
    }
}