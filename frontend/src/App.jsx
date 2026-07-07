import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import CoachDirectory from './pages/public/CoachDirectory';
import ResourceLibrary from './pages/public/ResourceLibrary';
import LoginPage from './pages/auth/LoginPage';
import GuestWall from './pages/public/GuestWall';

// User Pages
import UserWall from './pages/user/UserWall';
import EmotionJournal from './pages/user/EmotionJournal';
import PrivateJournal from './pages/user/PrivateJournal';
import MySessions from './pages/user/MySessions';
import CoachProfile from './pages/user/CoachProfile'; // <-- ADDED MISSING IMPORT!

// Dashboards 
import CoachDashboard from './pages/coach/CoachDashboard';
import CoachChat from './pages/coach/CoachChat';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminModeration from './pages/admin/AdminModeration';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/guest-wall" element={<GuestWall />} />

        {/* CHANGED PATH to /coach-directory so it doesn't conflict with the User's /coach-profile */}
        <Route path="/coach-directory" element={<CoachDirectory />} />
        <Route path="/resources" element={<ResourceLibrary />} />

        {/* USER ROUTES */}
        <Route path="/user-wall" element={<UserWall />} />
        <Route path="/emotion-journal" element={<EmotionJournal />} />
        <Route path="/private-journal" element={<PrivateJournal />} />
        <Route path="/my-sessions" element={<MySessions />} />
        <Route path="/coach-profile" element={<CoachProfile />} />

        {/* COACH ROUTES */}
        <Route path="/coach-dashboard" element={<CoachDashboard />} />
        <Route path="/coach-chat" element={<CoachChat />} />
        <Route path="/coaches/:id" element={<CoachProfile />} />

        {/* ADMIN ROUTES */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-moderation" element={<AdminModeration />} />
      </Routes>
    </Router>
  );
}