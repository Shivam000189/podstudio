import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Login } from './pages/Login';
import Signup from './pages/Signup';
import { Home } from './pages/Home';
import { Rooms } from './pages/Room';
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Signup />} />
          <Route path='/home' element={<Home />} />
          <Route path='/rooms/:id' element={<Rooms />} />

          {/* Protected Routes */}
          <Route 
            path='/dashboard' 
            element={
              <ProtectedRoute>
                <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
                    <p>Your recordings will appear here.</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />

          {/* Default redirect */}
          <Route path='/' element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;