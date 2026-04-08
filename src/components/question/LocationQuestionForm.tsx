import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import apiClient from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { Loader2, Trash2 } from "lucide-react";
import endpoints from "@/api/api.js";

// UI shadcn
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const questionSchema = z.object({
  text: z.string().min(3, "Câu hỏi ít nhất 3 ký tự"),
  latitude: z.number().min(-90, "Chọn vị trí trên bản đồ").max(90),
  longitude: z.number().min(-180, "Chọn vị trí trên bản đồ").max(180),
  mapType: z.enum(["SIMPLE", "SATELLITE"]).default("SIMPLE"),
  radius1000: z.number().min(1, "Bán kính > 0").default(5000),
  radius750: z.number().min(1, "Bán kính > 0").default(15000),
  radius500: z.number().min(1, "Bán kính > 0").default(30000),
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function LocationPicker({ setLocation }) {
  const map = useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
}

const LocationQuestionForm = ({ quizId, question, onSaved, onDelete }) => {
  const { token } = useAuth();
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      latitude: undefined,
      longitude: undefined,
      mapType: "SIMPLE",
      radius1000: 5000,
      radius750: 15000,
      radius500: 30000,
    },
  });

  const onSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        quizId: quizId,
        text: values.text,
        type: "LOCATION",
        correctLatitude: values.latitude,
        correctLongitude: values.longitude,
        optionsData: {
          mapType: values.mapType,
          radius1000: values.radius1000,
          radius750: values.radius750,
          radius500: values.radius500,
        }
      };

      if (question?.id) {
        const res = await apiClient.put(endpoints.question_location(question.id), payload);
        showAlert({
          title: "Thành công",
          message: "Cập nhật câu hỏi thành công!",
          type: "success"
        });
        if (onSaved) onSaved(res.data);
      } else {
        const res = await apiClient.post(endpoints.question_locations, payload);
        showAlert({
          title: "Thành công",
          message: "Tạo câu hỏi thành công",
          type: "success"
        });
        if (onSaved) onSaved(res.data);
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

  // đồng bộ form khi chọn điểm
  useEffect(() => {
    if (location) {
      form.setValue("latitude", location.lat, { shouldValidate: true });
      form.setValue("longitude", location.lng, { shouldValidate: true });
    }
  }, [location, form]);

  // Centering the data from backend
  useEffect(() => {
    if (question) {
      form.reset({
        text: question.text || "",
        mapType: question.optionsData?.mapType || "SIMPLE",
        radius1000: question.optionsData?.radius1000 || 5000,
        radius750: question.optionsData?.radius750 || 15000,
        radius500: question.optionsData?.radius500 || 30000,
      });

      if (question.data?.correctLatitude && question.data?.correctLongitude) {
        setLocation({
          lat: Number(question.data.correctLatitude),
          lng: Number(question.data.correctLongitude),
        });
      }
    }
  }, [form, question]);

  return (
    <div className="p-4 border rounded-xl shadow bg-white/40 backdrop-blur-lg">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl z-50">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}

      <h2 className="font-bold text-lg mb-2">{question ? "Chỉnh sửa câu hỏi về địa điểm" : "Tạo câu hỏi về địa điểm"}</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 flex flex-col xl:flex-row gap-4 xl:gap-6"
        >
          {/* Text câu hỏi & Cấu hình */}
          <div className="flex flex-col gap-4 min-w-[320px] flex-1">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câu hỏi</FormLabel>
                  <FormControl>
                    <Textarea rows={2}
                      placeholder="Nhập câu hỏi về địa điểm..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mapType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại bản đồ hiển thị</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại bản đồ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SIMPLE">Bản đồ tiêu chuẩn</SelectItem>
                        <SelectItem value="SATELLITE">Bản đồ vệ tinh</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
               {/* 3 Radii inputs */}
               <FormField control={form.control} name="radius1000" render={({field}) => (
                  <FormItem>
                    <FormLabel className="text-green-600 font-bold">1000đ (m)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
               )}/>
               <FormField control={form.control} name="radius750" render={({field}) => (
                  <FormItem>
                    <FormLabel className="text-orange-500 font-bold">750đ (m)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
               )}/>
               <FormField control={form.control} name="radius500" render={({field}) => (
                  <FormItem>
                    <FormLabel className="text-red-500 font-bold">500đ (m)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
               )}/>
            </div>

            <div className="flex gap-2 mt-auto">
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

          {/* Map chọn vị trí */}
          <div className="flex flex-col gap-3 flex-[2] bg-white p-2 rounded-xl border">
            <MapContainer
              className="w-full relative z-0"
              center={question?.data?.correctLatitude ? [question.data.correctLatitude, question.data.correctLongitude] : [10.7904, 106.69285]}
              zoom={10}
              style={{ minHeight: "400px", borderRadius: "8px" }}
            >
              <ChangeView center={location ? [location.lat, location.lng] : null} />
              <TileLayer
                attribution={form.watch("mapType") === "SATELLITE" ? "Tiles &copy; Esri" : "&copy; OpenStreetMap &copy; CARTO"}
                url={form.watch("mapType") === "SATELLITE"
                  ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                }
              />
              <LocationPicker setLocation={setLocation} />
              {location && (
                <>
                  <Marker position={[location.lat, location.lng]} />
                  <Circle
                    center={[location.lat, location.lng]}
                    radius={form.watch("radius500") || 30000}
                    pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.1, weight: 1 }}
                  />
                  <Circle
                    center={[location.lat, location.lng]}
                    radius={form.watch("radius750") || 15000}
                    pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.15, weight: 1 }}
                  />
                  <Circle
                    center={[location.lat, location.lng]}
                    radius={form.watch("radius1000") || 5000}
                    pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.2, weight: 1 }}
                  />
                </>
              )}
            </MapContainer>
            {location ? (
              <p className="text-sm text-gray-600 px-2 font-medium">
                Vị trí đã chọn: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            ) : (
               <p className="text-sm text-red-500 px-2 font-medium">Riêng câu hỏi địa điểm: Vui lòng click vào bản đồ để chọn định vị (Có thể không cập nhật câu hỏi mới được)</p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LocationQuestionForm;

