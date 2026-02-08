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
    | 'buttons'
    | 'checkboxes'
    | 'reorder'
    | 'range'
    | 'location'
    | 'typeanswer';

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
    type: 'buttons';
    options: ButtonOption[];
}

export interface ButtonOption {
    id: number;
    text: string;
    isCorrect: boolean;
}

export interface CheckboxQuestion extends BaseQuestion {
    type: 'checkboxes';
    options: CheckboxOption[];
}

export interface CheckboxOption {
    id: number;
    text: string;
    isCorrect: boolean;
}

export interface ReorderQuestion extends BaseQuestion {
    type: 'reorder';
    items: ReorderItem[];
}

export interface ReorderItem {
    id: number;
    text: string;
    correctOrder: number;
}

export interface RangeQuestion extends BaseQuestion {
    type: 'range';
    min: number;
    max: number;
    correctValue: number;
    tolerance?: number;
}

export interface LocationQuestion extends BaseQuestion {
    type: 'location';
    correctLat: number;
    correctLng: number;
    toleranceRadius?: number;
}

export interface TypeAnswerQuestion extends BaseQuestion {
    type: 'typeanswer';
    correctAnswers: string[];
    caseSensitive?: boolean;
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
