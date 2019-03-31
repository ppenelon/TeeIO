export interface IMapData{
    mapSize: {
        x: number;
        y: number;
    };
    tileSize: {
        x: number;
        y: number;
    };
    data: number[];
}

export interface IInputs{
    /**
     * 0 Left
     * 1 Right
     * 2 Jump
     * 3 Right-Click
     */
    buttons: number;
    mouseDirection: { x: number, y: number };
}