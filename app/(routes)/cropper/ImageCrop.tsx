"use client";
import { useState } from "react";
import Image from "next/image";

interface ImageProps {
  pathOrFile: string | File;
  onClick?: () => void;
}

export function ImageCrop({ pathOrFile, onClick }: ImageProps) {
  const [selected, setSelected] = useState(false);

  const handleClick = () => {
    onClick?.();
    setSelected((state) => !state);
  };

  const src =
    typeof pathOrFile === "string"
      ? pathOrFile
      : URL.createObjectURL(pathOrFile);

  return (
    <div className="inline-block max-w-[500px] w-full">
      <div
        className={`relative w-full transition-opacity duration-300 ${
          selected ? "opacity-50" : "opacity-100"
        }`}
      >
        <Image
          src={src}
          alt={typeof pathOrFile === "string" ? "image" : pathOrFile.name}
          onClick={handleClick}
          layout="responsive"
          width={500}
          height={500}
          className="object-contain cursor-pointer"
          onLoadingComplete={() => {
            if (typeof pathOrFile !== "string") URL.revokeObjectURL(src);
          }}
        />
      </div>
    </div>
  );
}
