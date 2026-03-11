import React from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertCircle, Calendar, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AIGenerationLimitProps {
    used: number;
    limit: number | null;
    renewalDate?: string;
}

const AIGenerationLimit: React.FC<AIGenerationLimitProps> = ({ used, limit, renewalDate }) => {
    const isUnlimited = limit === null;
    const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
    const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
    const isCloseToLimit = !isUnlimited && percentage >= 80;
    const isAtLimit = !isUnlimited && used >= limit;

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${isAtLimit ? 'bg-destructive' : isCloseToLimit ? 'bg-amber-500' : 'bg-primary'}`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className={`w-4 h-4 ${isAtLimit ? 'text-destructive' : 'text-primary'}`} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Sử dụng AI Generator</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        {isUnlimited ? (
                             <span className="text-2xl font-black text-primary italic">Không giới hạn</span>
                        ) : (
                            <>
                                <span className="text-2xl font-black text-foreground">{used}</span>
                                <span className="text-muted-foreground font-bold">/ {limit} câu hỏi</span>
                            </>
                        )}
                    </div>
                </div>

                {!isUnlimited && (
                    <div className="flex-1 max-w-xs">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                            <span className={isAtLimit ? 'text-destructive' : isCloseToLimit ? 'text-amber-500' : 'text-muted-foreground'}>
                                {isAtLimit ? 'Đã hết lượt' : isCloseToLimit ? 'Sắp hết lượt' : 'Còn lại'}
                            </span>
                            <span className="text-muted-foreground">{remaining} lượt</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {renewalDate && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-foreground/5 px-3 py-1.5 rounded-full border border-white/5">
                            <Calendar className="w-3 h-3" />
                            <span>Làm mới: {new Date(renewalDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                    )}

                    {(isCloseToLimit || isAtLimit) && (
                        <Link to="/billing">
                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary gap-2 rounded-full">
                                <ArrowUpCircle className="w-3 h-3" />
                                Nâng cấp
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {isAtLimit && (
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-destructive bg-destructive/10 p-2 rounded-xl border border-destructive/20 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    <span>Bạn đã đạt giới hạn tạo AI cho giai đoạn này. Hãy nâng cấp để tiếp tục!</span>
                </div>
            )}
        </div>
    );
};

export default AIGenerationLimit;
