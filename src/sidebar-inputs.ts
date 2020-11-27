import { LitElement, html, customElement, property, css } from 'lit-element';
import { Square } from './interfaces/interfaces';

@customElement('sidebar-inputs')
export class SidebarInputs extends LitElement {
  static styles = css`
    :host {
      width: 160px;
      height: 100vh;
      padding-left: 10px;
      background-color: #eeeeee;
      display: flex;
      flex-direction: column;
    }

    label {
      margin-top: 12px;
      margin-bottom: 4px;
    }

    input {
      margin-right: 16px;
    }

    button {
      margin-top: 8px;
      margin-right: 8px;
    }
  `;

  @property({ type: Number })
  lastFrameFps = 0;

  @property({ type: Number })
  sideLength = 40;

  @property({ type: Number })
  numberOfSquares = 100;

  @property({ type: Number })
  numberSpinning = 0;

  @property({ type: Number })
  requestedFps = 30;

  render() {
    return html`
      <label for="side-length">Side length:</label>
      <input
        type="number"
        id="side-length"
        name="side-length"
        value=${this.sideLength}
        @change=${(e: Event) => (this.sideLength = this.getInputValue(e))}
      />
      <label for="num-squares">Number of squares:</label>
      <input
        type="number"
        id="num-squares"
        name="num-squares"
        value=${this.numberOfSquares}
        @change=${(e: Event) => (this.numberOfSquares = this.getInputValue(e))}
      />
      <label for="num-spinning">Number spinning:</label>
      <input
        type="number"
        id="num-spinning"
        name="num-spinning"
        value=${this.numberSpinning}
        @change=${(e: Event) => (this.numberSpinning = this.getInputValue(e))}
      />
      <label for="req-fps">Frames per sec:</label>
      <input
        type="number"
        id="req-fps"
        name="req-fps"
        value=${this.requestedFps}
        @change=${(e: Event) => (this.requestedFps = this.getInputValue(e))}
      />
      <div>
        <button @click=${this.handleStartButtonClick}>Start</button>
        <button @click=${this.handleStopButtonClick}>Stop</button>
      </div>
      <p>Last frame: ${this.lastFrameFps} fps</p>
      <p>Last 30 frames: ${this.averageFps(30)} fps</p>
      <p>All frames: ${this.averageFps()} fps</p>
    `;
  }

  private getInputValue(e: Event) {
    const inputElement = e.target as HTMLInputElement;
    return Number(inputElement.value);
  }

  private intervalId: NodeJS.Timeout | undefined = undefined;

  private handleStartButtonClick() {
    this.fpsList = [];
    this.lastFrameFps = 0;
    this.resetSquares();
    this.createSquares();
    this.stopInterval();
    if (this.numberSpinning > 0) {
      this.intervalId = setInterval(() => {
        this.measureFps();
        this.spinSquares();
      }, 1000 / this.requestedFps);
    }
  }

  private handleStopButtonClick() {
    this.stopInterval();
  }

  private averageFps(subsetSize: number = 0) {
    if (this.fpsList.length === 0 || this.fpsList.length < subsetSize) {
      return 0;
    }

    const summer = (acc: number, current: number) => acc + current;
    if (subsetSize === 0) {
      const sum = this.fpsList.reduce(summer);
      return Math.round(sum / this.fpsList.length);
    } else {
      const lastItems = this.fpsList.slice(this.fpsList.length - subsetSize);
      const sum = lastItems.reduce(summer);
      return Math.round(sum / lastItems.length);
    }
  }

  private stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private resetSquares() {
    // Fire event
    const setSquaresEvent = new CustomEvent('set-squares', {
      detail: { newSquares: [] },
    });
    this.dispatchEvent(setSquaresEvent);
  }

  private createSquares() {
    const squaresPerRow = Math.round(Math.sqrt(this.numberOfSquares));
    const newSquares: Square[] = [];
    for (let n = 1; n <= this.numberOfSquares; n++) {
      const row = Math.ceil(n / squaresPerRow);
      const colum = n - (row - 1) * squaresPerRow;
      const x = this.distance * colum;
      const y = this.distance * row;
      const square: Square = {
        id: n.toString(),
        x,
        y,
        sideLength: this.sideLength,
        rotation: 0,
        isHighligted: false,
        isSelected: false,
      };
      newSquares.push(square);
    }
    // Fire event
    const setSquaresEvent = new CustomEvent('set-squares', {
      detail: { newSquares: newSquares },
    });
    this.dispatchEvent(setSquaresEvent);
  }

  private get distance() {
    return this.sideLength * 1.75;
  }

  private lastT = 0;
  private fpsList: number[] = [];
  
  private measureFps() {
    // Check whether this is the first run
    if (this.lastT == 0) {
      this.lastT = performance.now();
      return;
    }
    const t = performance.now();
    const diff = t - this.lastT;
    const frameFps = Math.round(1000 / diff);
    this.lastFrameFps = frameFps;
    this.fpsList.push(frameFps);
    // Save current time stamp for next run
    this.lastT = t;
  }

  private spinSquares() {
    const rotateSquaresEvent = new CustomEvent('rotate-squares', {
      detail: { numberSpinning: this.numberSpinning },
    });
    this.dispatchEvent(rotateSquaresEvent);
  }
  
}

declare global {
  interface HTMLElementTagNameMap {
    'sidebar-inputs': SidebarInputs;
  }
}
