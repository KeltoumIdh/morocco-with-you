import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { MoroccoMotif } from "../icons";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function RegisterPage({ setPage }) {
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm]     = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      setPage("home");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try { await loginWithGoogle(); } catch (err) { setError(err.message); }
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 16,
    border: "1.5px solid var(--clay)", background: "var(--sand)",
    color: "var(--ink)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none",
  };

  return (
    <div className="page-enter min-h-screen flex" style={{ background: "var(--parchment)" }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-2/5 pattern-bg relative flex-col justify-between p-14 overflow-hidden">
        <MoroccoMotif />
        <div className="relative z-10">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm mb-8"
            style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>MW</div>
          <h2 className="font-display text-white" style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.1 }}>
            Start your <em>journey</em>
          </h2>
          <p className="mt-4" style={{ fontSize: 15, color: "rgba(255,255,255,.55)", lineHeight: 1.7 }}>
            Join thousands of travellers who've discovered Morocco through extraordinary, personalised experiences.
          </p>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>Morocco With You © 2026</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold mx-auto mb-3"
              style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>MW</div>
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 400, color: "var(--ink)" }}>Create account</h1>
          </div>

          <h2 className="hidden lg:block font-display mb-2" style={{ fontSize: 34, fontWeight: 400, color: "var(--ink)" }}>Create account</h2>
          <p className="text-sm mb-8" style={{ color: "var(--smoke)" }}>
            Already have an account?{" "}
            <button onClick={() => setPage("login")} style={{ color: "var(--terracotta)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              Sign in
            </button>
          </p>

          {/* Google OAuth */}
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl mb-5 text-sm font-medium"
            style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", color: "var(--ink)", cursor: "pointer" }}>
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "var(--clay)" }} />
            <span className="text-xs" style={{ color: "var(--smoke)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--clay)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>Full Name</label>
              <input type="text" required value={form.name} onChange={set("name")}
                placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>Email</label>
              <input type="email" required value={form.email} onChange={set("email")}
                placeholder="your@email.com" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>Password</label>
              <input type="password" required value={form.password} onChange={set("password")}
                placeholder="Min. 6 characters" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>Confirm Password</label>
              <input type="password" required value={form.confirm} onChange={set("confirm")}
                placeholder="Repeat password" style={inputStyle} />
            </div>

            {error && <p className="text-sm fade-in" style={{ color: "var(--terracotta)" }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 mt-2"
              style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.3)", opacity: loading ? .7 : 1 }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account…</>
                : "Create account"}
            </button>
          </form>

          <p className="text-xs text-center mt-5" style={{ color: "var(--clay)" }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>

          <button onClick={() => setPage("home")}
            className="w-full mt-3 py-3 text-sm"
            style={{ background: "none", border: "none", color: "var(--smoke)", cursor: "pointer" }}>
            Continue as guest →
          </button>
        </div>
      </div>
    </div>
  );
}
