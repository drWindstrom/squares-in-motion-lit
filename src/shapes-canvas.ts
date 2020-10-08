import {LitElement, html, customElement, property, svg} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map.js';
import {Square} from './interfaces/square-interface';

function squareTemplate(
  id: number,
  square: Square,
  enableHighlight,
  disableHighlight,
  toggleSelect
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
      style=${styleMap(styles)}
    ></rect>
  `;
}

@customElement('shapes-canvas')
export class ShapesCanvas extends LitElement {
  @property({type: Number})
  canvasWidth = 0;

  @property({type: Number})
  canvasHeight = 0;

  @property({type: Array})
  squares: Square[] = [];

  render() {
    if (this.squares.length === 0) {
      return html`No shapes to render`;
    }
    return html`
      <svg
        version="1.1"
        width=${this.canvasWidth}
        height=${this.canvasHeight}
        xmlns="http://www.w3.org/2000/svg"
        @click=${this._deselectAllSquares}
      >
        ${this.squares.map((square, id) =>
          squareTemplate(
            id,
            square,
            (e) => {e.stopPropagation(); this._enableHighlight(square)},
            (e) => {e.stopPropagation(); this._disableHighlight(square)},
            (e) => {e.stopPropagation(); this._toggleSelect(square)}
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

  private _deselectAllSquares() {
    this.squares = this.squares.map((square) => {
      square.isSelected = false;
      return square;
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shapes-canvas': ShapesCanvas;
  }
}
