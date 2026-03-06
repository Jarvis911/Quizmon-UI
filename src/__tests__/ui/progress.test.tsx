import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Progress } from "@/components/ui/progress";

describe("Progress component", () => {
    it("renders correctly with value", () => {
        render(<Progress value={50} data-testid="progress" />);
        const progress = screen.getByTestId("progress");
        expect(progress).toBeInTheDocument();

        // Check for indicator style
        const indicator = progress.querySelector('[data-slot="progress-indicator"]');
        expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' });
    });

    it("renders correctly with 0 value", () => {
        render(<Progress value={0} data-testid="progress" />);
        const progress = screen.getByTestId("progress");
        const indicator = progress.querySelector('[data-slot="progress-indicator"]');
        expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it("renders correctly with 100 value", () => {
        render(<Progress value={100} data-testid="progress" />);
        const progress = screen.getByTestId("progress");
        const indicator = progress.querySelector('[data-slot="progress-indicator"]');
        expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
    });

    it("applies custom className", () => {
        render(<Progress className="custom-class" data-testid="progress" />);
        expect(screen.getByTestId("progress")).toHaveClass("custom-class");
    });
});
