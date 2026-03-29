import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { ICONS } from "../config/nav";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import { Input, Select, Textarea } from "../components/ui/FormControls";
import { CAT_COLORS } from "../data/mock";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

const emptyPost = () => ({
  id: "",
  title: "",
  excerpt: "",
  status: "draft",
  category: "Guide",
  author: "Admin",
  image: "",
  date: "",
  views: 0,
});

function PostForm({ data, onChange }) {
  return (
    <div className="space-y-4">
      <Input
        label="Post Title"
        required
        placeholder="e.g. 10 Reasons to Visit Morocco"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={data.category}
          onChange={(e) => onChange({ ...data, category: e.target.value })}
        >
          {["Guide", "Accommodation", "Food", "Experience", "Photography", "Adventure"].map(
            (c) => (
              <option key={c}>{c}</option>
            )
          )}
        </Select>
        <Select
          label="Status"
          value={data.status}
          onChange={(e) => onChange({ ...data, status: e.target.value })}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </Select>
      </div>
      <Input
        label="Cover Image URL"
        placeholder="https://..."
        value={data.image}
        onChange={(e) => onChange({ ...data, image: e.target.value })}
      />
      {data.image && (
        <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100">
          <img
            src={data.image}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
      <Textarea
        label="Excerpt / Description"
        required
        rows={4}
        placeholder="Short description of the post..."
        value={data.excerpt}
        onChange={(e) => onChange({ ...data, excerpt: e.target.value })}
      />
    </div>
  );
}

const rowToPost = (p) => ({
  id: p.id,
  title: p.title || "",
  excerpt: p.excerpt || "",
  status: p.status || "draft",
  category: p.category || "Guide",
  author: "Admin",
  image: p.image_url || "",
  date: p.created_at ? new Date(p.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "",
  views: Number(p.views) || 0,
  content: p.content || "",
});

const postToPayload = (p) => ({
  title: p.title,
  excerpt: p.excerpt,
  content: p.content || p.excerpt,
  category: p.category,
  status: p.status,
  image_url: p.image || undefined,
});

function PostsPage({ toast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyPost());
  const [target, setTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminApi.posts.list();
      setPosts((rows || []).map(rowToPost));
    } catch (e) {
      setError(e?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setForm(emptyPost());
    setModal("add");
  };
  const openEdit = (p) => {
    setForm({ ...p });
    setTarget(p);
    setModal("edit");
  };
  const openView = (p) => {
    setTarget(p);
    setModal("view");
  };

  const handleSave = async () => {
    if (!form.title || !form.excerpt) {
      toast?.("Please fill all required fields", "error");
      return;
    }

    try {
      if (modal === "add") {
        const created = await adminApi.posts.create(postToPayload(form));
        setPosts((prev) => [rowToPost(created), ...prev]);
        toast?.("Post created", "success");
      } else {
        const updated = await adminApi.posts.update(target.id, postToPayload(form));
        setPosts((prev) => prev.map((p) => (p.id === target.id ? rowToPost(updated) : p)));
        toast?.("Post updated", "success");
      }
      setModal(null);
    } catch (e) {
      toast?.(e?.message || "Failed to save post", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.posts.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast?.("Post deleted", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to delete post", "error");
    }
  };

  const togglePublish = async (post) => {
    try {
      const updated = await adminApi.posts.update(post.id, {
        status: post.status === "published" ? "draft" : "published",
      });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? rowToPost(updated) : p)));
      toast?.(`Post ${post.status === "published" ? "unpublished" : "published"}`, "success");
    } catch (e) {
      toast?.(e?.message || "Failed to update post status", "error");
    }
  };

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (filterStatus === "all" || p.status === filterStatus) &&
          p.title.toLowerCase().includes(search.toLowerCase())
      ),
    [posts, filterStatus, search]
  );

  return (
    <div className="page-enter space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Content</h1>
          <p className="text-xs text-slate-400 mt-1">Manage website posts and experiences.</p>
        </div>
        <Button variant="blue" icon="plus" size="sm" onClick={openAdd}>
          New Post
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Posts", value: posts.length, bg: "bg-slate-50", color: "text-slate-800" },
          {
            label: "Published",
            value: posts.filter((p) => p.status === "published").length,
            bg: "bg-sky-50",
            color: "text-sky-700",
          },
          {
            label: "Drafts",
            value: posts.filter((p) => p.status === "draft").length,
            bg: "bg-amber-50",
            color: "text-amber-700",
          },
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
            <Icon
              d={ICONS.search}
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-300 outline-none focus:ring-2 focus:ring-blue-50"
            />
          </div>
          <div className="flex gap-1">
            {["all", "published", "draft"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  filterStatus === f
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 border border-slate-200 hover:bg-slate-50"
                }`}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((post) => (
            <div
              key={post.id}
              className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="h-32 bg-slate-100 relative overflow-hidden">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon d={ICONS.image} size={28} className="text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-2">
                  <Badge status={post.status} />
                </div>
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                      CAT_COLORS[post.category] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-slate-800 text-sm leading-snug mb-1 line-clamp-2">
                  {post.title}
                </p>
                <p className="text-xs text-slate-400 mb-2">
                  {post.date} · {post.views ? `${post.views.toLocaleString()} views` : "No views yet"}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{post.excerpt}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openView(post)}
                    className="flex-1 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    type="button"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="flex-1 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => togglePublish(post)}
                    className="flex-1 py-1.5 text-xs font-medium border rounded-xl transition-colors"
                    style={{
                      color: post.status === "published" ? "#f59e0b" : "#10b981",
                      borderColor: post.status === "published" ? "#fde68a" : "#a7f3d0",
                      background: post.status === "published" ? "#fffbeb" : "#ecfdf5",
                    }}
                    type="button"
                  >
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => setConfirmId(post.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                    type="button"
                    aria-label="Delete"
                  >
                    <Icon d={ICONS.trash} size={13} />
                  </button>
                </div>
              </div>
            </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-12 text-center text-slate-400 text-sm">No posts found.</div>
            )}
          </div>
        )}
      </Card>

      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "add" ? "New Post" : "Edit Post"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="blue" onClick={handleSave}>
              {modal === "add" ? "Create Post" : "Save Changes"}
            </Button>
          </>
        }
      >
        <PostForm data={form} onChange={setForm} />
      </Modal>

      <Modal
        open={modal === "view"}
        onClose={() => setModal(null)}
        title="Post Preview"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Close
            </Button>
            <Button
              variant="blue"
              icon="edit"
              onClick={() => {
                setForm({ ...target });
                setModal("edit");
              }}
            >
              Edit Post
            </Button>
          </>
        }
      >
        {target && (
          <div className="space-y-4">
            {target.image && (
              <div className="w-full h-48 rounded-2xl overflow-hidden">
                <img src={target.image} alt={target.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between flex-wrap gap-2">
              <h3 className="syne text-xl font-semibold text-slate-800">{target.title}</h3>
              <div className="flex gap-2">
                <Badge status={target.status} />
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    CAT_COLORS[target.category] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {target.category}
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-slate-400">
              <span>By {target.author}</span>
              <span>·</span>
              <span>{target.date}</span>
              <span>·</span>
              <span>{(target.views || 0).toLocaleString()} views</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{target.excerpt}</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title="Delete Post?"
        message="This post will be permanently removed from the website."
      />
    </div>
  );
}

export default PostsPage;

