import {LitElement, html, customElement, property, css} from 'lit-element';
import './shapes-canvas';
import { Square } from './interfaces/square-interface';


@customElement('shapes-in-motion-app')
export class ShapesInMotionApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 4px;
      
    }
    
    #canvas-container {
      border-style: solid;
      border-width: 1px;
      padding: 0px;
      margin: 4px;
      background-color: rgb(245, 245, 245);
      width: 100%;
      height: 99vh;
      overflow: auto;
    }

    .flex-column {
      display: flex;
      flex-direction: column;
    }

    .flex-row {
      display: flex;
      flex-direction: row;
    }

    #input-parameters {
      width: 160px;
    }

    input {
      margin-left: 5px;
      margin-right: 10px;
    }

    label {
      margin-top: 10px;
      margin-left: 5px;
    }

    button {
      margin-top: 15px;
      width: 60px;
    }

    #buttons {
      align-self: center;
    }
  `;
  
  @property({type: Number})
  canvasWidth = 0;

  @property({type: Number})
  canvasHeight = 0;

  @property({ type: Array })
  squares: Square[] = []; 

  rotation: number = 0;
  intervalId!:NodeJS.Timeout;
    
  render() {
    return html`
      <div class="flex-row">
        <div class="flex-column" id="input-parameters">
          <label for="side-length">Side length:</label>
          <input type="number" id="side-length" name="side-length">
          <label for="num-squares">Number of squares:</label>
          <input type="number" id="num-squares" name="num-squares">
          <label for="num-spinning">Number spinning:</label>
          <input type="number" id="num-spinning" name="num-spinning">
          <div id="buttons">
            <button @click=${this._startButton}>Start</button>
            <button @click=${this._stopButton}>Stop</button>
          </div> 
        </div>
        <div id="canvas-container">
          <shapes-canvas 
            .canvasWidth=${this.canvasWidth}
            .canvasHeight=${this.canvasHeight}
            .squares=${this.squares}
          ></shapes-canvas>
        </div>
      </div>
    `;
  }

  private _startButton() {
    // Get sideLength
    const sideLengthInput = this.shadowRoot?.getElementById('side-length') as HTMLInputElement;
    const sideLength = Number(sideLengthInput.value);
    // Get numberOfSquares
    const numberOfSquaresInput = this.shadowRoot?.getElementById("num-squares") as HTMLInputElement;
    const numberOfSquares = Number(numberOfSquaresInput.value);
    // Get numberSpinning
    const numberSpinningInput = this.shadowRoot?.getElementById("num-spinning") as HTMLInputElement;
    const numberSpinning = Number(numberSpinningInput.value);
    
    this._createSquares(numberOfSquares, sideLength, numberSpinning);
    this._setMaxCanvasWidthAndHeight();
    this.intervalId = setInterval(() => {
      this._createSquares(numberOfSquares, sideLength, numberSpinning)
    }, 1000/60);
  }

  private _createSquares(numberOfSquares: number, sideLength: number, numberSpinning: number) {
    const squaresPerRow = Math.round(Math.sqrt(numberOfSquares));
    const distance = 1.75*sideLength;
    const squares: Square[] = [];
    for (let n = 1; n <= numberOfSquares; n++) {
      const row = Math.ceil(n/squaresPerRow); 
      const colum = n - (row - 1)*squaresPerRow
      const x =  distance*colum;
      const y = distance*row;
      const square: Square = {
        x: x,
        y: y,
        sideLength: sideLength,
        rotation: (n <= numberSpinning) ? this.rotation : 0  
      }
      squares.push(square);
    }
    this.rotation++;
    this.squares = squares;
  }

  private _setMaxCanvasWidthAndHeight() {
    let maxWidth = 0;
    let maxHeight = 0;
    for (const square of this.squares.values()) {
      if (square.x > maxWidth) {
        maxWidth = square.x;
      }
      if (square.y > maxHeight) {
        maxHeight = square.y;
      }
    }
    const distance = this.squares[0].sideLength*1.75;
    this.canvasWidth = maxWidth + distance;
    this.canvasHeight = maxHeight + distance;
  }

_stopButton() {
  clearInterval(this.intervalId);
}
}

declare global {
  interface HTMLElementTagNameMap {
    'shapes-in-motion-app': ShapesInMotionApp;
  }
}