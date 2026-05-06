/**
 * AIImageButton — reusable "Generate image with AI" entry point.
 *
 * Props:
 *   context      – The quiz title / question text fed to the AI as background context.
 *   onGenerated  – Called with the returned URL (and optional effect) when the image is ready.
 *   disabled?    – Externally disable the button (e.g. while saving).
 */
import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "@/api/client";
import endpoints from "@/api/api";

const IMAGE_QUOTA_COST = 3;

const STYLE_OPTIONS = [
    { value: "", label: "AI tự chọn" },
    { value: "flat illustration, vibrant colors", label: "Flat / Minh họa phẳng" },
    { value: "photorealistic", label: "Ảnh thực tế" },
    { value: "cartoon style, bright colors", label: "Hoạt hình / Cartoon" },
    { value: "minimal clean vector art", label: "Minimal / Tối giản" },
    { value: "watercolor painting style", label: "Màu nước" },
    { value: "3D render, soft lighting", label: "3D Render" },
    { value: "pixel art", label: "Pixel Art" },
];

const EFFECT_OPTIONS = [
    { value: "NONE", label: "Không có" },
    { value: "BLUR_TO_CLEAR", label: "Mờ → Rõ dần" },
    { value: "ZOOM_IN", label: "Zoom vào" },
    { value: "ZOOM_OUT", label: "Zoom ra" },
];

interface AIImageButtonProps {
    context: string;
    onGenerated: (url: string, effect: string) => void;
    disabled?: boolean;
}

export default function AIImageButton({ context, onGenerated, disabled }: AIImageButtonProps) {
    const [open, setOpen] = useState(false);
    const [extraPrompt, setExtraPrompt] = useState("");
    const [style, setStyle] = useState("");
    const [effect, setEffect] = useState("NONE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const reset = () => {
        setExtraPrompt("");
        setStyle("");
        setEffect("NONE");
        setError(null);
        setPreview(null);
    };

    const handleOpen = () => {
        reset();
        setOpen(true);
    };

    const handleGenerate = async () => {
        setError(null);
        setLoading(true);
        try {
            const res = await apiClient.post(endpoints.ai_generate_image, {
                context,
                prompt: extraPrompt || undefined,
                style: style || undefined,
                imageEffect: effect,
            });
            const url = res.data.url as string;
            setPreview(url);
            // Attach immediately; user can remove later if they don't like it.
            onGenerated(url, effect);
            setOpen(false);
        } catch (err: any) {
            setError(
                err?.response?.data?.message || "Tạo ảnh thất bại. Thử lại hoặc thay đổi mô tả."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={handleOpen}
                className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Tạo ảnh với AI
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            Tạo ảnh với AI
                        </DialogTitle>
                    </DialogHeader>

                    {/* Quota warning */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-snug">
                            Mỗi ảnh tiêu tốn <span className="font-black text-amber-500">{IMAGE_QUOTA_COST} quota</span> từ giới hạn AI của bạn trong kỳ hiện tại.
                        </p>
                    </div>

                    <div className="space-y-4 py-1">
                        {/* Context preview */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1.5 block">
                                AI sẽ dựa vào nội dung
                            </label>
                            <p className="text-sm font-bold bg-foreground/5 rounded-xl px-4 py-2.5 border border-white/5 leading-snug line-clamp-3">
                                {context || "(Không có context)"}
                            </p>
                        </div>

                        {/* Style selector */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1.5 block">
                                Phong cách ảnh
                            </label>
                            <select
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full h-10 rounded-xl border border-white/10 bg-foreground/5 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                {STYLE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Extra description */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1.5 block">
                                Mô tả thêm (tuỳ chọn)
                            </label>
                            <Textarea
                                value={extraPrompt}
                                onChange={(e) => setExtraPrompt(e.target.value)}
                                placeholder="Ví dụ: bản đồ thế giới, màu xanh lá, góc nhìn từ trên cao..."
                                className="min-h-[72px] max-h-36 overflow-y-auto resize-none bg-foreground/5 border-white/5 rounded-xl font-bold text-sm"
                            />
                        </div>

                        {/* Effect selector */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1.5 block">
                                Hiệu ứng hiển thị
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {EFFECT_OPTIONS.map((o) => (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => setEffect(o.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                                            effect === o.value
                                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                : "border-white/10 bg-foreground/5 hover:bg-foreground/10"
                                        }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-xs font-bold text-red-500 bg-red-500/10 rounded-xl px-3 py-2 border border-red-500/20">
                                {error}
                            </p>
                        )}

                        {/* Preview */}
                        {preview && (
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/10">
                                <img
                                    src={preview}
                                    alt="AI generated"
                                    className="w-full max-h-64 object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPreview(null)}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-all"
                                >
                                    <X className="w-3.5 h-3.5 text-white" />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                                    <p className="text-[10px] text-white/80 font-black uppercase tracking-widest">
                                        Xem trước — chưa được lưu
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                        <Button
                            variant="ghost"
                            className="h-11 rounded-2xl font-black uppercase tracking-widest text-xs px-6 text-muted-foreground"
                            onClick={() => setOpen(false)}
                        >
                            Huỷ
                        </Button>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="h-11 rounded-2xl font-black uppercase tracking-widest text-xs px-8 bg-primary text-primary-foreground shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            {loading ? "Đang tạo..." : `Tạo & gắn luôn (−${IMAGE_QUOTA_COST} quota)`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
