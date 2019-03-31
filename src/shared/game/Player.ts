import * as P2 from 'p2';

import Collisions from './Collisions';
import Materials from './Materials';
import { IInputs } from '../interfaces';
import Vector2 from '../math/Vector2';
import Vector2Like from '../math/Vector2Like';

const CONSTANTS = {
    MASS: 5,
    RADIUS: 15,
    MOVE_SPEED_ACCELERATION: 250,
    MAX_SPEED: 50,
    HOOK: {
        MAX_DISTANCE: 175,
        SPEED: 1750,
        FORCE: 35
    },
    JUMP_RANGE: { // X
        FROM: Math.cos(Math.PI + (Math.PI / 4)),
        TO: Math.cos(Math.PI + ((Math.PI * 3) / 4))
    }
}

export default class Player{

    hasAuthority: boolean;
    body: P2.Body;
    hook: Hook;
    controller: IInputs;

    constructor(position: Vector2Like, hasAuthority: boolean){
        // Network
        this.hasAuthority = hasAuthority;
        // Physic Body
        this.body = new P2.Body({ mass: CONSTANTS.MASS, position: [position.x, position.y], fixedRotation: true });
        let playerShape = new P2.Circle({ radius: CONSTANTS.RADIUS, collisionGroup: Collisions.PLAYER, collisionMask: Collisions.WALL });
        playerShape.material = Materials.PLAYER;
        this.body.addShape(playerShape);
        // Controller
        this.controller = {
            buttons: 0,
            mouseDirection: { x: 0, y: 0 }
        }
        // Hook
        this.hook = new Hook(CONSTANTS.HOOK.SPEED, CONSTANTS.HOOK.MAX_DISTANCE, this);
    }

    update(delta: number){
        // Calcul des inputs
        let inputs = {
            left: (this.controller.buttons >> 0) % 2 === 1,
            right: (this.controller.buttons >> 1) % 2 === 1,
            jump: (this.controller.buttons >> 2) % 2 === 1,
            rightClick: (this.controller.buttons >> 3) % 2 === 1,
        }
        // Saut
        if(inputs.jump){
            let canJump = false;
            let playerRadius = (this.body.shapes[0] as P2.Circle).radius;
            for(let contactEquation of this.body.world.narrowphase.contactEquations){
                if(contactEquation.bodyA !== this.body && contactEquation.bodyB !== this.body) return;
                let playerContactPoint = contactEquation.bodyA === this.body ? contactEquation.contactPointA : contactEquation.contactPointB;
                if(
                    playerContactPoint[0] >= CONSTANTS.JUMP_RANGE.FROM * playerRadius &&
                    playerContactPoint[0] <= CONSTANTS.JUMP_RANGE.TO * playerRadius &&
                    playerContactPoint[1] > 0){
                        canJump = true;
                        break;
                }
            }
            if(canJump){
                this.body.velocity[1] = -50;
            }
        }
        // Déplacement du personnage
        if(inputs.left && !inputs.right && this.body.velocity[0] > -CONSTANTS.MAX_SPEED){
            this.body.velocity[0] = Math.max(this.body.velocity[0] - (CONSTANTS.MOVE_SPEED_ACCELERATION * (delta / 1000)), -CONSTANTS.MAX_SPEED)
        }
        if(inputs.right && !inputs.left && this.body.velocity[0] < CONSTANTS.MAX_SPEED){
            this.body.velocity[0] = Math.min(this.body.velocity[0] + (CONSTANTS.MOVE_SPEED_ACCELERATION * (delta / 1000)), CONSTANTS.MAX_SPEED);
        }
        // Hook
        if(inputs.rightClick){
            this.hook.fire(delta, this.controller.mouseDirection)
            // Si on a touché quelque chose
            if(this.hook.hit){
                let direction = this.hook.hit.clone().substract(new Vector2(this.body.position[0], this.body.position[1])).normalize();
                let force = CONSTANTS.HOOK.FORCE;
                let move = direction.multiply(force);
                this.body.applyImpulse([move.x, move.y]);
            }
        }
        else{
            this.hook.reset();
        }
    }

    /**
     * Met à jour l'état des inputs du joueur
     */
    setController(controller: IInputs){
        this.controller = controller;
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

    player: Player;

    constructor(speed: number, maxDistance: number, player: Player){
        this.maxDistance = maxDistance;
        this.speed = speed;
        this.position = new Vector2();
        this.direction = new Vector2();
        this.hit = null;
        this.fired = false;
        this.recalled = false;
        this.player = player;
    }

    fire(delta: number, direction: Vector2Like){
        // On regarde si on a pas besoin de l'update
        if(this.fired && (this.hit || this.recalled)) return;
        // Si le grappin vient d'être tiré, on lui assigne sa trajectoire
        if(!this.fired){
            this.direction.set(direction);
            this.position.set(this.player.body.position[0], this.player.body.position[1]);
            this.fired = true;
        }
        // Sauvegarde de l'ancienne position pour le raycast
        let oldPosition = this.position.clone();
        // Mise à jour de la position du grappin
        this.position.add(this.direction.clone().multiply(this.speed * (delta / 1000)));
        // Création du nouveau Raycast
        let hookRay = new P2.Ray({
            mode: P2.Ray.CLOSEST,
            from: [oldPosition.x, oldPosition.y],
            to: [this.position.x, this.position.y],
            collisionMask: Collisions.WALL
        });
        // Résultat du Raycast
        let rayResult = new P2.RaycastResult();
        let hasHit = this.player.body.world.raycast(rayResult, hookRay);
        // Si ça a touché quelque chose
        if(hasHit){
            let point: [number, number] = [0, 0];
            rayResult.getHitPoint(point, hookRay);
            this.hit = new Vector2(point[0], point[1]);
        }
        else{ // Si ça n'a pas touché on regarde si le grappin n'est pas allé trop loin
            let distancePlayerHook = new Vector2(this.player.body.position[0], this.player.body.position[1]).distance(this.position);
            if(distancePlayerHook >= this.maxDistance){
                // On rappelle le grappin
                this.recalled = true;
            }
        }
    }

    reset(){
        this.hit = null;
        this.direction.set(0);
        this.position.set(0);
        this.fired = false;
        this.recalled = false;
    }
}