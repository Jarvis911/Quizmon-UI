import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
    it("renders correctly with default props", () => {
        render(<Button>Click me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toBeInTheDocument();
    });

    it("handles onClick events", () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });

        fireEvent.click(buttonElement);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("can be disabled", () => {
        render(<Button disabled>Click me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toBeDisabled();
    });
});
