import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import * as AuthContext from "@/context/AuthContext";

// Mock useAuth
const mockLogin = vi.fn();
const mockSetAuthData = vi.fn();
vi.mock("@/context/AuthContext", () => ({
    useAuth: () => ({
        login: mockLogin,
        setAuthData: mockSetAuthData,
    }),
}));

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [mockSearchParams],
    };
});

describe("LoginForm Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams();
    });

    const renderForm = () => {
        render(
            <BrowserRouter>
                <LoginForm />
            </BrowserRouter>
        );
    };

    it("renders the login form correctly", () => {
        renderForm();
        expect(screen.getByText("Chào mừng trở lại!")).toBeInTheDocument();
        expect(screen.getByText("Email / Tài khoản")).toBeInTheDocument();
        expect(screen.getByText("Mật khẩu")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /đăng nhập ngay!/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    });

    it("handles manual login submission", async () => {
        mockLogin.mockResolvedValueOnce(true);
        renderForm();

        const emailInput = screen.getByLabelText(/email \/ tài khoản/i);
        const passwordInput = screen.getByLabelText(/mật khẩu/i);
        const submitButton = screen.getByRole("button", { name: /đăng nhập ngay!/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        fireEvent.click(submitButton);

        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("shows error message if login fails", async () => {
        mockLogin.mockResolvedValueOnce(false);
        renderForm();

        const emailInput = screen.getByLabelText(/email \/ tài khoản/i);
        const passwordInput = screen.getByLabelText(/mật khẩu/i);
        const submitButton = screen.getByRole("button", { name: /đăng nhập ngay!/i });

        fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "wrongpass" } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!")).toBeInTheDocument();
        });
    });

    it("handles Google login redirect logic (URL params)", async () => {
        const user = { id: 1, username: "googleuser", email: "google@gmail.com" };
        mockSearchParams.set("token", "google-token");
        mockSearchParams.set("user", encodeURIComponent(JSON.stringify(user)));

        renderForm();

        await waitFor(() => {
            expect(mockSetAuthData).toHaveBeenCalledWith("google-token", user);
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("shows error from URL param if present", () => {
        mockSearchParams.set("error", encodeURIComponent("Social login failed"));

        renderForm();

        expect(screen.getByText("Social login failed")).toBeInTheDocument();
    });

    it("navigates to signup page", () => {
        renderForm();
        const signupButton = screen.getByText(/đăng ký ngay/i);

        fireEvent.click(signupButton);

        expect(mockNavigate).toHaveBeenCalledWith("/sign-up");
    });
});
