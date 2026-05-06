import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import QuizEditor from "@/pages/QuizEditor";
import { AuthProvider } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import axios from "axios";

// Mock axios
const mockedGet = vi.mocked(axios.get);

// Mock useParams
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useParams: () => ({ id: "quiz-123" }),
        useBlocker: vi.fn().mockReturnValue({ state: "unblocked" }),
    };
});

// Mock Sub-components
vi.mock("@/components/question/ButtonQuestionForm", () => ({
    default: () => <div data-testid="button-form">Button Question Form</div>,
}));
vi.mock("@/components/question/CheckboxQuestionForm", () => ({
    default: () => <div data-testid="checkbox-form">Checkbox Question Form</div>,
}));
vi.mock("@/components/question/RangeQuestionForm", () => ({
    default: () => <div data-testid="range-form">Range Question Form</div>,
}));
vi.mock("@/components/question/ReorderQuestionForm", () => ({
    default: () => <div data-testid="reorder-form">Reorder Question Form</div>,
}));
vi.mock("@/components/question/TypeAnswerQuestionForm", () => ({
    default: () => <div data-testid="typeanswer-form">Type Answer Question Form</div>,
}));
vi.mock("@/components/question/LocationQuestionForm", () => ({
    default: () => <div data-testid="location-form">Location Question Form</div>,
}));
vi.mock("@/components/quiz/SelectQuestionType", () => ({
    default: ({ onSelect }) => (
        <div data-testid="select-type-form">
            Select Type Form
            <button onClick={() => onSelect("BUTTONS")}>Choose Buttons</button>
        </div>
    ),
}));

const mockQuizData = {
    id: "quiz-123",
    questions: [
        { id: 1, text: "Q1", type: "BUTTONS" },
        { id: 2, text: "Q2", type: "CHECKBOXES" },
    ],
};

describe("QuizEditor Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedGet.mockResolvedValue({ data: mockQuizData });
    });

    const renderEditor = () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <ModalProvider>
                        <QuizEditor />
                    </ModalProvider>
                </AuthProvider>
            </BrowserRouter>
        );
    };

    it("fetches and displays quiz questions", async () => {
        renderEditor();

        expect(screen.getByText("Đang tải quiz...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByTestId("button-form")).toBeInTheDocument();
            expect(screen.getByText("1")).toBeInTheDocument(); // Question index 1 in footer
            expect(screen.getByText("2")).toBeInTheDocument(); // Question index 2 in footer
        });
    });

    it("switches between questions when clicking thumbnails", async () => {
        renderEditor();

        await waitFor(() => {
            expect(screen.getByTestId("button-form")).toBeInTheDocument();
        });

        const secondThumbnail = screen.getByText("2");
        fireEvent.click(secondThumbnail);

        await waitFor(() => {
            expect(screen.getByTestId("checkbox-form")).toBeInTheDocument();
            expect(screen.queryByTestId("button-form")).not.toBeInTheDocument();
        });
    });

    it("opens the question type selector and adds a new question", async () => {
        renderEditor();

        await waitFor(() => {
            expect(screen.getByTestId("button-form")).toBeInTheDocument();
        });

        // Plus button to add question
        const addButton = screen.getByRole("button", { name: /thêm câu hỏi/i });
        fireEvent.click(addButton);

        expect(screen.getByTestId("select-type-form")).toBeInTheDocument();

        const chooseButtons = screen.getByText("Choose Buttons");
        fireEvent.click(chooseButtons);

        await waitFor(() => {
            expect(screen.getByTestId("button-form")).toBeInTheDocument();
            // Since it's a new question being created, it should render the form for it.
        });
    });
});
