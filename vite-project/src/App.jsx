import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetail from "./pages/CandidateDetail";
import OfferLetters from "./pages/OfferLetters";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import HRMSAuth from "./pages/HRMSAuth";
import LeavesPage from "./pages/LeavesPage";

const queryClient = new QueryClient();

export default function App() {
  // ✅ New
  const [isAuth, setIsAuth] = useState(() => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return false;

    // Check token is not expired
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.clear(); // token expired, clear it
        return false;
      }
      return true;
    } catch {
      localStorage.clear(); // invalid token, clear it
      return false;
    }
  });

  const handleLogin = () => {
    setIsAuth(true); // token is already saved by HRMSAuth.jsx
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Default → /login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Login page */}
            <Route path="/login" element={
              isAuth
                ? <Navigate to="/dashboard" replace />
                : <HRMSAuth onLogin={handleLogin} />
            } />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              isAuth ? <AppLayout><Dashboard /></AppLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/candidates" element={
              isAuth ? <AppLayout><Candidates /></AppLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/candidates/:id" element={
              isAuth ? <AppLayout><CandidateDetail /></AppLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/offer-letters" element={
              isAuth ? <AppLayout><OfferLetters /></AppLayout> : <Navigate to="/login" replace />
            } />
            <Route path="/settings" element={
              isAuth ? <AppLayout><SettingsPage /></AppLayout> : <Navigate to="/login" replace />
            } />

            <Route path="/leaves" element={
              isAuth ? <AppLayout><LeavesPage /></AppLayout> : <Navigate to="/login" replace />
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}