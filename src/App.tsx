import { LoginForm } from "./components/auth/LoginForm";
import { SignUpForm } from "./components/auth/SignupForm";
import Navbar from "./components/ui/navbar";
import QuizEditor from "./pages/QuizEditor";
import Home from "./pages/Home";
import MatchLobby from "./pages/MatchLobby";
import MatchPlay from "./pages/MatchPlay";
import CreateQuizForm from "./components/quiz/CreateQuizForm";
import UserStats from "./pages/UserStatistics";
import AIQuizGenerator from "./pages/AIQuizGenerator";
import AIQuizReview from "./pages/AIQuizReview";
import Classrooms from "./pages/Classrooms";
import ClassroomDetails from "./pages/ClassroomDetails";
import HomeworkStart from "./pages/HomeworkStart";
import JoinMatch from "./pages/JoinMatch";
import OrganizationSettings from "./pages/OrganizationSettings";
import BillingPage from "./pages/BillingPage";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { OrganizationProvider } from "./context/OrganizationContext";
import { FeatureProvider } from "./context/FeatureContext";
import { ModalProvider } from "./context/ModalContext";
import GlobalModal from "./components/ui/GlobalModal";
import { createBrowserRouter, RouterProvider, Navigate, useLocation, Outlet } from "react-router-dom";
import { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function RootLayout() {
    const location = useLocation();

    // Hide navbar and standard bg on match, join, login, and sign-up routes
    const isNoNavbarRoute = /^\/(match\/\d+\/(lobby|play)|join|login|sign-up)/.test(location.pathname);

    // Compact navbar padding on quiz routes
    const isQuizRoute = location.pathname.startsWith('/quiz');
    const paddingTopClass = isNoNavbarRoute ? "" : isQuizRoute ? "pt-[48px]" : "pt-[64px]";

    return (
        <div className={`w-full h-full min-h-screen ${paddingTopClass}`}>
            <AuthProvider>
                <ModalProvider>
                    <OrganizationProvider>
                        <FeatureProvider>
                            {!isNoNavbarRoute && <Navbar />}
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
            { path: "/home", element: <Navigate to="/" replace /> },
            
            // Protected Routes
            { path: "/quiz/:id/editor", element: <ProtectedRoute><QuizEditor /></ProtectedRoute> },
            { path: "/match/:id/lobby", element: <ProtectedRoute><MatchLobby /></ProtectedRoute> },
            { path: "/match/:id/play", element: <ProtectedRoute><MatchPlay /></ProtectedRoute> },
            { path: "/quiz", element: <ProtectedRoute><CreateQuizForm /></ProtectedRoute> },
            { path: "/statistics", element: <ProtectedRoute><UserStats /></ProtectedRoute> },
            { path: "/ai/generate", element: <ProtectedRoute><AIQuizGenerator /></ProtectedRoute> },
            { path: "/ai/review/:jobId", element: <ProtectedRoute><AIQuizReview /></ProtectedRoute> },
            { path: "/classrooms", element: <ProtectedRoute><Classrooms /></ProtectedRoute> },
            { path: "/classrooms/:id", element: <ProtectedRoute><ClassroomDetails /></ProtectedRoute> },
            { path: "/homework/:id/start", element: <ProtectedRoute><HomeworkStart /></ProtectedRoute> },
            { path: "/settings/organization", element: <ProtectedRoute><OrganizationSettings /></ProtectedRoute> },
            { path: "/billing", element: <ProtectedRoute><BillingPage /></ProtectedRoute> },
            { path: "/billing/success", element: <ProtectedRoute><BillingSuccess /></ProtectedRoute> },
            { path: "/billing/cancel", element: <ProtectedRoute><BillingCancel /></ProtectedRoute> },
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

