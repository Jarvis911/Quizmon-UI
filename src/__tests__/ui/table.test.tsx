import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from "@/components/ui/table";

describe("Table component", () => {
    it("renders Table structure correctly", () => {
        render(
            <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>INV001</TableCell>
                        <TableCell>Paid</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={1}>Total</TableCell>
                        <TableCell>$250.00</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        );

        expect(screen.getByText("Invoice")).toBeInTheDocument();
        expect(screen.getByText("INV001")).toBeInTheDocument();
        expect(screen.getByText("Paid")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
        expect(screen.getByText("$250.00")).toBeInTheDocument();
        expect(screen.getByText("A list of your recent invoices.")).toBeInTheDocument();
    });

    it("applies custom className to TableRow", () => {
        render(
            <Table>
                <TableBody>
                    <TableRow className="custom-row-class">
                        <TableCell>Data</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
        const row = screen.getByRole("row");
        expect(row).toHaveClass("custom-row-class");
    });
});
