import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import * as AuthContext from "@/context/AuthContext";
import * as ThemeContext from "@/context/ThemeContext";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedGet = vi.mocked(axios.get);
const mockedPut = vi.mocked(axios.put);

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
let mockLocation = { pathname: "/" };
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => mockLocation,
    };
});

// Mock Contexts
const mockLogout = vi.fn();
const mockHandleThemeChange = vi.fn();

const defaultTheme = {
    id: 'default',
    name: 'Mặc định',
    className: 'bg-transparent',
    navbarStyles: {
        logo: 'text-orange-600',
        buttonPrimary: 'bg-orange-600',
        buttonSecondary: 'bg-orange-500',
        borderFocus: 'border-orange-400'
    }
};

describe("Navbar Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation = { pathname: "/" };

        // Default Mock Implementations
        vi.spyOn(AuthContext, "useAuth").mockReturnValue({
            token: null,
            user: null,
            login: vi.fn(),
            signup: vi.fn(),
            logout: mockLogout,
            setAuthData: vi.fn(),
        });

        vi.spyOn(ThemeContext, "useTheme").mockReturnValue({
            themeId: "default",
            selectedTheme: defaultTheme,
            handleThemeChange: mockHandleThemeChange,
        });

        mockedGet.mockResolvedValue({ data: [] });
    });

    const renderNavbar = () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );
    };

    it("renders the logo and login button when logged out", () => {
        renderNavbar();
        expect(screen.getByText("Quizmon")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /đăng nhập/i })).toBeInTheDocument();
    });

    it("renders the user avatar and navigation when logged in", async () => {
        vi.spyOn(AuthContext, "useAuth").mockReturnValue({
            token: "valid-token",
            user: { id: 1, username: "testuser", email: "test@test.com" },
            login: vi.fn(),
            signup: vi.fn(),
            logout: mockLogout,
            setAuthData: vi.fn(),
        });

        renderNavbar();

        expect(screen.getByText("Trang chủ")).toBeInTheDocument();
        expect(screen.getByText("Lớp học")).toBeInTheDocument();
        expect(screen.getByText("t")).toBeInTheDocument(); // Avatar fallback for "testuser"
    });

    it("fetches and displays notifications when logged in", async () => {
        vi.spyOn(AuthContext, "useAuth").mockReturnValue({
            token: "valid-token",
            user: { id: 1, username: "testuser", email: "test@test.com" },
            login: vi.fn(),
            signup: vi.fn(),
            logout: mockLogout,
            setAuthData: vi.fn(),
        });

        mockedGet.mockResolvedValueOnce({
            data: [
                { id: 1, message: "New challenge!", isRead: false, createdAt: new Date().toISOString() }
            ]
        });

        renderNavbar();

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalled();
            expect(screen.getByText("1")).toBeInTheDocument(); // Unread count badge
        });
    });

    it("handles logout correctly", async () => {
        const user = userEvent.setup();
        vi.spyOn(AuthContext, "useAuth").mockReturnValue({
            token: "valid-token",
            user: { id: 1, username: "testuser", email: "test@test.com" },
            login: vi.fn(),
            signup: vi.fn(),
            logout: mockLogout,
            setAuthData: vi.fn(),
        });

        renderNavbar();

        // Open dropdown
        const avatar = screen.getByText("t");
        await user.click(avatar);

        // Wait for Radix dropdown content
        await waitFor(() => {
            expect(screen.getByText(/đăng xuất/i)).toBeInTheDocument();
        });

        const logoutButton = screen.getByText(/đăng xuất/i);
        await user.click(logoutButton);

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("navigates to join match page on button click", async () => {
        const user = userEvent.setup();
        renderNavbar();
        const joinButton = screen.getByRole("button", { name: /tham gia đấu/i });
        await user.click(joinButton);
        expect(mockNavigate).toHaveBeenCalledWith("/join");
    });

    it("displays compact variant when on a quiz route", () => {
        mockLocation = { pathname: "/quiz/123" };
        renderNavbar();

        const nav = screen.getByRole("navigation");
        expect(nav).toHaveClass("h-12");
    });
});
