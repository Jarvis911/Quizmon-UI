// ========================
// User & Auth Types
// ========================

export interface User {
    id: number;
    username: string;
    email: string;
}

// ========================
// Quiz Types
// ========================

export interface Quiz {
    id: number;
    title: string;
    description?: string;
    image?: string;
    creatorId: number;
    creator: User;
    categoryId?: number;
    category?: Category;
    questions?: Question[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
}

// ========================
// Question Types
// ========================

export type QuestionType =
    | 'BUTTONS'
    | 'CHECKBOXES'
    | 'REORDER'
    | 'RANGE'
    | 'LOCATION'
    | 'TYPEANSWER';

export interface BaseQuestion {
    id: number;
    quizId: number;
    order: number;
    title: string;
    image?: string;
    video?: string;
    timeLimit?: number;
    points?: number;
}

export interface ButtonQuestion extends BaseQuestion {
    type: 'BUTTONS';
    options: ButtonOption[];
}

export interface ButtonOption {
    id: number;
    text: string;
    isCorrect: boolean;
}

export interface CheckboxQuestion extends BaseQuestion {
    type: 'CHECKBOXES';
    options: CheckboxOption[];
}

export interface CheckboxOption {
    id: number;
    text: string;
    isCorrect: boolean;
}

export interface ReorderQuestion extends BaseQuestion {
    type: 'REORDER';
    items: ReorderItem[];
}

export interface ReorderItem {
    id: number;
    text: string;
    correctOrder: number;
}

export interface RangeQuestion extends BaseQuestion {
    type: 'RANGE';
    data?: {
        minValue: number;
        maxValue: number;
        correctValue: number;
    } | null;
}

export interface LocationQuestion extends BaseQuestion {
    type: 'LOCATION';
    data?: {
        correctLatitude: number;
        correctLongitude: number;
    } | null;
}

export interface TypeAnswerQuestion extends BaseQuestion {
    type: 'TYPEANSWER';
    data?: {
        correctAnswer: string;
    } | null;
}

export type Question =
    | ButtonQuestion
    | CheckboxQuestion
    | ReorderQuestion
    | RangeQuestion
    | LocationQuestion
    | TypeAnswerQuestion;

// ========================
// Match Types
// ========================

export interface Match {
    id: number;
    quizId: number;
    quiz?: Quiz;
    hostId: number;
    host?: User;
    status: MatchStatus;
    currentQuestionIndex?: number;
    players?: MatchPlayer[];
    createdAt?: string;
}

export type MatchStatus = 'waiting' | 'playing' | 'finished';

export interface MatchPlayer {
    id: number;
    matchId: number;
    userId: number;
    user?: User;
    score: number;
    answers?: PlayerAnswer[];
}

export interface LobbyPlayer {
    userId: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isReady: boolean;
    isHost: boolean;
}

export interface PlayerAnswer {
    id: number;
    matchPlayerId: number;
    questionId: number;
    answer: unknown;
    isCorrect: boolean;
    timeTaken?: number;
    points?: number;
}

// ========================
// Socket Event Types
// ========================

export interface AnswerSubmittedEvent {
    questionId: number;
    userId: number;
}

export interface AnswerResultEvent {
    userId: number;
    questionId: number;
    isCorrect: boolean;
    points?: number;
}

export interface QuestionStartEvent {
    question: Question;
    questionIndex: number;
    totalQuestions: number;
}

export interface LeaderboardEntry {
    rank: number;
    userId: number;
    username: string;
    score: number;
}

// ========================
// API Response Types
// ========================

export interface ApiError {
    message: string;
    statusCode?: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface MatchScore {
    userId: number;
    username: string;
    score: number;
}

// ========================
// Component Prop Types
// ========================

export interface QuestionFormProps<T extends BaseQuestion = BaseQuestion> {
    question?: T;
    quizId: number;
    onSave: (question: T) => void;
    onCancel: () => void;
}

export interface QuestionPlayProps<T extends BaseQuestion = BaseQuestion> {
    question: T;
    matchId: number;
    userId: number;
    onAnswer: (answer: unknown) => void;
}

// ========================
// AI Generation Types
// ========================

export type AIGenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'APPROVED' | 'FAILED';
export type AIQuestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REGENERATING';

export interface AIGeneratedQuestion {
    id: number;
    jobId: number;
    questionText: string;
    questionType: string;
    optionsData: {
        options?: Array<{ text: string; isCorrect?: boolean; order?: number }>;
        correctAnswer?: string;
    };
    status: AIQuestionStatus;
    userFeedback?: string | null;
    regenerationCount: number;
    finalQuestionId?: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface AIGenerationJob {
    id: number;
    instruction?: string | null;
    pdfUrl?: string | null;
    targetQuizId?: number | null;
    targetQuiz?: { id: number; title: string } | null;
    status: AIGenerationStatus;
    questionCount: number;
    errorMessage?: string | null;
    suggestedTitle?: string | null;
    suggestedDescription?: string | null;
    suggestedCategoryId?: number | null;
    userId: number;
    generatedQuestions?: AIGeneratedQuestion[];
    _count?: { generatedQuestions: number };
    createdAt: string;
    updatedAt: string;
}

// ========================
// Image Picker Types
// ========================

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ImagePickerProps {
    imageSrc: string | null;
    setImageSrc: (src: string | null) => void;
    crop: { x: number; y: number };
    setCrop: (crop: { x: number; y: number }) => void;
    zoom: number;
    setZoom: (zoom: number) => void;
    setCroppedAreaPixels: (area: CropArea) => void;
}
// ========================
// Stats & History Types
// ========================

export interface RecentMatch {
    id: number | string;
    quizId: number | string;
    quizName: string;
    score: number;
    rank: number;
    createdAt: string;
}

export interface UserStats {
    totalMatches: number;
    totalQuizzes: number;
    rankCounts: Record<string, number>;
    winRate: number;
    recentMatches: RecentMatch[];
}
