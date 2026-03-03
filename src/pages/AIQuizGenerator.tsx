import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import endpoints from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
    Sparkles, Upload, FileText, Loader2, Wand2, X, AlertCircle
} from "lucide-react";

const QUESTION_TYPES = [
    { value: "BUTTONS", label: "Trắc nghiệm (1 đáp án)", description: "Chọn 1 đáp án đúng" },
    { value: "CHECKBOXES", label: "Nhiều đáp án", description: "Chọn nhiều đáp án đúng" },
    { value: "TYPEANSWER", label: "Tự nhập câu trả lời", description: "Người chơi gõ đáp án" },
    { value: "REORDER", label: "Sắp xếp thứ tự", description: "Sắp xếp các mục đúng thứ tự" },
];

const AIQuizGenerator = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [instruction, setInstruction] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [questionCount, setQuestionCount] = useState(10);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(["BUTTONS"]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const toggleType = (typeValue: string) => {
        setSelectedTypes((prev) =>
            prev.includes(typeValue)
                ? prev.filter((t) => t !== typeValue)
                : [...prev, typeValue]
        );
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPdfFile(file);
    };

    const handleGenerate = async () => {
        if (!instruction && !pdfFile) {
            setError("Vui lòng nhập yêu cầu hoặc tải lên file PDF");
            return;
        }
        if (selectedTypes.length === 0) {
            setError("Vui lòng chọn ít nhất một loại câu hỏi");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            if (instruction) formData.append("instruction", instruction);
            if (pdfFile) formData.append("pdfFile", pdfFile);
            formData.append("questionCount", String(questionCount));
            formData.append("questionTypes", JSON.stringify(selectedTypes));

            const res = await axios.post(endpoints.ai_create_job, formData, {
                headers: {
                    Authorization: token,
                    "Content-Type": "multipart/form-data",
                },
            });

            navigate(`/ai/review/${res.data.id}`);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Lỗi tạo quiz. Vui lòng thử lại."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-700 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        Powered by AI
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                        Tạo Quiz với AI
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Nhập yêu cầu hoặc tải lên tài liệu PDF để AI tự động tạo câu hỏi cho bạn
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 space-y-6">

                    {/* Text Instruction */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-violet-500" />
                            Yêu cầu / Chủ đề
                        </Label>
                        <Textarea
                            placeholder="Ví dụ: Tạo quiz về lịch sử Việt Nam thời kỳ phong kiến, tập trung vào các triều đại Lý, Trần, Lê..."
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            className="min-h-[120px] bg-white/70 resize-none"
                        />
                    </div>

                    {/* PDF Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-violet-500" />
                            File PDF (tuỳ chọn)
                        </Label>
                        {!pdfFile ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${dragOver
                                        ? "border-violet-500 bg-violet-50/50"
                                        : "border-gray-300 hover:border-violet-400 hover:bg-violet-50/30"
                                    }`}
                                onClick={() => document.getElementById("pdf-input")?.click()}
                            >
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                    Kéo thả file PDF vào đây hoặc <span className="text-violet-600 font-medium">nhấp để chọn</span>
                                </p>
                                <input
                                    id="pdf-input"
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 bg-violet-50 rounded-xl p-3 border border-violet-200">
                                <FileText className="w-5 h-5 text-violet-500" />
                                <span className="text-sm flex-1 truncate">{pdfFile.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setPdfFile(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Question Count */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                            Số câu hỏi: <span className="text-violet-600">{questionCount}</span>
                        </Label>
                        <Slider
                            value={[questionCount]}
                            onValueChange={(v) => setQuestionCount(v[0])}
                            min={1}
                            max={30}
                            step={1}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>1</span>
                            <span>30</span>
                        </div>
                    </div>

                    {/* Question Types */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Loại câu hỏi</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {QUESTION_TYPES.map((type) => (
                                <div
                                    key={type.value}
                                    onClick={() => toggleType(type.value)}
                                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${selectedTypes.includes(type.value)
                                            ? "border-violet-500 bg-violet-50/50 shadow-sm"
                                            : "border-gray-200 hover:border-gray-300 bg-white/50"
                                        }`}
                                >
                                    <Checkbox
                                        checked={selectedTypes.includes(type.value)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{type.label}</p>
                                        <p className="text-xs text-gray-500">{type.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || (!instruction && !pdfFile)}
                        className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl shadow-lg shadow-violet-500/25 transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Đang tạo câu hỏi...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Tạo Quiz với AI
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AIQuizGenerator;
