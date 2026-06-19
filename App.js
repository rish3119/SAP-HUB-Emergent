
Action: file_editor create /app/frontend/src/App.js --file-text "import \"@/App.css\";
import { BrowserRouter, Routes, Route, Navigate } from \"react-router-dom\";
import { Toaster } from \"@/components/ui/sonner\";
import { AuthProvider, useAuth } from \"@/lib/auth\";
import LoginPage from \"@/pages/LoginPage\";
import RegisterPage from \"@/pages/RegisterPage\";
import AppShell from \"@/components/AppShell\";
import DashboardPage from \"@/pages/DashboardPage\";
import TasksPage from \"@/pages/TasksPage\";
import GitHubPage from \"@/pages/GitHubPage\";
import LearningPage from \"@/pages/LearningPage\";
import ChallengePage from \"@/pages/ChallengePage\";
import ProfilePage from \"@/pages/ProfilePage\";

const Protected = ({ children }) => {
  const { user, ready } = useAuth();
  if (!ready) return <div className=\"min-h-screen grid place-items-center text-gray-400 font-mono text-sm\">loading workspace…</div>;
  if (!user) return <Navigate to=\"/login\" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, ready } = useAuth();
  if (!ready) return <div className=\"min-h-screen grid place-items-center text-gray-400 font-mono text-sm\">loading…</div>;
  if (user) return <Navigate to=\"/dashboard\" replace />;
  return children;
};

function App() {
  return (
    <div className=\"App\">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path=\"/login\" element={<PublicOnly><LoginPage /></PublicOnly>} />
            <Route path=\"/register\" element={<PublicOnly><RegisterPage /></PublicOnly>} />
            <Route
              path=\"/\"
              element={
                <Protected>
                  <AppShell />
                </Protected>
              }
            >
              <Route index element={<Navigate to=\"/dashboard\" replace />} />
              <Route path=\"dashboard\" element={<DashboardPage />} />
              <Route path=\"tasks\" element={<TasksPage />} />
              <Route path=\"github\" element={<GitHubPage />} />
              <Route path=\"learning\" element={<LearningPage />} />
              <Route path=\"learning/:id\" element={<ChallengePage />} />
              <Route path=\"profile\" element={<ProfilePage />} />
            </Route>
            <Route path=\"*\" element={<Navigate to=\"/\" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position=\"top-right\" richColors closeButton />
      </AuthProvider>
    </div>
  );
}

export default App;
"
Observation: Overwrite successful: /app/frontend/src/App.js