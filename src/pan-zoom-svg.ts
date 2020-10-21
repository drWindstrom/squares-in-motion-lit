import { LitElement, html, customElement, property, query } from 'lit-element';
import { Square, SquareCanvas, TrainCanvas } from './interfaces/interfaces';
import { originTemplate } from './templates';
import { squareTemplate, SquareHandlers } from './square';
import { TrainHandlers, trainTemplate } from './train';

@customElement('pan-zoom-svg')
export class PanZoomSvg extends LitElement
  implements SquareCanvas, TrainCanvas {
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

  @property({ type: Object })
  train = {
    x: 0,
    y: 0,
    offset: 0,
    pathId: 'dragPath',
    rotation: 0,
    isSelected: false,
  };

  @query('svg')
  svg!: SVGSVGElement;

  @query('#dragPath')
  dragPath!: SVGPathElement;

  squareHandlers = new SquareHandlers(this);
  trainHandlers = new TrainHandlers(this);

  constructor() {
    super();
    // Register event handlers
    this.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.addEventListener('wheel', (e) => this.handleWheel(e));
    window.addEventListener('resize', () => this.setViewportSize());
    window.addEventListener('mouseup', () => this.handleMouseUp());
  }

  firstUpdated() {
    this.setViewportSize();
    this.setViewBoxMin();
    const dragPathStart = this.dragPath.getPointAtLength(this.train.offset);
    this.train = {
      ...this.train,
      x: dragPathStart.x,
      y: -dragPathStart.y,
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
    return this.viewportWidth / this.zoom;
  }

  get viewboxHeight(): number {
    return this.viewportHeight / this.zoom;
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
      >
        <path
          id="dragPath"
          d="M 36.100951,-910.06048 H 827.62683 l 166.68601,166.38064 
            V -480.6311 L 1208.956,-266.38117 808.8766,-35.81835 
            H 388.09716 c 0,0 -427.431999,-3.42393 -249.56346,-264.48957
            205.08356,-301.01038 730.06623,-141.28412 474.9155,-7.436 -255.15068,
            133.8481 -227.21447,-139.42514 -342.6841,14.87202 -115.46966,
            154.2971 270.04997,156.15612 270.04997,156.15612 0,0 
            402.2814,24.16706 430.21759,-107.82208 C 998.96886,-376.527 
            815.89213,-468.9673 712.15718,-623.77422 672.58182,-682.83374 
            548.26473,-677.68529 548.26473,-677.68529 H 26.788881"
          fill="none"
          stroke="rgb(85,160,185)"
          stroke-width="2"
        />

        ${trainTemplate(
          this.train,
          (e) => this.trainHandlers.click(e),
          (e) => this.trainHandlers.mouseDown(e)
        )}
        ${originTemplate({ x: 0, y: 0 }, 100, 2)}
        ${this.squares.map((square) =>
          squareTemplate(
            square,
            () => this.squareHandlers.mouseEnter(square),
            () => this.squareHandlers.mouseLeave(square),
            (e) => this.squareHandlers.click(e, square),
            (e) => this.squareHandlers.mouseDown(e, square)
          )
        )}
      </svg>
    `;
  }

  clientToCanvasCoordinates(e: MouseEvent) {
    const CTM = this.svg.getScreenCTM();
    const mousePos = { x: 0, y: 0 };
    if (CTM) {
      mousePos.x = (e.clientX - CTM.e) / CTM.a;
      mousePos.y = (e.clientY - CTM.f) / CTM.d;
    }
    return mousePos;
  }

  isPan = false;
  lastMousePosition = { x: 0, y: 0 };

  private handleMouseDown(e: MouseEvent) {
    const MIDDLE_BUTTON = 1;
    if (e.button === MIDDLE_BUTTON) {
      this.isPan = true;
      this.lastMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isPan) {
      const mousePosition = { x: e.clientX, y: e.clientY };
      const deltaX = mousePosition.x - this.lastMousePosition.x;
      const deltaY = mousePosition.y - this.lastMousePosition.y;
      this.viewBoxMinX -= deltaX / this.zoom;
      this.viewBoxMinY -= deltaY / this.zoom;
      // Save last mouse position
      this.lastMousePosition = mousePosition;
    }
  }

  private handleMouseUp() {
    if (this.isPan) {
      this.isPan = false;
    }
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();
    // Before zoom
    const xBeforeZoom = e.offsetX / this.zoom;
    const yBeforeZoom = e.offsetY / this.zoom;
    // Update zoom
    let zoomFaktor = 1.0;
    e.deltaY < 0 ? (zoomFaktor = 0.90) : (zoomFaktor = 1/0.9);
    this.zoom *= zoomFaktor;
    // After zoom
    const xAfterZoom = e.offsetX / this.zoom;
    const yAfterZoom = e.offsetY / this.zoom;
    // Calculate shift due to zoom
    const deltaX = xBeforeZoom - xAfterZoom;
    const deltaY = yBeforeZoom - yAfterZoom;
    // Translate coordinate system to prevent shift due to zoom
    this.viewBoxMinX += deltaX;
    this.viewBoxMinY += deltaY;
    console.log(`zoom: ${this.zoom}`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pan-zoom-svg': PanZoomSvg;
  }
}
