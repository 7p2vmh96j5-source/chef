import { Plus, ChefHat } from "lucide-react";

export function ActionSheet({ app, onClose }) {
  return (
    <>
      <div className="k-backdrop" onClick={onClose} />
      <div className="k-as" role="dialog" aria-modal="true" aria-label="Skapa">
        <div className="k-as-g">
          <button className="k-as-b" onClick={() => app.setSheet({ type: "log" })}>
            <span className="k-as-i"><ChefHat size={22} /></span>
            <span><b>Logga matlagning</b><small>Visa vännerna vad du har lagat</small></span>
          </button>
          <button className="k-as-b" onClick={() => app.setSheet({ type: "new" })}>
            <span className="k-as-i"><Plus size={22} /></span>
            <span><b>Nytt recept</b><small>Spara ett eget recept</small></span>
          </button>
        </div>
        <button className="k-as-cancel" onClick={onClose}>Avbryt</button>
      </div>
    </>
  );
}
