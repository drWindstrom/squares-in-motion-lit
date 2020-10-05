import {LitElement, html, customElement, property, svg} from 'lit-element';
import {Square} from './interfaces/square-interface';

function squareTemplate(id: number, square: Square) {
  return svg`
    <rect 
      id=${'square' + id}
      x=${square.x - square.sideLength / 2.0} 
      y=${square.y - square.sideLength / 2.0} 
      width=${square.sideLength} 
      height=${square.sideLength} 
      transform='rotate (${square.rotation} ${square.x} ${square.y})'
    ></rect>
  `;
}

@customElement('shapes-canvas')
export class ShapesCanvas extends LitElement {
  @property({type: Number})
  canvasWidth = 0;

  @property({type: Number})
  canvasHeight = 0;

  @property({ type: Array })
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
      >
        ${ this.squares.map((square, id) => squareTemplate(id, square)) }
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shapes-canvas': ShapesCanvas;
  }
}
