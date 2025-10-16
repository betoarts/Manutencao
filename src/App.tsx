import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import Purchases from "./pages/Purchases";
import Maintenance from "./pages/Maintenance";
import DepartmentsUsers from "./pages/DepartmentsUsers";
import Settings from "./pages/Settings";
import TestSupabase from "./pages/TestSupabase";
import { SessionContextProvider } from "./integrations/supabase/SessionContextProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Inventory from "./pages/Inventory";
import PublicRequest from "./pages/PublicRequest";
import Requests from "./pages/Requests";
import Tasks from "./pages/Tasks";
import NotificationsPage from "./pages/Notifications";
import Suppliers from "./pages/Suppliers";
import CalendarView from "./pages/CalendarView";
import AIAssistant from "./pages/AIAssistant"; // Importação adicionada

export const queryClient = new QueryClient(); // Exportando o queryClient

const AppWrapper = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/solicitar-manutencao" element={<PublicRequest />} />
            <Route path="/test-supabase" element={<TestSupabase />} />
            
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
            <Route path="/assets/:id" element={<ProtectedRoute><AssetDetail /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/departments-users" element={<ProtectedRoute><DepartmentsUsers /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} /> {/* Nova rota adicionada */}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppWrapper;