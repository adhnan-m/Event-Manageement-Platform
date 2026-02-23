import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { AuthPage } from '@/app/components/AuthPage';
import { MainLayout } from '@/app/components/MainLayout';

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}