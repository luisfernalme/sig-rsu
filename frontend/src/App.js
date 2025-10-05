import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import RoutesPage from './pages/Routes';
import Vehicles from './pages/Vehicles';
import CollectionPoints from './pages/CollectionPoints';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './services/authContext';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <div className="App">
      <Navigation />
      <Container fluid className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/collection-points" element={<CollectionPoints />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Container>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;