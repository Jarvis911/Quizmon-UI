import { useState } from "react";
import { Search, Loader2, Play, CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MusicSearchResult {
    title: string;
    url: string;
    thumbnail: string;
    duration: string;
    uploaderName: string;
}

interface MusicSearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (url: string) => void;
}

const MusicSearchModal = ({ open, onOpenChange, onSelect }: MusicSearchModalProps) => {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<MusicSearchResult[]>([]);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            // Using a public Piped instance API for searching YouTube
            const response = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`);
            const data = await response.json();
            
            const formattedResults = data.items.map((item: any) => ({
                title: item.title,
                url: item.url,
                thumbnail: item.thumbnail,
                duration: item.duration ? Math.floor(item.duration / 60) + ":" + (item.duration % 60).toString().padStart(2, '0') : "N/A",
                uploaderName: item.uploaderName || "Unknown",
            }));
            
            setResults(formattedResults);
        } catch (error) {
            console.error("Music search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (url: string) => {
        setSelectedUrl(url);
        onSelect(url);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-2xl border-white/10 max-h-[80vh] flex flex-col p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        🎵 Tìm kiếm nhạc nền
                    </DialogTitle>
                    <DialogDescription className="font-medium text-foreground/60">
                        Tìm kiếm hàng triệu bản nhạc từ YouTube để làm phong phú trận đấu của bạn.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <img 
                            src="https://cdn-icons-png.flaticon.com/512/11552/11552108.png" 
                            alt="Search" 
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain opacity-40 grayscale" 
                        />
                        <Input
                            placeholder="Nhập tên bài hát, ca sĩ, thể loại..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="pl-10 h-12 bg-background/50 border-white/10 focus:ring-primary text-base font-medium"
                        />
                    </div>
                    <Button 
                        onClick={handleSearch} 
                        disabled={loading}
                        className="h-12 px-6 font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "TÌM KIẾM"}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-foreground/60 font-black animate-pulse uppercase tracking-widest text-sm">Đang tìm kiếm giai điệu...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {results.map((result, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(result.url)}
                                    className={`group flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 border-2 text-left ${
                                        selectedUrl === result.url 
                                        ? "bg-primary/20 border-primary shadow-lg shadow-primary/10" 
                                        : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 hover:scale-[1.01]"
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <img 
                                            src={result.thumbnail} 
                                            alt={result.title} 
                                            className="w-24 h-16 object-cover rounded-xl shadow-md transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                            <Play className="w-6 h-6 text-white fill-white" />
                                        </div>
                                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold text-white px-1.5 rounded-md">
                                            {result.duration}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                            {result.title}
                                        </h4>
                                        <p className="text-xs text-foreground/50 font-medium mt-1 truncate">
                                            {result.uploaderName}
                                        </p>
                                    </div>
                                    <div className="shrink-0 scale-0 group-hover:scale-100 transition-transform">
                                        <Button variant="ghost" size="icon" className="rounded-full bg-primary text-white w-10 h-10 hover:bg-primary/90">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </Button>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query && !loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-foreground/40 gap-3">
                            <span className="text-6xl">🔍</span>
                            <p className="font-bold">Không tìm thấy kết quả nào cho "{query}"</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-foreground/40 gap-4">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border-2 border-dashed border-white/10">
                                <img 
                                    src="https://cdn-icons-png.flaticon.com/512/11552/11552108.png" 
                                    alt="Search" 
                                    className="w-8 h-8 object-contain opacity-20 grayscale" 
                                />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest opacity-60">Khám phá âm nhạc cho trận đấu của bạn</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MusicSearchModal;
