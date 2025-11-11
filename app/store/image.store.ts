import { create } from "zustand";
import { IImageStore } from "../types/store.types";

export const useImageStore = create<IImageStore>()((set, get) => ({
  selectedElement: null,
  imageFiles: new Set<File>(),
  setImagesPath(files) {
    const imageFiles = new Set(files);
    set({ imageFiles });
  },
  removeElement(image) {
    const imageFiles = new Set(get().imageFiles);
    if (imageFiles.delete(image)) set({ imageFiles });
    else alert("some error occured");
  },
}));
