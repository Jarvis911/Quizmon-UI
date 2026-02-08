import { LoginForm } from "./components/auth/LoginForm";
import { SignUpForm } from "./components/auth/SignupForm";
import Navbar from "./components/ui/navbar";
import QuizEditor from "./pages/QuizEditor";
import Home from "./pages/Home";
import MatchLobby from "./pages/MatchLobby";
import MatchPlay from "./pages/MatchPlay";
import CreateQuizForm from "./components/quiz/CreateQuizForm";
import UserStats from "./pages/UserStatistics";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
    return (
        <BrowserRouter>
            <div className="w-full h-full py-[60px] min-h-screen">
                <div
                    className="fixed inset-0 -z-10 
    bg-[radial-gradient(ellipse_at_top_left,theme(colors.red.300),theme(colors.yellow.200),theme(colors.orange.300))]"
                />
                <AuthProvider>
                    <Navbar />
                    <Routes>
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/sign-up" element={<SignUpForm />} />
                        <Route path="/quiz/:id/editor" element={<QuizEditor />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/match/:id/lobby" element={<MatchLobby />} />
                        <Route path="/match/:id/play" element={<MatchPlay />} />
                        <Route path="/quiz" element={<CreateQuizForm />} />
                        <Route path="/statistics" element={<UserStats />} />
                    </Routes>
                </AuthProvider>
            </div>
        </BrowserRouter>
    );
}

export default App;
