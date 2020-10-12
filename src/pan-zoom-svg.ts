import {LitElement, html, customElement, property, svg, query} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map.js';
import {Square} from './interfaces/square-interface';
import {Point} from './interfaces/point_interface';
import { invertYAxis } from './utils';

function squareTemplate(
  id: number,
  square: Square,
  handleSquareMouseEnter: (e: MouseEvent) => void,
  handleSquareMouseLeave: (e: MouseEvent) => void,
  handleSquareClick: (e: MouseEvent) => void,
  handleSquareMouseDown: (e: MouseEvent) => void
) {
  // Default style
  let strokeColor = 'black';
  let strokeWidth = '0';
  let cursorStyle = 'grab';
  // Highlighted only
  if (square.isHighligted && !square.isSelected) {
    strokeColor = 'rgb(85,160,185)';
    strokeWidth = '2';
  }
  // Selected only
  if (square.isSelected && !square.isHighligted) {
    strokeColor = 'rgb(175,35,95)';
    strokeWidth = '2';
  }
 // Highlighted and selected   
 if (square.isSelected && square.isHighligted) {
    strokeColor = 'rgb(175,35,95)';
    strokeWidth = '2';
    cursorStyle = 'move';
  }

  const styles = {
    cursor: cursorStyle,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
  };
  let location = {
    x: square.coordinate.x - square.sideLength / 2.0,
    y: square.coordinate.y + square.sideLength / 2.0
  };
  location = invertYAxis(location);

  return svg`
    <rect 
      id=${'square' + id}
      x=${location.x} 
      y=${location.y} 
      width=${square.sideLength} 
      height=${square.sideLength} 
      rx=${square.sideLength / 10}
      ry=${square.sideLength / 10}
      transform='rotate (${square.rotation} ${square.coordinate.x} ${square.coordinate.y})'
      @mouseenter=${handleSquareMouseEnter}
      @mouseleave=${handleSquareMouseLeave}
      @click=${handleSquareClick}
      @mousedown=${handleSquareMouseDown}
      style=${styleMap(styles)}
    ></rect>
  `;
}

function originTemplate(origin: Point, size: number, strokeWidth: number) {
  let markerSize = 3 * strokeWidth;
  let xArrow = { x: origin.x + size, y: origin.y };
  let yArrow = { x: origin.x, y: origin.y + size };
  let xLabel = { x: xArrow.x - 4*markerSize , y: xArrow.y - 3*markerSize };
  let yLabel = { x: yArrow.x - 3*markerSize , y: yArrow.y - 4*markerSize };
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

  draggedSqaure: Square | undefined = undefined;
  dragStartPointerPosition = {x: 0, y: 0};

  constructor() {
    super();
    window.onresize = () => this._setViewportSize();
  }

  firstUpdated() {
   this._setViewportSize();
  }

  private _setViewportSize() {
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
        viewBox="-50 -500 ${this.viewboxWidth} ${this.viewboxHeight}"
        xmlns="http://www.w3.org/2000/svg"
        @click=${(e: MouseEvent) => this.handleSvgClick(e)}
        @mousemove=${(e: MouseEvent) => this.handleSvgMouseMove(e)}
        @mouseup=${() => this.handleSvgMouseUp()}
        @wheel=${(e: WheelEvent) => this.handleSvgWheel(e)}
      >
        ${originTemplate({x: 0, y: 0}, 100, 2)}
        ${this.squares.map((square, id) =>
          squareTemplate(
            id,
            square,
            (e) => {e.stopPropagation(); this.handleSquareMouseEnter(square)},
            (e) => {e.stopPropagation(); this.handleSquareMouseLeave(square)},
            (e) => {e.stopPropagation(); this.handleSquareClick(square)},
            (e) => {this._startDrag(e, square)}
          )
        )}
      </svg>
    `;
  }

  private handleSquareMouseEnter(changedSquare: Square) {
    this.squares = this.squares.map((square) => {
      if (square === changedSquare) {
        square.isHighligted = true;
        return square;
      }
      return square;
    });
  }

  private handleSquareMouseLeave(changedSquare: Square) {
    this.squares = this.squares.map((square) => {
      if (square === changedSquare) {
        square.isHighligted = false;
        return square;
      }
      return square;
    })
  }

  private handleSquareClick(clickedSquare: Square) {
    this.squares = this.squares.map((square) => {
      if (square === clickedSquare) {
        square.isSelected = !square.isSelected;
      }
      return square;
    })
  }

  private handleSvgClick(e: MouseEvent) {
    // Print mouse coordinates to console
    const mousePositon = this.convertClientViewportToSvgUserSpace(e);
    console.log(`SVG user space [x: ${mousePositon.x}, y: ${mousePositon.y}]`)
    // Deselect all squares
    this.squares = this.squares.map((square) => {
      square.isSelected = false;
      return square;
    })
  }

  private convertClientViewportToSvgUserSpace(e: MouseEvent) {
    const CTM = this.svg.getScreenCTM();
    const mousePos = {x: 0, y: 0};
    if (CTM) {
      mousePos.x = ((e.clientX - CTM.e) / CTM.a);
      mousePos.y = -(e.clientY - CTM.f) / CTM.d;
    }
    return mousePos;
  }

  private _startDrag(evt: MouseEvent, clickedSquare: Square) {
    if (clickedSquare.isSelected) {
      this.draggedSqaure = clickedSquare;
      this.dragStartPointerPosition = this.convertClientViewportToSvgUserSpace(evt);
    }
  }

  private handleSvgMouseMove(evt: MouseEvent) {
    if (this.draggedSqaure) {
      const currentPointerPosition = this.convertClientViewportToSvgUserSpace(evt);
      const deltaX = currentPointerPosition.x - this.dragStartPointerPosition.x;
      const deltaY = currentPointerPosition.y - this.dragStartPointerPosition.y;
      this.squares = this.squares.map((square) => {
        if (square.isSelected) {
          square.coordinate.x -= deltaX;
          square.coordinate.y -= deltaY;
          return square;
        }
        return square;
      })
      this.dragStartPointerPosition = currentPointerPosition;
    }
  }

  private handleSvgMouseUp() {
    this.draggedSqaure = undefined;
  }

  private handleSvgWheel(evt: WheelEvent) {
    evt.preventDefault();
    let zoomFaktor = 1.0;
    (evt.deltaY < 0) ? zoomFaktor = 0.9 : zoomFaktor = 1.1;
    this.zoom /= zoomFaktor;
  }  
}

declare global {
  interface HTMLElementTagNameMap {
    'pan-zoom-svg': PanZoomSvg;
  }
}
