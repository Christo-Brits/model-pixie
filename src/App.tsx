
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Register from '@/pages/Register';
import Create from '@/pages/Create';
import Models from '@/pages/Models';
import Community from '@/pages/Community';
import Learn from '@/pages/Learn';
import Onboarding from '@/pages/Onboarding';
import ModelGenerating from '@/pages/ModelGenerating';
import ModelPreview from '@/pages/ModelPreview';
import ModelDetail from '@/pages/ModelDetail';
import ImageSelection from '@/pages/ImageSelection';
import CreditPurchase from '@/pages/CreditPurchase';
import NotFound from '@/pages/NotFound';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<Create />} />
          <Route path="/models" element={<Models />} />
          <Route path="/community" element={<Community />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/generating" element={<ModelGenerating />} />
          <Route path="/preview" element={<ModelPreview />} />
          <Route path="/model/:id" element={<ModelDetail />} />
          <Route path="/credits" element={<CreditPurchase />} />
          <Route path="/select-image" element={<ImageSelection />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
