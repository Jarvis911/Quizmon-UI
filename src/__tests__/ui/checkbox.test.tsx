import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox component", () => {
    it("renders correctly", () => {
        render(<Checkbox aria-label="confirm" />);
        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeInTheDocument();
    });

    it("toggles state on click", () => {
        render(<Checkbox aria-label="confirm" />);
        const checkbox = screen.getByRole("checkbox");

        expect(checkbox).toHaveAttribute("data-state", "unchecked");

        fireEvent.click(checkbox);
        expect(checkbox).toHaveAttribute("data-state", "checked");

        fireEvent.click(checkbox);
        expect(checkbox).toHaveAttribute("data-state", "unchecked");
    });

    it("can be disabled", () => {
        render(<Checkbox aria-label="confirm" disabled />);
        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeDisabled();
    });

    it("applies custom className", () => {
        render(<Checkbox className="custom-class" />);
        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toHaveClass("custom-class");
    });
});
