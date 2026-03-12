import { useCallback, ChangeEvent } from "react";
import Cropper from "react-easy-crop";
import { Upload, Trash2 } from "lucide-react";
import { MdImageNotSupported } from "react-icons/md";
import { Button } from "@/components/ui/button";
import type { CropArea, ImagePickerProps } from "@/types";

const ImagePicker = ({
    imageSrc,
    setImageSrc,
    crop,
    setCrop,
    zoom,
    setZoom,
    setCroppedAreaPixels,
}: ImagePickerProps) => {
    const onCropComplete = useCallback(
        (_: unknown, croppedPixels: CropArea) => {
            setCroppedAreaPixels(croppedPixels);
        },
        [setCroppedAreaPixels]
    );

    const removeImage = () => {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImageSrc(url);
        }
    };

    const handleZoomChange = (e: ChangeEvent<HTMLInputElement>) => {
        setZoom(Number(e.target.value));
    };

    return (
        <div className="relative w-[500px] h-[300px] border rounded-lg overflow-hidden">
            {!imageSrc ? (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <MdImageNotSupported className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Chọn ảnh</span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            ) : (
                <>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={4 / 3}
                        restrictPosition={true}
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
                            onChange={handleZoomChange}
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
