import { Card } from "@/components/ui/card";

export interface QuestionTypeOption {
    key: string;
    label: string;
    desc: string;
}

export interface SelectQuestionTypeProps {
    onSelect: (type: string) => void;
    onClose?: () => void;
}

const types: QuestionTypeOption[] = [
    { key: "BUTTONS", label: "Trắc nghiệm", desc: "Chọn một đáp án đúng" },
    { key: "CHECKBOXES", label: "Hộp kiểm", desc: "Chọn nhiều đáp án đúng" },
    { key: "REORDER", label: "Sắp xếp", desc: "Sắp xếp các đáp án theo thứ tự đúng" },
    { key: "LOCATION", label: "Địa điểm", desc: "Đánh dấu đáp án trên bản đồ" },
    { key: "TYPEANSWER", label: "Nhập câu trả lời", desc: "Nhập đáp án đúng vào ô trả lời" },
    { key: "AI", label: "Tạo với AI", desc: "Tạo câu hỏi từ file PDF" },
];

export default function SelectQuestionType({ onSelect }: SelectQuestionTypeProps) {
    return (
        <div className="p-10 text-center">
            <h2 className="text-2xl font-bold mb-8 text-foreground">Thêm câu hỏi</h2>
            <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
                {types.map((t) => (
                    <Card
                        key={t.key}
                        className="p-6 cursor-pointer bg-card/40 hover:bg-card/70 transition-all duration-300 hover:scale-[1.03] border border-white/10 rounded-2xl shadow-lg backdrop-blur-md group"
                        onClick={() => onSelect(t.key)}
                    >
                        <h3 className="text-lg font-black text-foreground mb-1 group-hover:text-primary transition-colors">{t.label}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{t.desc}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}
