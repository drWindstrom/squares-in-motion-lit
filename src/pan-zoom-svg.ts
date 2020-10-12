import {
  LitElement,
  html,
  customElement,
  property,
  svg,
  query,
} from 'lit-element';
import {Square} from './interfaces/square-interface';
import {Point} from './interfaces/point_interface';
import {invertYAxis} from './utils';

function squareTemplate(
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

  const center = invertYAxis(square.coordinate);

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
      transform='translate(${center.x} ${center.y}) rotate(${square.rotation})'
      @mouseenter=${onMouseEnter}
      @mouseleave=${onMouseLeave}
      @click=${onClick}
      @mousedown=${onMouseDown}
    ></rect>
  `;
}

function originTemplate(origin: Point, size: number, strokeWidth: number) {
  const markerSize = 3 * strokeWidth;
  let xArrow = {x: origin.x + size, y: origin.y};
  let yArrow = {x: origin.x, y: origin.y + size};
  let xLabel = {x: xArrow.x - 4 * markerSize, y: xArrow.y - 3 * markerSize};
  let yLabel = {x: yArrow.x - 3 * markerSize, y: yArrow.y - 4 * markerSize};
  // Invert y-axis
  xArrow = invertYAxis(xArrow);
  yArrow = invertYAxis(yArrow);
  xLabel = invertYAxis(xLabel);
  yLabel = invertYAxis(yLabel);
  const invOrigin = invertYAxis(origin);

  return svg`
    <marker 
      id="arrow" 
      viewBox="0 0 10 10" 
      refX="5" 
      refY="5"
      markerWidth=${markerSize} 
      markerHeight=${markerSize}
      orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" />
    </marker>
    <path 
      d='M ${yArrow.x} ${yArrow.y} 
         L ${invOrigin.x} ${invOrigin.y} 
         L ${xArrow.x} ${xArrow.y}'
      stroke="black"
      stroke-width=${strokeWidth}
      fill="none"
      marker-start="url(#arrow)"
      marker-end="url(#arrow)"
    />
    <text x=${xLabel.x} y=${xLabel.y} >X</text>
    <text x=${yLabel.x} y=${yLabel.y} >Y</text>
  `;
}

@customElement('pan-zoom-svg')
export class PanZoomSvg extends LitElement {
  @property({type: Array})
  squares: Square[] = [];

  @property({type: Number})
  viewportWidth = 0;

  @property({type: Number})
  viewportHeight = 0;

  @property({type: Number})
  zoom = 1;

  @query('svg')
  svg!: SVGAElement;

  isDrag = false;
  dragStartPosition = {x: 0, y: 0};

  constructor() {
    super();
    window.onresize = () => this.setViewportSize();
  }

  firstUpdated() {
    this.setViewportSize();
  }

  private setViewportSize() {
    this.viewportWidth = this.svg.clientWidth;
    this.viewportHeight = this.svg.clientHeight;
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
        viewBox="${-50} ${-this.viewportHeight + 50} ${this.viewboxWidth} ${this
          .viewboxHeight}"
        xmlns="http://www.w3.org/2000/svg"
        @click=${this.handleSvgClick}
        @mousemove=${this.handleSvgMouseMove}
        @mouseup=${this.handleSvgMouseUp}
        @wheel=${this.handleSvgWheel}
      >
        ${originTemplate({x: 0, y: 0}, 100, 2)}
        ${this.squares.map(square =>
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
    this.squares = this.squares.map(square => {
      if (square === changed) {
        square = {...square, isHighligted: true};
      }
      return square;
    });
  }

  private handleSquareMouseLeave(changed: Square) {
    this.squares = this.squares.map(square => {
      if (square === changed) {
        square = {...square, isHighligted: false};
      }
      return square;
    });
  }

  private handleSquareClick(e: MouseEvent, changed: Square) {
    e.stopPropagation();
    this.squares = this.squares.map(square => {
      if (square === changed) {
        square = {...square, isSelected: !square.isSelected}
      }
      return square;
    });
  }

  private handleSquareMouseDown(e: MouseEvent, changed: Square) {
    e.stopPropagation();
    if (changed.isSelected) {
      this.isDrag = true;
      this.dragStartPosition = this.clientToSvgUserSpaceCoordinates(e);
    }
  }

  private handleSvgClick(e: MouseEvent) {
    // Print mouse coordinates to console
    const mousePositon = this.clientToSvgUserSpaceCoordinates(e);
    console.log(`SVG user space [x: ${mousePositon.x}, y: ${mousePositon.y}]`);
    // Deselect all squares
    this.squares = this.squares.map((square) => {
      return {...square, isSelected: false};
    });
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

  private handleSvgMouseMove(e: MouseEvent) {
    if (!this.isDrag) {
      return;
    }
    const pointerPosition = this.clientToSvgUserSpaceCoordinates(e);
    const deltaX = pointerPosition.x - this.dragStartPosition.x;
    const deltaY = pointerPosition.y - this.dragStartPosition.y;
    this.squares = this.squares.map(square => {
      if (square.isSelected) {
        // Move the square to the next position
        const nextPosition = {
          x: square.coordinate.x + deltaX,
          y: square.coordinate.y + deltaY
        };
        square = {...square, coordinate: nextPosition};
      }
      return square;
    });
    this.dragStartPosition = pointerPosition;
  }

  private handleSvgMouseUp() {
    this.isDrag = false;
  }

  private handleSvgWheel(e: WheelEvent) {
    e.preventDefault();
    let zoomFaktor = 1.0;
    e.deltaY < 0 ? (zoomFaktor = 0.9) : (zoomFaktor = 1.1);
    this.zoom /= zoomFaktor;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pan-zoom-svg': PanZoomSvg;
  }
}
