
Action: file_editor create /app/frontend/src/pages/ProfilePage.jsx --file-text "import { useEffect, useState } from \"react\";
import api from \"@/lib/api\";
import { useAuth } from \"@/lib/auth\";
import { Trophy, CheckCircle2, Code2 } from \"lucide-react\";

export default function ProfilePage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(\"/submissions/me\");
      setSubmissions(data);
    })();
  }, []);

  const passed = submissions.filter((s) => s.passed);
  const points = passed.reduce((a, b) => a + (b.points_earned || 0), 0);
  const uniqueSolved = new Set(passed.map((p) => p.challenge_id)).size;

  return (
    <div className=\"space-y-8\" data-testid=\"profile-page\">
      <div className=\"flex items-end justify-between\">
        <div className=\"flex items-center gap-5\">
          <div className=\"w-16 h-16 bg-[#002FA7] text-white grid place-items-center font-bold text-2xl\" style={{ borderRadius: 2 }}>
            {(user?.name || user?.email || \"?\").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className=\"label-eyebrow mb-1\">{user?.role}</div>
            <h1 className=\"font-heading text-4xl font-bold tracking-tight text-gray-900\">{user?.name}</h1>
            <p className=\"text-sm text-gray-500 font-mono mt-1\">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
        <div className=\"surface-card p-6\">
          <div className=\"label-eyebrow\">Total Points</div>
          <div className=\"font-heading text-4xl font-bold mt-2 flex items-center gap-2\">
            <Trophy className=\"w-7 h-7 text-[#F59E0B]\" />
            <span>{points}</span>
          </div>
        </div>
        <div className=\"surface-card p-6\">
          <div className=\"label-eyebrow\">Challenges Solved</div>
          <div className=\"font-heading text-4xl font-bold mt-2 flex items-center gap-2\">
            <CheckCircle2 className=\"w-7 h-7 text-[#10B981]\" />
            <span>{uniqueSolved}</span>
          </div>
        </div>
        <div className=\"surface-card p-6\">
          <div className=\"label-eyebrow\">Submissions</div>
          <div className=\"font-heading text-4xl font-bold mt-2 flex items-center gap-2\">
            <Code2 className=\"w-7 h-7 text-[#002FA7]\" />
            <span>{submissions.length}</span>
          </div>
        </div>
      </div>

      {user?.skills?.length > 0 && (
        <div className=\"surface-card p-6\">
          <div className=\"label-eyebrow mb-3\">Skills</div>
          <div className=\"flex flex-wrap gap-2\">
            {user.skills.map((s) => (
              <span key={s} className=\"font-mono text-xs bg-gray-100 px-3 py-1 text-gray-800\" style={{ borderRadius: 2 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className=\"surface-card p-6\">
        <div className=\"label-eyebrow mb-4\">Recent submissions</div>
        {submissions.length === 0 ? (
          <div className=\"text-sm text-gray-400 py-8 text-center\">No submissions yet. Head to the Learning Portal to start.</div>
        ) : (
          <div className=\"divide-y divide-gray-100\">
            {submissions.slice(0, 10).map((s) => (
              <div key={s.id} className=\"py-3 flex items-center justify-between text-sm\">
                <div>
                  <div className=\"text-gray-700\">{s.verdict}</div>
                  <div className=\"font-mono text-xs text-gray-400\">{new Date(s.created_at).toLocaleString()}</div>
                </div>
                <div className={`font-mono font-semibold ${s.passed ? \"text-[#10B981]\" : \"text-[#E11D48]\"}`}>{s.score}/100</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/ProfilePage.jsx