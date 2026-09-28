import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { fetchCurrentUser } from '@/features/auth/authSlice';
import { getSessionHint } from '@/utils/storage';
import { AppRoutes } from '@/routes/AppRoutes';

export const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // If a session hint exists, attempt to hydrate session via /api/auth/me (Section 8.1)
    const hint = getSessionHint();
    if (hint) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return <AppRoutes />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
