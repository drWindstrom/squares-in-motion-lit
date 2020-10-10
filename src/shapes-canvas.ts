import {LitElement, html, customElement, property, svg, query, css} from 'lit-element';
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
  static styles = css`
    :host {
      display: flex;
    }

    #canvas-container {
      overflow: scroll;
      flex: 1;
    }

    svg {
      border-width: 2px;
      border-style: solid;
    }
  `;
  
  @property({type: Number})
  minViewBoxWidth = 0;

  @property({type: Number})
  minViewBoxHeight = 0;

  @property({type: Number})
  svgZoom = 1;

  @property({type: Number})
  viewBoxZoom = 1;

  @property({type: Array})
  squares: Square[] = [];
  
  @property({type: Number})  
  minimumSvgWidth: number = 0;
  
  @property({type: Number})
  minimumSvgHeight: number = 0;

  @query('svg')
  svg!: SVGAElement;

  @query('div')
  svgContainer!: HTMLElement;

  draggedSqaure: Square | undefined = undefined;
  dragStartPointerPosition = {x: 0, y: 0};

  constructor() {
    super();
    window.onresize = () => this._setMinimumSvgSize();
  }

  firstUpdated() {
   this._setMinimumSvgSize();
  }

  private _setMinimumSvgSize() {
    this.minimumSvgWidth = this.svgContainer.clientWidth;
    this.minimumSvgHeight = this.svgContainer.clientHeight;
  }

  get svgWidth(): number {
    return this.svgZoom * this.minimumSvgWidth
  }

  get svgHeight(): number {
    return this.svgZoom * this.minimumSvgHeight;    
  }

  get viewWidth(): number {
    return this.viewBoxZoom * this.minimumSvgWidth;
  }

  get viewHeight(): number {
    return this.viewBoxZoom * this.minimumSvgHeight;    
  }
  
  render() {
    return html`
      <div id="canvas-container">
        <svg
          version="1.1"
          width=${this.svgWidth}
          height=${this.svgHeight}
          viewBox="0 0 ${this.viewWidth} ${this.viewHeight}"
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
      </div>
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
    let mousePos = {x: 0, y: 0};
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
    if (this.svgZoom <= 1.0 && this.viewBoxZoom <= 1.0 && zoomFaktor > 1.0 ) {
      this.svgZoom = this.svgZoom * zoomFaktor;
      return;
    }
    if (this.svgZoom <= 1.0 && this.viewBoxZoom <= 1.0 && zoomFaktor < 1.0 ) {
      this.viewBoxZoom = this.viewBoxZoom / zoomFaktor;
      return;
    }
    if (this.svgZoom > 1.0) {
      this.svgZoom = this.svgZoom * zoomFaktor;
      return;
    }
    if (this.viewBoxZoom > 1.0) {
      this.viewBoxZoom = this.viewBoxZoom / zoomFaktor;
      return;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shapes-canvas': ShapesCanvas;
  }
}
