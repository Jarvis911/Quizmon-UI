import { BASE_URL } from "./client";

interface Endpoints {
    // Auth
    login: string;
    register: string;

    // Category
    category: string;
    getQuizByCategory: (id: number) => string;

    // Quiz
    quizzes: string;
    quiz_my: string;
    quiz_org_library: string;
    quiz_assignable: string;
    explore: string;
    quiz: (id: number) => string;
    quiz_rating: (id: number) => string;
    quiz_isRated: (id: number) => string;
    quiz_delete: (id: number | string) => string;
    quiz_replicate: (id: number) => string;
    quiz_assign_to_org: (id: number) => string;
    quiz_remove_from_org: (id: number) => string;

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
    question_delete: (id: number | string) => string;

    // Match
    matches: string;
    match: (id: string | number) => string;

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
    ai_generate_image: string;
    ai_agentic_save: string;

    // Agentic Workspace Sessions
    ai_agentic_sessions: string;
    ai_agentic_session: (id: number) => string;
    ai_agentic_session_delete: (id: number) => string;
    ai_agentic_session_rename: (id: number) => string;

    // Classrooms
    classrooms: string;
    classroom: (id: number) => string;
    classroom_join: string;
    classroom_join_invite: (token: string) => string;
    classroom_pending: (id: number) => string;
    classroom_approve: (id: number, memberId: number) => string;
    classroom_reject: (id: number, memberId: number) => string;
    classroom_remove_member: (id: number, userId: number) => string;
    classroom_import_students: (id: number) => string;
    classroom_clear_expected: (id: number) => string;
    classroom_regenerate_invite: (id: number) => string;
    classroom_expected_match: (id: number, expectedId: number, userId: number) => string;
    classroom_expected_unmatch: (id: number, expectedId: number) => string;

    // Homework
    homework: string;
    homework_detail: (id: number) => string;
    homework_start: (id: number) => string;
    homework_answer: (id: number) => string;
    homework_finish: (id: number) => string;

    // Reports
    report_excel: (matchId: string | number) => string;

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

    // Promotions
    promotions_active: string;
    admin_promotions: string;
    admin_promotion: (id: number) => string;
    admin_promotion_publish: (id: number) => string;
    subscription_checkout_free: string;
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
    quiz_my: `${BASE_URL}/quiz`,
    quiz_org_library: `${BASE_URL}/quiz/org-library`,
    quiz_assignable: `${BASE_URL}/quiz/assignable`,
    explore: `${BASE_URL}/quiz/explore`,
    quiz: (id: number) => `${BASE_URL}/quiz/${id}`,
    quiz_rating: (id: number) => `${BASE_URL}/quiz/${id}/rating`,
    quiz_isRated: (id: number) => `${BASE_URL}/quiz/${id}/rated`,
    quiz_delete: (id: number | string) => `${BASE_URL}/quiz/${id}`,
    quiz_replicate: (id: number) => `${BASE_URL}/quiz/${id}/replicate`,
    quiz_assign_to_org: (id: number) => `${BASE_URL}/quiz/${id}/assign-to-org`,
    quiz_remove_from_org: (id: number) => `${BASE_URL}/quiz/${id}/remove-from-org`,

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
    question_delete: (id: number | string) => `${BASE_URL}/question/${id}`,

    // Match
    matches: `${BASE_URL}/match`,
    match: (id: string | number) => `${BASE_URL}/match/${id}`,

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
    ai_generate_image: `${BASE_URL}/ai/generate-image`,
    ai_agentic_save: `${BASE_URL}/ai/agentic/save`,

    // Agentic Workspace Sessions
    ai_agentic_sessions: `${BASE_URL}/ai/agentic/sessions`,
    ai_agentic_session: (id: number) => `${BASE_URL}/ai/agentic/sessions/${id}`,
    ai_agentic_session_delete: (id: number) => `${BASE_URL}/ai/agentic/sessions/${id}`,
    ai_agentic_session_rename: (id: number) => `${BASE_URL}/ai/agentic/sessions/${id}`,

    // Classrooms
    classrooms: `${BASE_URL}/classrooms`,
    classroom: (id: number) => `${BASE_URL}/classrooms/${id}`,
    classroom_join: `${BASE_URL}/classrooms/join`,
    classroom_join_invite: (token: string) => `${BASE_URL}/classrooms/invite/${token}`,
    classroom_pending: (id: number) => `${BASE_URL}/classrooms/${id}/pending`,
    classroom_approve: (id: number, memberId: number) => `${BASE_URL}/classrooms/${id}/members/${memberId}/approve`,
    classroom_reject: (id: number, memberId: number) => `${BASE_URL}/classrooms/${id}/members/${memberId}/reject`,
    classroom_remove_member: (id: number, userId: number) => `${BASE_URL}/classrooms/${id}/members/${userId}`,
    classroom_import_students: (id: number) => `${BASE_URL}/classrooms/${id}/import-students`,
    classroom_clear_expected: (id: number) => `${BASE_URL}/classrooms/${id}/expected-students`,
    classroom_regenerate_invite: (id: number) => `${BASE_URL}/classrooms/${id}/regenerate-invite`,
    classroom_expected_match: (id: number, expectedId: number, userId: number) => `${BASE_URL}/classrooms/${id}/expected-students/${expectedId}/match/${userId}`,
    classroom_expected_unmatch: (id: number, expectedId: number) => `${BASE_URL}/classrooms/${id}/expected-students/${expectedId}/match`,

    // Homework
    homework: `${BASE_URL}/homework`,
    homework_detail: (id: number) => `${BASE_URL}/homework/${id}`,
    homework_start: (id: number) => `${BASE_URL}/homework/${id}/start`,
    homework_answer: (id: number) => `${BASE_URL}/homework/${id}/answer`,
    homework_finish: (id: number) => `${BASE_URL}/homework/${id}/finish`,

    // Reports
    report_excel: (matchId: string | number) => `${BASE_URL}/reports/excel/${matchId}`,

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

    // Promotions
    promotions_active: `${BASE_URL}/promotions/active`,
    admin_promotions: `${BASE_URL}/admin/promotions`,
    admin_promotion: (id: number) => `${BASE_URL}/admin/promotions/${id}`,
    admin_promotion_publish: (id: number) => `${BASE_URL}/admin/promotions/${id}/publish`,
    subscription_checkout_free: `${BASE_URL}/subscriptions/checkout-free`,
};

export const getAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return "https://github.com/shadcn.png";
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
};

export default endpoints;
