
Action: file_editor create /app/frontend/src/components/AppShell.jsx --file-text "import { NavLink, Outlet, useNavigate } from \"react-router-dom\";
import { LayoutDashboard, KanbanSquare, GitBranch, GraduationCap, User2, LogOut, Hexagon } from \"lucide-react\";
import { useAuth } from \"@/lib/auth\";

const nav = [
  { to: \"/dashboard\", label: \"Dashboard\", icon: LayoutDashboard, tid: \"nav-dashboard\" },
  { to: \"/tasks\", label: \"Tasks\", icon: KanbanSquare, tid: \"nav-tasks\" },
  { to: \"/github\", label: \"Repositories\", icon: GitBranch, tid: \"nav-github\" },
  { to: \"/learning\", label: \"Learning Portal\", icon: GraduationCap, tid: \"nav-learning\" },
  { to: \"/profile\", label: \"Profile\", icon: User2, tid: \"nav-profile\" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(\"/login\");
  };

  return (
    <div className=\"min-h-screen bg-[#F8F9FA] text-gray-900\">
      {/* Sidebar */}
      <aside className=\"w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40\" data-testid=\"app-sidebar\">
        <div className=\"h-16 border-b border-gray-200 flex items-center px-5 gap-2\">
          <div className=\"w-8 h-8 bg-[#002FA7] flex items-center justify-center\" style={{ borderRadius: 2 }}>
            <Hexagon className=\"w-4 h-4 text-white\" strokeWidth={2.5} />
          </div>
          <div>
            <div className=\"font-heading text-base font-bold leading-none\">SAP Hub</div>
            <div className=\"label-eyebrow leading-none mt-1\" style={{ fontSize: \"0.55rem\" }}>TCS Internal</div>
          </div>
        </div>

        <nav className=\"flex-1 py-4 px-3 space-y-1\">
          <div className=\"label-eyebrow px-3 mb-2\" style={{ fontSize: \"0.6rem\" }}>Workspace</div>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.tid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? \"nav-item-active\" : \"text-gray-700 hover:bg-gray-100 hover:text-gray-900\"
                }`
              }
              style={{ borderRadius: 2 }}
            >
              <n.icon className=\"w-4 h-4\" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className=\"border-t border-gray-200 p-3\">
          <div className=\"flex items-center gap-3 p-2\">
            <div className=\"w-9 h-9 bg-[#002FA7] text-white grid place-items-center font-semibold\" style={{ borderRadius: 2 }}>
              {(user?.name || user?.email || \"?\").charAt(0).toUpperCase()}
            </div>
            <div className=\"flex-1 min-w-0\">
              <div className=\"text-sm font-semibold truncate\" data-testid=\"sidebar-user-name\">{user?.name || \"User\"}</div>
              <div className=\"text-xs text-gray-500 truncate font-mono\">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            data-testid=\"logout-button\"
            className=\"mt-2 w-full flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-[#E11D48] border border-gray-200 hover:border-[#E11D48] py-2 transition-colors\"
            style={{ borderRadius: 2 }}
          >
            <LogOut className=\"w-3.5 h-3.5\" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className=\"ml-64\">
        <header className=\"h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30\">
          <div>
            <div className=\"label-eyebrow\" style={{ fontSize: \"0.6rem\" }}>Project Operations</div>
            <div className=\"text-sm font-medium text-gray-900\">{user?.name} · {user?.role}</div>
          </div>
          <div className=\"flex items-center gap-3\">
            <span className=\"font-mono text-xs text-gray-400\" data-testid=\"top-bar-status\">SYSTEM ONLINE</span>
            <span className=\"w-2 h-2 bg-[#10B981] rounded-full animate-pulse\" />
          </div>
        </header>

        <main className=\"px-8 py-8 max-w-[1600px]\" data-testid=\"main-content\">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/components/AppShell.jsx