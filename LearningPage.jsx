
Action: file_editor create /app/frontend/src/pages/LearningPage.jsx --file-text "import { useEffect, useState } from \"react\";
import { Link } from \"react-router-dom\";
import api from \"@/lib/api\";
import { Tabs, TabsList, TabsTrigger, TabsContent } from \"@/components/ui/tabs\";
import { Cpu, Terminal, Code2, ArrowUpRight } from \"lucide-react\";

const HERO = \"https://images.unsplash.com/photo-1607799279861-4dd421887fb3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBzb2Z0d2FyZSUyMGRldmVsb3BlcnxlbnwwfHx8fDE3ODE4NDMwNTF8MA&ixlib=rb-4.1.0&q=85\";

const LANG_META = {
  c: { label: \"C\", icon: Cpu, color: \"#002FA7\" },
  cpp: { label: \"C++\", icon: Code2, color: \"#E11D48\" },
  linux: { label: \"Linux Shell\", icon: Terminal, color: \"#10B981\" },
};

const diffStyle = {
  easy: \"bg-[#10B981]/10 text-[#047857]\",
  medium: \"bg-[#F59E0B]/10 text-[#92400E]\",
  hard: \"bg-[#E11D48]/10 text-[#9F1239]\",
};

export default function LearningPage() {
  const [challenges, setChallenges] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([api.get(\"/challenges\"), api.get(\"/submissions/me\")]);
      setChallenges(c.data);
      setSubmissions(s.data);
    })();
  }, []);

  const solvedIds = new Set(submissions.filter((s) => s.passed).map((s) => s.challenge_id));

  const render = (lang) => {
    const list = lang === \"all\" ? challenges : challenges.filter((c) => c.language === lang);
    return (
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 stagger-fade\" data-testid={`challenges-${lang}`}>
        {list.map((c) => {
          const meta = LANG_META[c.language];
          const Icon = meta.icon;
          const solved = solvedIds.has(c.id);
          return (
            <Link
              key={c.id}
              to={`/learning/${c.id}`}
              data-testid={`challenge-${c.id}`}
              className=\"surface-card p-5 hover:-translate-y-0.5 hover:border-gray-400 transition-all duration-200 group\"
            >
              <div className=\"flex items-start justify-between mb-3\">
                <div className=\"w-9 h-9 grid place-items-center\" style={{ background: `${meta.color}10`, borderRadius: 2 }}>
                  <Icon className=\"w-4.5 h-4.5\" style={{ color: meta.color }} />
                </div>
                <ArrowUpRight className=\"w-4 h-4 text-gray-300 group-hover:text-[#002FA7] transition-colors\" />
              </div>
              <div className=\"flex items-center gap-2 mb-1\">
                <span className=\"font-mono text-[10px] uppercase tracking-widest text-gray-500\">{meta.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 font-medium ${diffStyle[c.difficulty]}`} style={{ borderRadius: 2 }}>{c.difficulty}</span>
                {solved && <span className=\"text-[10px] px-1.5 py-0.5 bg-[#10B981] text-white font-medium\" style={{ borderRadius: 2 }}>solved</span>}
              </div>
              <h3 className=\"font-heading font-semibold text-base leading-snug text-gray-900 mb-2\">{c.title}</h3>
              <p className=\"text-xs text-gray-500 line-clamp-2 leading-relaxed\">{c.description}</p>
              <div className=\"mt-4 flex items-center justify-between\">
                <span className=\"font-mono text-xs text-gray-400\">{c.points} pts</span>
              </div>
            </Link>
          );
        })}
        {list.length === 0 && <div className=\"col-span-full text-center text-gray-400 py-16\">No challenges in this track yet.</div>}
      </div>
    );
  };

  return (
    <div className=\"space-y-6\" data-testid=\"learning-page\">
      <div className=\"relative overflow-hidden border border-gray-200 bg-[#0a0e1a]\" style={{ borderRadius: 2 }}>
        <img src={HERO} alt=\"\" className=\"absolute inset-0 w-full h-full object-cover opacity-30\" />
        <div className=\"absolute inset-0 bg-gradient-to-r from-[#0a0e1a]/95 via-[#0a0e1a]/80 to-transparent\" />
        <div className=\"relative p-8 md:p-12 max-w-2xl text-white\">
          <div className=\"label-eyebrow text-white/60 mb-2\">Skills Academy</div>
          <h1 className=\"font-heading text-3xl md:text-4xl font-bold mb-3 leading-tight\">Sharpen your C, C++ and Linux scripting skills.</h1>
          <p className=\"text-white/70 text-sm leading-relaxed\">
            Solve curated coding challenges. Submissions are AI-graded by Claude with a score and concrete feedback in seconds.
          </p>
        </div>
      </div>

      <Tabs defaultValue=\"all\" className=\"w-full\">
        <TabsList className=\"bg-gray-100 rounded-sm\" data-testid=\"language-tabs\">
          <TabsTrigger value=\"all\" data-testid=\"tab-all\" className=\"rounded-sm\">All ({challenges.length})</TabsTrigger>
          <TabsTrigger value=\"c\" data-testid=\"tab-c\" className=\"rounded-sm\">C</TabsTrigger>
          <TabsTrigger value=\"cpp\" data-testid=\"tab-cpp\" className=\"rounded-sm\">C++</TabsTrigger>
          <TabsTrigger value=\"linux\" data-testid=\"tab-linux\" className=\"rounded-sm\">Linux Shell</TabsTrigger>
        </TabsList>
        <TabsContent value=\"all\">{render(\"all\")}</TabsContent>
        <TabsContent value=\"c\">{render(\"c\")}</TabsContent>
        <TabsContent value=\"cpp\">{render(\"cpp\")}</TabsContent>
        <TabsContent value=\"linux\">{render(\"linux\")}</TabsContent>
      </Tabs>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/LearningPage.jsx