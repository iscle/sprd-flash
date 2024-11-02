export const readFile = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      } else {
        reject(new Error("File reading failed"));
      }
    };
    reader.onerror = () => {
      reject(new Error("File reading error"));
    };
    reader.readAsArrayBuffer(file);
  });
};