import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Icon from "../components/Icon";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { Input, Label, Select, Textarea } from "../components/ui/FormControls";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";
import { ICONS } from "../config/nav";

const TYPES = ["ACTIVITY", "ACCOMMODATION", "RESTAURANT", "EXPERIENCE", "TRANSPORT", "GUIDE"];

const emptyProvider = () => ({
  name: "",
  type: "ACTIVITY",
  city: "",
  description: "",
  phone: "",
  email: "",
  website: "",
  commission_rate: 10,
  bank_iban: "",
  bank_name: "",
  verified: false,
  status: "active",
  logo_url: "",
  cover_url: "",
  imagesText: "",
  languagesText: "English, French, Arabic",
});

function ProviderFormSteps({ step, data, onChange }) {
  return (
    <div className="space-y-4">
      {step === 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name" required value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} />
            <Select label="Type" value={data.type} onChange={(e) => onChange({ ...data, type: e.target.value })}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <Input label="City" required value={data.city} onChange={(e) => onChange({ ...data, city: e.target.value })} />
          <Textarea label="Description" rows={4} value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} />
            <Input label="Email" type="email" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} />
          </div>
          <Input label="Website" value={data.website} onChange={(e) => onChange({ ...data, website: e.target.value })} />
        </>
      )}
      {step === 1 && (
        <>
          <Input
            label="Commission rate %"
            type="number"
            min={0}
            max={100}
            value={data.commission_rate}
            onChange={(e) => onChange({ ...data, commission_rate: Number(e.target.value) || 0 })}
          />
          <Input label="Bank IBAN" value={data.bank_iban} onChange={(e) => onChange({ ...data, bank_iban: e.target.value })} />
          <Input label="Bank name" value={data.bank_name} onChange={(e) => onChange({ ...data, bank_name: e.target.value })} />
          <div>
            <Label>Verified</Label>
            <button
              type="button"
              onClick={() => onChange({ ...data, verified: !data.verified })}
              className={`mt-2 w-10 h-6 rounded-full transition-colors flex items-center ${data.verified ? "bg-emerald-500" : "bg-slate-200"}`}
            >
              <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${data.verified ? "translate-x-4" : ""}`} />
            </button>
          </div>
          <Select label="Status" value={data.status} onChange={(e) => onChange({ ...data, status: e.target.value })}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="suspended">suspended</option>
          </Select>
        </>
      )}
      {step === 2 && (
        <>
          <Input label="Logo URL" value={data.logo_url} onChange={(e) => onChange({ ...data, logo_url: e.target.value })} />
          <Input label="Cover URL" value={data.cover_url} onChange={(e) => onChange({ ...data, cover_url: e.target.value })} />
          <Textarea
            label="Images (comma-separated URLs)"
            rows={3}
            value={data.imagesText}
            onChange={(e) => onChange({ ...data, imagesText: e.target.value })}
          />
          <Input
            label="Languages (comma-separated)"
            value={data.languagesText}
            onChange={(e) => onChange({ ...data, languagesText: e.target.value })}
          />
        </>
      )}
    </div>
  );
}

function toPayload(f) {
  const images = String(f.imagesText || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const languages = String(f.languagesText || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    name: f.name,
    type: f.type,
    city: f.city,
    description: f.description || null,
    phone: f.phone || null,
    email: f.email || null,
    website: f.website || null,
    commission_rate: Number(f.commission_rate) || 10,
    bank_iban: f.bank_iban || null,
    bank_name: f.bank_name || null,
    verified: !!f.verified,
    status: f.status || "active",
    logo_url: f.logo_url || null,
    cover_url: f.cover_url || null,
    images: images.length ? images : [],
    languages: languages.length ? languages : ["English", "French", "Arabic"],
  };
}

const toForm = (p) => ({
  ...emptyProvider(),
  ...p,
  commission_rate: p.commission_rate ?? 10,
  imagesText: Array.isArray(p.images) ? p.images.join(", ") : "",
  languagesText: Array.isArray(p.languages) ? p.languages.join(", ") : "English, French, Arabic",
});

export default function ProvidersAdminPage({ toast }) {
  const INIT = useMemo(
    () => [
      {
        id: "demo-1",
        name: "Atlas Adventures Co.",
        type: "ACTIVITY",
        city: "Marrakech",
        commission_rate: 12,
        verified: true,
        status: "active",
      },
    ],
    []
  );

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyProvider());
  const [target, setTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.providers.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load providers");
      setRows(INIT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const verified = rows.filter((r) => r.verified).length;
    const avg =
      total > 0
        ? rows.reduce((s, r) => s + Number(r.commission_rate || 0), 0) / total
        : 0;
    return { total, active, verified, avg };
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          String(r.name || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          String(r.city || "")
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [rows, search]
  );

  const save = async () => {
    if (!form.name?.trim() || !form.city?.trim()) {
      toast?.("Name and city are required", "error");
      return;
    }
    try {
      const payload = toPayload(form);
      if (modal === "add") {
        const created = await adminApi.providers.create(payload);
        setRows((prev) => [created, ...prev]);
        toast?.("Provider created", "success");
      } else {
        const updated = await adminApi.providers.update(target.id, payload);
        setRows((prev) => prev.map((r) => (r.id === target.id ? updated : r)));
        toast?.("Provider updated", "success");
      }
      setModal(null);
      setStep(0);
    } catch (e) {
      toast?.(e?.message || "Save failed", "error");
    }
  };

  const del = async (id) => {
    try {
      await adminApi.providers.delete(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast?.("Provider deactivated", "success");
    } catch (e) {
      toast?.(e?.message || "Delete failed", "error");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Providers</h1>
          <p className="text-xs text-slate-400 mt-1">Prestataires — commission, banking, and verification.</p>
        </div>
        <Button
          variant="blue"
          icon="plus"
          size="sm"
          onClick={() => {
            setForm(emptyProvider());
            setStep(0);
            setModal("add");
          }}
        >
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Providers", value: stats.total, bg: "bg-slate-50", color: "text-slate-800" },
          { label: "Active", value: stats.active, bg: "bg-sky-50", color: "text-sky-700" },
          { label: "Verified", value: stats.verified, bg: "bg-emerald-50", color: "text-emerald-700" },
          { label: "Avg Commission %", value: stats.avg.toFixed(1), bg: "bg-amber-50", color: "text-amber-800" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`syne text-xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Card p="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Icon d={ICONS.search} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-50 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <Table
            columns={[
              {
                key: "name",
                label: "Name",
                render: (_v, r) => (
                  <div>
                    <p className="font-semibold text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.city}</p>
                  </div>
                ),
              },
              {
                key: "type",
                label: "Type",
                render: (v) => <Badge tone="indigo">{v}</Badge>,
              },
              { key: "city", label: "City" },
              {
                key: "commission_rate",
                label: "Commission",
                render: (v) => <span className="font-semibold">{Number(v || 0).toFixed(1)}%</span>,
              },
              {
                key: "verified",
                label: "Verified",
                render: (v) => <Badge tone={v ? "emerald" : "slate"}>{v ? "Yes" : "No"}</Badge>,
              },
              {
                key: "status",
                label: "Status",
                render: (v) => <Badge tone={v === "active" ? "emerald" : "slate"}>{v}</Badge>,
              },
              {
                key: "actions",
                label: "",
                render: (_v, r) => (
                  <div className="flex justify-end gap-2">
                    <Button size="xs" variant="ghost" icon="edit" onClick={() => {
                      setTarget(r);
                      setForm(toForm(r));
                      setStep(0);
                      setModal("edit");
                    }}>
                      Edit
                    </Button>
                    <Button size="xs" variant="ghost" icon="trash" onClick={() => setConfirmId(r.id)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filtered}
          />
        )}
      </Card>

      <Modal
        open={modal === "add" || modal === "edit"}
        title={modal === "add" ? "New provider" : "Edit provider"}
        onClose={() => {
          setModal(null);
          setStep(0);
        }}
        footer={
          <>
            <Button variant="ghost" onClick={() => (step > 0 ? setStep((s) => s - 1) : setModal(null))}>
              {step === 0 ? "Cancel" : "← Back"}
            </Button>
            {step < 2 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && (!form.name?.trim() || !form.city?.trim())}
              >
                Next →
              </Button>
            ) : (
              <Button onClick={save}>Save</Button>
            )}
          </>
        }
      >
        <div className="flex gap-2 mb-4">
          {["Basics", "Commission", "Photos"].map((label, i) => (
            <span
              key={label}
              className={`text-xs font-semibold px-2 py-1 rounded-lg ${step === i ? "bg-slate-800 text-white" : "text-slate-400"}`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
        <ProviderFormSteps step={step} data={form} onChange={setForm} />
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Deactivate provider?"
        desc="Sets status to inactive (soft delete)."
        onClose={() => setConfirmId(null)}
        onConfirm={() => del(confirmId)}
      />
    </div>
  );
}
