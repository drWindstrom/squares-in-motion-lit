import { svg } from 'lit-element';
import { Train, TrainCanvas } from './interfaces/interfaces';
import { invertYAxis, getVec, scalarProjection } from './utils';

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
  Up,
  Down,
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
  private startDrag = { x: 0, y: 0 };
 
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
      this.startDrag = this.canvas.clientToCanvasCoordinates(e);
    }
  }

  private handleCanvasMouseMove(e: MouseEvent) {
    // Throttle
    // if(Date.now() - this.lastUpdate < 1000/30) {
    //   return;
    // }
    // this.lastUpdate = Date.now();
    // Dragging a square
    if (this.isTrainDrag) {
      const endDrag = this.canvas.clientToCanvasCoordinates(e);
      const dragVector = getVec(this.startDrag, endDrag);
      const trainOffset = this.canvas.train.offset;
      const tagentUpVector = this.getTangentVectorAtOffset(trainOffset, PathDirection.Up);
      //const tagentDownVector =this.getTangentVectorAtOffset(trainOffset, PathDirection.Down);

      const dragMagnitudeUp = scalarProjection(dragVector, tagentUpVector);
      //const dragMagnitudeDown = scalarProjection(dragVector, tagentDownVector);
      
      let dragMagnitude = dragMagnitudeUp;
      // if (dragMagnitudeUp >= dragMagnitudeDown) {
      //   dragMagnitude = dragMagnitudeUp;
      // } else {
      //   dragMagnitude = -dragMagnitudeDown;
      // }
      console.log(`dragMagnitude: ${dragMagnitude}`);
      const maxPathLength = this.trainPath.getTotalLength();
      let nextTrainOffset = trainOffset + dragMagnitude;
      if (nextTrainOffset > maxPathLength) {
        nextTrainOffset = maxPathLength;
      }
      if (nextTrainOffset < 0) {
        nextTrainOffset = 0;
      }
      
      const trainLocation = this.trainPath.getPointAtLength(nextTrainOffset);

      // Move train to next position
      this.canvas.train = {
        ...this.canvas.train,
        x: trainLocation.x,
        y: -trainLocation.y,
        offset: nextTrainOffset,
      };
      // Save last mouse position
      this.startDrag = endDrag;
    }
  }
  

  private handleMouseUp() {
    if (this.isTrainDrag) {
      this.isTrainDrag = false;
      this.finishingDrag = true;
    }
  }

  private getTangentVectorAtOffset(offset: number, direction: PathDirection) {
    let tangentVector = {x: 0, y: 0};
    const pointAtOffset = this.trainPath.getPointAtLength(offset);
    
    if (direction === PathDirection.Up) {
      const pathLength = this.trainPath.getTotalLength();
      let deltaOffset = offset + 1;
      if (deltaOffset > pathLength) {
        deltaOffset = pathLength;
      }
      const pointAtDeltaOffset = this.trainPath.getPointAtLength(deltaOffset);
      tangentVector = getVec(pointAtOffset, pointAtDeltaOffset);
    }

    if (direction === PathDirection.Down) {
      let deltaOffset = offset - 1;
      if (deltaOffset < 0) {
        deltaOffset = 0;
      }
      const pointAtDeltaOffset = this.trainPath.getPointAtLength(deltaOffset);
      tangentVector = getVec(pointAtOffset, pointAtDeltaOffset);
    }

    return invertYAxis(tangentVector);
  }


}
