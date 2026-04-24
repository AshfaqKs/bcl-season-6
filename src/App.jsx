import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import Teams from "./pages/Teams";
import Matches from "./pages/Matches";
import Leaderboard from "./pages/Leaderboard";
import TopScorers from "./pages/TopScorers";
import TopAssists from "./pages/TopAssists";
import CleanSheets from "./pages/CleanSheets";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-navy-dark text-primary">Loading...</div>;
  return user ? children : <Navigate to="/admin/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-navy-dark">
        <Navbar />

        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/players" element={<Players />} />
            <Route path="/player/:id" element={<PlayerProfile />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/top-scorers" element={<TopScorers />} />
            <Route path="/top-assists" element={<TopAssists />} />
            <Route path="/clean-sheets" element={<CleanSheets />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </main>

        <footer className="bg-navy-light border-t border-white/5 py-16 mt-20">
          <div className="container mx-auto px-4 text-center space-y-4">
            <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Official League Platform</p>
            <h2 className="text-4xl font-black italic text-white tracking-tighter">BCL SEASON 6</h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full opacity-50"></div>
            <p className="text-gray-600 text-[10px] uppercase tracking-widest pt-4">© 2026 BCL League Management System. All Rights Reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;