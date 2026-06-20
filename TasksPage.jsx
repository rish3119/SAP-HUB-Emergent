
Action: file_editor create /app/frontend/src/pages/TasksPage.jsx --file-text "import { useEffect, useState } from \"react\";
import api, { formatApiError } from \"@/lib/api\";
import { Button } from \"@/components/ui/button\";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from \"@/components/ui/dialog\";
import { Input } from \"@/components/ui/input\";
import { Label } from \"@/components/ui/label\";
import { Textarea } from \"@/components/ui/textarea\";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@/components/ui/select\";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from \"@/components/ui/dropdown-menu\";
import { Popover, PopoverContent, PopoverTrigger } from \"@/components/ui/popover\";
import { Calendar } from \"@/components/ui/calendar\";
import { toast } from \"sonner\";
import { Plus, MoreVertical, MessageSquare, Calendar as CalendarIcon, Trash2 } from \"lucide-react\";

const COLUMNS = [
  { key: \"todo\", label: \"To Do\" },
  { key: \"in_progress\", label: \"In Progress\" },
  { key: \"review\", label: \"Review\" },
  { key: \"done\", label: \"Done\" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    title: \"\",
    description: \"\",
    project_id: \"\",
    assignee_email: \"\",
    priority: \"medium\",
    status: \"todo\",
    due_date: undefined,
  });

  const refresh = async () => {
    const [t, p, u] = await Promise.all([
      api.get(\"/tasks\"),
      api.get(\"/projects\"),
      api.get(\"/users\"),
    ]);
    setTasks(t.data);
    setProjects(p.data);
    setUsers(u.data);
  };

  useEffect(() => { refresh(); }, []);

  const submit = async () => {
    if (!form.title || !form.project_id) {
      toast.error(\"Title and project are required\");
      return;
    }
    try {
      await api.post(\"/tasks\", {
        ...form,
        due_date: form.due_date ? form.due_date.toISOString() : null,
      });
      toast.success(\"Task created\");
      setOpen(false);
      setForm({ title: \"\", description: \"\", project_id: \"\", assignee_email: \"\", priority: \"medium\", status: \"todo\", due_date: undefined });
      refresh();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const moveTask = async (task, status) => {
    await api.patch(`/tasks/${task.id}`, { status });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
  };

  const deleteTask = async (task) => {
    await api.delete(`/tasks/${task.id}`);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    toast.success(\"Task deleted\");
  };

  return (
    <div className=\"space-y-6\" data-testid=\"tasks-page\">
      <div className=\"flex items-end justify-between\">
        <div>
          <div className=\"label-eyebrow mb-2\">Sprint Board</div>
          <h1 className=\"font-heading text-4xl sm:text-5xl font-bold tracking-tight text-gray-900\">Tasks</h1>
          <p className=\"text-gray-500 mt-2 text-sm\">Plan work across SAP engagements. Drop tasks into columns to update status.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid=\"new-task-button\" className=\"bg-[#002FA7] hover:bg-[#00227B] text-white rounded-sm h-11 px-6\">
              <Plus className=\"w-4 h-4 mr-2\" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className=\"rounded-sm max-w-lg\">
            <DialogHeader>
              <DialogTitle className=\"font-heading\">Create task</DialogTitle>
            </DialogHeader>
            <div className=\"space-y-4\">
              <div>
                <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className=\"mt-1.5 rounded-sm\" data-testid=\"task-title-input\" />
              </div>
              <div>
                <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className=\"mt-1.5 rounded-sm\" data-testid=\"task-description-input\" />
              </div>
              <div className=\"grid grid-cols-2 gap-3\">
                <div>
                  <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Project</Label>
                  <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                    <SelectTrigger className=\"mt-1.5 rounded-sm\" data-testid=\"task-project-select\"><SelectValue placeholder=\"Select\" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Assignee</Label>
                  <Select value={form.assignee_email} onValueChange={(v) => setForm({ ...form, assignee_email: v })}>
                    <SelectTrigger className=\"mt-1.5 rounded-sm\" data-testid=\"task-assignee-select\"><SelectValue placeholder=\"Select\" /></SelectTrigger>
                    <SelectContent>
                      {users.map((u) => <SelectItem key={u.email} value={u.email}>{u.name} · {u.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className=\"mt-1.5 rounded-sm\" data-testid=\"task-priority-select\"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"low\">Low</SelectItem>
                      <SelectItem value=\"medium\">Medium</SelectItem>
                      <SelectItem value=\"high\">High</SelectItem>
                      <SelectItem value=\"critical\">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className=\"text-xs uppercase tracking-widest font-semibold text-gray-700\">Due date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant=\"outline\" className=\"w-full justify-start mt-1.5 rounded-sm font-normal\" data-testid=\"task-due-date-button\">
                        <CalendarIcon className=\"w-4 h-4 mr-2\" />
                        {form.due_date ? form.due_date.toLocaleDateString() : \"Pick a date\"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className=\"w-auto p-0\" align=\"start\">
                      <Calendar mode=\"single\" selected={form.due_date} onSelect={(d) => setForm({ ...form, due_date: d })} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant=\"outline\" className=\"rounded-sm\" onClick={() => setOpen(false)} data-testid=\"task-cancel-button\">Cancel</Button>
              <Button onClick={submit} className=\"bg-[#002FA7] hover:bg-[#00227B] rounded-sm\" data-testid=\"task-create-submit\">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className={`bg-[#F8F9FA] kanban-col-${col.key} p-4 border border-gray-200 flex flex-col gap-3 min-h-[420px]`} style={{ borderRadius: 2 }} data-testid={`column-${col.key}`}>
              <div className=\"flex items-center justify-between\">
                <div>
                  <div className=\"label-eyebrow\" style={{ fontSize: \"0.6rem\" }}>{col.label}</div>
                  <div className=\"font-mono text-xs text-gray-400 mt-0.5\">{items.length} item{items.length !== 1 ? \"s\" : \"\"}</div>
                </div>
              </div>
              <div className=\"flex flex-col gap-2\">
                {items.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelected(t)}
                    data-testid={`task-card-${t.id}`}
                    className=\"bg-white p-3 border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer\"
                    style={{ borderRadius: 2 }}
                  >
                    <div className=\"flex items-start justify-between gap-2\">
                      <div className=\"text-sm font-medium text-gray-900 leading-snug\">{t.title}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className=\"text-gray-400 hover:text-gray-700\" data-testid={`task-menu-${t.id}`}>
                            <MoreVertical className=\"w-4 h-4\" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align=\"end\" className=\"rounded-sm\">
                          {COLUMNS.filter((c) => c.key !== t.status).map((c) => (
                            <DropdownMenuItem key={c.key} onClick={(e) => { e.stopPropagation(); moveTask(t, c.key); }} className=\"text-sm\">
                              Move to {c.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteTask(t); }} className=\"text-sm text-[#E11D48]\">
                            <Trash2 className=\"w-3.5 h-3.5 mr-2\" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className=\"mt-2 flex items-center gap-2\">
                      <span className={`text-[10px] px-1.5 py-0.5 font-mono font-medium priority-${t.priority}`} style={{ borderRadius: 2 }}>{t.priority}</span>
                      {t.comments?.length > 0 && (
                        <span className=\"text-[10px] font-mono text-gray-400 flex items-center gap-1\">
                          <MessageSquare className=\"w-3 h-3\" />{t.comments.length}
                        </span>
                      )}
                    </div>
                    {t.assignee_email && <div className=\"text-[11px] font-mono text-gray-500 mt-2 truncate\">{t.assignee_email}</div>}
                    {t.due_date && <div className=\"text-[11px] font-mono text-gray-400 mt-1\">due {new Date(t.due_date).toLocaleDateString()}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <TaskDetailDialog
          task={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}

function TaskDetailDialog({ task, onClose, onUpdated }) {
  const [comment, setComment] = useState(\"\");

  const submit = async () => {
    if (!comment.trim()) return;
    const { data: newComment } = await api.post(`/tasks/${task.id}/comments`, { body: comment });
    onUpdated({ ...task, comments: [...(task.comments || []), newComment] });
    setComment(\"\");
    toast.success(\"Comment added\");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className=\"rounded-sm max-w-2xl\" data-testid=\"task-detail-dialog\">
        <DialogHeader>
          <DialogTitle className=\"font-heading text-2xl\">{task.title}</DialogTitle>
        </DialogHeader>
        <div className=\"space-y-4\">
          <div className=\"grid grid-cols-3 gap-4 pb-4 border-b border-gray-100\">
            <div>
              <div className=\"label-eyebrow\" style={{ fontSize: \"0.55rem\" }}>Status</div>
              <div className=\"font-mono text-sm mt-1\">{task.status}</div>
            </div>
            <div>
              <div className=\"label-eyebrow\" style={{ fontSize: \"0.55rem\" }}>Priority</div>
              <div className=\"font-mono text-sm mt-1\">{task.priority}</div>
            </div>
            <div>
              <div className=\"label-eyebrow\" style={{ fontSize: \"0.55rem\" }}>Assignee</div>
              <div className=\"font-mono text-xs mt-1 truncate\">{task.assignee_email || \"—\"}</div>
            </div>
          </div>
          <div>
            <div className=\"label-eyebrow mb-1\">Description</div>
            <p className=\"text-sm text-gray-700 leading-relaxed\">{task.description || \"No description.\"}</p>
          </div>
          <div>
            <div className=\"label-eyebrow mb-2\">Comments · {task.comments?.length || 0}</div>
            <div className=\"space-y-2 max-h-48 overflow-auto\">
              {(task.comments || []).map((c) => (
                <div key={c.id} className=\"bg-gray-50 p-3 border border-gray-200\" style={{ borderRadius: 2 }}>
                  <div className=\"flex items-center justify-between mb-1\">
                    <div className=\"text-xs font-semibold text-gray-700\">{c.author_name}</div>
                    <div className=\"font-mono text-[10px] text-gray-400\">{new Date(c.created_at).toLocaleString()}</div>
                  </div>
                  <div className=\"text-sm text-gray-700\">{c.body}</div>
                </div>
              ))}
              {!task.comments?.length && <div className=\"text-sm text-gray-400\">No comments yet.</div>}
            </div>
            <div className=\"flex gap-2 mt-3\">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder=\"Add a comment…\" className=\"rounded-sm\" data-testid=\"comment-input\" />
              <Button onClick={submit} className=\"bg-[#002FA7] hover:bg-[#00227B] rounded-sm\" data-testid=\"add-comment-button\">Send</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
"
Observation: Create successful: /app/frontend/src/pages/TasksPage.jsx