import { useState } from "react";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import { supabase, supabaseConfigError } from "../lib/supabase.js";

export function AuthScreen({ recovery = false, onRecoveryComplete }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setMessage("");
  };

  const oauth = async (provider) => {
    if (!supabase) { setError(supabaseConfigError); return; }
    setError("");
    setMessage("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (oauthError) setError(oauthError.message);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase) {
      setError(supabaseConfigError);
      return;
    }
    if (recovery) {
      if (password.length < 6 || password !== confirmPassword) {
        setError(password !== confirmPassword ? "Lösenorden matchar inte." : "Lösenordet måste vara minst 6 tecken.");
        return;
      }
      setBusy(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      setBusy(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      if (onRecoveryComplete) {
        await onRecoveryComplete();
        return;
      }
      setMessage("Lösenordet är ändrat.");
      setPassword("");
      setConfirmPassword("");
      return;
    }
    if (mode === "forgot") {
      if (!email.trim()) {
        setError("Fyll i din e-postadress.");
        return;
      }
      setBusy(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      setBusy(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setMessage("Kolla din e-post för en återställningslänk.");
      return;
    }
    if (!email.trim() || password.length < 6) {
      setError("Fyll i en e-postadress och ett lösenord på minst 6 tecken.");
      return;
    }

    setBusy(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Kontot är skapat. Kontrollera din e-post för att bekräfta kontot.");
    }
  };

  return (
    <div className="k-root">
      <div className="k-phone">
        <div className="k-status" aria-hidden="true"><span>9:41</span><span className="k-batt"><i /></span></div>
        <div className="k-body">
          <main className="k-scroll k-auth-scroll">
            <div className="k-auth">
              <div className="k-auth-brand">
                <span className="k-auth-icon"><ChefHat size={26} /></span>
                <h1>Foodtho</h1>
                <p>
                  {recovery ? "Välj ett nytt lösenord"
                    : mode === "forgot" ? "Återställ ditt lösenord"
                    : mode === "login" ? "Välkommen tillbaka — logga in på ditt konto"
                    : "Skapa ett nytt konto"}
                </p>
              </div>
              <form className="k-auth-form" onSubmit={submit}>
                {!recovery && (
                  <>
                    <label className="k-label" htmlFor="auth-email">E-post</label>
                    <input id="auth-email" className="k-input" type="email" autoComplete="email" value={email}
                      onChange={(event) => setEmail(event.target.value)} placeholder="namn@exempel.se" />
                  </>
                )}
                {!recovery && mode !== "forgot" && <>
                  <label className="k-label" htmlFor="auth-password">Lösenord</label>
                  <div className="k-auth-password">
                    <input id="auth-password" className="k-input" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minst 6 tecken" />
                    <button type="button" className="k-auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}>
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </>}
                {recovery && <>
                  <label className="k-label" htmlFor="auth-password">Nytt lösenord</label>
                  <div className="k-auth-password">
                    <input id="auth-password" className="k-input" type={showPassword ? "text" : "password"} autoComplete="new-password"
                      value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minst 6 tecken" />
                    <button type="button" className="k-auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}>
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  <label className="k-label" htmlFor="auth-confirm-password">Upprepa lösenord</label>
                  <input id="auth-confirm-password" className="k-input" type={showPassword ? "text" : "password"} autoComplete="new-password"
                    value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Skriv lösenordet igen" />
                </>}
                {!recovery && mode === "login" && (
                  <button type="button" className="k-auth-forgot" onClick={() => switchMode("forgot")}>Glömt lösenordet?</button>
                )}
                {error && <p className="k-auth-error" role="alert">{error}</p>}
                {message && <p className="k-auth-message" role="status">{message}</p>}
                <button className="k-auth-submit" type="submit" disabled={busy}>
                  {busy ? "Arbetar..." : recovery ? "Byt lösenord" : mode === "forgot" ? "Skicka återställningslänk" : mode === "login" ? "Logga in" : "Skapa konto"}
                </button>
              </form>

              {!recovery && mode !== "forgot" && (
                <>
                  <div className="k-auth-divider">eller</div>
                  <div className="k-auth-oauth">
                    <button type="button" onClick={() => oauth("apple")}>Apple — Fortsätt med</button>
                    <button type="button" onClick={() => oauth("google")}>Google — Fortsätt med</button>
                  </div>
                </>
              )}

              {!recovery && (
                <button className="k-auth-switch" type="button" onClick={() => switchMode(mode === "forgot" ? "login" : mode === "login" ? "signup" : "login")}>
                  {mode === "forgot" ? "Tillbaka till inloggning"
                    : mode === "login" ? "Har du inget konto? Skapa konto"
                    : "Har du redan ett konto? Logga in"}
                </button>
              )}
            </div>
          </main>
        </div>
        <div className="k-homebar" />
      </div>
    </div>
  );
}
