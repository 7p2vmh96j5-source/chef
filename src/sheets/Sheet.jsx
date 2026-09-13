export function Sheet({ title, onClose, children, footer, tall, bodyKey, right }) {
  return (
    <>
      <div className="k-backdrop" onClick={onClose} />
      <div className={"k-sheet" + (tall ? " tall" : "")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="k-grab" />
        <div className="k-sheet-h">
          <button className="k-link" onClick={onClose}>Avbryt</button>
          <b style={{ fontSize: 17 }}>{title}</b>
          {right || <span />}
        </div>
        <div className="k-sheet-b" key={bodyKey}>{children}</div>
        {footer && <div className="k-sheet-f">{footer}</div>}
      </div>
    </>
  );
}
