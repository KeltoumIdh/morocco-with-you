import { useCallback, useEffect, useState } from "react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

export default function PromptManagementPage({ toast }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.prompts.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load prompts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invalidateCache = async () => {
    try {
      await adminApi.prompts.invalidateCache();
      toast?.("Server prompt cache cleared", "success");
    } catch (e) {
      toast?.(e?.message || "Failed", "error");
    }
  };

  const duplicate = async (id) => {
    try {
      await adminApi.prompts.create({ duplicate_from_id: id });
      toast?.("New version created (inactive). Edit it, then Set active.", "success");
      load();
    } catch (e) {
      toast?.(e?.message || "Duplicate failed", "error");
    }
  };

  const activate = async (id) => {
    try {
      await adminApi.prompts.activate(id);
      toast?.("Prompt activated for its feature", "success");
      load();
    } catch (e) {
      toast?.(e?.message || "Activate failed", "error");
    }
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await adminApi.prompts.update(editRow.id, { content: editContent });
      toast?.("Saved", "success");
      setEditRow(null);
      load();
    } catch (e) {
      toast?.(e?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const tableData = rows.map((r) => ({
    ...r,
    _active: r.is_active ? (
      <Badge status="success">Active</Badge>
    ) : (
      <span className="text-slate-400 text-xs">—</span>
    ),
    _created: r.created_at
      ? new Date(r.created_at).toLocaleString()
      : "—",
    _actions: (
      <div className="flex flex-wrap gap-1">
        <Button size="xs" variant="ghost" onClick={() => setViewRow(r)}>
          View
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => {
            setEditRow(r);
            setEditContent(r.content || "");
          }}
        >
          Edit
        </Button>
        <Button size="xs" variant="ghost" onClick={() => duplicate(r.id)}>
          New version
        </Button>
        {!r.is_active ? (
          <Button size="xs" onClick={() => activate(r.id)}>
            Set active
          </Button>
        ) : null}
      </div>
    ),
  }));

  return (
    <div className="page-enter space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Prompts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Versioned system & guardrail templates. Activate a row to use it in production (no redeploy).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={invalidateCache}>
            Invalidate cache
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Card p="p-5">
          <SectionHeader
            title="All versions"
            desc="Run server/schema_prompt_templates.sql in Supabase if this list is empty."
          />
          <div className="overflow-x-auto rounded-xl border border-slate-100 mt-4">
            <Table
              columns={[
                { key: "name", label: "Name" },
                { key: "feature", label: "Feature" },
                { key: "version", label: "Ver" },
                { key: "_active", label: "Active" },
                { key: "_created", label: "Created" },
                { key: "_actions", label: "" },
              ]}
              data={tableData}
            />
          </div>
        </Card>
      )}

      <Modal
        open={viewRow != null}
        title={viewRow ? `${viewRow.name} v${viewRow.version}` : ""}
        onClose={() => setViewRow(null)}
        footer={
          <Button variant="ghost" onClick={() => setViewRow(null)}>
            Close
          </Button>
        }
      >
        <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words max-h-[65vh] overflow-y-auto font-mono">
          {viewRow?.content || "—"}
        </pre>
      </Modal>

      <Modal
        open={editRow != null}
        title={editRow ? `Edit ${editRow.name} v${editRow.version}` : ""}
        onClose={() => setEditRow(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-500 mb-2">
          Use <code className="bg-slate-100 px-1 rounded">{"{{variable}}"}</code> placeholders
          matching the template&apos;s variable list.
        </p>
        <textarea
          className="w-full min-h-[320px] text-sm font-mono border border-slate-200 rounded-xl p-3"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
        />
      </Modal>
    </div>
  );
}
