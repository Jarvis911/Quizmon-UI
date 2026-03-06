import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Input } from "@/components/ui/input";

describe("Input component", () => {
    it("renders Input correctly", () => {
        render(<Input placeholder="Test Input" />);
        const inputElement = screen.getByPlaceholderText("Test Input");
        expect(inputElement).toBeInTheDocument();
        expect(inputElement).toHaveClass("border-input");
    });

    it("applies custom className", () => {
        render(<Input data-testid="custom-input" className="custom-class" />);
        const inputElement = screen.getByTestId("custom-input");
        expect(inputElement).toHaveClass("custom-class");
    });

    it("handles changes", () => {
        const handleChange = vi.fn();
        render(<Input data-testid="change-input" onChange={handleChange} />);
        const inputElement = screen.getByTestId("change-input");

        fireEvent.change(inputElement, { target: { value: "test value" } });

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(inputElement).toHaveValue("test value");
    });

    it("can be disabled", () => {
        render(<Input data-testid="disabled-input" disabled />);
        const inputElement = screen.getByTestId("disabled-input");

        expect(inputElement).toBeDisabled();
        expect(inputElement).toHaveClass("disabled:opacity-50");
    });

    it("supports different types", () => {
        render(<Input data-testid="password-input" type="password" />);
        const inputElement = screen.getByTestId("password-input");
        expect(inputElement).toHaveAttribute("type", "password");
    });
});
