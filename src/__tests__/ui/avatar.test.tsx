import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

describe("Avatar component", () => {
    it("renders Avatar correctly", () => {
        render(
            <Avatar data-testid="avatar">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
        );
        const avatar = screen.getByTestId("avatar");
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveClass("relative flex size-8 shrink-0 overflow-hidden rounded-full");
    });

    it("renders AvatarFallback when image is missing", () => {
        render(
            <Avatar>
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
        );
        expect(screen.getByText("CN")).toBeInTheDocument();
        expect(screen.getByText("CN")).toHaveClass("bg-muted flex size-full items-center justify-center rounded-full");
    });

    it("applies custom className", () => {
        render(<Avatar className="custom-class" data-testid="avatar-custom" />);
        const avatar = screen.getByTestId("avatar-custom");
        expect(avatar).toHaveClass("custom-class");
    });
});
