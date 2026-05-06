import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import JoinMatch from "@/pages/JoinMatch";

// Mock axios
const mockedAxios = vi.mocked(axios, true);

// Mock useNavigate
const mockedUsedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockedUsedNavigate,
    };
});

describe("JoinMatch Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderPage = () => {
        render(
            <BrowserRouter>
                <JoinMatch />
            </BrowserRouter>
        );
    };

    it("renders the join match form", () => {
        renderPage();
        expect(screen.getByText("Tham gia!")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Game ID")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /tham gia/i })).toBeInTheDocument();
    });

    it("focuses the input on mount", () => {
        renderPage();
        const input = screen.getByPlaceholderText("Game ID");
        expect(input).toHaveFocus();
    });

    it("shows error if joining with empty code", () => {
        renderPage();
        const button = screen.getByRole("button", { name: /tham gia/i });

        // Button might be disabled if code is empty based on the component code:
        // disabled={!code.trim() || isLoading}
        expect(button).toBeDisabled();
    });

    it("successfully joins a match and navigates", async () => {
        mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { id: "match-123", pin: "123456" } });
        renderPage();

        const input = screen.getByPlaceholderText("Game ID");
        const button = screen.getByRole("button", { name: /tham gia/i });

        fireEvent.change(input, { target: { value: "123456" } });
        expect(button).not.toBeDisabled();

        fireEvent.click(button);

        expect(screen.getByText("Đang kiểm tra...")).toBeInTheDocument();

        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("123456"));
            expect(mockedUsedNavigate).toHaveBeenCalledWith("/match/123456/lobby");
        });
    });

    it("shows error message if match is not found", async () => {
        mockedAxios.get.mockRejectedValueOnce({
            response: { status: 404 }
        });

        renderPage();

        const input = screen.getByPlaceholderText("Game ID");
        const button = screen.getByRole("button", { name: /tham gia/i });

        fireEvent.change(input, { target: { value: "999999" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText("Mã phòng không tồn tại hoặc đã kết thúc!")).toBeInTheDocument();
        });
    });

    it("shows generic error message for other API failures", async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

        renderPage();

        const input = screen.getByPlaceholderText("Game ID");
        const button = screen.getByRole("button", { name: /tham gia/i });

        fireEvent.change(input, { target: { value: "111111" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText("Có lỗi xảy ra, vui lòng thử lại.")).toBeInTheDocument();
        });
    });
});
