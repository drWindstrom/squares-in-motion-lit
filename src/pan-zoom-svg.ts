import { LitElement, html, customElement, property, query } from 'lit-element';
import { Square } from './interfaces/interfaces';
import { squareTemplate, originTemplate, trainTemplate } from './templates';

@customElement('pan-zoom-svg')
export class PanZoomSvg extends LitElement {
  @property({ type: Array })
  squares: Square[] = [];

  @property({ type: Number })
  viewBoxMinX = 0;

  @property({ type: Number })
  viewBoxMinY = 0;

  @property({ type: Number })
  viewportWidth = 0;

  @property({ type: Number })
  viewportHeight = 0;

  @property({ type: Number })
  zoom = 1;

  @property({ type: Object})
  train = {
    x: 0,
    y: 0,
    rotation: 0,
  };
  
  @query('svg')
  svg!: SVGAElement;

  @query('#dragPath')
  dragPath!: SVGPathElement;

  constructor() {
    super();
    window.onresize = () => this.setViewportSize();
    window.onmouseup = () => this.handleMouseUp();
  }

  firstUpdated() {
    this.setViewportSize();
    this.setViewBoxMin();
    const dragPathStart = this.dragPath.getPointAtLength(0);
    this.train = {
      x: dragPathStart.x,
      y: dragPathStart.y,
      rotation: 0,
    };
  }

  private setViewportSize() {
    this.viewportWidth = this.svg.clientWidth;
    this.viewportHeight = this.svg.clientHeight;
  }

  private setViewBoxMin() {
    const offset = 50;
    this.viewBoxMinX = -offset;
    this.viewBoxMinY = -this.svg.clientHeight + offset;
  }

  get viewboxWidth(): number {
    return this.zoom * this.viewportWidth;
  }

  get viewboxHeight(): number {
    return this.zoom * this.viewportHeight;
  }

  render() {
    return html`
      <svg
        version="1.1"
        width="100%"
        height="100%"
        viewBox="${this.viewBoxMinX} ${this.viewBoxMinY} 
                 ${this.viewboxWidth} ${this.viewboxHeight}"
        xmlns="http://www.w3.org/2000/svg"
        @click=${this.handleSvgClick}
        @mousedown=${this.handleSvgMouseDown}
        @mousemove=${this.handleSvgMouseMove}
        @wheel=${this.handleSvgWheel}
      >
        <path
          id='dragPath'
          d='M 36.100951,-910.06048 H 827.62683 l 166.68601,166.38064 
            V -480.6311 L 1208.956,-266.38117 808.8766,-35.81835 
            H 388.09716 c 0,0 -427.431999,-3.42393 -249.56346,-264.48957
            205.08356,-301.01038 730.06623,-141.28412 474.9155,-7.436 -255.15068,
            133.8481 -227.21447,-139.42514 -342.6841,14.87202 -115.46966,
            154.2971 270.04997,156.15612 270.04997,156.15612 0,0 
            402.2814,24.16706 430.21759,-107.82208 C 998.96886,-376.527 
            815.89213,-468.9673 712.15718,-623.77422 672.58182,-682.83374 
            548.26473,-677.68529 548.26473,-677.68529 H 26.788881'
          fill='none'
          stroke='rgb(85,160,185)'
          stroke-width='2'
        />
        ${trainTemplate(this.train.x, this.train.y, this.train.rotation)}
        
        ${originTemplate({ x: 0, y: 0 }, 100, 2)}
        ${this.squares.map((square) =>
          squareTemplate(
            square,
            () => this.handleSquareMouseEnter(square),
            () => this.handleSquareMouseLeave(square),
            (e) => this.handleSquareClick(e, square),
            (e) => this.handleSquareMouseDown(e, square)
          )
        )}
      </svg>
    `;
  }

  private handleSquareMouseEnter(changed: Square) {
    this.squares = this.squares.map((square) => {
      if (square === changed) {
        square = { ...square, isHighligted: true };
      }
      return square;
    });
  }

  private handleSquareMouseLeave(changed: Square) {
    this.squares = this.squares.map((square) => {
      if (square === changed) {
        square = { ...square, isHighligted: false };
      }
      return square;
    });
  }

