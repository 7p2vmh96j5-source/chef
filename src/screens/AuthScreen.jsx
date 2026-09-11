import { useState } from "react";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import { REMEMBER_LOGIN_KEY, supabase, supabaseConfigError } from "../lib/supabase.js";

export function AuthScreen({ recovery = false, onRecoveryComplete }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(() => localStorage.getItem(REMEMBER_LOGIN_KEY) === "true");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    if (!email.trim() || password.length < 6) {
      setError("Fyll i en e-postadress och ett lösenord på minst 6 tecken.");
      return;
    }

    setBusy(true);
    localStorage.setItem(REMEMBER_LOGIN_KEY, String(rememberLogin));
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
      <main className="k-auth">
        <div className="k-auth-brand">
          <span className="k-auth-icon"><ChefHat size={30} /></span>
          <h1>Köket</h1>
          <p>{recovery ? "Välj ett nytt lösenord" : "Logga in för att fortsätta"}</p>
        </div>
        <form className="k-auth-form" onSubmit={submit}>
          {!recovery && <>
            <label className="k-label" htmlFor="auth-email">E-post</label>
            <input id="auth-email" className="k-input" type="email" autoComplete="email" value={email}
              onChange={(event) => setEmail(event.target.value)} placeholder="namn@exempel.se" />
          </>}
          <label className="k-label" htmlFor="auth-password">Lösenord</label>
          <div className="k-auth-password">
            <input id="auth-password" className="k-input" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minst 6 tecken" />
            <button type="button" className="k-auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}>
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {recovery && <>
            <label className="k-label" htmlFor="auth-confirm-password">Upprepa lösenord</label>
            <input id="auth-confirm-password" className="k-input" type={showPassword ? "text" : "password"} autoComplete="new-password"
              value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Skriv lösenordet igen" />
          </>}
          {!recovery && mode === "login" && <label className="k-auth-remember">
            <input type="checkbox" checked={rememberLogin} onChange={(event) => setRememberLogin(event.target.checked)} />
            <span>Kom ihåg mig på den här enheten</span>
          </label>}
          {error && <p className="k-auth-error" role="alert">{error}</p>}
          {message && <p className="k-auth-message" role="status">{message}</p>}
          <button className="k-primary k-auth-submit" type="submit" disabled={busy}>
            {busy ? "Arbetar..." : recovery ? "Byt lösenord" : mode === "login" ? "Logga in" : "Skapa konto"}
          </button>
        </form>
        {!recovery && <button className="k-auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>
          {mode === "login" ? "Har du inget konto? Skapa konto" : "Har du redan ett konto? Logga in"}
        </button>}
      </main>
    </div>
  );
}
