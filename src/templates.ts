import { svg } from 'lit-element';
import {Point, Square} from './interfaces/interfaces';
import {invertYAxis} from './utils';

export function squareTemplate(
  square: Square,
  onMouseEnter: (e: MouseEvent) => void,
  onMouseLeave: (e: MouseEvent) => void,
  onClick: (e: MouseEvent) => void,
  onMouseDown: (e: MouseEvent) => void
) {
  // Default style
  let strokeColor = 'black';
  let strokeWidth = '0';
  let cursorStyle = 'grab';
  if (square.isHighligted && !square.isSelected) {
    // Highlighted only
    strokeColor = 'rgb(85,160,185)';
    strokeWidth = '2';
  } else if (square.isSelected && !square.isHighligted) {
    // Selected only
    strokeColor = 'rgb(175,35,95)';
    strokeWidth = '2';
  } else if (square.isSelected && square.isHighligted) {
    // Highlighted and selected
    strokeColor = 'rgb(175,35,95)';
    strokeWidth = '2';
    cursorStyle = 'move';
  }

  const center = invertYAxis(square.coordinate);

  return svg`
      <rect 
        x=${-square.sideLength / 2} 
        y=${-square.sideLength / 2} 
        width=${square.sideLength} 
        height=${square.sideLength} 
        rx=${square.sideLength / 10}
        ry=${square.sideLength / 10}
        stroke=${strokeColor}
        stroke-width=${strokeWidth}
        cursor=${cursorStyle}
        transform='translate(${center.x} ${center.y}) rotate(${
    square.rotation
  })'
        @mouseenter=${onMouseEnter}
        @mouseleave=${onMouseLeave}
        @click=${onClick}
        @mousedown=${onMouseDown}
      ></rect>
    `;
}

export function originTemplate(
  origin: Point,
  size: number,
  strokeWidth: number
) {
  const markerSize = 3 * strokeWidth;
  let xArrow = {x: origin.x + size, y: origin.y};
  let yArrow = {x: origin.x, y: origin.y + size};
  let xLabel = {x: xArrow.x - 4 * markerSize, y: xArrow.y - 3 * markerSize};
  let yLabel = {x: yArrow.x - 3 * markerSize, y: yArrow.y - 4 * markerSize};
  // Invert y-axis
  xArrow = invertYAxis(xArrow);
  yArrow = invertYAxis(yArrow);
  xLabel = invertYAxis(xLabel);
  yLabel = invertYAxis(yLabel);
  const invOrigin = invertYAxis(origin);

  return svg`
      <marker 
        id="arrow" 
        viewBox="0 0 10 10" 
        refX="5" 
        refY="5"
        markerWidth=${markerSize} 
        markerHeight=${markerSize}
        orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>
      <path 
        d='M ${yArrow.x} ${yArrow.y} 
           L ${invOrigin.x} ${invOrigin.y} 
           L ${xArrow.x} ${xArrow.y}'
        stroke="black"
        stroke-width=${strokeWidth}
        fill="none"
        marker-start="url(#arrow)"
        marker-end="url(#arrow)"
      />
      <text x=${xLabel.x} y=${xLabel.y} >X</text>
      <text x=${yLabel.x} y=${yLabel.y} >Y</text>
    `;
}
