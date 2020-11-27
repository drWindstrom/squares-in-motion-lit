import { Point } from './interfaces/interfaces';

export function invertYAxis(p: Point): Point {
    return {x: p.x, y: -p.y}    
}
