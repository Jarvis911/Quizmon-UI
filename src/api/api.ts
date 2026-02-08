const BASE_URL = "http://localhost:5000";

interface Endpoints {
    // Auth
    login: string;
    register: string;

    // Category
    category: string;
    getQuizByCategory: (id: number) => string;

    // Quiz
    quizzes: string;
    quiz: (id: number) => string;
    quiz_rating: (id: number) => string;
    quiz_isRated: (id: number) => string;

    // Question
    question_buttons: string;
    question_checkboxes: string;
    question_reorders: string;
    question_ranges: string;
    question_locations: string;
    question_typeanswers: string;
    question_button: (id: number) => string;
    question_checkbox: (id: number) => string;
    question_reorder: (id: number) => string;
    question_range: (id: number) => string;
    question_location: (id: number) => string;
    question_typeanswer: (id: number) => string;

    // Match
    matches: string;
    match: (id: number) => string;

    // Rating
    rating: string;

    // User
    user_stats: string;
}

const endpoints: Endpoints = {
    // Auth
    login: `${BASE_URL}/auth/login`,
    register: `${BASE_URL}/auth/register`,

    // Category
    category: `${BASE_URL}/category`,
    getQuizByCategory: (id: number) => `${BASE_URL}/category/${id}/quiz`,

    // Quiz
    quizzes: `${BASE_URL}/quiz`,
    quiz: (id: number) => `${BASE_URL}/quiz/${id}`,
    quiz_rating: (id: number) => `${BASE_URL}/quiz/${id}/rating`,
    quiz_isRated: (id: number) => `${BASE_URL}/quiz/${id}/rated`,

    // Question
    question_buttons: `${BASE_URL}/question/buttons`,
    question_checkboxes: `${BASE_URL}/question/checkboxes`,
    question_reorders: `${BASE_URL}/question/reorder`,
    question_ranges: `${BASE_URL}/question/range`,
    question_locations: `${BASE_URL}/question/location`,
    question_typeanswers: `${BASE_URL}/question/typeanswer`,

    question_button: (id: number) => `${BASE_URL}/question/buttons/${id}`,
    question_checkbox: (id: number) => `${BASE_URL}/question/checkboxes/${id}`,
    question_reorder: (id: number) => `${BASE_URL}/question/reorder/${id}`,
    question_range: (id: number) => `${BASE_URL}/question/range/${id}`,
    question_location: (id: number) => `${BASE_URL}/question/location/${id}`,
    question_typeanswer: (id: number) => `${BASE_URL}/question/typeanswer/${id}`,

    // Match
    matches: `${BASE_URL}/match`,
    match: (id: number) => `${BASE_URL}/match/${id}`,

    // Rating
    rating: `${BASE_URL}/rating`,

    // User
    user_stats: `${BASE_URL}/user/statistics`,
};

export default endpoints;
