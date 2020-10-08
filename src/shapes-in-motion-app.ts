import {LitElement, html, customElement, property, css} from 'lit-element';
import './shapes-canvas';
import {Square} from './interfaces/square-interface';

@customElement('shapes-in-motion-app')
export class ShapesInMotionApp extends LitElement {
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
      display: flex;
      flex-direction: column;
    }

    #canvas-container {
      overflow: scroll;
      flex: 1;
    }

    label {
      margin-top: 10px;
    }

    button {
      margin-top: 15px;
    }
  `;

  @property({type: Number})
  canvasWidth = 0;

  @property({type: Number})
  canvasHeight = 0;

  @property({type: Number})
  measuredFps = 0;

  @property({type: Array})
  squares: Square[] = [];

  private intervalId: NodeJS.Timeout | undefined;
  private sideLength: number = 0;
  private numberOfSquares: number = 0;
  private numberSpinning: number = 0;
  private reqFps: number = 0;
  private lastT: number = 0;
  private _distance = () => this.sideLength * 1.75;

  render() {
    return html`
      <div id="input-parameters">
        <label for="side-length">Side length:</label>
        <input type="number" id="side-length" name="side-length" value="40"/>
        <label for="num-squares">Number of squares:</label>
        <input type="number" id="num-squares" name="num-squares" value="100"/>
        <label for="num-spinning">Number spinning:</label>
        <input type="number" id="num-spinning" name="num-spinning" value="10"/>
        <label for="req-fps">Frames per sec:</label>
        <input type="number" id="req-fps" name="req-fps" value="30" />
        <div>
          <button @click=${this._startButton}>Start</button>
          <button @click=${this._stopButton}>Stop</button>
        </div>
        <p>Measuring: ${this.measuredFps} fps</p>
      </div>
      <div id="canvas-container">
        <shapes-canvas
          .canvasWidth=${this.canvasWidth}
          .canvasHeight=${this.canvasHeight}
          .squares=${this.squares}
        ></shapes-canvas>
      </div>
    `;
  }

  private _startButton() {
    this._readInputs();
    this._createSquares();
    this._setMaxCanvasWidthAndHeight();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => {
      this._measureFps();      
      this._spinSquares();
    }
      , 1000 / this.reqFps);
  }

  private _readInputs() {
    // Get sideLength
    const sideLengthInput = this.shadowRoot?.getElementById(
      'side-length'
    ) as HTMLInputElement;
    this.sideLength = Number(sideLengthInput.value);
    // Get numberOfSquares
    const numberOfSquaresInput = this.shadowRoot?.getElementById(
      'num-squares'
    ) as HTMLInputElement;
    this.numberOfSquares = Number(numberOfSquaresInput.value);
    // Get numberSpinning
    const numberSpinningInput = this.shadowRoot?.getElementById(
      'num-spinning'
    ) as HTMLInputElement;
    this.numberSpinning = Number(numberSpinningInput.value);
    // Get frames per sec
    const fpsInput = this.shadowRoot?.getElementById(
      'req-fps'
    ) as HTMLInputElement;
    this.reqFps = Number(fpsInput.value);
  }

  private _createSquares() {
    const squaresPerRow = Math.round(Math.sqrt(this.numberOfSquares));
    const squares: Square[] = [];
    for (let n = 1; n <= this.numberOfSquares; n++) {
      const row = Math.ceil(n / squaresPerRow);
      const colum = n - (row - 1) * squaresPerRow;
      const x = this._distance() * colum;
      const y = this._distance() * row;
      const square: Square = {
        x,
        y,
        sideLength: this.sideLength,
        rotation: 0,
        isHighligted: false,
        isSelected: false,
      };
      squares.push(square);
    }
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
    this.canvasWidth = maxWidth + this._distance();
    this.canvasHeight = maxHeight + this._distance();
  }

  private _measureFps() {
    // Check whether this is the first run
    if (this.lastT == 0) {
      this.lastT = performance.now();
      return;
    }
    const t = performance.now();
    const diff = t - this.lastT;
    this.measuredFps = Math.round(1000/diff);
    this.lastT = t;
  }

  private _spinSquares() {
    this.squares = this.squares.map((square, n) => {
      if (n < this.numberSpinning) {
        square.rotation++;
        return square;
      }
    
      return square;
    });
    
  }

  _stopButton() {
    if(this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shapes-in-motion-app': ShapesInMotionApp;
  }
}
