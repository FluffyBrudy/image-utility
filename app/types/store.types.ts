export interface IImageStore {
  selectedElement: HTMLCanvasElement | null;
  imageFiles: Set<File>;
  setImagesPath: (files: File[]) => void;
  removeElement: (image: File) => void;
}

export type ISize = [number, number] | readonly [number, number];
