import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { RegisterPage } from '@/features/auth/components/RegisterPage';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { SourcesPage } from '@/features/sources/components/SourcesPage';
import { AppShell } from './layout/AppShell';

/** Root router: public auth pages and the private app shell. */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<AppShell />} />
          <Route path="/projects/:projectId/sources" element={<SourcesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
