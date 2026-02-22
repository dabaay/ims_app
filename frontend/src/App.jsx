import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { useLanguage } from "./context/useLanguage";
import { ThemeProvider } from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
import { useSettings } from "./context/SettingsContextDef";
import { Languages, Globe } from "lucide-react";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import ProductList from "./pages/ProductList";
import CustomerList from "./pages/CustomerList";
import PosPage from "./pages/PosPage";
import Dashboard from "./pages/Dashboard";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import ExpensesPage from "./pages/ExpensesPage";
import SuppliersPage from "./pages/SuppliersPage";
import UsersPage from "./pages/UsersPage";
import AccountingPage from "./pages/AccountingPage";
import LogsPage from "./pages/LogsPage";
import ProfilePage from "./pages/ProfilePage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import WalpoPage from "./pages/WalpoPage";
import FinancialReportsPage from "./pages/FinancialReportsPage";
import PurchasesPage from "./pages/PurchasesPage";
import MobileOrders from "./pages/MobileOrders";
import MobileChat from "./pages/MobileChat";
import MobileDashboard from "./pages/MobileDashboard";
import MobileCustomerList from "./pages/MobileCustomerList";
import CashierMobileOrders from "./pages/CashierMobileOrders";
import CashierDeliveries from "./pages/CashierDeliveries";
import PromotionsPage from "./pages/PromotionsPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading)
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center text-white">
        {t("loading")}
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  return children;
};

const RoleBasedRoot = () => {
    const { user } = useAuth();
    if (user?.role === 'app_manager') {
        return <MobileDashboard />;
    }
    return <Dashboard />;
};

const Layout = ({ children }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { settings } = useSettings();

  return (
    <div className="flex bg-primary min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-slate-700 flex items-center justify-between px-8 bg-secondary/30 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-2 text-slate-400">
            <Globe size={16} />
            <span className="text-xs font-bold uppercase tracking-widest leading-none">
              {t("dashboard")}
              <span className="mx-2 opacity-30">|</span>
              <span className="text-blue-400">{settings.store_name}</span>
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 transition-all group"
            >
              <Languages
                size={16}
                className="text-blue-400 group-hover:rotate-12 transition-transform"
              />
              <span className="text-xs font-bold text-white uppercase tracking-tighter">
                {language === "so" ? "English" : "Somali"}
              </span>
            </button>

            <div className="flex items-center space-x-4 border-l border-slate-700 pl-6">
              <div className="text-right">
                <p className="text-sm font-black text-white leading-none mb-1 uppercase tracking-tighter">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                  {user?.role || "Staff"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20">
                {user?.name?.substring(0, 2).toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 pb-20">{children}</div>
        <footer className="h-12 border-t border-slate-700 flex items-center justify-between px-8 bg-secondary/20 backdrop-blur-md text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
          <div>
            © {new Date().getFullYear()} {settings.store_name}. All rights
            reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-blue-500/50">System Verified</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
        </footer>
      </main>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <SettingsProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <RoleBasedRoot />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ProductList />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CustomerList />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <PosPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ReportsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <SettingsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ExpensesPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suppliers"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <SuppliersPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <UsersPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accounting"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AccountingPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/logs"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <LogsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-history"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <SalesHistoryPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchases"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <PurchasesPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/walpo"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <WalpoPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/financial"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <FinancialReportsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ProfilePage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/mobile/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <MobileDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mobile/customers"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <MobileCustomerList />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mobile/orders"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <MobileOrders />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mobile/chat"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <MobileChat />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cashier/mobile-orders"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CashierMobileOrders />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cashier/deliveries"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CashierDeliveries />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mobile/promotions"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <PromotionsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </SettingsProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
