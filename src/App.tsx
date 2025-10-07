import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RedirectIfAuthenticated from "@/components/RedirectIfAuthenticated";
import Welcome from "./pages/Welcome";
import Pricing from "./pages/Pricing";
import CurrentPlan from "./pages/CurrentPlan";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import Restaurant from "./pages/Restaurant";
import Comparison from "./pages/Comparison";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import SavedList from "./pages/SavedList";
import TermsOfService from "./pages/TermsOfService";
import History from "./pages/History";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ResetPassword from "./pages/ResetPassword";
import ForgotPasswordOtp from "./pages/ForgotPasswordOtp";
import NewPassword from "./pages/NewPassword";
import OtpVerification from "./pages/OtpVerification";
import ChangePassword from "./pages/ChangePassword";
import EmailVerification from "./pages/EmailVerification";
import SignupVerification from "./pages/SignupVerification";
import ScrapeMenu from "./pages/ScrapeMenu";
import UnderConstruction from "./pages/UnderConstruction";
import { maintenanceConfig } from "@/config/maintenance";

const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering");
  
  // Check if site is under construction
  if (maintenanceConfig.isUnderConstruction) {
    return <UnderConstruction />;
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <ComparisonProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Redirect root to welcome */}
                <Route path="/" element={<Navigate to="/welcome" replace />} />
                {/* Welcome page for unauthenticated users */}
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route 
                  path="/home" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/search-results" 
                  element={
                    <ProtectedRoute>
                      <SearchResults />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/restaurant/:id" element={
                  <ProtectedRoute>
                    <Restaurant />
                  </ProtectedRoute>
                } />
                <Route path="/comparison" element={
                  <ProtectedRoute>
                    <Comparison />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/saved-list" element={
                  <ProtectedRoute>
                    <SavedList />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                 } />
                <Route path="/scrape-menu" element={
                  <ProtectedRoute>
                    <ScrapeMenu />
                  </ProtectedRoute>
                } />
                <Route path="/current-plan" element={
                  <ProtectedRoute>
                    <CurrentPlan />
                  </ProtectedRoute>
                } />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/forgot-password-otp" element={<ForgotPasswordOtp />} />
                <Route path="/new-password" element={<NewPassword />} />
                <Route path="/otp-verification" element={<OtpVerification />} />
                <Route path="/signup-verification" element={<SignupVerification />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route 
                  path="/email-verification" 
                  element={
                    <ProtectedRoute>
                      <EmailVerification />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/auth" 
                  element={
                    <RedirectIfAuthenticated>
                      <Auth />
                    </RedirectIfAuthenticated>
                  } 
                />
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </TooltipProvider>
            </ComparisonProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
