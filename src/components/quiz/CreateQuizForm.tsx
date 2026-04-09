import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import apiClient from "@/api/client";
import { useEffect, useState, useCallback, ChangeEvent, DragEvent } from "react";
import Cropper from "react-easy-crop";
import { Upload, Loader2 } from "lucide-react";
import { MdImageNotSupported } from "react-icons/md";
import endpoints from "@/api/api";
import type { CropArea, Category } from "@/types";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { ControllerRenderProps } from "react-hook-form";

const quizSchema = z.object({
    title: z.string().min(3, "Tên quiz ít nhất 5 ký tự"),
    description: z.string().min(10, "Mô tả ít nhất 10 ký tự"),
    quiz_category: z.string().nonempty("Phải chọn category"),
    image: z.any(),
    is_public: z.boolean(),
});

type QuizFormData = z.infer<typeof quizSchema>;

const CreateQuizForm = () => {
    const { token } = useAuth();
    const { showAlert } = useModal();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Crop and zoom image
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

    const form = useForm<QuizFormData>({
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: "",
            description: "",
            quiz_category: "",
            image: null,
            is_public: true,
        },
    });

    useEffect(() => {
        apiClient.get(endpoints.category).then((res) => {
            setCategories(res.data);
        });
    }, []);

    const onCropComplete = useCallback((_: unknown, croppedPixels: CropArea) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const removeImage = () => {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        form.setValue("image", null);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, field: ControllerRenderProps<QuizFormData, "image">) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setImageSrc(url);
            field.onChange(file);
        }
    };

    const getCroppedImg = async (): Promise<Blob | null> => {
        if (!imageSrc || !croppedAreaPixels) return null;

        const image = new Image();
        image.src = imageSrc;
        await new Promise((r) => (image.onload = r));

        const canvas = document.createElement("canvas");
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, "image/jpeg");
        });
    };

    const onSubmit = async (values: QuizFormData) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("description", values.description);
            formData.append("categoryId", values.quiz_category);
            formData.append("isPublic", String(values.is_public));

            const croppedBlob = await getCroppedImg();
            if (croppedBlob) {
                formData.append("file", croppedBlob, "image.jpg");
            }

            const res = await apiClient.post(endpoints.quizzes, formData);

            console.log("Quiz created:", res.data.id);
            form.reset();
            removeImage();
            if (res.data.id) {
                navigate(`/${res.data.id}/editor`);
            }
        } catch (err) {
            const error = err as { response?: { data?: unknown }; message?: string };
            console.error("Error creating quiz:", error.response?.data || error.message);
            showAlert({ 
                title: "Thất bại", 
                message: "Không thể tạo quiz. Vui lòng thử lại.", 
                type: "error" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: ControllerRenderProps<QuizFormData, "image">) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImageSrc(url);
            field.onChange(file);
        }
    };

    const handleZoomChange = (e: ChangeEvent<HTMLInputElement>) => {
        setZoom(Number(e.target.value));
    };

    return (
        <div className="flex justify-center">
            <div className="inline-flex flex-col p-6 mt-5 border rounded-xl shadow-md bg-white/30 backdrop-blur-lg ">
                {loading && (
                    <div className="absolute rounded-xl inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="p-6 bg-white rounded-xl shadow-lg flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                            <p className="text-gray-700 font-medium">Đang tạo quiz...</p>
                        </div>
                    </div>
                )}

                <h2 className="text-xl font-bold mb-4">Tạo Quiz mới</h2>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex flex-row gap-6">
                            {/* Image Upload + Cropper */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Thumbnail</FormLabel>
                                            <FormControl>
                                                <div
                                                    className="relative w-[500px] h-[500px] border rounded-lg flex items-center justify-center overflow-hidden bg-gray-100"
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleDrop(e, field)}
                                                >
                                                    {!imageSrc ? (
                                                        <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                                            <MdImageNotSupported className="w-16 h-16 text-gray-400 mb-2" />
                                                            <span className="text-gray-500">
                                                                Kéo & thả hoặc click để chọn ảnh
                                                            </span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleFileChange(e, field)}
                                                            />
                                                        </label>
                                                    ) : (
                                                        <>
                                                            <Cropper
                                                                image={imageSrc}
                                                                crop={crop}
                                                                zoom={zoom}
                                                                aspect={1}
                                                                onCropChange={setCrop}
                                                                onZoomChange={setZoom}
                                                                onCropComplete={onCropComplete}
                                                            />

                                                            {/* Zoom + Delete */}
                                                            <div className="absolute bottom-4 w-full flex justify-center gap-2 items-center">
                                                                <input
                                                                    type="range"
                                                                    min={1}
                                                                    max={3}
                                                                    step={0.1}
                                                                    value={zoom}
                                                                    onChange={handleZoomChange}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={removeImage}
                                                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                                >
                                                                    🗑
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Other fields */}
                            <div className="flex flex-col max-w-[200px] gap-8">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tên Quiz</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập tên quiz" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mô tả</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Nhập mô tả quiz" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="quiz_category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Danh mục</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn danh mục" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="is_public"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel>Quiz công khai</FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full">
                                    Tạo Quiz
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default CreateQuizForm;
