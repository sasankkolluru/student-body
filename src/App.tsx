import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PollProvider } from './contexts/PollContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import Events from './pages/Events';
import { Voting } from './pages/Voting';
import { Ideas } from './pages/Ideas';
import { Councils } from './pages/Councils';
import { CouncilDetail } from './pages/CouncilDetail';
import { FAQ } from './pages/FAQ';
import Achievements from './pages/Achievements';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import StudentDashboard from './pages/student/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import PollsAdmin from './pages/admin/PollsAdmin';
import MessagesAdmin from './pages/admin/MessagesAdmin';
import Gallery from './pages/Gallery';
import NewsAndScores from './pages/NewsAndScores';
import MessagesPage from './pages/Messages';
import ChatInterface from './components/chat/ChatInterface';

// Protected Route Component
type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Public Route Component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/councils" element={<Councils />} />
      <Route path="/councils/:id" element={<CouncilDetail />} />
      <Route path="/events" element={<Events />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/voting" element={<Voting />} />
      <Route path="/ideas" element={<Ideas />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/news" element={<NewsAndScores />} />
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      
      {/* Authentication Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/my-achievements" element={<Navigate to="/dashboard" replace />} />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/polls" 
        element={
          <ProtectedRoute requiredRole="admin">
            <PollsAdmin />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/messages" 
        element={
          <ProtectedRoute requiredRole="admin">
            <MessagesAdmin />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback Routes */}
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Unauthorized Access</h2>
            <p className="mt-2">You don't have permission to view this page.</p>
          </div>
        </div>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
function App() {
  return (
    <Router>
      <AuthProvider>
        <PollProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <AppRoutes />
            </main>
            <Footer />
            {/* Chat Interface */}
            <ChatInterface />
          </div>
        </PollProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;