  private handleSquareClick(e: MouseEvent, changed: Square) {
    // Prevent the click event after dragging a square
    if (this.finishingDrag) {
      this.finishingDrag = false;
      e.stopPropagation();
      return;
    }
    // Regular click to select the square
    e.stopPropagation();
    this.squares = this.squares.map((square) => {
      if (square === changed) {
        square = { ...square, isSelected: !square.isSelected };
      }
      return square;
    });
  }

  private handleSvgClick(e: MouseEvent) {
    const MAIN_BUTTON = 0;
    if (e.button === MAIN_BUTTON) {
      // Deselect all squares
      this.squares = this.squares.map((square) => {
        return { ...square, isSelected: false };
      });
    }
  }

  private clientToSvgUserSpaceCoordinates(e: MouseEvent) {
    const CTM = this.svg.getScreenCTM();
    const mousePos = { x: 0, y: 0 };
    if (CTM) {
      mousePos.x = (e.clientX - CTM.e) / CTM.a;
      mousePos.y = -(e.clientY - CTM.f) / CTM.d;
    }
    return mousePos;
  }

  isSquareDrag = false;
  isPan = false;
  finishingDrag = false;
  lastMousePosition = { x: 0, y: 0 };
  lastUpdate = 0;

  private handleSquareMouseDown(e: MouseEvent, changed: Square) {
    const MAIN_BUTTON = 0;
    if (changed.isSelected && e.button === MAIN_BUTTON) {
      e.stopPropagation();
      this.isSquareDrag = true;
      this.lastMousePosition = this.clientToSvgUserSpaceCoordinates(e);
    }
  }

  private handleSvgMouseDown(e: MouseEvent) {
    const MIDDLE_BUTTON = 1;
    if (e.button === MIDDLE_BUTTON) {
      this.isPan = true;
      this.lastMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };
    }
  }

  private handleSvgMouseMove(e: MouseEvent) {
    // Throttle
    // if(Date.now() - this.lastUpdate < 1000/30) {
    //   return;
    // }
    // this.lastUpdate = Date.now();
    // Dragging a square
    if (this.isSquareDrag) {
      const mousePosition = this.clientToSvgUserSpaceCoordinates(e);
      const deltaX = mousePosition.x - this.lastMousePosition.x;
      const deltaY = mousePosition.y - this.lastMousePosition.y;
      if (this.isSquareDrag) {
        this.squares = this.squares.map((square) => {
          if (square.isSelected) {
            // Move the square to the next position
            square = {
              ...square,
              x: square.x + deltaX,
              y: square.y + deltaY,
            };
          }
          return square;
        });
      }
      // Save last mouse position
      this.lastMousePosition = mousePosition;
    }
    // Panning
    if (this.isPan) {
      const mousePosition = { x: e.clientX, y: e.clientY };
      const deltaX = mousePosition.x - this.lastMousePosition.x;
      const deltaY = mousePosition.y - this.lastMousePosition.y;
      this.viewBoxMinX -= deltaX * this.zoom;
      this.viewBoxMinY -= deltaY * this.zoom;
      // Save last mouse position
      this.lastMousePosition = mousePosition;
    }
  }

  private handleMouseUp() {
    if (this.isSquareDrag) {
      this.isSquareDrag = false;
      this.finishingDrag = true;
    }
    this.isPan = false;
  }

  private handleSvgWheel(e: WheelEvent) {
    e.preventDefault();
    // Before zoom
    const xBeforeZoom = e.offsetX * this.zoom;
    const yBeforeZoom = e.offsetY * this.zoom;
    // Update zoom
    let zoomFaktor = 1.0;
    e.deltaY < 0 ? (zoomFaktor = 0.9) : (zoomFaktor = 1.1);
    this.zoom /= zoomFaktor;
    // After zoom
    const xAfterZoom = e.offsetX * this.zoom;
    const yAfterZoom = e.offsetY * this.zoom;
    // Calculate shift due to zoom
    const deltaX = xBeforeZoom - xAfterZoom;
    const deltaY = yBeforeZoom - yAfterZoom;
    // Translate coordinate system to prevent shift due to zoom
    this.viewBoxMinX += deltaX;
    this.viewBoxMinY += deltaY;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pan-zoom-svg': PanZoomSvg;
  }
}
