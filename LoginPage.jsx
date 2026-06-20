
Action: file_editor create /app/frontend/src/pages/LoginPage.jsx --file-text "import { useState } from \"react\";
import { useNavigate, Link } from \"react-router-dom\";
import { useAuth } from \"@/lib/auth\";
import { Button } from \"@/components/ui/button\";
import { Input } from \"@/components/ui/input\";
import { Label } from \"@/components/ui/label\";
import { formatApiError } from \"@/lib/api\";
import { toast } from \"sonner\";
import { ArrowRight, Hexagon } from \"lucide-react\";

const AUTH_BG = \"https://images.unsplash.com/photo-1644088379091-d574269d422f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwbmV0d29yayUyMGFic3RyYWN0fGVufDB8fHx8MTc4MTg0MzA1OHww&ixlib=rb-4.1.0&q=85\";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(\"admin@tcs.com\");
  const [password, setPassword] = useState(\"Admin@123\");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(\"Welcome back\");
      navigate(\"/dashboard\");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || \"Login failed\");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"min-h-screen grid lg:grid-cols-2 bg-white\">
      {/* Left: form */}
      <div className=\"flex items-center justify-center p-8\">
        <div className=\"w-full max-w-md\">
          <div className=\"flex items-center gap-2 mb-12\">
            <div className=\"w-9 h-9 bg-[#002FA7] grid place-items-center\" style={{ borderRadius: 2 }}>
              <Hexagon className=\"w-4.5 h-4.5 text-white\" strokeWidth={2.5} />
            </div>
            <div>
              <div className=\"font-heading text-lg font-bold leading-none\">SAP Hub</div>
              <div className=\"label-eyebrow leading-none mt-1\" style={{ fontSize: \"0.6rem\" }}>TCS Internal Console</div>
            </div>
          </div>

          <div className=\"label-eyebrow mb-3\">Authentication</div>
          <h1 className=\"font-heading text-4xl font-bold text-gray-900 mb-2 tracking-tight\">Sign in to your workspace.</h1>
          <p className=\"text-gray-500 text-sm mb-10 leading-relaxed\">
            Track SAP projects, collaborate with your team, and sharpen C / C++ / Linux skills — from a single command center.
          </p>

          <form onSubmit={onSubmit} className=\"space-y-5\" data-testid=\"login-form\">
            <div>
              <Label htmlFor=\"email\" className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Email</Label>
              <Input
                id=\"email\"
                type=\"email\"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid=\"login-email-input\"
                className=\"mt-1.5 rounded-sm border-gray-300 focus-visible:ring-[#002FA7]/30 focus-visible:border-[#002FA7]\"
                placeholder=\"you@tcs.com\"
              />
            </div>
            <div>
              <Label htmlFor=\"password\" className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Password</Label>
              <Input
                id=\"password\"
                type=\"password\"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid=\"login-password-input\"
                className=\"mt-1.5 rounded-sm border-gray-300 focus-visible:ring-[#002FA7]/30 focus-visible:border-[#002FA7]\"
                placeholder=\"••••••••\"
              />
            </div>

            <Button
              type=\"submit\"
              disabled={loading}
              data-testid=\"login-submit-button\"
              className=\"w-full bg-[#002FA7] hover:bg-[#00227B] text-white rounded-sm h-11 font-medium group\"
            >
              {loading ? \"Signing in…\" : (
                <span className=\"flex items-center justify-center gap-2\">
                  Continue <ArrowRight className=\"w-4 h-4 group-hover:translate-x-0.5 transition-transform\" />
                </span>
              )}
            </Button>
          </form>

          <div className=\"mt-6 text-sm text-gray-500\">
            New to SAP Hub?{\" \"}
            <Link to=\"/register\" className=\"text-[#002FA7] hover:underline font-medium\" data-testid=\"link-register\">
              Create an account
            </Link>
          </div>

          <div className=\"mt-10 border border-gray-200 p-4 bg-gray-50\" style={{ borderRadius: 2 }}>
            <div className=\"label-eyebrow mb-2\" style={{ fontSize: \"0.6rem\" }}>Demo credentials</div>
            <div className=\"font-mono text-xs text-gray-700 space-y-1\">
              <div>admin@tcs.com · Admin@123</div>
              <div>associate@tcs.com · Associate@123</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: image */}
      <div className=\"hidden lg:block relative overflow-hidden bg-[#0a0e1a]\">
        <img src={AUTH_BG} alt=\"\" className=\"absolute inset-0 w-full h-full object-cover opacity-70\" />
        <div className=\"absolute inset-0 bg-gradient-to-br from-[#002FA7]/40 via-transparent to-[#0a0e1a]/80\" />
        <div className=\"absolute inset-0 grid-bg opacity-30\" />
        <div className=\"relative h-full flex flex-col justify-end p-12 text-white\">
          <div className=\"label-eyebrow text-white/60 mb-3\" style={{ fontSize: \"0.65rem\" }}>Project Operations · v1.0</div>
          <h2 className=\"font-heading text-4xl font-bold leading-tight mb-3\">
            One console for SAP delivery, code, and craft.
          </h2>
          <p className=\"text-white/70 max-w-md text-sm leading-relaxed\">
            Dashboard, kanban, GitHub feed, and AI-graded coding labs — engineered for the way TCS associates actually ship.
          </p>
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/LoginPage.jsx