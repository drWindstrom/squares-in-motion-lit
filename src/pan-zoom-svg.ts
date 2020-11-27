import { LitElement, html, customElement, property, query } from 'lit-element';
import { Square, SquareCanvas } from './interfaces/interfaces';
import { originTemplate } from './origin-template';
import { squareTemplate, SquareHandlers } from './square-template';

const VIEW_BOX_OFFSET = 50;

@customElement('pan-zoom-svg')
export class PanZoomSvg extends LitElement
  implements SquareCanvas {
  @property({ type: Array })
  squares: Square[] = [];

  @property({ type: Number })
  viewportWidth = 0;

  @property({ type: Number })
  viewportHeight = 0;
  
  @property({ type: Number })
  viewBoxMinX = 0;

  @property({ type: Number })
  viewBoxMinY = 0;

  @property({ type: Number })
  zoom = 1;

  @query('svg')
  svg!: SVGSVGElement;

  squareHandlers = new SquareHandlers(this);
  
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
  }

  private setViewportSize() {
    this.viewportWidth = this.svg.clientWidth;
    this.viewportHeight = this.svg.clientHeight;
    this.viewBoxMinX = -VIEW_BOX_OFFSET;
    this.viewBoxMinY = -this.viewportHeight + VIEW_BOX_OFFSET;
  }

  private get viewboxWidth() {
    return this.viewportWidth / this.zoom;
  }

  private get viewboxHeight() {
    return this.viewportHeight / this.zoom;
  }

  render() {
    const squareItems = this.squares.map((square) => 
      squareTemplate(
        square,
        () => this.squareHandlers.mouseEnter(square),
        () => this.squareHandlers.mouseLeave(square),
        (e) => this.squareHandlers.click(e, square),
        (e) => this.squareHandlers.mouseDown(e, square)
      )
    );

    return html`
      <svg
        version="1.1"
        width="100%"
        height="100%"
        viewBox="${this.viewBoxMinX} ${this.viewBoxMinY} 
                 ${this.viewboxWidth} ${this.viewboxHeight}"
        xmlns="http://www.w3.org/2000/svg"
      >
        ${originTemplate({ x: 0, y: 0 }, 100, 2)}
        ${squareItems}
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
    e.preventDefault();
    e.stopPropagation();
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
