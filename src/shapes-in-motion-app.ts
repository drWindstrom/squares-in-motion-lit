import {LitElement, html, customElement, property, css} from 'lit-element';
import './pan-zoom-svg';
import {Square} from './interfaces/interfaces';

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

  @property({type: Object})
  squares: Record<string, Square> = {};

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
          <button @click=${this._startButton}>Start</button>
          <button @click=${this._stopButton}>Stop</button>
        </div>
        <p>Measuring: ${this.measuredFps} fps</p>
      </div>
      <pan-zoom-svg
        .squares=${this.squares}
      ></pan-zoom-svg>
      </div>
    `;
  }

  private _startButton() {
    this._readInputs();
    this._createSquares();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.numberSpinning > 0) {
      this.intervalId = setInterval(() => {
        this._measureFps();      
        this._spinSquares();
      }, 1000 / this.reqFps);
    }      
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
    
    for (let n = 1; n <= this.numberOfSquares; n++) {
      const row = Math.ceil(n / squaresPerRow);
      const colum = n - (row - 1) * squaresPerRow;
      const x = this.distance * colum;
      const y = this.distance * row;
      const id = n.toString();
      const square: Square = {
        x,
        y,
        sideLength: this.sideLength,
        rotation: 0,
        isHighligted: false,
        isSelected: false,
      };
      this.squares[id] = square;
    }
    
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
    this.squares = {...this.squares}
    let n = 0;
    for (const id in this.squares) {
      if (n >= this.numberSpinning) {
        break;
      }
      const changed = this.squares[id];
      this.squares[id] = {
        ...changed,
        rotation: changed.rotation + 1,
      };
      n++;
    }
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
