import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Label } from "@/components/ui/label";

describe("Label component", () => {
    it("renders correctly", () => {
        render(<Label>Username</Label>);
        expect(screen.getByText("Username")).toBeInTheDocument();
    });

    it("associates with input via htmlFor", () => {
        render(
            <>
                <Label htmlFor="test-input">Username</Label>
                <input id="test-input" />
            </>
        );
        const label = screen.getByText("Username");
        expect(label).toHaveAttribute("for", "test-input");
    });

    it("applies custom className", () => {
        render(<Label className="custom-class">Label</Label>);
        expect(screen.getByText("Label")).toHaveClass("custom-class");
    });
});
