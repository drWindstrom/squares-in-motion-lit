import { svg } from 'lit-element';
import { invertYAxis } from './utils';
import { SquareCanvas, Square } from './interfaces/interfaces';


export function squareTemplate(
  square: Square,
  onMouseEnter: (e: MouseEvent) => void,
  onMouseLeave: (e: MouseEvent) => void,
  onClick: (e: MouseEvent) => void,
  onMouseDown: (e: MouseEvent) => void
) {
  // Default style
  let strokeColor = 'black';
  let strokeWidth = '0';
  let cursorStyle = 'grab';
  if (square.isHighligted && !square.isSelected) {
    // Highlighted only
    strokeColor = 'rgb(85,160,185)';
    strokeWidth = '2';
  } else if (square.isSelected && !square.isHighligted) {
    // Selected only
    strokeColor = 'rgb(175,35,95)';
    strokeWidth = '2';
  } else if (square.isSelected && square.isHighligted) {
    // Highlighted and selected
    strokeColor = 'rgb(175,35,95)';
    strokeWidth = '2';
    cursorStyle = 'move';
  }

  const center = invertYAxis({ x: square.x, y: square.y });

  return svg`
        <rect 
          x=${-square.sideLength / 2} 
          y=${-square.sideLength / 2} 
          width=${square.sideLength} 
          height=${square.sideLength} 
          rx=${square.sideLength / 10}
          ry=${square.sideLength / 10}
          stroke=${strokeColor}
          stroke-width=${strokeWidth}
          cursor=${cursorStyle}
          transform='translate(${center.x} ${center.y}) rotate(${
    square.rotation
  })'
          @mouseenter=${onMouseEnter}
          @mouseleave=${onMouseLeave}
          @click=${onClick}
          @mousedown=${onMouseDown}
        ></rect>
      `;
}

export class SquareHandlers {
  constructor(canvas: SquareCanvas) {
    this.canvas = canvas;
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
  }

  private canvas: SquareCanvas;
  private isSquareDrag = false;
  private finishingDrag = false;
  private lastMousePosition = { x: 0, y: 0 };
  
  mouseEnter(changed: Square) {
    const toggleHighlightSquareEvent = new CustomEvent('toggle-highlight-square', {
      detail: { changed: changed },
    });
    this.canvas.dispatchEvent(toggleHighlightSquareEvent);
  }

  mouseLeave(changed: Square) {
    const toggleHighlightSquareEvent = new CustomEvent('toggle-highlight-square', {
      detail: { changed: changed },
    });
    this.canvas.dispatchEvent(toggleHighlightSquareEvent);
  }

  click(e: MouseEvent, changed: Square) {
    // Prevent the click event after dragging a square
    if (this.finishingDrag) {
      this.finishingDrag = false;
      e.stopPropagation();
      return;
    }
    // Regular click to select the square
    e.stopPropagation();
    // Fire event
    const toggleSelectSquareEvent = new CustomEvent('toggle-select-square', {
      detail: { changed: changed },
    });
    this.canvas.dispatchEvent(toggleSelectSquareEvent);
  }

  mouseDown(e: MouseEvent, changed: Square) {
    const MAIN_BUTTON = 0;
    if (changed.isSelected && e.button === MAIN_BUTTON) {
      e.stopPropagation();
      this.isSquareDrag = true;
      this.lastMousePosition = this.canvas.clientToCanvasCoordinates(e);
    }
  }

  handleCanvasClick(e: MouseEvent) {
    const MAIN_BUTTON = 0;
    if (e.button === MAIN_BUTTON) {
      // Deselect all squares
      const deselectAllSquareEvent = new CustomEvent('deselect-all-squares');
      this.canvas.dispatchEvent(deselectAllSquareEvent);
    }
  }

  private handleCanvasMouseMove(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Throttle
    // if(Date.now() - this.lastUpdate < 1000/30) {
    //   return;
    // }
    // this.lastUpdate = Date.now();
    // Dragging a square
    if (this.isSquareDrag) {
      const mousePosition = this.canvas.clientToCanvasCoordinates(e);
      const deltaX = mousePosition.x - this.lastMousePosition.x;
      const deltaY = mousePosition.y - this.lastMousePosition.y;
      // Move slected squares to the next position
      const translateSelectedSquaresEvent = new CustomEvent('translate-selected-squares', {
        detail: { deltaX, deltaY },
      });
      this.canvas.dispatchEvent(translateSelectedSquaresEvent);
      // Save last mouse position
      this.lastMousePosition = mousePosition;
    }
  }

  private handleMouseUp() {
    if (this.isSquareDrag) {
      this.isSquareDrag = false;
      this.finishingDrag = true;
    }
  }

}
