// Bildhantering

// Skalar ner bilden så den ryms i lagringen
export function resizeImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.62));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Kunde inte läsa bilden")); };
    img.src = url;
  });
}
