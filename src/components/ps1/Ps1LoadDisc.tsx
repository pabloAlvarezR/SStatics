/** Disco de carga estilo CD PS1 + HUD Steam. Solo presentación; las animaciones viven en globals.css. */
export function Ps1LoadDisc() {
  return (
    <div className="ps1-load-assembly" aria-hidden="true">
      <div className="ps1-load-halo" />
      <div className="ps1-load-ticks" />
      <div className="ps1-load-disc">
        <div className="ps1-load-disc-face" />
        <div className="ps1-load-disc-sheen" />
        <div className="ps1-load-hole">
          <span className="ps1-load-tri">△</span>
        </div>
      </div>
      <div className="ps1-load-orbit">
        <span className="ps1-load-slot ps1-load-slot-n">
          <span className="ps1-load-btn ps1-load-btn-tri">△</span>
        </span>
        <span className="ps1-load-slot ps1-load-slot-e">
          <span className="ps1-load-btn ps1-load-btn-cir">○</span>
        </span>
        <span className="ps1-load-slot ps1-load-slot-s">
          <span className="ps1-load-btn ps1-load-btn-crs">✕</span>
        </span>
        <span className="ps1-load-slot ps1-load-slot-w">
          <span className="ps1-load-btn ps1-load-btn-sqr">□</span>
        </span>
      </div>
    </div>
  );
}
