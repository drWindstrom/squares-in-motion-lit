import {LitElement, html, customElement, property, css, query} from 'lit-element';
import './pan-zoom-svg';
import {Square} from './interfaces/interfaces';
import { PanZoomSvg } from './pan-zoom-svg';

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

  @property({type: Number})
  measuredFps = 0;

  @query('pan-zoom-svg')
  canvas!: PanZoomSvg;

  private intervalId: NodeJS.Timeout | undefined = undefined;
  private sideLength = 0;
  private numberOfSquares = 0;
  private numberSpinning = 0;
  private reqFps = 0;
  private lastT = 0;
  
  private get distance() {
    return this.sideLength * 1.75;
  }

  render() {
    return html`
      <div id="input-parameters">
        <label for="side-length">Side length:</label>
        <input type="number" id="side-length" name="side-length" value="40"/>
        <label for="num-squares">Number of squares:</label>
        <input type="number" id="num-squares" name="num-squares" value="100"/>
        <label for="num-spinning">Number spinning:</label>
        <input type="number" id="num-spinning" name="num-spinning" value="0"/>
        <label for="req-fps">Frames per sec:</label>
        <input type="number" id="req-fps" name="req-fps" value="30" />
        <div>
          <button @click=${this.handleStartButtonClick}>Start</button>
          <button @click=${this.handleStopButtonClick}>Stop</button>
        </div>
        <p>Measuring: ${this.measuredFps} fps</p>
      </div>
      <pan-zoom-svg></pan-zoom-svg>
      </div>
    `;
  }

  private handleStartButtonClick() {
    this.readInputs();
    this.createSquares();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.numberSpinning > 0) {
      this.intervalId = setInterval(() => {
        this.measureFps();      
        this.spinSquares();
      }, 1000 / this.reqFps);
    }      
  }

  private readInputs() {
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

  private createSquares() {
    const squaresPerRow = Math.round(Math.sqrt(this.numberOfSquares));
    const squares: Square[] = [];
    for (let n = 1; n <= this.numberOfSquares; n++) {
      const row = Math.ceil(n / squaresPerRow);
      const colum = n - (row - 1) * squaresPerRow;
      const x = this.distance * colum;
      const y = this.distance * row;
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
    this.canvas.squares = squares;
  }

  private measureFps() {
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

  private spinSquares() {
    this.canvas.squares = this.canvas.squares.map((square, n) => {
      if (n < this.numberSpinning) {
        square = { ...square, rotation: square.rotation + 1 };
      }
      return square;
    });
  }

  handleStopButtonClick() {
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
