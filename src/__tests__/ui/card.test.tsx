import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";

describe("Card component", () => {
    it("renders Card correctly", () => {
        const { container } = render(<Card>Card Content</Card>);
        expect(container.firstChild).toHaveClass("bg-card text-card-foreground");
        expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("renders CardHeader correctly", () => {
        const { container } = render(<CardHeader>Header Content</CardHeader>);
        expect(container.firstChild).toHaveClass("items-start gap-1.5 px-6");
        expect(screen.getByText("Header Content")).toBeInTheDocument();
    });

    it("renders CardTitle correctly", () => {
        const { container } = render(<CardTitle>Title Content</CardTitle>);
        expect(container.firstChild).toHaveClass("leading-none font-semibold");
        expect(screen.getByText("Title Content")).toBeInTheDocument();
    });

    it("renders CardDescription correctly", () => {
        const { container } = render(<CardDescription>Description Content</CardDescription>);
        expect(container.firstChild).toHaveClass("text-muted-foreground text-sm");
        expect(screen.getByText("Description Content")).toBeInTheDocument();
    });

    it("renders CardContent correctly", () => {
        const { container } = render(<CardContent>Body Content</CardContent>);
        expect(container.firstChild).toHaveClass("px-6");
        expect(screen.getByText("Body Content")).toBeInTheDocument();
    });

    it("renders CardFooter correctly", () => {
        const { container } = render(<CardFooter>Footer Content</CardFooter>);
        expect(container.firstChild).toHaveClass("flex items-center px-6");
        expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });

    it("renders full card composite correctly", () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Card Content</p>
                </CardContent>
                <CardFooter>
                    <p>Card Footer</p>
                </CardFooter>
            </Card>
        );

        expect(screen.getByText("Card Title")).toBeInTheDocument();
        expect(screen.getByText("Card Description")).toBeInTheDocument();
        expect(screen.getByText("Card Content")).toBeInTheDocument();
        expect(screen.getByText("Card Footer")).toBeInTheDocument();
    });
});
