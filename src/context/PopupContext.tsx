import React, { createContext, useContext, useState, ReactNode } from "react";

type PopupVariant = "default" | "destructive" | "success" | "warning";

interface PopupState {
    isOpen: boolean;
    title: string;
    message: string;
    variant: PopupVariant;
    onConfirm?: () => void;
}

interface PopupContextType {
    showPopup: (title: string, message: string, variant?: PopupVariant, onConfirm?: () => void) => void;
    hidePopup: () => void;
    popup: PopupState;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider = ({ children }: { children: ReactNode }) => {
    const [popup, setPopup] = useState<PopupState>({
        isOpen: false,
        title: "",
        message: "",
        variant: "default",
    });

    const showPopup = React.useCallback((title: string, message: string, variant: PopupVariant = "default", onConfirm?: () => void) => {
        setPopup({ isOpen: true, title, message, variant, onConfirm });
    }, []);

    const hidePopup = React.useCallback(() => {
        setPopup((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const value = React.useMemo(() => ({ showPopup, hidePopup, popup }), [showPopup, hidePopup, popup]);

    return (
        <PopupContext.Provider value={value}>
            {children}
        </PopupContext.Provider>
    );
};

export const usePopup = () => {
    const context = useContext(PopupContext);
    if (context === undefined) {
        throw new Error("usePopup must be used within a PopupProvider");
    }
    return context;
};
