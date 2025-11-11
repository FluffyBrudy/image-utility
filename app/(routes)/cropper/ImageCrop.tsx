"use client";
import { useEffect, useRef, useState } from "react";

interface ImageProps {
  path: string;
}

export function ImageCrop({ path }: ImageProps) {
  const [size, setSize] = useState({ width: 32, height: 32 });
  const [loaded, setLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      alert("sorry couldn't get context");
      return;
    }
    const image = new Image();
    image.src = path;
    image
      .decode()
      .then(() => {
        setLoaded(true);
        setSize({ width: image.width, height: image.height });
        ctx.drawImage(image, 0, 0);
      })
      .catch((err) => {
        alert(JSON.stringify(err));
      });
  }, [loaded, path]);
  return <canvas {...size} ref={canvasRef}></canvas>;
}
