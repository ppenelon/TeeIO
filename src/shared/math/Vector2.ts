/** Source https://github.com/photonstorm/phaser/blob/43b4aad96cae18fe7aa0179353c72e1b23719164/src/math/Vector2.js
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

interface Vector2Like{
    x: number;
    y: number;
}

/**
 * A representation of a vector in 2D space.
 */
export default class Vector2{

    static readonly ZERO: Vector2 = new Vector2();
    static readonly RIGHT: Vector2 = new Vector2(1, 0);
    static readonly LEFT: Vector2 = new Vector2(-1, 0);
    static readonly UP: Vector2 = new Vector2(0, -1);
    static readonly DOWN: Vector2 = new Vector2(0, 1);
    static readonly ONE: Vector2 = new Vector2(1, 1);

    /**
     * The x component of this `Vector2`.
     */
    x: number;
    /**
     * The y component of this `Vector2`.
     */
    y: number;

    constructor();
    constructor(v: Vector2Like);
    constructor(xy: number);
    constructor(x: number, y: number);
    constructor(x?: number | Vector2Like, y?: number){
        if(x === undefined && y === undefined){
            this.x = 0;
            this.y = 0;
        }
        else if(typeof x === 'object'){
            let v = x as Vector2Like;
            this.x = v.x;
            this.y = v.y;
        }
        else if(y === undefined){
            this.x = x;
            this.y = x;
        }
        else{
            this.x = x;
            this.y = y;
        }
    }

    /**
     * Make a clone of this `Vector2`.
     * @return A clone of this `Vector2`.
     */
    clone(){
        return new Vector2(this);
    }

    set(): Vector2;
    set(v: Vector2Like): Vector2;
    set(xy: number): Vector2;
    set(x: number, y: number): Vector2;
    set(x?: number | Vector2Like, y?: number){
        if(x === undefined && y === undefined){
            this.x = 0;
            this.y = 0;
        }
        else if(typeof x === 'object'){
            let v = x as Vector2Like;
            this.x = v.x;
            this.y = v.y;
        }
        else if(y === undefined){
            this.x = x;
            this.y = x;
        }
        else{
            this.x = x;
            this.y = y;
        }
        return this;
    }

    /**
     * Sets the `x` and `y` values of this object from a given polar coordinate.
     * @param azimuth - The angular coordinate, in radians.
     * @param radius - The radial coordinate (length).
     */
    setToPolar(azimuth: number, radius: number = 1){
        this.x = Math.cos(azimuth) * radius;
        this.y = Math.sin(azimuth) * radius;
        return this;
    }

    /**
     * Check whether this Vector is equal to a given `Vector2`.
     * Performs a strict equality check against each Vector's components.
     */
    equals(v: Vector2){
        return this.x === v.x && this.y === v.y;
    }

    /**
     * Calculate the angle between this Vector and the positive x-axis, in radians.
     * @return The angle between this Vector, and the positive x-axis, given in radians.
     */
    angle(){
        let angle = Math.atan2(this.y, this.x);
        if (angle < 0) angle += 2 * Math.PI;
        return angle;
    }

    add(xy: number): Vector2;
    add(v: Vector2Like): Vector2;
    add(x: number, y: number): Vector2;
    add(x: number | Vector2Like, y?: number){
        if(typeof x === 'object'){
            let v = x as Vector2Like;
            this.x += v.x;
            this.y += v.y;
        }
        else if(y === undefined){
            this.x += x;
            this.y += x;
        }
        else{
            this.x += x;
            this.y += y;
        }
        return this;
    }

    substract(xy: number): Vector2;
    substract(v: Vector2Like): Vector2;
    substract(x: number, y: number): Vector2;
    substract(x: number | Vector2Like, y?: number){
        if(typeof x === 'object'){
            let v = x as Vector2Like;
            this.x -= v.x;
            this.y -= v.y;
        }
        else if(y === undefined){
            this.x -= x;
            this.y -= x;
        }
        else{
            this.x -= x;
            this.y -= y;
        }
        return this;
    }

    multiply(xy: number): Vector2;
    multiply(v: Vector2Like): Vector2;
    multiply(x: number, y: number): Vector2;
    multiply(x: number | Vector2Like, y?: number){
        if(typeof x === 'object'){
            let v = x as Vector2Like;
            this.x *= v.x;
            this.y *= v.y;
        }
        else if(y === undefined){
            this.x *= x;
            this.y *= x;
        }
        else{
            this.x *= x;
            this.y *= y;
        }
        return this;
    }

    divide(xy: number): Vector2;
    divide(v: Vector2Like): Vector2;
    divide(x: number, y: number): Vector2;
    divide(x: number | Vector2Like, y?: number){
        if(typeof x === 'object'){
            let v = x as Vector2Like;
            this.x /= v.x;
            this.y /= v.y;
        }
        else if(y === undefined){
            this.x /= x;
            this.y /= x;
        }
        else{
            this.x /= x;
            this.y /= y;
        }
        return this;
    }

    /**
     * Negate the `x` and `y` components of this Vector.
     * @return This Vector2.
     */
    negate(){
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    /**
     * Calculate the distance between this Vector and the given Vector.
     * @param v The Vector to calculate the distance to.
     * @return The distance from this Vector to the given Vector.
     */
    distance(v: Vector2){
        return Math.sqrt(this.distanceSq(v));
    }

    /**
     * Calculate the distance between this Vector and the given Vector, squared.
     * @param v The Vector to calculate the distance to.
     * @return The distance from this Vector to the given Vector, squared.
     */
    distanceSq(v: Vector2){
        let dx = v.x - this.x;
        let dy = v.y - this.y;
        return dx * dx + dy * dy;
    }

    /**
     * Calculate the length (or magnitude) of this Vector.
     * @return The length of this Vector.
     */
    length(){
        return Math.sqrt(this.lengthSq());
    }

    /**
     * Calculate the length of this Vector squared.
     * @return The length of this Vector, squared.
     */
    lengthSq(){
        let x = this.x;
        let y = this.y;
        return x * x + y * y;
    }

    /**
     * Normalize this Vector.
     * Makes the vector a unit length vector (magnitude of 1) in the same direction.
     * @return This Vector2.
     */
    normalize(){
        let x = this.x;
        let y = this.y;
        let len = x * x + y * y;

        if (len > 0){
            len = 1 / Math.sqrt(len);

            this.x = x * len;
            this.y = y * len;
        }

        return this;
    }

    /**
     * Right-hand normalize (make unit length) this Vector.
     * @return This Vector2.
     */
    normalizeRightHand(){
        let x = this.x;

        this.x = this.y * -1;
        this.y = x;

        return this;
    }

    /**
     * Calculate the dot product of this Vector and the given Vector.
     * @param v The Vector2 to dot product with this Vector2.
     * @return The dot product of this Vector and the given Vector.
     */
    dot(v: Vector2){
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Calculate the cross product of this Vector and the given Vector.
     * @param v The Vector2 to cross with this Vector2.
     * @return The cross product of this Vector and the given Vector.
     */
    cross(v: Vector2){
        return this.x * v.y - this.y * v.x;
    }

    /**
     * Linearly interpolate between this Vector and the given Vector.
     * Interpolates this Vector towards the given Vector.
     * @param v The Vector2 to interpolate towards.
     * @param t The interpolation percentage, between 0 and 1.
     * @return This Vector2.
     */
    lerp(v: Vector2, t: number = 0){
        var ax = this.x;
        var ay = this.y;

        this.x = ax + t * (v.x - ax);
        this.y = ay + t * (v.y - ay);

        return this;
    }
}