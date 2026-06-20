
Action: file_editor create /app/frontend/src/pages/ChallengePage.jsx --file-text "import { useEffect, useState } from \"react\";
import { useParams, Link } from \"react-router-dom\";
import api, { formatApiError } from \"@/lib/api\";
import { Button } from \"@/components/ui/button\";
import { toast } from \"sonner\";
import { ArrowLeft, Play, CheckCircle2, XCircle, Lightbulb } from \"lucide-react\";

export default function ChallengePage() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState(\"\");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/challenges/${id}`);
        setChallenge(data);
        setCode(data.starter_code || \"\");
      } catch (e) {
        toast.error(\"Challenge not found\");
      }
      try {
        const { data: all } = await api.get(\"/submissions/me\");
        setHistory(all.filter((s) => s.challenge_id === id));
      } catch {}
    })();
  }, [id]);

  const submit = async () => {
    if (!code.trim()) {
      toast.error(\"Write some code first\");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await api.post(\"/submissions\", { challenge_id: id, code });
      setResult(data);
      setHistory((h) => [data, ...h]);
      if (data.passed) toast.success(`Passed · ${data.score}/100`);
      else toast.error(`Score: ${data.score}/100`);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  if (!challenge) return <div className=\"text-gray-400 font-mono text-sm\">loading challenge…</div>;

  return (
    <div className=\"space-y-6\" data-testid=\"challenge-page\">
      <Link to=\"/learning\" className=\"inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900\" data-testid=\"back-to-learning\">
        <ArrowLeft className=\"w-4 h-4\" /> Back to all challenges
      </Link>

      <div className=\"grid grid-cols-1 lg:grid-cols-5 gap-6\">
        {/* Left: problem statement */}
        <div className=\"lg:col-span-2 surface-card p-6 space-y-4\">
          <div>
            <div className=\"flex items-center gap-2 mb-2\">
              <span className=\"label-eyebrow\">{challenge.language === \"cpp\" ? \"C++\" : challenge.language === \"linux\" ? \"Linux Shell\" : \"C\"}</span>
              <span className=\"text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 font-medium font-mono\" style={{ borderRadius: 2 }}>{challenge.difficulty}</span>
              <span className=\"text-[10px] px-1.5 py-0.5 bg-[#002FA7] text-white font-medium font-mono\" style={{ borderRadius: 2 }}>{challenge.points} pts</span>
            </div>
            <h1 className=\"font-heading text-2xl font-bold leading-tight\">{challenge.title}</h1>
          </div>

          <div>
            <div className=\"label-eyebrow mb-2\">Problem</div>
            <p className=\"text-sm text-gray-700 leading-relaxed whitespace-pre-line\">{challenge.description}</p>
          </div>

          {challenge.sample_input && (
            <div>
              <div className=\"label-eyebrow mb-1\">Sample Input</div>
              <pre className=\"font-mono text-xs bg-gray-50 border border-gray-200 p-3 text-gray-800\" style={{ borderRadius: 2 }}>{challenge.sample_input}</pre>
            </div>
          )}
          {challenge.sample_output && (
            <div>
              <div className=\"label-eyebrow mb-1\">Expected Output</div>
              <pre className=\"font-mono text-xs bg-gray-50 border border-gray-200 p-3 text-gray-800\" style={{ borderRadius: 2 }}>{challenge.sample_output}</pre>
            </div>
          )}
        </div>

        {/* Right: editor and result */}
        <div className=\"lg:col-span-3 space-y-4\">
          <div className=\"surface-card p-0 overflow-hidden\">
            <div className=\"flex items-center justify-between px-4 py-2.5 bg-[#0b1020] border-b border-[#1f2937]\">
              <div className=\"flex items-center gap-2\">
                <span className=\"w-2.5 h-2.5 rounded-full bg-[#ff5f57]\" />
                <span className=\"w-2.5 h-2.5 rounded-full bg-[#febc2e]\" />
                <span className=\"w-2.5 h-2.5 rounded-full bg-[#28c840]\" />
                <span className=\"font-mono text-[11px] text-white/50 ml-3\">editor · {challenge.language}</span>
              </div>
              <Button
                onClick={submit}
                disabled={submitting}
                size=\"sm\"
                data-testid=\"submit-code-button\"
                className=\"bg-[#10B981] hover:bg-[#059669] text-white rounded-sm h-7 px-3 text-xs\"
              >
                <Play className=\"w-3 h-3 mr-1.5\" />
                {submitting ? \"Evaluating…\" : \"Submit\"}
              </Button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              data-testid=\"code-editor\"
              spellCheck={false}
              className=\"code-editor block\"
              placeholder=\"// write your solution here…\"
            />
          </div>

          {result && (
            <div className=\"surface-card p-6\" data-testid=\"evaluation-result\">
              <div className=\"flex items-start justify-between mb-4\">
                <div>
                  <div className=\"label-eyebrow\">AI Evaluation · Claude Sonnet 4.5</div>
                  <h3 className=\"font-heading text-2xl font-bold mt-1\">
                    {result.passed ? (
                      <span className=\"text-[#10B981] flex items-center gap-2\"><CheckCircle2 className=\"w-6 h-6\" />Passed</span>
                    ) : (
                      <span className=\"text-[#E11D48] flex items-center gap-2\"><XCircle className=\"w-6 h-6\" />Try Again</span>
                    )}
                  </h3>
                </div>
                <div className=\"text-right\">
                  <div className=\"font-heading text-4xl font-bold tabular-nums\">{result.score}<span className=\"text-base text-gray-400\">/100</span></div>
                  <div className=\"font-mono text-xs text-gray-500 mt-1\">+{result.points_earned} pts</div>
                </div>
              </div>
              <div className=\"space-y-3\">
                <div>
                  <div className=\"label-eyebrow mb-1\">Verdict</div>
                  <div className=\"text-sm font-medium\">{result.verdict}</div>
                </div>
                <div>
                  <div className=\"label-eyebrow mb-1\">Feedback</div>
                  <p className=\"text-sm text-gray-700 leading-relaxed\">{result.feedback}</p>
                </div>
                {result.suggestions?.length > 0 && (
                  <div>
                    <div className=\"label-eyebrow mb-2\">Suggestions</div>
                    <ul className=\"space-y-1.5\">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className=\"text-sm text-gray-700 flex items-start gap-2\">
                          <Lightbulb className=\"w-3.5 h-3.5 text-[#F59E0B] mt-0.5 flex-shrink-0\" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className=\"surface-card p-6\">
              <div className=\"label-eyebrow mb-3\">My Submissions · {history.length}</div>
              <div className=\"space-y-1\">
                {history.slice(0, 5).map((s) => (
                  <div key={s.id} className=\"flex items-center justify-between text-xs py-2 border-b border-gray-100 last:border-0\">
                    <div className=\"font-mono text-gray-500\">{new Date(s.created_at).toLocaleString()}</div>
                    <div className=\"flex items-center gap-3\">
                      <span className=\"font-mono text-gray-700\">{s.verdict}</span>
                      <span className={`font-mono font-semibold ${s.passed ? \"text-[#10B981]\" : \"text-[#E11D48]\"}`}>{s.score}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/ChallengePage.jsx