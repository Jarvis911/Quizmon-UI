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
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function AppContent() {
    const location = useLocation();

    // Hide navbar and standard bg on match, join, login, and sign-up routes
    const isNoNavbarRoute = /^\/(match\/\d+\/(lobby|play)|join|login|sign-up)/.test(location.pathname);

    // Compact navbar padding on quiz routes
    const isQuizRoute = location.pathname.startsWith('/quiz');
    const paddingTopClass = isNoNavbarRoute ? "" : isQuizRoute ? "pt-[48px]" : "pt-[64px]";

    return (
        <div className={`w-full h-full min-h-screen ${paddingTopClass}`}>
            {/* Default background — hidden on match/join pages which have their own */}
            {!isNoNavbarRoute && (
                <div
                    className="fixed inset-0 -z-10 
        bg-[radial-gradient(ellipse_at_top_left,theme(colors.red.300),theme(colors.yellow.200),theme(colors.orange.300))]"
                />
            )}
            <AuthProvider>
                {!isNoNavbarRoute && <Navbar />}
                <Routes>
                    <Route path="/join" element={<JoinMatch />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/sign-up" element={<SignUpForm />} />
                    <Route path="/" element={<Home />} />

                    {/* Protected Routes */}
                    <Route path="/quiz/:id/editor" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
                    <Route path="/match/:id/lobby" element={<ProtectedRoute><MatchLobby /></ProtectedRoute>} />
                    <Route path="/match/:id/play" element={<ProtectedRoute><MatchPlay /></ProtectedRoute>} />
                    <Route path="/quiz" element={<ProtectedRoute><CreateQuizForm /></ProtectedRoute>} />
                    <Route path="/statistics" element={<ProtectedRoute><UserStats /></ProtectedRoute>} />
                    <Route path="/ai/generate" element={<ProtectedRoute><AIQuizGenerator /></ProtectedRoute>} />
                    <Route path="/ai/review/:jobId" element={<ProtectedRoute><AIQuizReview /></ProtectedRoute>} />
                    <Route path="/classrooms" element={<ProtectedRoute><Classrooms /></ProtectedRoute>} />
                    <Route path="/classrooms/:id" element={<ProtectedRoute><ClassroomDetails /></ProtectedRoute>} />
                    <Route path="/homework/:id/start" element={<ProtectedRoute><HomeworkStart /></ProtectedRoute>} />

                    {/* Redirect old home to root */}
                    <Route path="/home" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;

