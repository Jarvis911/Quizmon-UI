import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import YoutubePicker from "@/components/picker/YoutubePicker";
import ImagePicker from "@/components/picker/ImagePicker";
import { useAuth } from "@/context/AuthContext";
import { ImageIcon, Youtube, Loader2 } from "lucide-react";
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

// ---------------- Schema ----------------
const questionSchema = z
  .object({
    text: z.string().min(3, "Câu hỏi ít nhất 3 ký tự"),
    minValue: z.number({ invalid_type_error: "Phải nhập số" }),
    maxValue: z.number({ invalid_type_error: "Phải nhập số" }),
    correctValue: z.number({ invalid_type_error: "Phải nhập số" }),
    mediaType: z.enum(["IMAGE", "YOUTUBE"]).optional(),
    videoUrl: z
      .string()
      .url("Link YouTube không hợp lệ")
      .optional()
      .or(z.literal("")),
    startTime: z.number().optional(),
    duration: z.number().optional(),
  })
  .refine((data) => data.minValue < data.maxValue, {
    path: ["maxValue"],
    message: "Giá trị max phải lớn hơn min",
  })
  .refine(
    (data) =>
      data.correctValue >= data.minValue && data.correctValue <= data.maxValue,
    {
      path: ["correctValue"],
      message: "Giá trị đúng phải nằm trong khoảng min - max",
    }
  );

// ---------------- Component ----------------
const RangeQuestion = ({ quizId, question, onSaved }) => {
  const { token } = useAuth();
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  

  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      minValue: 0,
      maxValue: 100,
      correctValue: 50,
      mediaType: undefined,
      videoUrl: "",
      startTime: 0,
      duration: 30,
    },
  });

  // const removeImage = () => {
  //   setImageSrc(null);
  //   setCrop({ x: 0, y: 0 });
  //   setZoom(1);
  // };

  // crop ảnh
  const getCroppedImg = async () => {
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
        if (!blob) return resolve(null);
        blob.name = "image.jpg";
        resolve(blob);
      }, "image/jpeg");
    });
  };

  useEffect(() => {
      if (question) {
        form.reset({
          text: question.text || "",
          minValue: question.range.minValue || "",
          maxValue: question.range.maxValue || "",
          correctValue: question.range.correctValue || "",

          mediaType: question.media?.length
            ? question.media[0].type === "VIDEO"
              ? "YOUTUBE"
              : "IMAGE"
            : undefined,
          videoUrl:
            question.media?.[0]?.type === "VIDEO" ? question.media[0].url : "",
          startTime: question.media?.[0]?.startTime || 0,
          duration: question.media?.[0]?.duration || 30,
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
      formData.append("type", "RANGE");
      formData.append("minValue", values.minValue);
      formData.append("maxValue", values.maxValue);
      formData.append("correctValue", values.correctValue);

      if (values.mediaType === "IMAGE") {
        const croppedBlob = await getCroppedImg();
        if (croppedBlob) {
          formData.append("files", croppedBlob, "image.jpg");
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
        await axios.put(endpoints.question_range(question.id), formData, {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Cập nhật câu hỏi thanh giá trị thành công!");
      } else {
        const res = await axios.post(endpoints.question_ranges, formData, {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        });

        alert("Tạo câu hỏi thanh giá trị thành công!");
        if (onSaved) onSaved(res.data);
        // form.reset();
        // removeImage();
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-xl shadow bg-white/40 backdrop-blur-lg">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl z-50">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}

      <h2 className="font-bold text-lg mb-4">{question ? "Chỉnh sửa câu hỏi thanh giá trị" : "Tạo câu hỏi thanh giá trị"}</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 flex flex-row gap-8"
        >
          {/* Media */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-center gap-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.setValue("mediaType", "IMAGE")}
              >
                <ImageIcon className="mr-2" /> Thêm ảnh
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.setValue("mediaType", "YOUTUBE")}
              >
                <Youtube className="mr-2" /> Thêm video
              </Button>
            </div>

            {form.watch("mediaType") === "IMAGE" && (
              <ImagePicker
                imageSrc={imageSrc}
                setImageSrc={setImageSrc}
                crop={crop}
                setCrop={setCrop}
                zoom={zoom}
                setZoom={setZoom}
                setCroppedAreaPixels={setCroppedAreaPixels}
              />
            )}

            {form.watch("mediaType") === "YOUTUBE" && (
              <YoutubePicker form={form} />
            )}
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-4 w-[250px]">
            {/* Text câu hỏi */}
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câu hỏi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Nhập câu hỏi..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Min - Max - Correct */}
            <div className="grid grid-rows-3 gap-3">
              <FormField
                control={form.control}
                name="minValue"
                render={({ field }) => (
                  <FormItem className="max-w-70">
                    <FormLabel>Giá trị nhỏ nhất</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxValue"
                render={({ field }) => (
                  <FormItem className="max-w-70">
                    <FormLabel>Giá trị lớn nhất</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="correctValue"
                render={({ field }) => (
                  <FormItem className="max-w-70">
                    <FormLabel>Giá trị đúng</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Range Preview */}
            <div className="flex flex-col gap-2">
              <FormLabel>Thanh giá trị</FormLabel>
              <input
                type="range"
                min={form.watch("minValue")}
                max={form.watch("maxValue")}
                value={form.watch("correctValue")}
                readOnly
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{form.watch("minValue")}</span>
                <span>{form.watch("correctValue")}</span>
                <span>{form.watch("maxValue")}</span>
              </div>
            </div>

            <Button type="submit" className="w-full">
              {question ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RangeQuestion;
