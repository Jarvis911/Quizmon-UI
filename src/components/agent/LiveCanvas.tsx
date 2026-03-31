import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, Circle, Pencil, MoreVertical, Trash2, Loader2 } from "lucide-react";

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    optionsData: any;
}

interface QuizData {
    title: string;
    questions: Question[];
}

interface LiveCanvasProps {
    quizData: QuizData;
    isGenerating: boolean;
}

const TYPE_LABELS: Record<string, string> = {
    BUTTONS: "Trắc nghiệm",
    CHECKBOXES: "Nhiều đáp án",
    TYPEANSWER: "Điền đáp án",
    REORDER: "Sắp xếp",
    LOCATION: "Vị trí",
};

const LiveCanvas = ({ quizData, isGenerating }: LiveCanvasProps) => {
    return (
        <div className="space-y-8 pb-32">
            {/* Quiz Info */}
            <div className="text-center space-y-3 mb-12">
                <h2 className="text-4xl font-black tracking-tighter text-foreground drop-shadow-sm">
                    {quizData.title}
                </h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    <Sparkles className="w-3 h-3" />
                    Xem trước bản vẽ trực tiếp
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                {quizData.questions.length === 0 && !isGenerating && (
                    <div className="flex flex-col items-center justify-center py-20 bg-card/10 rounded-4xl border border-white/5 border-dashed">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-10 h-10 text-primary opacity-40" />
                        </div>
                        <p className="text-lg font-black text-muted-foreground opacity-60">
                            Hãy yêu cầu Agent để bắt đầu tạo quiz!
                        </p>
                    </div>
                )}

                {quizData.questions.map((q, idx) => (
                    <Card key={q.id || idx} className="p-8 rounded-4xl bg-white/40 backdrop-blur-3xl border border-white/20 shadow-2xl group transition-all hover:scale-[1.01] hover:border-primary/20">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-black tabular-nums shadow-lg shadow-primary/20">
                                    {idx + 1}
                                </div>
                                <div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-primary/20 text-primary bg-primary/5">
                                        {TYPE_LABELS[q.questionType] || q.questionType}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5"><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-foreground mb-8 tracking-tight leading-tight">
                            {q.questionText}
                        </h3>

                        {/* Options Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.optionsData?.options?.map((opt: any, i: number) => (
                                <div 
                                    key={i} 
                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all shadow-sm ${opt.isCorrect 
                                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/5" 
                                        : "bg-foreground/5 border-white/5"
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-inner ${opt.isCorrect 
                                        ? "bg-emerald-500 text-white" 
                                        : "bg-foreground/10 text-muted-foreground"
                                    }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className={`text-sm ${opt.isCorrect ? "font-black text-emerald-500" : "font-bold text-foreground/80"}`}>
                                        {opt.text}
                                    </span>
                                    {opt.isCorrect && <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-500" />}
                                </div>
                            ))}
                            {q.questionType === "TYPEANSWER" && (
                                <div className="col-span-2 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl p-4 shadow-sm">
                                    <p className="font-black text-emerald-500 text-sm tracking-tight">
                                        Đáp án đúng: {q.optionsData?.correctAnswer}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}

                {isGenerating && (
                    <Card className="p-8 rounded-4xl bg-white/20 backdrop-blur-3xl border-2 border-dashed border-primary/20 shadow-2xl animate-pulse">
                        <div className="flex items-center gap-4 mb-8">
                             <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center backdrop-blur-xl">
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                             </div>
                             <div className="h-4 w-32 bg-primary/10 rounded-full"></div>
                        </div>
                        <div className="h-8 w-3/4 bg-primary/10 rounded-xl mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-14 bg-primary/5 rounded-2xl border-2 border-white/5"></div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default LiveCanvas;
