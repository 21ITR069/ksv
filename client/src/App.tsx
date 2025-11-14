import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { ProtectedRoute } from "@/components/protected-route";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import AttendancePage from "@/pages/attendance";
import ChatPage from "@/pages/chat";
import ReportsPage from "@/pages/reports";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { UserRole } from "@shared/schema";

function AuthRedirect() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (currentUser) {
    return <Redirect to="/" />;
  }

  return <Redirect to="/login" />;
}

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {currentUser ? <Redirect to="/" /> : <Login />}
      </Route>

      <Route path="/register">
        {currentUser ? <Redirect to="/" /> : <Register />}
      </Route>

      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/attendance">
        <ProtectedRoute
          allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.HR, UserRole.EMPLOYEE]}
        >
          <AttendancePage />
        </ProtectedRoute>
      </Route>

      <Route path="/chat">
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute
          allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.HR]}
        >
          <ReportsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/users">
        <ProtectedRoute
          allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}
        >
          <UsersPage />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <AppRoutes />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="text-sm text-muted-foreground">
              TeamConnect - Attendance & Chat Management
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <AppRoutes />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
