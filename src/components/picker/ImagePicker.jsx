import { useCallback } from "react";
import Cropper from "react-easy-crop";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Process the after crop part
const ImagePicker = ({ imageSrc, setImageSrc, crop, setCrop, zoom, setZoom, setCroppedAreaPixels }) => {
  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, [setCroppedAreaPixels]);

  const removeImage = () => { // Reset Image src, reset crop stat and zoom stat
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="relative w-[320px] h-[240px] border rounded-lg overflow-hidden shrink-0">
      {!imageSrc ? ( // If there is not an image, show the placeholder image
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <Upload className="w-10 h-10 text-gray-400" />
          <span>Chọn ảnh</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setImageSrc(url);
              }
            }}
          />
        </label>
      ) : ( // If there is an image, show the cropper with the image inside
        <>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 items-center">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <Button
              type="button"
              onClick={removeImage}
              size="icon"
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ImagePicker;
