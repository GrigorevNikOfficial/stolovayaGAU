const createImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
};

interface CropOptions {
  fileName: string;
  mimeType?: string;
  quality?: number;
}

export const getCroppedImage = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  { fileName, mimeType = 'image/jpeg', quality = 0.92 }: CropOptions
): Promise<{ file: File; previewUrl: string }> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Не удалось получить контекст canvas для обрезки');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Не удалось преобразовать изображение'));
          return;
        }

        const extension = mimeType === 'image/png' ? 'png' : 'jpg';
        const sanitizedName = fileName?.replace(/\.[^/.]+$/, '') || 'image';
        const file = new File([blob], `${sanitizedName}.${extension}`, {
          type: mimeType,
        });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file, previewUrl });
      },
      mimeType,
      quality
    );
  });
};
