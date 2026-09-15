import { useState } from "react";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import { supabase, supabaseConfigError } from "../lib/supabase.js";

function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 384 512" aria-hidden="true">
      <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

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
                    <button type="button" onClick={() => oauth("apple")}><AppleLogo />Fortsätt med Apple</button>
                    <button type="button" onClick={() => oauth("google")}><GoogleLogo />Fortsätt med Google</button>
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
