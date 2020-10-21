import { svg } from 'lit-element';
import { Train, TrainCanvas, Point } from './interfaces/interfaces';
import { invertYAxis, getVec, distance } from './utils';

export function trainTemplate(
  train: Train,
  onClick: (e: MouseEvent) => void,
  onMouseDown: (e: MouseEvent) => void
) {
    let cursorStyle = 'grab';
    let strokeColor = 'rgb(85,160,185)';
    if (train.isSelected) {
        strokeColor = 'rgb(175,35,95)';
        cursorStyle = 'move';
    }

    const center = invertYAxis({x: train.x, y: train.y});

  return svg`
      <g 
        id="train" 
        transform='translate(${center.x} ${center.y}) rotate(${train.rotation})'
        stroke=${strokeColor}
        cursor=${cursorStyle}
        @click=${onClick}
        @mousedown=${onMouseDown}
      >
        <path
          id="trainOutline"
          d="M 20,10 H -20 V -10 H 20 l 15,10 z"
          fill='rgb(85,160,185)'
          fill-opacity='25%'
          stroke-width='2'
        />
        <circle
          id="trainCenter"
          r="4"
          cy="0"
          cx="0"
          stroke-width='0'
          fill='rgb(175,35,95)'
        />
      </g>
    `;
}

enum PathDirection {
  Up = 1,
  Down = -1,
}

export class TrainHandlers {
  constructor(canvas: TrainCanvas) {
    this.canvas = canvas;
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) =>
      this.handleCanvasMouseMove(e)
    );
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
  }

  private canvas: TrainCanvas;
  private isTrainDrag = false;
  private finishingDrag = false;
  
 
  private get trainPath(): SVGPathElement {
    const pathId = this.canvas.train.pathId;
    return this.canvas.shadowRoot?.querySelector(`#${pathId}`) as SVGPathElement;
  }

  click(e: MouseEvent) {
    // Prevent the click event after dragging a square
    if (this.finishingDrag) {
      this.finishingDrag = false;
      e.stopPropagation();
      return;
    }
    // Regular click to select the square
    e.stopPropagation();
    this.canvas.train = {
      ...this.canvas.train,
      isSelected: !this.canvas.train.isSelected,
    };
  }

  handleCanvasClick(e: MouseEvent) {
    const MAIN_BUTTON = 0;
    if (e.button === MAIN_BUTTON) {
      // Deselect all squares
      this.canvas.train = { ...this.canvas.train, isSelected: false };
    }
  }

  mouseDown(e: MouseEvent) {
    const MAIN_BUTTON = 0;
    if (this.canvas.train.isSelected && e.button === MAIN_BUTTON) {
      e.stopPropagation();
      this.isTrainDrag = true;
      //this.dragStart = this.canvas.clientToCanvasCoordinates(e);
      this.dragStart = {x: e.clientX, y: e.clientY};
    }
  }
  
  private dragStart = {x: 0, y: 0}; 
  private lastUpdate = 0;

  private handleCanvasMouseMove(e: MouseEvent) {
    // Throttle
    if(Date.now() - this.lastUpdate < 1000/30) {
       return;
    }
    this.lastUpdate = Date.now();
    // Dragging a square
    if (this.isTrainDrag) {
      //const dragEnd = this.canvas.clientToCanvasCoordinates(e);
      const dragEnd = {x: e.clientX, y: e.clientY};
      console.log(`Drag Distance: ${distance(this.dragStart, dragEnd)}`);
      this.dragStart = dragEnd;
    }
  }

  private getSearchDirection(initialGuess: number) {
    const maxLength = this.trainPath.getTotalLength();
    if (initialGuess === 0 ) {
      return PathDirection.Up;
    } 
    if (initialGuess === maxLength) {
      return PathDirection.Down;
    }
    const stepSize = 1;
    let upStep = initialGuess + stepSize;
    let downStep = initialGuess - stepSize;
    // Make sure up and down step are within the limits of the path length
    if (upStep > maxLength) {
      upStep = maxLength;
    }
    if (downStep < 0) {
      downStep = 0;
    }
    // Calculate distance
    const initialLocation = this.trainPath.getPointAtLength(initialGuess);
    const upLocation = this.trainPath.getPointAtLength(upStep);
    const distanceUpStep = distance(initialLocation, upLocation);
    const downLocation = this.trainPath.getPointAtLength(downStep);
    const distanceDownStep = distance(initialLocation, downLocation);
    if (distanceUpStep <= distanceDownStep) {
      return PathDirection.Up;
    } else {
      return PathDirection.Down;
    }
  }

  private getDistanceLinePointToCursorLocation(offset: number, cursorLocation: Point): number {
    const linePoint = this.trainPath.getPointAtLength(offset);
    return distance(linePoint, cursorLocation);
  }
  
  private getDiffDistanceLinePointToCursorLocation(offset: number, direction: PathDirection, cursorLocation: Point): number {
    let diffF = 0;
    const stepSize = 1;
    if (direction === PathDirection.Up) {
      diffF = (this.getDistanceLinePointToCursorLocation(offset + stepSize, cursorLocation) - this.getDistanceLinePointToCursorLocation(offset, cursorLocation))/stepSize;
    }
    if (direction === PathDirection.Down) {
      diffF = (this.getDistanceLinePointToCursorLocation(offset, cursorLocation) - this.getDistanceLinePointToCursorLocation(offset - stepSize, cursorLocation) )/stepSize;
    }
    
    return diffF; 
  }

  private handleMouseUp() {
    if (this.isTrainDrag) {
      this.isTrainDrag = false;
      this.finishingDrag = true;
    }
  }

  


}
