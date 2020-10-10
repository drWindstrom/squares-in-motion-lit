import {LitElement, html, customElement, property, svg, query} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map.js';
import {Square} from './interfaces/square-interface';

function squareTemplate(
  id: number,
  square: Square,
  enableHighlight: (e: MouseEvent) => void,
  disableHighlight: (e: MouseEvent) => void,
  toggleSelect: (e: MouseEvent) => void,
  startDrag: (e: MouseEvent) => void
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

  return svg`
    <rect 
      id=${'square' + id}
      x=${square.x - square.sideLength / 2.0} 
      y=${square.y - square.sideLength / 2.0} 
      width=${square.sideLength} 
      height=${square.sideLength} 
      rx=${square.sideLength / 10}
      ry=${square.sideLength / 10}
      transform='rotate (${square.rotation} ${square.x} ${square.y})'
      @mouseenter=${enableHighlight}
      @mouseleave=${disableHighlight}
      @click=${toggleSelect}
      @mousedown=${startDrag}
      style=${styleMap(styles)}
    ></rect>
  `;
}

@customElement('shapes-canvas')
export class ShapesCanvas extends LitElement {
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
        viewBox="0 0 ${this.viewboxWidth} ${this.viewboxHeight}"
        xmlns="http://www.w3.org/2000/svg"
        @click=${(e: MouseEvent) => this._deselectAllSquares(e)}
        @mousemove=${(e: MouseEvent) => this._drag(e)}
        @mouseup=${() => this._endDrag()}
        @wheel=${(e: WheelEvent) => this._zoom(e)}
      >
        ${this.squares.map((square, id) =>
          squareTemplate(
            id,
            square,
            (e) => {e.stopPropagation(); this._enableHighlight(square)},
            (e) => {e.stopPropagation(); this._disableHighlight(square)},
            (e) => {e.stopPropagation(); this._toggleSelect(square)},
            (e) => {this._startDrag(e, square)}
          )
        )}
      </svg>
    `;
  }

  private _enableHighlight(changedSquare: Square) {
    this.squares = this.squares.map((square) => {
      if (square === changedSquare) {
        square.isHighligted = true;
        return square;
      }
      return square;
    });
  }

  private _disableHighlight(changedSquare: Square) {
    this.squares = this.squares.map((square) => {
      if (square === changedSquare) {
        square.isHighligted = false;
        return square;
      }
      return square;
    })
  }

  private _toggleSelect(clickedSquare: Square) {
    this.squares = this.squares.map((square) => {
      if (square === clickedSquare) {
        square.isSelected = !square.isSelected;
      }
      return square;
    })
  }

  private _deselectAllSquares(evt: MouseEvent) {
    const mousePos = this._getMousePosition(evt);
    console.log(`Clicked x: ${mousePos.x} y: ${mousePos.y}`)
    this.squares = this.squares.map((square) => {
      square.isSelected = false;
      return square;
    })
  }

  private _getMousePosition(evt: MouseEvent) {
    const CTM = this.svg.getScreenCTM();
    const mousePos = {x: 0, y: 0};
    if (CTM) {
      mousePos.x = (evt.clientX - CTM.e) / CTM.a;
      mousePos.y = (evt.clientY - CTM.f) / CTM.d;
    }
    return mousePos;
  }

  private _startDrag(evt: MouseEvent, clickedSquare: Square) {
    if (clickedSquare.isSelected) {
      this.draggedSqaure = clickedSquare;
      this.dragStartPointerPosition = this._getMousePosition(evt);
    }
  }

  private _drag(evt: MouseEvent) {
    if (this.draggedSqaure) {
      const currentPointerPosition = this._getMousePosition(evt);
      const deltaX = currentPointerPosition.x - this.dragStartPointerPosition.x;
      const deltaY = currentPointerPosition.y - this.dragStartPointerPosition.y;
      this.squares = this.squares.map((square) => {
        if (square.isSelected) {
          square.x += deltaX;
          square.y += deltaY;
          return square;
        }
        return square;
      })
      this.dragStartPointerPosition = currentPointerPosition;
    }
  }

  private _endDrag() {
    this.draggedSqaure = undefined;
  }

  private _zoom(evt: WheelEvent) {
    evt.preventDefault();
    let zoomFaktor = 1.0;
    (evt.deltaY < 0) ? zoomFaktor = 0.9 : zoomFaktor = 1.1;
    this.zoom /= zoomFaktor;
  }  
}

declare global {
  interface HTMLElementTagNameMap {
    'shapes-canvas': ShapesCanvas;
  }
}
