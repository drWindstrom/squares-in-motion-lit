import { svg } from 'lit-element';
import { Train, TrainCanvas } from './interfaces/interfaces';
import { invertYAxis } from './utils';

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
  private lastMousePosition = { x: 0, y: 0 };

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
      this.lastMousePosition = this.canvas.clientToCanvasCoordinates(e);
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
      const mousePosition = this.canvas.clientToCanvasCoordinates(e);
      const deltaX = mousePosition.x - this.lastMousePosition.x;
      const deltaY = mousePosition.y - this.lastMousePosition.y;
      // Move train to next position
      this.canvas.train = {
        ...this.canvas.train,
        x: this.canvas.train.x + deltaX,
        y: this.canvas.train.y + deltaY,
      };
      // Save last mouse position
      this.lastMousePosition = mousePosition;
    }
  }

  private handleMouseUp() {
    if (this.isTrainDrag) {
      this.isTrainDrag = false;
      this.finishingDrag = true;
    }
  }
}
