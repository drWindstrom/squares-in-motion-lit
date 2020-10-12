import {Point} from './interfaces/point_interface'

export function invertYAxis(p: Point): Point {
    return {x: p.x, y: -p.y}    
}