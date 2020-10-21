import { svg } from 'lit-element';
import { Train, TrainCanvas, Point } from './interfaces/interfaces';
import { invertYAxis, distance } from './utils';

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
      this.dragStart = this.canvas.clientToCanvasCoordinates(e);
    }
  }
  
  private dragStart = {x: 0, y: 0}; 
  private lastUpdate = 0;
  private trainPathCache!: SVGPathElement; 

  private handleCanvasMouseMove(e: MouseEvent) {
    // Throttle
    if(Date.now() - this.lastUpdate < 1000/30) {
      return;
    }
    
    
    if (this.isTrainDrag) {
      this.trainPathCache = this.trainPath;
      const cursorLocation = this.canvas.clientToCanvasCoordinates(e);
      let trainOffset = this.canvas.train.offset;
      
      let intervalWidth = 2*distance(this.dragStart, cursorLocation);
      intervalWidth = this.fitIntervalWidth(intervalWidth, trainOffset, cursorLocation);
      const stopIntervalWidth = 1.0 / this.canvas.zoom;

      while (intervalWidth > stopIntervalWidth) {
        const searchDirection = this.getSearchDirection(trainOffset, cursorLocation);
        if (searchDirection === PathDirection.Up) {
          trainOffset = trainOffset + intervalWidth/2;
        } 
        if (searchDirection === PathDirection.Down) {
          trainOffset = trainOffset - intervalWidth/2;
        }
        intervalWidth = 0.5 * intervalWidth;
      }
      
      // move train
      const nextTrainLocation = this.trainPathCache.getPointAtLength(trainOffset);
      this.canvas.train = {
        ...this.canvas.train,
        x: nextTrainLocation.x,
        y: -nextTrainLocation.y,
        offset: trainOffset,
      }
      
      this.dragStart = cursorLocation;
      this.lastUpdate = Date.now();
    }
  }

  private getSearchDirection(offset: number, cursorLocation: Point) {
    const stepSize = 1;
    
    const maxPathLength = this.trainPathCache.getTotalLength();
    let stepUp = offset + stepSize;
    if (stepUp > maxPathLength) { stepUp = maxPathLength; }
    
    let stepDown = offset - stepSize;
    if (stepDown < 0) { stepDown = 0; }

    const offsetLocationUp = this.trainPathCache.getPointAtLength(stepUp);
    const distanceUp = distance(offsetLocationUp, cursorLocation);

    const offsetLocationDown = this.trainPathCache.getPointAtLength(stepDown);
    const distanceDown = distance(offsetLocationDown, cursorLocation);

    if (distanceUp <= distanceDown) {
      return PathDirection.Up;
    }
    else {
      return PathDirection.Down;
    }
  }

  private fitIntervalWidth(intervallWidth: number, offset: number, 
    cursorLocation: Point) {
      const maxPathLength = this.trainPathCache.getTotalLength();
      const searchDirection = this.getSearchDirection(offset, cursorLocation);
      
      if (searchDirection === PathDirection.Up) {
        if (maxPathLength < offset + intervallWidth) {
          intervallWidth = maxPathLength - offset;
        }
      }

      if (searchDirection === PathDirection.Down) {
        if (offset - intervallWidth < 0) {
          intervallWidth = offset;
        }
      }

      return intervallWidth;



  }

  private handleMouseUp() {
    if (this.isTrainDrag) {
      this.isTrainDrag = false;
      this.finishingDrag = true;
    }
  }

  


}
