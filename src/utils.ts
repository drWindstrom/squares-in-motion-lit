import {Point} from './interfaces/point-interface'

export function invertYAxis(p: Point): Point {
    return {x: p.x, y: -p.y}    
}
