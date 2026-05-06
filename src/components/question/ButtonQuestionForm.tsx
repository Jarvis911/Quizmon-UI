import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import apiClient from "@/api/client";
import YoutubePicker from "@/components/picker/YoutubePicker";
import ImagePicker from "@/components/picker/ImagePicker";
import AIImageButton from "@/components/ai/AIImageButton";
import endpoints from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { ImageIcon, Youtube, Trash2, Loader2 } from "lucide-react";

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

// Valide data
const optionSchema = z.object({
  text: z.string().min(1, "Đáp án không được rỗng"),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(3, "Câu hỏi ít nhất 3 ký tự"),
  options: z.array(optionSchema).min(2, "Phải có ít nhất 2 đáp án"),
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

// If there is a question data, initialize with the question data
const ButtonQuestionForm = ({ quizId, question, onSaved, onDirtyChange, onDelete }) => {
  const { token } = useAuth();
  const { showAlert } = useModal();
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initial data and get form ready
  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
      mediaType: undefined,
      imageEffect: "NONE",
      videoUrl: "",
      startTime: 0,
      duration: 30,
      zoomX: 0.5,
      zoomY: 0.5,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyChange]);

  useEffect(() => {
    if (question) {
      form.reset({
        text: question.text || "",
        options: question.options?.map((o) => ({
          text: o.text,
          isCorrect: o.isCorrect,
        })) || [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
          ],
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

  // const removeImage = () => {
  //   setImageSrc(null);
  //   setCrop({ x: 0, y: 0 });
  //   setZoom(1);
  // };

  // Get the cropped Image
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

  const onSubmit = async (values) => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("quizId", quizId);
      formData.append("text", values.text);
      formData.append("type", "BUTTONS");
      formData.append("options", JSON.stringify(values.options));

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

      // Update if there was question data
      if (question?.id) {
        const res = await apiClient.put(endpoints.question_button(question.id), formData);
        showAlert({
          title: "Thành công",
          message: "Cập nhật câu hỏi thành công!",
          type: "success"
        });
        if (onSaved) onSaved(res.data);
      }
      // Create new if there was no question data
      else {
        const res = await apiClient.post(endpoints.question_buttons, formData);
        showAlert({
          title: "Thành công",
          message: "Tạo câu hỏi thành công!",
          type: "success"
        });
        // form.reset();
        // removeImage();
        if (onSaved) onSaved(res.data);
      }

    } catch (err) {
      console.error(err);
      showAlert({
        title: "Lỗi",
        message: "Lỗi khi lưu câu hỏi",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow bg-white/40 backdrop-blur-lg">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl z-50">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}

      <h2 className="font-bold text-lg mb-2">
        {question ? "Chỉnh sửa câu hỏi trắc nghiệm" : "Tạo câu hỏi trắc nghiệm"}
      </h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 flex flex-col md:flex-row gap-4 md:gap-6"
        >
          {/* If media */}
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

            {/* If IMAGE */}
            {form.watch("mediaType") === "IMAGE" && (
              <div className="flex flex-col gap-3">
                {!imageSrc && (
                  <AIImageButton
                    context={form.watch("text") || "Câu hỏi trắc nghiệm"}
                    onGenerated={(url, effect) => {
                      setImageSrc(url);
                      form.setValue("imageEffect", effect as any);
                    }}
                    disabled={loading}
                  />
                )}
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
            {/* Options */}
            <div>
              <FormLabel className="mb-2">Đáp án</FormLabel>
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <FormField
                    control={form.control}
                    name={`options.${idx}.text`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={`Đáp án ${idx + 1}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`options.${idx}.isCorrect`}
                    render={({ field }) => (
                      <input
                        type="radio"
                        checked={field.value}
                        onChange={() =>
                          form.setValue(
                            "options",
                            form.getValues("options").map((o, i) => ({
                              ...o,
                              isCorrect: i === idx,
                            }))
                          )
                        }
                      />
                    )}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={fields.length <= 2}
                    onClick={() => remove(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ text: "", isCorrect: false })}
              >
                + Thêm đáp án
              </Button>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {question ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
              </Button>
              {question && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
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

export default ButtonQuestionForm;
