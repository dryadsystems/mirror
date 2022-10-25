import anime from 'animejs';
import { memo } from 'react';

const cellSize = 50;
//number of rows = height divided by cells size
const height = 512;
const width = 512;

const rows = Math.floor(height / cellSize);
const cols = Math.floor(width / cellSize);

const total = rows * cols;
function _Grid() {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    height: '100%',
    width: '100%',
  };

  const tileStyle = {};

  return (
    <div className="transition-grid" style={gridStyle}>
      {Array.from({ length: total }).map((_, i) => (
        <div className="tile" key={i} style={tileStyle}></div>
      ))}
    </div>
  );
}

export function staggerAnimate(on: boolean) {
  anime({
    targets: '.tile',
    opacity: on ? 1 : 0,
    delay: anime.stagger(40, {
      grid: [cols, rows],
      from: 'center',
    }),
  });
}

export const Grid = memo(_Grid);
