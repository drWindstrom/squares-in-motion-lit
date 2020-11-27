import {LitElement, html, customElement, property, css} from 'lit-element';
import './pan-zoom-svg';
import './sidebar-inputs';
import {Square} from './interfaces/interfaces';


@customElement('squares-in-motion-lit')
export class SquaresInMotionLit extends LitElement {
  static styles = css`
    :host {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: row;
    }

    #input-parameters {
      width: 140px;
      margin-left: 10px;
      margin-right: 10px;
      display: flex;
      flex-direction: column;
    }

    pan-zoom-svg {
      flex: 1;
    }

    label {
      margin-top: 10px;
    }

    button {
      margin-top: 15px;
    }
  `;

  @property({ type: Array })
  squares: Square[] = [];

  render() {
    return html`
      <sidebar-inputs 
        @rotate-squares=${this.rotateSquares}
        @set-squares=${this.setSquares}
      ></sidebar-inputs>
      <pan-zoom-svg 
        .squares=${this.squares}
        @toggle-highlight-square=${this.toggleHightlightSquare}
        @toggle-select-square=${this.toggleSelectSquare}
        @deselect-all-squares=${this.deselectAllSquare}
        @translate-selected-squares=${this.translateSelectedSquares}
      ></pan-zoom-svg>
    `;
  }

  private rotateSquares(e: CustomEvent<{numberSpinning: number}>) {
    const nextSquares = this.squares.map((square, n) => {
      if (n < e.detail.numberSpinning) {
        square = { ...square, rotation: square.rotation + 1 };
      }
      return square;
    });
    this.squares = nextSquares;
  }

  private setSquares(e: CustomEvent<{newSquares: Square[]}>) {
    this.squares = e.detail.newSquares;
  }

  private toggleHightlightSquare(e: CustomEvent<{changed: Square}>) {
    const nextSquares = this.squares.map((square) => {
      if (square === e.detail.changed) {
        square = { ...square, isHighligted: !square.isHighligted };
      }
      return square;
    });
    this.squares = nextSquares;
  }

  private toggleSelectSquare(e: CustomEvent<{changed: Square}>) {
    const nextSquares = this.squares.map((square) => {
      if (square === e.detail.changed) {
        square = { ...square, isSelected: !square.isSelected };
      }
      return square;
    });
    this.squares = nextSquares;
  }

  private deselectAllSquare() {
    const nextSquares = this.squares.map((square) => {
      return { ...square, isSelected: false };
    });
    this.squares = nextSquares;
  }

  private translateSelectedSquares(e: CustomEvent<{deltaX: number, deltaY: number}>) {
    const nextSquares = this.squares.map((square) => {
      if (square.isSelected) {
        square = {
          ...square,
          x: square.x + e.detail.deltaX,
          y: square.y - e.detail.deltaY,
        };
      }
      return square;
    });
    this.squares = nextSquares;
  }


}

declare global {
  interface HTMLElementTagNameMap {
    'squares-in-motion-lit': SquaresInMotionLit;
  }
}
