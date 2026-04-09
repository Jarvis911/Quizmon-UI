import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import apiClient from "@/api/client";
import YoutubePicker from "@/components/picker/YoutubePicker";
import ImagePicker from "@/components/picker/ImagePicker";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { ImageIcon, Youtube, Loader2, Trash2 } from "lucide-react";
import endpoints from "@/api/api";

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

const questionSchema = z.object({
  text: z.string().min(3, "Câu hỏi ít nhất 3 ký tự"),
  correctAnswer: z.string().min(1, "Phải có đáp án đúng"),
  mediaType: z.enum(["IMAGE", "YOUTUBE"]).optional(),
  imageEffect: z.enum(["NONE", "BLUR_TO_CLEAR", "ZOOM_IN", "ZOOM_OUT"]).optional(),
  videoUrl: z
    .string()
    .url("Link YouTube không hợp lệ")
    .optional()
    .or(z.literal("")),
  startTime: z.number().optional(),
  duration: z.number().optional(),
  zoomX: z.number().optional(),
  zoomY: z.number().optional(),
});

const TypeAnswerQuestionForm = ({ quizId, question, onSaved, onDirtyChange, onDelete }) => {
  const { token } = useAuth();
  const { showAlert } = useModal();
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      correctAnswer: "",
      mediaType: undefined,
      imageEffect: "NONE",
      videoUrl: "",
      startTime: 0,
      duration: 30,
      zoomX: 0.5,
      zoomY: 0.5,
    },
  });

  // const removeImage = () => {
  //   setImageSrc(null);
  //   setCrop({ x: 0, y: 0 });
  //   setZoom(1);
  // };

  const getCroppedImg = async (): Promise<File | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;
    const image = new Image();
    image.src = imageSrc;
    await new Promise((r) => (image.onload = r));

    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d");

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
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg");
    });
  };

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyChange]);

  useEffect(() => {
    if (question) {
      form.reset({
        text: question.text || "",
        correctAnswer: question.data?.correctAnswer || "",

        mediaType: question.media?.length
          ? question.media[0].type === "VIDEO"
            ? "YOUTUBE"
            : "IMAGE"
          : undefined,
        imageEffect: question.media?.[0]?.effect || "NONE",
        videoUrl:
          question.media?.[0]?.type === "VIDEO" ? question.media[0].url : "",
        startTime: question.media?.[0]?.startTime || 0,
        duration: question.media?.[0]?.duration || 30,
        zoomX: question.media?.[0]?.zoomX || 0.5,
        zoomY: question.media?.[0]?.zoomY || 0.5,
      });

      // Set preview if it is IMAGE
      if (question.media?.[0]?.type === "IMAGE") {
        setImageSrc(question.media[0].url);
      }
    }
  }, [question, form]);

  const onSubmit = async (values) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("quizId", quizId);
      formData.append("text", values.text);
      formData.append("type", "TYPEANSWER");
      formData.append("correctAnswer", values.correctAnswer);

      if (values.mediaType === "IMAGE") {
        const croppedBlob = await getCroppedImg();
        if (croppedBlob) {
          formData.append("files", croppedBlob, "image.jpg");
          formData.append("imageEffect", values.imageEffect || "NONE");
          formData.append("zoomX", (values.zoomX ?? 0.5).toString());
          formData.append("zoomY", (values.zoomY ?? 0.5).toString());
        }
      } else if (values.mediaType === "YOUTUBE") {
        const videoData = {
          url: values.videoUrl,
          startTime: values.startTime,
          duration: values.duration,
        };
        formData.append("videos", JSON.stringify(videoData));
      }

      if (question?.id) {
        const res = await apiClient.put(endpoints.question_typeanswer(question.id), formData);

        showAlert({
          title: "Thành công",
          message: "Cập nhật câu hỏi điền đáp án!",
          type: "success"
        });
        if (onSaved) onSaved(res.data);
      } else {
        const res = await apiClient.post(endpoints.question_typeanswers, formData);

        showAlert({
          title: "Thành công",
          message: "Tạo câu hỏi nhập đáp án thành công!",
          type: "success"
        });
        if (onSaved) onSaved(res.data);
        // form.reset();
        // removeImage();
      }
    } catch (err) {
      console.error(err);
      showAlert({
        title: "Lỗi",
        message: "Lỗi khi tạo câu hỏi",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow bg-white/40 backdrop-blur-lg relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl z-50">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}

      <h2 className="font-bold text-lg mb-2">{question ? "Cập nhật câu hỏi nhập đáp án" : "Tạo câu hỏi nhập đáp án"}</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 flex flex-col md:flex-row gap-4 md:gap-6"
        >
          {/* Media */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-center gap-2 md:gap-4 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none h-8 md:h-10 text-[10px] sm:text-xs md:text-sm px-2 md:px-4"
                onClick={() => form.setValue("mediaType", "IMAGE")}
              >
                <ImageIcon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 shrink-0" /> <span className="truncate">Thêm ảnh</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none h-8 md:h-10 text-[10px] sm:text-xs md:text-sm px-2 md:px-4"
                onClick={() => form.setValue("mediaType", "YOUTUBE")}
              >
                <Youtube className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 shrink-0" /> <span className="truncate">Thêm video</span>
              </Button>
            </div>

            {form.watch("mediaType") === "IMAGE" && (
              <div className="flex flex-col gap-3">
                <ImagePicker
                  imageSrc={imageSrc}
                  setImageSrc={setImageSrc}
                  crop={crop}
                  setCrop={setCrop}
                  zoom={zoom}
                  setZoom={setZoom}
                  setCroppedAreaPixels={setCroppedAreaPixels}
                />
                {imageSrc && (
                  <FormField
                    control={form.control}
                    name="imageEffect"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hiệu ứng lúc làm bài</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="NONE">Không có</option>
                            <option value="BLUR_TO_CLEAR">Mờ dần sang Rõ</option>
                            <option value="ZOOM_OUT">Thu phóng (Phóng to rồi Nhỏ lại)</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                {imageSrc && form.watch("imageEffect") === "ZOOM_OUT" && (
                  <div className="flex flex-col gap-2">
                    <FormLabel>Chọn điểm bắt đầu phóng (Click vào ảnh)</FormLabel>
                    <div 
                      className="relative w-full aspect-square border rounded-lg overflow-hidden cursor-crosshair bg-black/5"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const y = (e.clientY - rect.top) / rect.height;
                        form.setValue("zoomX", x, { shouldDirty: true });
                        form.setValue("zoomY", y, { shouldDirty: true });
                      }}
                    >
                      <img src={imageSrc} className="w-full h-full object-cover" alt="Point picker" />
                      <div 
                        className="absolute w-6 h-6 border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        style={{ 
                          left: `${form.watch("zoomX") * 100}%`, 
                          top: `${form.watch("zoomY") * 100}%` 
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.watch("mediaType") === "YOUTUBE" && (
              <YoutubePicker form={form} />
            )}
          </div>

          {/* Nội dung */}
          <div className="flex flex-col gap-4 min-w-[280px] flex-1">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câu hỏi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Nhập câu hỏi..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đáp án đúng</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập đáp án đúng..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {question ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
              </Button>
              {question && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="shrink-0"
                  onClick={onDelete}
                  title="Xóa câu hỏi này"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TypeAnswerQuestionForm;
