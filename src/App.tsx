import { LoginForm } from "./components/auth/LoginForm";
import { SignUpForm } from "./components/auth/SignupForm";
import Navbar from "./components/ui/navbar";
import QuizEditor from "./pages/QuizEditor";
import Home from "./pages/Home";
import Results from "./pages/Results";
import MatchLobby from "./pages/MatchLobby.tsx";
import MatchPlay from "./pages/MatchPlay";
import CreateQuizForm from "./components/quiz/CreateQuizForm";
import UserStats from "./pages/UserStatistics";
import AIQuizGenerator from "./pages/AIQuizGenerator";
import AIQuizReview from "./pages/AIQuizReview";
import AgenticQuizWorkspace from "./pages/AgenticQuizWorkspace";
import Classrooms from "./pages/Classrooms";
import ClassroomDetails from "./pages/ClassroomDetails";
import HomeworkStart from "./pages/HomeworkStart";
import JoinMatch from "./pages/JoinMatch";
import OrganizationSettings from "./pages/OrganizationSettings";
import BillingPage from "./pages/BillingPage";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import ProfileSettings from "./pages/ProfileSettings";
import Library from "./pages/Library";

// Admin Imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import AdminReports from "./pages/admin/AdminReports";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAI from "./pages/admin/AdminAI";
import AdminPromotions from "./pages/admin/AdminPromotions";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { OrganizationProvider } from "./context/OrganizationContext";
import { FeatureProvider } from "./context/FeatureContext";
import { ModalProvider } from "./context/ModalContext";
import GlobalModal from "./components/ui/GlobalModal";
import WorkspaceSidebar from "./components/WorkspaceSidebar";
import { createBrowserRouter, RouterProvider, Navigate, useLocation, Outlet } from "react-router-dom";
import { ReactNode, useState } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
    const { token, user } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    if (!user?.isAdmin) return <Navigate to="/" replace />;
    return <>{children}</>;
};

function RootLayout() {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Hide navbar and standard bg on match, join, login, sign-up, and agentic workspace routes
    const isNoNavbarRoute = /^\/(match\/\d+\/(lobby|play)|join|login|sign-up|ai\/agentic-workspace|admin)/.test(location.pathname);

    // Compact navbar padding on quiz routes
    const isQuizRoute = location.pathname.startsWith('/quiz');
    const isAdminRoute = location.pathname.startsWith('/admin');
    const paddingTopClass = isAdminRoute ? "pt-[64px]" /* if navbar is used, but wait, admin has its own layout? We will show navbar above AdminLayout */ : isNoNavbarRoute ? "" : isQuizRoute ? "pt-[48px]" : "pt-24 lg:pt-32";

    return (
        <div className={`w-full h-full min-h-screen ${paddingTopClass}`}>
            <AuthProvider>
                <ModalProvider>
                    <OrganizationProvider>
                        <FeatureProvider>
                            {(!isNoNavbarRoute || isAdminRoute) && <Navbar onToggleSidebar={() => setIsSidebarOpen(true)} />}
                            <WorkspaceSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                            <GlobalModal />
                            <Outlet />
                        </FeatureProvider>
                    </OrganizationProvider>
                </ModalProvider>
            </AuthProvider>
        </div>
    );
}

const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            { path: "/join", element: <JoinMatch /> },
            { path: "/login", element: <LoginForm /> },
            { path: "/sign-up", element: <SignUpForm /> },
            { path: "/", element: <Home /> },
            { path: "/results", element: <Results /> },
            { path: "/home", element: <Navigate to="/" replace /> },

            // Protected Routes
            { path: "/quiz/:id/editor", element: <ProtectedRoute><QuizEditor /></ProtectedRoute> },
            { path: "/match/:id/lobby", element: <ProtectedRoute><MatchLobby /></ProtectedRoute> },
            { path: "/match/:id/play", element: <ProtectedRoute><MatchPlay /></ProtectedRoute> },
            { path: "/quiz", element: <ProtectedRoute><CreateQuizForm /></ProtectedRoute> },
            { path: "/statistics", element: <ProtectedRoute><UserStats /></ProtectedRoute> },
            { path: "/ai/generate", element: <ProtectedRoute><AIQuizGenerator /></ProtectedRoute> },
            { path: "/ai/review/:jobId", element: <ProtectedRoute><AIQuizReview /></ProtectedRoute> },
            { path: "/ai/agentic-workspace", element: <ProtectedRoute><AgenticQuizWorkspace /></ProtectedRoute> },
            { path: "/classrooms", element: <ProtectedRoute><Classrooms /></ProtectedRoute> },
            { path: "/classrooms/:id", element: <ProtectedRoute><ClassroomDetails /></ProtectedRoute> },
            { path: "/homework/:id/start", element: <ProtectedRoute><HomeworkStart /></ProtectedRoute> },
            { path: "/settings/organization", element: <ProtectedRoute><OrganizationSettings /></ProtectedRoute> },
            { path: "/billing", element: <ProtectedRoute><BillingPage /></ProtectedRoute> },
            { path: "/billing/success", element: <ProtectedRoute><BillingSuccess /></ProtectedRoute> },
            { path: "/billing/cancel", element: <ProtectedRoute><BillingCancel /></ProtectedRoute> },
            { path: "/profile/settings", element: <ProtectedRoute><ProfileSettings /></ProtectedRoute> },
            { path: "/library", element: <ProtectedRoute><Library /></ProtectedRoute> },

            // Admin Routes
            {
                path: "/admin",
                element: <AdminRoute><AdminLayout /></AdminRoute>,
                children: [
                    { index: true, element: <AdminDashboard /> },
                    { path: "quizzes", element: <AdminQuizzes /> },
                    { path: "reports", element: <AdminReports /> },
                    { path: "users", element: <AdminUsers /> },
                    { path: "ai", element: <AdminAI /> },
                    { path: "promotions", element: <AdminPromotions /> },
                ]
            }
        ]
    }
]);

function App() {
    return (
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;

