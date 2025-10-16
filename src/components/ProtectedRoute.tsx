import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSupabase();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;