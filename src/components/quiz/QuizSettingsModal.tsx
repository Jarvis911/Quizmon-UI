import { useState, useCallback, ChangeEvent, DragEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import apiClient from "@/api/client";
import Cropper, { Area } from "react-easy-crop";
import { Upload, Loader2, Settings, Trash2 } from "lucide-react";
import AIImageButton from "@/components/ai/AIImageButton";
import { MdImageNotSupported } from "react-icons/md";
import endpoints from "@/api/api";
import { useModal } from "@/context/ModalContext";
import type { Category, Quiz } from "@/types";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    title: z.string().min(3, "Tên quiz ít nhất 3 ký tự"),
    description: z.string().optional(),
    quiz_category: z.string().min(1, "Phải chọn danh mục"),
    image: z.any().optional(),
    is_public: z.boolean(),
});

type QuizFormData = z.infer<typeof quizSchema>;

interface QuizSettingsModalProps {
    quiz: Quiz;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updatedQuiz: Quiz) => void;
}

const QuizSettingsModal = ({ quiz, open, onOpenChange, onSuccess }: QuizSettingsModalProps) => {
    const { token } = useAuth();
    const { showAlert } = useModal();
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    // Crop and zoom image
    const [imageSrc, setImageSrc] = useState<string | null>(quiz.image || null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isImageChanged, setIsImageChanged] = useState(false);
    /** True when imageSrc is an already-uploaded URL (AI-generated), skip crop */
    const [isDirectUrl, setIsDirectUrl] = useState(false);

    const form = useForm<QuizFormData>({
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: quiz.title || "",
            description: quiz.description || "",
            quiz_category: quiz.categoryId ? quiz.categoryId.toString() : "",
            image: null,
            is_public: (quiz as any).isPublic ?? true,
        },
    });

    useEffect(() => {
        if (open) {
            apiClient.get(endpoints.category).then((res) => {
                setCategories(res.data);
            });
            // Reset form when opened with new quiz data
            form.reset({
                title: quiz.title || "",
                description: quiz.description || "",
                quiz_category: quiz.categoryId ? quiz.categoryId.toString() : "",
                image: null,
                is_public: (quiz as any).isPublic ?? true,
            });
            setImageSrc(quiz.image || null);
            setIsImageChanged(false);
        }
    }, [open, quiz, form]);

    const onCropComplete = useCallback((_: unknown, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const removeImage = () => {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        form.setValue("image", null);
        setIsImageChanged(true);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, field: ControllerRenderProps<QuizFormData, "image">) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setImageSrc(url);
            field.onChange(file);
            setIsImageChanged(true);
        }
    };

    const getCroppedImg = async (): Promise<Blob | null> => {
        if (!imageSrc || !croppedAreaPixels || !isImageChanged) return null;

        const image = new Image();
        image.src = imageSrc;
        // Check if imageSrc is external URL (cors issue)
        if (imageSrc.startsWith("http")) {
            image.crossOrigin = "anonymous";
        }
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
            formData.append("description", values.description || "");
            formData.append("categoryId", values.quiz_category);
            formData.append("isPublic", String(values.is_public));

            if (isImageChanged) {
                if (imageSrc) {
                    if (isDirectUrl) {
                        // AI-generated image already on Azure — pass URL directly
                        formData.append("imageUrl", imageSrc);
                    } else {
                        const croppedBlob = await getCroppedImg();
                        if (croppedBlob) {
                            formData.append("file", croppedBlob, "image.jpg");
                        }
                    }
                } else {
                    formData.append("removeImage", "true");
                }
            }

            const res = await apiClient.put(endpoints.quiz(quiz.id), formData);

            onOpenChange(false);
        } catch (err) {
            const error = err as { response?: { data?: unknown }; message?: string };
            console.error("Error updating quiz:", error.response?.data || error.message);
            showAlert({
                title: "Lỗi",
                message: "Lỗi cập nhật quiz",
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
            setIsImageChanged(true);
        }
    };

    const handleZoomChange = (e: ChangeEvent<HTMLInputElement>) => {
        setZoom(Number(e.target.value));
    };

    const handleDeleteQuiz = () => {
        showAlert({
            title: "Xác nhận xóa Quiz",
            message: "Bạn có chắc chắn muốn xóa bài trắc nghiệm này? Toàn bộ dữ liệu sẽ bị xóa vĩnh viễn.",
            type: "warning",
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await apiClient.delete(endpoints.quiz_delete(quiz.id));
                    onOpenChange(false);
                    navigate("/library");
                    showAlert({
                        title: "Thành công",
                        message: "Đã xóa bài trắc nghiệm.",
                        type: "success"
                    });
                } catch (err) {
                    console.error("Delete Quiz Error:", err);
                    showAlert({
                        title: "Lỗi",
                        message: "Không thể xóa bài trắc nghiệm.",
                        type: "error"
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-auto overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cài đặt Quiz</DialogTitle>
                    <DialogDescription>
                        Cập nhật các thông tin chung của quiz.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative">
                    {loading && (
                        <div className="absolute rounded-xl inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="p-4 bg-white rounded-xl shadow-lg flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                <p className="text-gray-700 font-medium">Đang lưu...</p>
                            </div>
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                            <div className="flex flex-col sm:flex-row gap-6">
                                {/* Image Upload + Cropper */}
                                <div className="sm:w-1/2 flex justify-center sm:block">
                                    <FormField
                                        control={form.control}
                                        name="image"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ảnh bìa</FormLabel>
                                                <FormControl>
                                                    <div
                                                        className="relative w-[300px] h-[300px] border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors"
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => handleDrop(e, field)}
                                                    >
                                                        {!imageSrc ? (
                                                            <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full gap-3">
                                                                <MdImageNotSupported className="w-12 h-12 text-muted-foreground mb-2" />
                                                                <span className="text-muted-foreground text-sm text-center px-4">
                                                                    Kéo thả hoặc click để chọn ảnh
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleFileChange(e, field)}
                                                                />
                                                                <span
                                                                    onClick={(e) => e.preventDefault()}
                                                                    className="pointer-events-auto"
                                                                >
                                                                    <AIImageButton
                                                                        context={form.watch("title") || quiz.title || "Ảnh bìa quiz"}
                                                                        onGenerated={(url) => {
                                                                            setImageSrc(url);
                                                                            setIsImageChanged(true);
                                                                            setIsDirectUrl(true);
                                                                        }}
                                                                        disabled={loading}
                                                                    />
                                                                </span>
                                                            </label>
                                                        ) : (
                                                            <>
                                                                {isImageChanged ? (
                                                                    <Cropper
                                                                        image={imageSrc}
                                                                        crop={crop}
                                                                        zoom={zoom}
                                                                        aspect={1}
                                                                        onCropChange={setCrop}
                                                                        onZoomChange={setZoom}
                                                                        onCropComplete={onCropComplete}
                                                                    />
                                                                ) : (
                                                                    <img src={imageSrc} alt="Quiz Cover" className="w-full h-full object-cover" />
                                                                )}

                                                                {/* Controls */}
                                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 items-center px-4">
                                                                    {isImageChanged && (
                                                                        <input
                                                                            type="range"
                                                                            min={1}
                                                                            max={3}
                                                                            step={0.1}
                                                                            value={zoom}
                                                                            onChange={handleZoomChange}
                                                                            className="w-24"
                                                                        />
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={removeImage}
                                                                        className="p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 shadow-md transition-colors"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
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
                                <div className="sm:w-1/2 flex flex-col gap-4">
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
                                                    <Textarea 
                                                        placeholder="Nhập mô tả quiz" 
                                                        {...field} 
                                                        value={field.value || ""} 
                                                        className="resize-none h-24"
                                                    />
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
                                            <FormItem className="flex items-center space-x-2 pt-2">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Quiz công khai</FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center pt-4 border-t gap-3 sm:gap-2">
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    className="gap-2 w-full sm:w-auto order-last sm:order-first"
                                    onClick={handleDeleteQuiz}
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Xóa Quiz
                                </Button>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)} disabled={loading}>
                                        Hủy
                                    </Button>
                                    <Button type="submit" className="flex-1 sm:flex-none" disabled={loading}>
                                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Lưu thay đổi
                                    </Button>
                                </div>
                            </div>


                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QuizSettingsModal;
