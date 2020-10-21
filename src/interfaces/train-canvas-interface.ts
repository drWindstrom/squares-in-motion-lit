import { Train, Point } from './interfaces';

export interface TrainCanvas extends HTMLElement {
    train: Train;
    clientToCanvasCoordinates: (e: MouseEvent) => Point;
    zoom: number;
}