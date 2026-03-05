import { useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";


const YoutubePicker = ({ form }) => { // RHF from the parent component
  const playerRef = useRef(null);
  const [videoDuration, setVideoDuration] = useState(0); // To get the max video duration
  const [isValidUrl, setIsValidUrl] = useState(true); // To check if the url is valid
  const [errorMessage, setErrorMessage] = useState("");

  // Validate is youtube url?
  const isValidYouTubeUrl = (url) =>
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);


  // When the url change, we check if it valid, reinitialize the duration and error message
  const handleUrlChange = (e) => {
    const url = e.target.value;
    form.setValue("videoUrl", url);
    const valid = isValidYouTubeUrl(url);
    setIsValidUrl(valid);
    setVideoDuration(0);
    setErrorMessage("");
  };

  return (
    <div className="space-y-3 border p-4 rounded-lg">
      <FormField
        control={form.control}
        name="videoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link YouTube</FormLabel>
            <FormControl>
              <Input
                placeholder="Dán link YouTube..."
                {...field}
                onChange={(e) => {
                  field.onChange(e); // Call field's onChange method to update value of field
                  handleUrlChange(e); // Call url change
                }}
              />
            </FormControl>
            {!isValidUrl && field.value && (
              <FormMessage>Link YouTube không hợp lệ</FormMessage>
            )}
            {errorMessage && <FormMessage>{errorMessage}</FormMessage>}
          </FormItem>
        )}
      />

      {form.watch("videoUrl") && isValidUrl && (
        <ReactPlayer
          ref={playerRef} // Grant this ReactPlayer is playerRef to use later
          url={form.watch("videoUrl")}
          controls={false}
          width="320px"
          height="240px"
          onReady={() => {
            console.log("[YoutubePicker] onReady gọi");
          }}
          onDuration={(dur) => {
            console.log("[YoutubePicker] onDuration gọi, duration =", dur);
            setVideoDuration(dur);
            if (form.getValues("startTime") > dur) {
              form.setValue("startTime", 0);
              console.log("[YoutubePicker] Reset startTime về 0 vì vượt duration");
            }
          }}
          onError={(e) => {
            console.error("[YoutubePicker] ReactPlayer error:", e);
            setIsValidUrl(false);
            setErrorMessage("Không thể load video. Vui lòng kiểm tra URL hoặc thử video khác.");
          }}
        />
      )}

      {videoDuration > 0 && (
        <>
          <p className="text-sm text-gray-500">
            Tổng thời lượng video: {Math.floor(videoDuration)} giây
          </p>

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bắt đầu (giây)</FormLabel>
                <FormControl>
                  <input
                    type="range"
                    min={0}
                    max={Math.floor(videoDuration)}
                    step={1}
                    value={field.value}
                    onChange={(e) => {
                      const newVal = Number(e.target.value);
                      console.log("[YoutubePicker] StartTime thay đổi:", newVal);
                      field.onChange(newVal);
                      if (playerRef.current) {
                        console.log("[YoutubePicker] SeekTo:", newVal);
                        playerRef.current.seekTo(newVal, "seconds");
                        // Seek preview video to new start time
                      }
                    }}
                  />
                </FormControl>
                <span>{field.value}s</span>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thời lượng (tối đa 30s)</FormLabel>
                <FormControl>
                  <input
                    type="range"
                    min={5}
                    max={Math.min(30, Math.floor(videoDuration))}
                    step={1}
                    value={field.value}
                    onChange={(e) => {
                      const newVal = Number(e.target.value);
                      field.onChange(newVal);
                      // Change duration value
                    }}
                  />
                </FormControl>
                <span>{field.value}s</span>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};

export default YoutubePicker;
