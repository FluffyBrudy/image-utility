"use client";

import { useEffect, useRef, useState } from "react";

export default function DebugPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size] = useState({ w: 400, h: 800 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let frame = 0;
    let running = true;

    const render = () => {
      if (!running) return;

      const image = ctx.createImageData(size.w, size.h);
      const imdata = image.data;
      const w = size.w;

      for (let i = 0; i < size.h; i++) {
        const color = ~~(Math.sin((i + frame) / 255) * 128 + 128);
        const colorj = ~~(Math.sin((i + frame + 85) / 255) * 128 + 128);
        const colork = ~~(Math.sin((i + frame + 170) / 255) * 128 + 128);
        for (let j = 0; j < size.w; j++) {
          const idx = (i * w + j) * 4;
          imdata[idx] = color;
          imdata[idx + 1] = colorj;
          imdata[idx + 2] = colork;
          imdata[idx + 3] = 255;
        }
      }

      ctx.putImageData(image, 0, 0);
      frame++;
      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
    return () => {
      running = false;
    };
  }, [size.h, size.w]);

  return <canvas ref={canvasRef} width={size.w} height={size.h}></canvas>;
}
