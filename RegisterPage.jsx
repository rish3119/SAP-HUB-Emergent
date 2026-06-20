
Action: file_editor create /app/frontend/src/pages/RegisterPage.jsx --file-text "import { useState } from \"react\";
import { useNavigate, Link } from \"react-router-dom\";
import { useAuth } from \"@/lib/auth\";
import { Button } from \"@/components/ui/button\";
import { Input } from \"@/components/ui/input\";
import { Label } from \"@/components/ui/label\";
import { formatApiError } from \"@/lib/api\";
import { toast } from \"sonner\";
import { Hexagon } from \"lucide-react\";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(\"\");
  const [email, setEmail] = useState(\"\");
  const [password, setPassword] = useState(\"\");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success(\"Account created\");
      navigate(\"/dashboard\");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || \"Registration failed\");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"min-h-screen grid place-items-center bg-[#F8F9FA] px-6\">
      <div className=\"w-full max-w-md bg-white border border-gray-200 p-8\" style={{ borderRadius: 2 }}>
        <div className=\"flex items-center gap-2 mb-8\">
          <div className=\"w-9 h-9 bg-[#002FA7] grid place-items-center\" style={{ borderRadius: 2 }}>
            <Hexagon className=\"w-4.5 h-4.5 text-white\" strokeWidth={2.5} />
          </div>
          <div>
            <div className=\"font-heading text-lg font-bold leading-none\">SAP Hub</div>
            <div className=\"label-eyebrow leading-none mt-1\" style={{ fontSize: \"0.6rem\" }}>Create account</div>
          </div>
        </div>

        <h1 className=\"font-heading text-2xl font-bold mb-1\">Join the team console.</h1>
        <p className=\"text-sm text-gray-500 mb-6\">Use your TCS work email to register.</p>

        <form onSubmit={onSubmit} className=\"space-y-4\" data-testid=\"register-form\">
          <div>
            <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid=\"register-name-input\" className=\"mt-1.5 rounded-sm\" />
          </div>
          <div>
            <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Email</Label>
            <Input type=\"email\" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid=\"register-email-input\" className=\"mt-1.5 rounded-sm\" />
          </div>
          <div>
            <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Password (min 6 chars)</Label>
            <Input type=\"password\" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} data-testid=\"register-password-input\" className=\"mt-1.5 rounded-sm\" />
          </div>

          <Button
            type=\"submit\"
            disabled={loading}
            data-testid=\"register-submit-button\"
            className=\"w-full bg-[#002FA7] hover:bg-[#00227B] text-white rounded-sm h-11\"
          >
            {loading ? \"Creating account…\" : \"Create account\"}
          </Button>
        </form>

        <div className=\"mt-6 text-sm text-gray-500 text-center\">
          Already have an account?{\" \"}
          <Link to=\"/login\" className=\"text-[#002FA7] hover:underline font-medium\" data-testid=\"link-login\">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/RegisterPage.jsx