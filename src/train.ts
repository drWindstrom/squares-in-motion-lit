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
      this.cursorLoc = this.canvas.clientToCanvasCoordinates(e);
    }
  }
  
  private lastUpdate = 0;
  private cachedPath!: SVGPathElement;
  private cursorLoc: Point = { x: 0, y: 0 }; 
  private previousCursorLoc: Point = { x: 0, y:0 };
  private maxPathLength = 0;
  private timeStamps: number[] = [];

  private handleCanvasMouseMove(e: MouseEvent) {
    // Throttle
    const now = Date.now();
    if(now - this.lastUpdate < 1000/60) {
      return;
    }
    this.lastUpdate = now;

    const t1 = performance.now();    
    if (this.isTrainDrag) {
      this.cachedPath = this.trainPath;
      this.maxPathLength = this.cachedPath.getTotalLength();
      // Save previous cursor location
      this.previousCursorLoc = this.cursorLoc;
      // Get current cursor location
      this.cursorLoc = this.canvas.clientToCanvasCoordinates(e);
      let trainOffset = this.canvas.train.offset;
      
      let intervalWidth = 2*distance(this.cursorLoc, this.previousCursorLoc);
      intervalWidth = this.fitIntervalWidth(intervalWidth, trainOffset);
      const stopIntervalWidth = 0.5 / this.canvas.zoom;

      while (intervalWidth > stopIntervalWidth) {
        const searchDirection = this.getSearchDirection(trainOffset);
        if (searchDirection === PathDirection.Up) {
          trainOffset = trainOffset + 0.5*intervalWidth;
        } 
        else { // Search in down direction
          trainOffset = trainOffset - 0.5*intervalWidth;
        }
        intervalWidth = 0.5 * intervalWidth;
      }
      
      // move train
      const nextTrainLocation = this.cachedPath.getPointAtLength(trainOffset);
      this.canvas.train = {
        ...this.canvas.train,
        x: nextTrainLocation.x,
        y: -nextTrainLocation.y,
        offset: trainOffset,
      }
      const t2 = performance.now();
      this.timeStamps.push(t2 - t1);
    }
  }

  // private handleCanvasMouseMove(e: MouseEvent) {
  //   // Throttle
  //   const now = Date.now();
  //   if(now - this.lastUpdate < 1000/60) {
  //     return;
  //   }
  //   this.lastUpdate = now;

  //   //const t1 = performance.now();    
  //   if (this.isTrainDrag) {
  //     this.cachedPath = this.trainPath;
  //     this.maxPathLength = this.cachedPath.getTotalLength();
  //     // Get current cursor location
  //     this.cursorLoc = this.canvas.clientToCanvasCoordinates(e);
  //     let trainOffset = this.canvas.train.offset;
      
  //     const searchDirection = this.getSearchDirection(trainOffset);
  //     const stepSize = 0.5 / this.canvas.zoom * searchDirection;
  //     let prevDistance = distance(this.cachedPath.getPointAtLength(trainOffset), this.cursorLoc);
  //     let nextDistance = distance(this.cachedPath.getPointAtLength(trainOffset + stepSize), this.cursorLoc);
  //     while (prevDistance > nextDistance) {
  //       trainOffset = trainOffset + stepSize;
  //       if (trainOffset > this.maxPathLength) {
  //         trainOffset = this.maxPathLength;
  //         break;
  //       }
  //       if (trainOffset < 0) {
  //         trainOffset = 0;
  //         break;
  //       }
  //       prevDistance = nextDistance;
  //       nextDistance = distance(this.cachedPath.getPointAtLength(trainOffset + stepSize), this.cursorLoc);
  //     }
           
  //     // move train
  //     const nextTrainLocation = this.cachedPath.getPointAtLength(trainOffset);
  //     this.canvas.train = {
  //       ...this.canvas.train,
  //       x: nextTrainLocation.x,
  //       y: -nextTrainLocation.y,
  //       offset: trainOffset,
  //     }
  //     //const t2 = performance.now();
  //     //this.timeStamps.push(t2 - t1);
  //   }
  // }

  getPerformance() {
    let sum = 0;
    for (const t of this.timeStamps) {
      sum = sum + t;
    }
    console.log(`Performanc: ${sum/this.timeStamps.length} ms`);
  }

  private getSearchDirection(offset: number) {
    const stepSize = 1;
    
    let stepUp = offset + stepSize;
    if (stepUp > this.maxPathLength) { stepUp = this.maxPathLength; }
    
    let stepDown = offset - stepSize;
    if (stepDown < 0) { stepDown = 0; }

    const offsetLocUp = this.cachedPath.getPointAtLength(stepUp);
    const offsetLocDown = this.cachedPath.getPointAtLength(stepDown);
    
    const distanceUp = distance(offsetLocUp, this.cursorLoc);
    const distanceDown = distance(offsetLocDown, this.cursorLoc);

    if (distanceUp <= distanceDown) {
      return PathDirection.Up;
    }
    return PathDirection.Down;
  }

  private fitIntervalWidth(intervallWidth: number, offset: number) {
    const searchDirection = this.getSearchDirection(offset);
    
    if (searchDirection === PathDirection.Up) {
      if (this.maxPathLength < offset + intervallWidth) {
        intervallWidth = this.maxPathLength - offset;
      }
    }
    else { // Search in down direction
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
