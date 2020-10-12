import { Point } from "./point_interface";

export interface Square {
    coordinate: Point
    sideLength: number;
    rotation: number;
    isHighligted: boolean;
    isSelected: boolean;
  }
  