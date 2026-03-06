import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

describe("Dialog component", () => {
    it("opens dialog on trigger click", async () => {
        render(
            <Dialog>
                <DialogTrigger data-testid="dialog-trigger">Open Dialog</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>Dialog Description</DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );

        const trigger = screen.getByTestId("dialog-trigger");
        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.getByText("Dialog Title")).toBeInTheDocument();
            expect(screen.getByText("Dialog Description")).toBeInTheDocument();
        });
    });

    it("closes dialog on close button click", async () => {
        render(
            <Dialog defaultOpen>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );

        expect(screen.getByText("Dialog Title")).toBeInTheDocument();

        // Note: Shadcn DialogClose is usually XIcon or a specific Close button.
        // I'll test the presence of the Title first.

        // Wait for the close button from Shadcn (XIcon)
        const closeButton = screen.getByRole("button", { name: /close/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();
        });
    });
});
