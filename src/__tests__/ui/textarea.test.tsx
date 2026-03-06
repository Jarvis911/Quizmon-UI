import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea component", () => {
    it("renders correctly", () => {
        render(<Textarea placeholder="Enter text" />);
        expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("handles value changes", () => {
        const onChange = vi.fn();
        render(<Textarea placeholder="Enter text" onChange={onChange} />);
        const textarea = screen.getByPlaceholderText("Enter text");

        fireEvent.change(textarea, { target: { value: "hello world" } });
        expect(onChange).toHaveBeenCalled();
        expect(textarea).toHaveValue("hello world");
    });

    it("can be disabled", () => {
        render(<Textarea disabled />);
        const textarea = screen.getByRole("textbox");
        expect(textarea).toBeDisabled();
    });

    it("applies custom className", () => {
        render(<Textarea className="custom-class" />);
        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveClass("custom-class");
    });
});
