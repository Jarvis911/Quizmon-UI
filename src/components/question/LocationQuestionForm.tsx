import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
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

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const questionSchema = z.object({
  text: z.string().min(3, "Câu hỏi ít nhất 3 ký tự"),
  latitude: z.number({ required_error: "Chọn vị trí trên bản đồ" }),
  longitude: z.number({ required_error: "Chọn vị trí trên bản đồ" }),
});

function LocationPicker({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const LocationQuestionForm = ({ quizId, question, onSaved }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      latitude: undefined,
      longitude: undefined,
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
      };

      if (question?.id) {
        await axios.put(endpoints.question_location(question.id), payload, {
          headers: {
            Authorization: token,
          },
        });
        alert("Cập nhật câu hỏi thành công!");
      } else {
        const res = await axios.post(endpoints.question_locations, payload, {
          headers: {
            Authorization: token,
          },
        });
        alert("Tạo câu hỏi thành công");
        if (onSaved) onSaved(res.data);
      }

      // form.reset();
      // setLocation(null);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  // đồng bộ form khi chọn điểm
  if (location) {
    form.setValue("latitude", location.lat);
    form.setValue("longitude", location.lng);
  }

  // Centering the data from backend
  useEffect(() => {
    if (question) {
      form.reset({
        text: question.text || ""
      });

      if (question.location?.correctLatitude && question.location?.correctLongitude) {
        setLocation({
          lat: Number(question.location.correctLatitude),
          lng: Number(question.location.correctLongitude),
        });
      }
    }
  }, [form, question]);

  return (
    <div className="p-6 border rounded-xl shadow bg-white/40 backdrop-blur-lg">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl z-50">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}

      <h2 className="font-bold text-lg mb-4">{question ? "Chỉnh sửa câu hỏi về địa điểm" : "Tạo câu hỏi về địa điểm"}</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 flex flex-row gap-8"
        >
          {/* Map chọn vị trí */}
          <div className="flex flex-col gap-3">
            <MapContainer
              className="min-w-lg"
              key={location ? `${location.lat}-${location.lng}` : "default"}
              // Location was updated after useEffect -> center will not update until map remount -> Key have to change
              center={location ? [location.lat, location.lng] : [10.7904, 106.69285]}
              zoom={10}
              style={{ height: "450px", borderRadius: "12px" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <LocationPicker setLocation={setLocation} />
              {location && <Marker position={[location.lat, location.lng]} />}
            </MapContainer>
            {location && (
              <p className="text-sm text-gray-600">
                Đã chọn: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            )}
          </div>

          {/* Text câu hỏi */}
          <div className="flex flex-col gap-4 w-[250px]">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câu hỏi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập câu hỏi về địa điểm..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {question ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LocationQuestionForm;
