import { Card } from "@/components/ui/card";

const types = [
  { key: "BUTTONS", label: "Trắc nghiệm", desc: "Chọn một đáp án đúng" },
  { key: "CHECKBOXES", label: "Hộp kiểm", desc: "Chọn nhiều đáp án đúng" },
  { key: "REORDER", label: "Sắp xếp", desc: "Sắp xếp các đáp án theo thứ tự đúng" },
  { key: "LOCATION", label: "Địa điểm", desc: "Đánh dấu đáp án trên bản đồ" },
  { key: "TYPEANSWER", label: "Nhập câu trả lời", desc: "Nhập đáp án đúng vào ô trả lời" },
  { key: "AI", label: "Tạo với AI", desc: "Tạo câu hỏi từ file PDF" },
];

export default function SelectQuestionType({ onSelect }) {

  return (
    <div className="p-10 text-center">
      <h2 className="text-2xl font-bold mb-8">Thêm câu hỏi</h2>
      <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
        {types.map((t) => (
          <Card
            key={t.key}
            className="p-6 cursor-pointer bg-white/40 hover:bg-white/60 transition transition-transform duration-300 hover:scale-103"
            onClick={() => onSelect(t.key)}
          >
            <h3 className="text-lg font-semibold">{t.label}</h3>
            <p className="text-sm text-gray-600">{t.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
