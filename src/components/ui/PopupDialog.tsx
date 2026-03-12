import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePopup } from "@/context/PopupContext";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const PopupDialog = () => {
    const { popup, hidePopup } = usePopup();

    const getIcon = () => {
        switch (popup.variant) {
            case "destructive":
                return <AlertCircle className="size-6 text-destructive" />;
            case "success":
                return <CheckCircle2 className="size-6 text-green-500" />;
            case "warning":
                return <AlertTriangle className="size-6 text-yellow-500" />;
            default:
                return <Info className="size-6 text-primary" />;
        }
    };

    return (
        <Dialog open={popup.isOpen} onOpenChange={(open) => !open && hidePopup()}>
            <DialogContent className="sm:max-w-md border-none shadow-2xl bg-card/95 backdrop-blur-xl">
                <DialogHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className={cn(
                        "p-2 rounded-full",
                        popup.variant === "destructive" && "bg-destructive/10",
                        popup.variant === "success" && "bg-green-500/10",
                        popup.variant === "warning" && "bg-yellow-500/10",
                        popup.variant === "default" && "bg-primary/10"
                    )}>
                        {getIcon()}
                    </div>
                    <DialogTitle className="text-xl font-black">{popup.title}</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-base text-muted-foreground font-medium py-2">
                    {popup.message}
                </DialogDescription>
                <DialogFooter className="gap-2 sm:gap-0">
                    {popup.onConfirm ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                className="font-bold min-w-24"
                                onClick={hidePopup}
                            >
                                Không
                            </Button>
                            <Button
                                type="button"
                                variant={popup.variant === "destructive" ? "destructive" : "default"}
                                className="font-bold min-w-24 border-none shadow-lg transition-all active:scale-95"
                                onClick={() => {
                                    popup.onConfirm?.();
                                    hidePopup();
                                }}
                            >
                                Có
                            </Button>
                        </>
                    ) : (
                        <Button 
                            type="button" 
                            variant={popup.variant === "destructive" ? "destructive" : "default"}
                            className="font-bold min-w-24 border-none shadow-lg transition-all active:scale-95"
                            onClick={hidePopup}
                        >
                            OK
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
