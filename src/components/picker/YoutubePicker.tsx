import { useRef, useState, ChangeEvent } from "react";
import ReactPlayer from "react-player";
import { Input } from "@/components/ui/input";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { QuizFormValues } from "@/types";

interface YoutubePickerProps {
    form: UseFormReturn<QuizFormValues>;
}

interface ReactPlayerRef {
    seekTo: (amount: number, type?: "seconds" | "fraction") => void;
}

const YoutubePicker = ({ form }: YoutubePickerProps) => {
    const playerRef = useRef<ReactPlayerRef | null>(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [isValidUrl, setIsValidUrl] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const isValidYouTubeUrl = (url: string): boolean =>
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);

    const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        form.setValue("videoUrl", url);
        const valid = isValidYouTubeUrl(url);
        setIsValidUrl(valid);
        setVideoDuration(0);
        setErrorMessage("");
    };

    const videoUrl = form.watch("videoUrl");

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
                                    field.onChange(e);
                                    handleUrlChange(e);
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

            {videoUrl && isValidUrl && (
                <ReactPlayer
                    ref={playerRef as React.RefObject<ReactPlayer>}
                    url={videoUrl}
                    controls={false}
                    width="500px"
                    height="350px"
                    onReady={() => {
                        console.log("[YoutubePicker] onReady called");
                    }}
                    onDuration={(dur: number) => {
                        console.log("[YoutubePicker] onDuration called, duration =", dur);
                        setVideoDuration(dur);
                        const currentStartTime = form.getValues("startTime");
                        if (currentStartTime && currentStartTime > dur) {
                            form.setValue("startTime", 0);
                            console.log("[YoutubePicker] Reset startTime to 0 because it exceeded duration");
                        }
                    }}
                    onError={(e: unknown) => {
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
                                        value={field.value ?? 0}
                                        onChange={(e) => {
                                            const newVal = Number(e.target.value);
                                            console.log("[YoutubePicker] StartTime changed:", newVal);
                                            field.onChange(newVal);
                                            if (playerRef.current) {
                                                console.log("[YoutubePicker] SeekTo:", newVal);
                                                playerRef.current.seekTo(newVal, "seconds");
                                            }
                                        }}
                                    />
                                </FormControl>
                                <span>{field.value ?? 0}s</span>
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
                                        value={field.value ?? 5}
                                        onChange={(e) => {
                                            const newVal = Number(e.target.value);
                                            field.onChange(newVal);
                                        }}
                                    />
                                </FormControl>
                                <span>{field.value ?? 5}s</span>
                            </FormItem>
                        )}
                    />
                </>
            )}
        </div>
    );
};

export default YoutubePicker;
