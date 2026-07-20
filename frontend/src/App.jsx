import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import CoachDirectory from './pages/public/CoachDirectory';
import ResourceLibrary from './pages/public/ResourceLibrary';
import LoginPage from './pages/auth/LoginPage';
import GuestWall from './pages/public/GuestWall';
import Announcements from './pages/public/announcement'; // Adjust the path if needed
// User Pages
import UserWall from './pages/user/UserWall';
import EmotionJournal from './pages/user/EmotionJournal';
import PrivateJournal from './pages/user/PrivateJournal';
import MySessions from './pages/user/MySessions';
import CoachProfile from './pages/user/CoachProfile';

// Dashboards 
import CoachDashboard from './pages/coach/CoachDashboard';
import CoachChat from './pages/coach/CoachChat';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminModeration from './pages/admin/AdminModeration';

// 🌟 IMPORT YOUR FOOTER HERE (Adjust the path if your components folder is elsewhere)
import Footer from './components/Footer';

// 🌟 WRAPPER TO HIDE FOOTER ON SPECIFIC PAGES
function GlobalFooter() {
  const location = useLocation();

  // You can add other paths here like '/my-sessions' if you don't want the footer interrupting the chat UI
  if (location.pathname === '/login') {
    return null;
  }

  return <Footer />;
}

export default function App() {
  return (
    <Router>
      {/* 🌟 FLEX WRAPPER: Pushes the footer to the bottom of the screen */}
      <div className="flex flex-col min-h-screen bg-background text-on-surface">

        {/* 🌟 FLEX-GROW: Makes the page content fill all available space */}
        <div className="flex-grow">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/guest-wall" element={<GuestWall />} />
            <Route path="/coach-directory" element={<CoachDirectory />} />
            <Route path="/resources" element={<ResourceLibrary />} />
            {/* Add this new line: */}
            <Route path="/announcements" element={<Announcements />} />

            {/* USER ROUTES */}
            <Route path="/user-wall" element={<UserWall />} />
            <Route path="/emotion-journal" element={<EmotionJournal />} />
            <Route path="/private-journal" element={<PrivateJournal />} />
            <Route path="/my-sessions" element={<MySessions />} />
            <Route path="/coach-profile" element={<CoachProfile />} />

            {/* COACH ROUTES */}
            <Route path="/coach-dashboard" element={<CoachDashboard />} />
            <Route path="/coach-chat" element={<CoachChat />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-moderation" element={<AdminModeration />} />
          </Routes>
        </div>

        {/* 🌟 THE FOOTER (Will render everywhere except /login) */}
        <GlobalFooter />

      </div>
    </Router>
  );
}