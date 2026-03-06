import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

describe("Select component", () => {
    it("renders trigger and shows value", () => {
        render(
            <Select defaultValue="apple">
                <SelectTrigger data-testid="select-trigger">
                    <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="banana">Banana</SelectItem>
                </SelectContent>
            </Select>
        );

        expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
        expect(screen.getByText("Apple")).toBeInTheDocument();
    });

    it("opens menu on click", async () => {
        render(
            <Select>
                <SelectTrigger data-testid="select-trigger">
                    <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="banana">Banana</SelectItem>
                </SelectContent>
            </Select>
        );

        const trigger = screen.getByTestId("select-trigger");
        fireEvent.click(trigger);

        // Wait for content to appear (Radix UI portal)
        await waitFor(() => {
            expect(screen.getByText("Banana")).toBeInTheDocument();
        });
    });
});
