
Action: file_editor create /app/frontend/src/pages/GitHubPage.jsx --file-text "import { useEffect, useState } from \"react\";
import api, { formatApiError } from \"@/lib/api\";
import { Button } from \"@/components/ui/button\";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from \"@/components/ui/dialog\";
import { Input } from \"@/components/ui/input\";
import { Label } from \"@/components/ui/label\";
import { Textarea } from \"@/components/ui/textarea\";
import { toast } from \"sonner\";
import { GitBranch, GitCommit, Star, ExternalLink, Plus } from \"lucide-react\";

export default function GitHubPage() {
  const [repos, setRepos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: \"\", url: \"\", language: \"ABAP\", description: \"\" });

  const refresh = async () => {
    const { data } = await api.get(\"/repos\");
    setRepos(data);
  };

  useEffect(() => { refresh(); }, []);

  const submit = async () => {
    if (!form.name || !form.url) {
      toast.error(\"Name and URL required\");
      return;
    }
    try {
      await api.post(\"/repos\", form);
      toast.success(\"Repository linked\");
      setForm({ name: \"\", url: \"\", language: \"ABAP\", description: \"\" });
      setOpen(false);
      refresh();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div className=\"space-y-6\" data-testid=\"github-page\">
      <div className=\"flex items-end justify-between\">
        <div>
          <div className=\"label-eyebrow mb-2\">Source Control</div>
          <h1 className=\"font-heading text-4xl sm:text-5xl font-bold tracking-tight text-gray-900\">Repositories</h1>
          <p className=\"text-gray-500 mt-2 text-sm\">Live commit feed from linked SAP engineering repositories.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid=\"link-repo-button\" className=\"bg-[#002FA7] hover:bg-[#00227B] text-white rounded-sm h-11 px-6\">
              <Plus className=\"w-4 h-4 mr-2\" /> Link Repository
            </Button>
          </DialogTrigger>
          <DialogContent className=\"rounded-sm\">
            <DialogHeader>
              <DialogTitle className=\"font-heading\">Link a repository</DialogTitle>
            </DialogHeader>
            <div className=\"space-y-3\">
              <div>
                <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className=\"mt-1.5 rounded-sm\" data-testid=\"repo-name-input\" />
              </div>
              <div>
                <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">URL</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className=\"mt-1.5 rounded-sm\" data-testid=\"repo-url-input\" />
              </div>
              <div>
                <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Language</Label>
                <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className=\"mt-1.5 rounded-sm\" data-testid=\"repo-language-input\" />
              </div>
              <div>
                <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className=\"mt-1.5 rounded-sm\" data-testid=\"repo-description-input\" />
              </div>
            </div>
            <DialogFooter>
              <Button variant=\"outline\" className=\"rounded-sm\" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} className=\"bg-[#002FA7] hover:bg-[#00227B] rounded-sm\" data-testid=\"repo-submit-button\">Link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-fade\">
        {repos.map((r) => (
          <div key={r.id} className=\"surface-card p-6 hover:border-gray-400 transition-colors\" data-testid={`repo-card-${r.id}`}>
            <div className=\"flex items-start justify-between mb-3\">
              <div>
                <div className=\"flex items-center gap-2\">
                  <GitBranch className=\"w-4 h-4 text-[#002FA7]\" />
                  <a href={r.url} target=\"_blank\" rel=\"noreferrer\" className=\"font-mono text-sm font-semibold text-gray-900 hover:text-[#002FA7] flex items-center gap-1\">
                    {r.name} <ExternalLink className=\"w-3 h-3 opacity-50\" />
                  </a>
                </div>
                <p className=\"text-sm text-gray-500 mt-1\">{r.description}</p>
              </div>
              <div className=\"flex items-center gap-1 text-xs text-gray-500 font-mono\">
                <Star className=\"w-3.5 h-3.5\" />{r.stars}
              </div>
            </div>
            <div className=\"flex items-center gap-2 text-xs\">
              <span className=\"bg-gray-100 px-2 py-0.5 font-mono\" style={{ borderRadius: 2 }}>{r.language}</span>
            </div>
            <div className=\"mt-4 border-t border-gray-100 pt-3\">
              <div className=\"label-eyebrow mb-2\" style={{ fontSize: \"0.55rem\" }}>Recent commits</div>
              <ul className=\"space-y-1.5\">
                {(r.commits || []).map((c, i) => (
                  <li key={i} className=\"flex items-start gap-3 text-xs\">
                    <GitCommit className=\"w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0\" />
                    <span className=\"font-mono text-[#002FA7] flex-shrink-0\">{c.hash}</span>
                    <span className=\"text-gray-700 truncate flex-1\">{c.message}</span>
                    <span className=\"font-mono text-gray-400 flex-shrink-0\">{c.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        {repos.length === 0 && <div className=\"lg:col-span-2 text-center text-gray-400 py-16\">No repositories linked yet.</div>}
      </div>
    </div>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/GitHubPage.jsx