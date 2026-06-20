Now the dashboard, tasks, github, learning, challenge, and profile pages.
Action: file_editor create /app/frontend/src/pages/DashboardPage.jsx --file-text "import { useEffect, useState } from \"react\";
import api from \"@/lib/api\";
import { CheckCircle2, Clock, FolderKanban, BookOpen, Trophy, AlertTriangle } from \"lucide-react\";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from \"recharts\";
import { Link } from \"react-router-dom\";

const StatCard = ({ label, value, icon: Icon, tone = \"default\", testId }) => {
  const tones = {
    default: \"border-gray-200\",
    accent: \"border-[#002FA7]\",
    warn: \"border-[#F59E0B]\",
    danger: \"border-[#E11D48]\",
    success: \"border-[#10B981]\",
  };
  return (
    <div className={`bg-white border-l-2 ${tones[tone]} border-y border-r border-gray-200 p-6`} style={{ borderRadius: 2 }} data-testid={testId}>
      <div className=\"flex items-start justify-between\">
        <div className=\"label-eyebrow\">{label}</div>
        <Icon className=\"w-4 h-4 text-gray-400\" />
      </div>
      <div className=\"font-heading text-4xl font-bold mt-3 text-gray-900 tabular-nums\">{value}</div>
    </div>
  );
};

const COLORS = { todo: \"#6B7280\", in_progress: \"#002FA7\", review: \"#F59E0B\", done: \"#10B981\" };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, p, l] = await Promise.all([
          api.get(\"/stats/dashboard\"),
          api.get(\"/projects\"),
          api.get(\"/stats/leaderboard\"),
        ]);
        setStats(s.data);
        setProjects(p.data);
        setLeaderboard(l.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const statusData = stats
    ? Object.entries(stats.task_status || {}).map(([k, v]) => ({ name: k, value: v, key: k }))
    : [];

  const projectChart = projects.slice(0, 5).map((p) => ({ name: p.name.split(\" \").slice(0, 2).join(\" \"), tasks: 0, status: p.status }));

  return (
    <div className=\"space-y-8\" data-testid=\"dashboard-page\">
      <div className=\"flex items-end justify-between\">
        <div>
          <div className=\"label-eyebrow mb-2\">Mission Control</div>
          <h1 className=\"font-heading text-4xl sm:text-5xl font-bold tracking-tight text-gray-900\">Dashboard</h1>
          <p className=\"text-gray-500 mt-2 text-sm\">Live snapshot of SAP delivery, learning velocity, and team activity.</p>
        </div>
      </div>

      <div className=\"grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade\">
        <StatCard label=\"Active Projects\" value={stats?.active_projects ?? \"—\"} icon={FolderKanban} tone=\"accent\" testId=\"stat-active-projects\" />
        <StatCard label=\"Open Tasks\" value={stats?.open_tasks ?? \"—\"} icon={Clock} tone=\"warn\" testId=\"stat-open-tasks\" />
        <StatCard label=\"My Tasks\" value={stats?.my_open_tasks ?? \"—\"} icon={AlertTriangle} tone=\"danger\" testId=\"stat-my-tasks\" />
        <StatCard label=\"My Points\" value={stats?.my_points ?? 0} icon={Trophy} tone=\"success\" testId=\"stat-my-points\" />
      </div>

      <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6 items-start\">
        {/* Task Status */}
        <div className=\"surface-card p-6 lg:col-span-2\" data-testid=\"task-distribution-card\">
          <div className=\"flex items-center justify-between mb-1\">
            <div>
              <div className=\"label-eyebrow\">Task Distribution</div>
              <h3 className=\"font-heading text-xl font-semibold mt-1\">Workflow status across all projects</h3>
            </div>
            <Link to=\"/tasks\" className=\"text-sm text-[#002FA7] hover:underline\" data-testid=\"link-view-tasks\">View board →</Link>
          </div>
          <div className=\"h-64 mt-4\">
            {statusData.length === 0 ? (
              <div className=\"h-full grid place-items-center text-gray-400 text-sm\">No tasks yet</div>
            ) : (
              <ResponsiveContainer width=\"100%\" height=\"100%\">
                <BarChart data={statusData} margin={{ top: 20, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray=\"3 3\" stroke=\"#E5E7EB\" />
                  <XAxis dataKey=\"name\" tick={{ fontSize: 12, fill: \"#6B7280\" }} />
                  <YAxis tick={{ fontSize: 12, fill: \"#6B7280\" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 2, border: \"1px solid #E5E7EB\", fontSize: 12 }} />
                  <Bar dataKey=\"value\" radius={[2, 2, 0, 0]}>
                    {statusData.map((d, i) => (<Cell key={i} fill={COLORS[d.key] || \"#002FA7\"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className=\"surface-card p-6\" data-testid=\"leaderboard-card\">
          <div className=\"label-eyebrow\">Skills Leaderboard</div>
          <h3 className=\"font-heading text-xl font-semibold mt-1 mb-4\">Top Practitioners</h3>
          {leaderboard.length === 0 ? (
            <div className=\"text-sm text-gray-400 py-8 text-center\">No submissions yet. Solve a challenge to start scoring.</div>
          ) : (
            <ol className=\"space-y-2\">
              {leaderboard.map((row, i) => (
                <li key={row.email} className=\"flex items-center justify-between py-2 border-b border-gray-100 last:border-0\">
                  <div className=\"flex items-center gap-3\">
                    <span className={`font-mono text-xs w-6 h-6 grid place-items-center ${i === 0 ? \"bg-[#002FA7] text-white\" : \"bg-gray-100 text-gray-700\"}`} style={{ borderRadius: 2 }}>{i + 1}</span>
                    <span className=\"text-sm text-gray-800 truncate max-w-[140px]\">{row.email}</span>
                  </div>
                  <div className=\"text-right\">
                    <div className=\"font-mono text-sm font-semibold text-gray-900\">{row.points} pts</div>
                    <div className=\"text-xs text-gray-400\">{row.solved} solved</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Projects list */}
      <div className=\"surface-card p-6\" data-testid=\"projects-list-card\">
        <div className=\"flex items-center justify-between mb-4\">
          <div>
            <div className=\"label-eyebrow\">Active Engagements</div>
            <h3 className=\"font-heading text-xl font-semibold mt-1\">SAP Projects</h3>
          </div>
        </div>
        <div className=\"divide-y divide-gray-100\">
          {projects.map((p) => (
            <div key={p.id} className=\"py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 px-2 -mx-2 transition-colors\">
              <div className=\"col-span-12 md:col-span-5\">
                <div className=\"font-medium text-gray-900\">{p.name}</div>
                <div className=\"text-xs text-gray-500 mt-0.5\">{p.description}</div>
              </div>
              <div className=\"col-span-4 md:col-span-2\">
                <div className=\"label-eyebrow\" style={{ fontSize: \"0.55rem\" }}>Module</div>
                <div className=\"font-mono text-xs text-gray-800\">{p.module}</div>
              </div>
              <div className=\"col-span-4 md:col-span-2\">
                <div className=\"label-eyebrow\" style={{ fontSize: \"0.55rem\" }}>Status</div>
                <span className={`text-xs font-medium ${p.status === \"active\" ? \"text-[#10B981]\" : p.status === \"planning\" ? \"text-[#F59E0B]\" : \"text-gray-500\"}`}>
                  ● {p.status.replace(\"_\", \" \")}
                </span>
              </div>
              <div className=\"col-span-4 md:col-span-3\">
                <div className=\"label-eyebrow\" style={{ fontSize: \"0.55rem\" }}>Deadline</div>
                <div className=\"font-mono text-xs text-gray-800\">{p.deadline ? new Date(p.deadline).toLocaleDateString() : \"—\"}</div>
              </div>
            </div>
          ))}
          {projects.length === 0 && <div className=\"text-sm text-gray-400 py-8 text-center\">No projects yet.</div>}
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/DashboardPage.jsx