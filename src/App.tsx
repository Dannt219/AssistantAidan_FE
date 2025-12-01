import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import GeneratePage from './pages/GeneratePage.tsx';
import DashboardPage from './pages/DashboardPage';
import React from 'react';
import { useAuthStore } from './state/auth';


function PrivateRoute({ children }: { children: React.JSX.Element }) {
  // Token is tru if user is authenticated
  const token = useAuthStore((s) => s.accessToken);;
  if (token) return children;
  else return <Navigate to="/login" replace />;
}

function Layout({ children }: { children: React.JSX.Element }) {
  const { accessToken, logout, user } = useAuthStore();
  {/* if it's a login or register page, don't wrap layout*/ }
  const location = useLocation();
  const isAuthenPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthenPage) {
    return children;
  }

  return (
    <div>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                NDTSDET Test Assistant
              </h1>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Generate
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/dashboard'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Dashboard
              </Link>
            </nav>

            {/* User Email (Hardcoded for now) */}
            <div className="flex items-center gap-4">
              {accessToken && user && (
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user.email}
                </span>
              )}
              {accessToken && (
                <button 
                className='px-4 py-2 text-sm text-gray-600 bg-white border-gray-350 rounđe-lg hover:bg-gray-50 transition-colors'
                onClick={logout}>
                  Logout
                </button>
              )}
          </div>
        </div>
    </div>
      </header >
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {children}
    </main>
    </div >
  )
}

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/' element={<Layout><PrivateRoute><GeneratePage /></PrivateRoute></Layout>} />
        <Route path="/dashboard" element={<Layout><PrivateRoute><DashboardPage /></PrivateRoute></Layout>} />

      </Routes>
    </div>
  )
}

export default App
