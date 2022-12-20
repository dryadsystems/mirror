import { useRef, useEffect, useState, memo } from 'react';

function _Animation() {
  const size = { width: 32, height: 32 };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  const draw = (frameCount: number) => {
    if (!context) return;
    var col = function (x: number, y: number, r: number, g: number, b: number) {
      context.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      context.fillRect(x, y, 1, 1);
    };
    var R = function (x: number, y: number, t: number) {
      return Math.floor(32 + 16 * Math.cos((x * x - y * y) / 300 + t));
    };

    var G = function (x: number, y: number, t: number) {
      return Math.floor(
        16 + 16 * Math.sin((x * x * Math.cos(t / 4) + y * y * Math.sin(t / 3)) / 300)
      );
    };

    var B = function (x: number, y: number, t: number) {
      return Math.floor(
        64 +
          32 *
            Math.sin(5 * Math.sin(t / 9) + ((x - 100) * (x - 100) + (y - 100) * (y - 100)) / 1100)
      );
    };

    const t = frameCount / 40;

    for (var x = 0; x <= 35; x++) {
      for (var y = 0; y <= 35; y++) {
        col(x, y, R(x, y, t), G(x, y, t), B(x, y, t));
      }
    }
  };

  useEffect(() => {
    //i.e. value other than null or undefined
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      setContext(ctx);
    }
  }, []);

  useEffect(() => {
    let frameCount = 0;
    let animationFrameId: number;

    if (context) {
      const render = () => {
        frameCount++;
        draw(frameCount);
        animationFrameId = window.requestAnimationFrame(render);
      };
      render();
    }
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw, context]);

  return <canvas {...size} ref={canvasRef} />;
}

// memoize the component so it never re-renders
export const Animation = memo(_Animation);

export default Animation;
