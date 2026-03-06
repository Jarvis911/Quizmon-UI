import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge component", () => {
    it("renders correctly with default variant", () => {
        render(<Badge>Test Badge</Badge>);
        const badgeElement = screen.getByText("Test Badge");
        expect(badgeElement).toBeInTheDocument();
        expect(badgeElement).toHaveClass("bg-primary"); // default variant
    });

    it("renders correctly with secondary variant", () => {
        render(<Badge variant="secondary">Secondary Badge</Badge>);
        const badgeElement = screen.getByText("Secondary Badge");
        expect(badgeElement).toBeInTheDocument();
        expect(badgeElement).toHaveClass("bg-secondary");
    });

    it("renders correctly with destructive variant", () => {
        render(<Badge variant="destructive">Destructive Badge</Badge>);
        const badgeElement = screen.getByText("Destructive Badge");
        expect(badgeElement).toBeInTheDocument();
        expect(badgeElement).toHaveClass("bg-destructive");
    });

    it("renders correctly with outline variant", () => {
        render(<Badge variant="outline">Outline Badge</Badge>);
        const badgeElement = screen.getByText("Outline Badge");
        expect(badgeElement).toBeInTheDocument();
        expect(badgeElement).toHaveClass("text-foreground"); // Based on outline styles
    });

    it("renders custom className correctly", () => {
        render(<Badge className="custom-class">Custom Badge</Badge>);
        const badgeElement = screen.getByText("Custom Badge");
        expect(badgeElement).toHaveClass("custom-class");
    });
});
