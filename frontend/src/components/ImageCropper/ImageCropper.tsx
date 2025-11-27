import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImage } from './cropImage';

interface ImageCropperProps {
  src: string;
  aspect?: number; // width/height
  onCancel?: () => void;
  onComplete: (file: File, previewUrl: string) => void;
  fileName?: string;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  src,
  aspect = 3 / 2,
  onCancel,
  onComplete,
  fileName = 'cropped',
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_: any, croppedAreaPixelsParam: any) => {
    setCroppedAreaPixels(croppedAreaPixelsParam);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (!croppedAreaPixels) return;
      const { file, previewUrl } = await getCroppedImage(src, croppedAreaPixels, {
        fileName,
        mimeType: 'image/jpeg',
      });
      onComplete(file, previewUrl);
    } catch (err) {
      console.error('Crop error', err);
    }
  }, [croppedAreaPixels, fileName, onComplete, src]);

  return (
    <div className="w-full h-[420px] bg-gray-800/5 rounded-xl p-4">
      <div className="relative w-full h-[300px] bg-black rounded-md overflow-hidden">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100">Отмена</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-green-dark text-white">Применить</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
