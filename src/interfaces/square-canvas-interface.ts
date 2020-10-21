import { Square, Point } from './interfaces';

export interface SquareCanvas extends HTMLElement {
    squares: Square[];
    clientToCanvasCoordinates: (e: MouseEvent) => Point;
    zoom: number;
}