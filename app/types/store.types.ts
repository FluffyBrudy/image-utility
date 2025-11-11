export interface IImageStore {
  selectedElement: HTMLCanvasElement | null;
  imageFiles: Set<File>;
  setImagesPath: (files: File[]) => void;
  removeElement: (image: File) => void;
}
