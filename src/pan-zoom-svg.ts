import {LitElement, html, customElement, property, query, SVGTemplateResult} from 'lit-element';
import {Square} from './interfaces/interfaces';
import {squareTemplate, originTemplate} from './templates';

@customElement('pan-zoom-svg')
export class PanZoomSvg extends LitElement {
  @property({type: Object})
  squares: Record<string, Square> = {};

  @property({type: Number})
  viewBoxMinX = 0;

  @property({type: Number})
  viewBoxMinY = 0;

  @property({type: Number})
  viewportWidth = 0;

  @property({type: Number})
  viewportHeight = 0;

  @property({type: Number})
  zoom = 1;

  @query('svg')
  svg!: SVGAElement;

  constructor() {
    super();
    window.onresize = () => this.setViewportSize();
    window.onmouseup = () => this.handleMouseUp();
  }

  firstUpdated() {
    this.setViewportSize();
    this.setViewBoxMin();
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
    const squareTemplates: SVGTemplateResult[] = [];
    for (const id in this.squares) {
      const square = this.squares[id];
      const template = squareTemplate(
        square,
        () => this.handleSquareMouseEnter(id),
        () => this.handleSquareMouseLeave(id),
        (e) => this.handleSquareClick(e, id),
        (e) => this.handleSquareMouseDown(e, id)
      )
      squareTemplates.push(template); 
    }
   
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
        ${originTemplate({x: 0, y: 0}, 100, 2)}
        ${squareTemplates}
      </svg>
    `;
  }

  private handleSquareMouseEnter(squareId: string) {
    this.squares = {...this.squares};
    const changed = this.squares[squareId];
    this.squares[squareId] = {
      ...changed,
      isHighligted: true,
    };
  }

  private handleSquareMouseLeave(squareId: string) {
    this.squares = {...this.squares};
    const changed = this.squares[squareId];
    this.squares[squareId] = {
      ...changed,
      isHighligted: false,
    };
  }

  private handleSquareClick(e: MouseEvent, squareId: string) {
    e.stopPropagation();
    
    this.squares = {...this.squares};
    const changed = this.squares[squareId];
    this.squares[squareId] = {
      ...changed,
      isSelected: !changed.isSelected,
    };
  }

  private handleSvgClick(e: MouseEvent) {
    const MAIN_BUTTON = 0;
    if (e.button === MAIN_BUTTON) {
      // Deselect all squares
      this.squares = {...this.squares};
      for (const id in this.squares) {
        this.squares[id] = {
          ...this.squares[id],
          isSelected: false,
        };
      }
    }
  }

  private clientToSvgUserSpaceCoordinates(e: MouseEvent) {
    const CTM = this.svg.getScreenCTM();
    const mousePos = {x: 0, y: 0};
    if (CTM) {
      mousePos.x = (e.clientX - CTM.e) / CTM.a;
      mousePos.y = -(e.clientY - CTM.f) / CTM.d;
    }
    return mousePos;
  }

  isSquareDrag = false;
  isPan = false;
  lastMousePosition = {x: 0, y: 0};
  lastUpdate = 0;

  private handleSquareMouseDown(e: MouseEvent, squareId: string) {
    const MAIN_BUTTON = 0;
    if (this.squares[squareId].isSelected && e.button === MAIN_BUTTON) {
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
        this.squares = { ...this.squares };
        for (const id in this.squares) {
          let square = this.squares[id];
          if (square.isSelected) {
            // Move the square to the next position
            this.squares[id] = {
              ...square,
              x: square.x + deltaX,
              y: square.y + deltaY,
            };
          }
        }
      }
      // Save last mouse position
      this.lastMousePosition = mousePosition;
    }
    // Panning
    if (this.isPan) {
      const mousePosition = {x: e.clientX, y: e.clientY};
      let deltaX = mousePosition.x - this.lastMousePosition.x;
      let deltaY = mousePosition.y - this.lastMousePosition.y;
      this.viewBoxMinX -= deltaX * this.zoom;
      this.viewBoxMinY -= deltaY * this.zoom;
      // Save last mouse position
      this.lastMousePosition = mousePosition;
    }
  }

  private handleMouseUp() {
    this.isSquareDrag = false;
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
