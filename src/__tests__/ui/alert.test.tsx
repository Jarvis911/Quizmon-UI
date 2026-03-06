import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

describe("Alert component", () => {
    it("renders default Alert correctly", () => {
        render(
            <Alert>
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                    You can add components to your app using the cli.
                </AlertDescription>
            </Alert>
        );
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText("Heads up!")).toBeInTheDocument();
        expect(screen.getByText(/You can add components/i)).toBeInTheDocument();
    });

    it("renders destructive Alert correctly", () => {
        render(
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Your session has expired.</AlertDescription>
            </Alert>
        );
        const alert = screen.getByRole("alert");
        expect(alert).toHaveClass("text-destructive");
        expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("applies custom className", () => {
        render(<Alert className="custom-class" />);
        expect(screen.getByRole("alert")).toHaveClass("custom-class");
    });
});
