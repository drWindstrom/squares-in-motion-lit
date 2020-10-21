import { Point, Vector } from './interfaces/interfaces';

export function invertYAxis(p: Point): Point {
    return {x: p.x, y: -p.y}    
}

export function getVec(p1: Point, p2: Point) :Vector {
    return {
      x: p2.x - p1.x,
      y: p2.y - p1.y,
    };
}

export function vectorMagnitude(vec: Vector): number {
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y);
}

export function dotProduct(a: Vector, b: Vector): number {
    return a.x*b.x + a.y*b.y;
}

export function angleBetweenVectors(a: Vector, b: Vector): number {
    const angle = Math.acos(dotProduct(a, b) / ( vectorMagnitude(a)*vectorMagnitude(b) ));
    console.log(`Angle: ${angle}`);
    return angle;
}

export function scalarProjection(vec: Vector, direction: Vector): number {
    const angle = angleBetweenVectors(vec, direction);
    return Math.cos(angle) * vectorMagnitude(vec);
}



