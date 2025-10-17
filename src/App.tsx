import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DiseaseDetection from "./pages/DiseaseDetection";
import Chatbot from "./pages/Chatbot";
import Products from "./pages/Products";
import Weather from "./pages/Weather";
import MarketPrices from "./pages/MarketPrices";
import ToolsPage from "./pages/Tools";
import ToolDetailsPage from "./pages/ToolDetails";
import MyToolsPage from "./pages/MyTools";
import MyRentalsPage from "./pages/MyRentals";
import GovernmentSchemes from "./pages/GovernmentSchemes";
import CropCalendar from "./pages/CropCalendar";
import Profile from "./pages/Profile";
import YieldPrediction from "./pages/YieldPrediction";
import FarmAnalytics from "./pages/FarmAnalytics";
import PestAlerts from "./pages/PestAlerts";
import EquipmentRental from "./pages/EquipmentRental";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/disease-detection" element={<DiseaseDetection />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/products" element={<Products />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/market-prices" element={<MarketPrices />} />
          <Route path="/government-schemes" element={<GovernmentSchemes />} />
          <Route path="/crop-calendar" element={<CropCalendar />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/:id" element={<ToolDetailsPage />} />
          <Route path="/dashboard/my-tools" element={<MyToolsPage />} />
          <Route path="/dashboard/my-rentals" element={<MyRentalsPage />} />
          <Route path="/yield-prediction" element={<YieldPrediction />} />
          <Route path="/equipment-rental" element={<EquipmentRental />} />
          <Route path="/farm-analytics" element={<FarmAnalytics />} />
          <Route path="/pest-alerts" element={<PestAlerts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
