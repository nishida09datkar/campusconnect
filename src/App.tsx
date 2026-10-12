import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCurrentUser } from '@/features/auth/authSlice';
import { getSessionHint } from '@/utils/storage';
import { updateSocketAuthToken } from '@/socket/socketClient';
import { AppRoutes } from '@/routes/AppRoutes';

export const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    updateSocketAuthToken(accessToken);
  }, [accessToken]);

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
