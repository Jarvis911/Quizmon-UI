const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
    user_profile_update: string;
    user_avatar_upload: string;

    // AI Generation
    ai_create_job: string;
    ai_jobs: string;
    ai_job: (id: number) => string;
    ai_job_status: (id: number) => string;
    ai_job_delete: (id: number) => string;
    ai_job_question: (jobId: number, questionId: number) => string;
    ai_job_question_content: (jobId: number, questionId: number) => string;
    ai_job_question_regenerate: (jobId: number, questionId: number) => string;
    ai_job_question_delete: (jobId: number, questionId: number) => string;
    ai_job_approve_all: (id: number) => string;
    ai_agentic_save: string;

    // Classrooms
    classrooms: string;
    classroom: (id: number) => string;
    classroom_join: string;

    // Homework
    homework: string;
    homework_detail: (id: number) => string;
    homework_start: (id: number) => string;
    homework_answer: (id: number) => string;
    homework_finish: (id: number) => string;

    // Reports
    report_excel: (matchId: number) => string;

    // Notifications
    notifications: string;
    notification_read_all: string;
    notification_read: (id: number) => string;
    
    // Organizations
    organizations: string;
    organization: (id: number) => string;
    organization_members: (id: number) => string;

    // Subscriptions
    plans: string;
    subscription_current: string;
    subscriptions: string;
    subscription_usage: string;
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
    user_profile_update: `${BASE_URL}/user/profile`,
    user_avatar_upload: `${BASE_URL}/user/avatar/upload`,

    // AI Generation
    ai_create_job: `${BASE_URL}/ai/jobs`,
    ai_jobs: `${BASE_URL}/ai/jobs`,
    ai_job: (id: number) => `${BASE_URL}/ai/jobs/${id}`,
    ai_job_status: (id: number) => `${BASE_URL}/ai/jobs/${id}/status`,
    ai_job_delete: (id: number) => `${BASE_URL}/ai/jobs/${id}`,
    ai_job_question: (jobId: number, questionId: number) => `${BASE_URL}/ai/jobs/${jobId}/questions/${questionId}`,
    ai_job_question_content: (jobId: number, questionId: number) => `${BASE_URL}/ai/jobs/${jobId}/questions/${questionId}/content`,
    ai_job_question_regenerate: (jobId: number, questionId: number) => `${BASE_URL}/ai/jobs/${jobId}/questions/${questionId}/regenerate`,
    ai_job_question_delete: (jobId: number, questionId: number) => `${BASE_URL}/ai/jobs/${jobId}/questions/${questionId}`,
    ai_job_approve_all: (id: number) => `${BASE_URL}/ai/jobs/${id}/approve-all`,
    ai_agentic_save: `${BASE_URL}/ai/agentic/save`,

    // Classrooms
    classrooms: `${BASE_URL}/classrooms`,
    classroom: (id: number) => `${BASE_URL}/classrooms/${id}`,
    classroom_join: `${BASE_URL}/classrooms/join`,

    // Homework
    homework: `${BASE_URL}/homework`,
    homework_detail: (id: number) => `${BASE_URL}/homework/${id}`,
    homework_start: (id: number) => `${BASE_URL}/homework/${id}/start`,
    homework_answer: (id: number) => `${BASE_URL}/homework/${id}/answer`,
    homework_finish: (id: number) => `${BASE_URL}/homework/${id}/finish`,

    // Reports
    report_excel: (matchId: number) => `${BASE_URL}/reports/excel/${matchId}`,

    // Notifications
    notifications: `${BASE_URL}/notifications`,
    notification_read_all: `${BASE_URL}/notifications/read-all`,
    notification_read: (id: number) => `${BASE_URL}/notifications/${id}/read`,

    // Organizations
    organizations: `${BASE_URL}/organizations`,
    organization: (id: number) => `${BASE_URL}/organizations/${id}`,
    organization_members: (id: number) => `${BASE_URL}/organizations/${id}/members`,

    // Subscriptions
    plans: `${BASE_URL}/subscriptions/plans`,
    subscription_current: `${BASE_URL}/subscriptions/current`,
    subscriptions: `${BASE_URL}/subscriptions`,
    subscription_usage: `${BASE_URL}/subscriptions/usage`,
};

export const getAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return "https://github.com/shadcn.png";
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
};

export default endpoints;
