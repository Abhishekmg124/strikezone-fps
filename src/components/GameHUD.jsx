
export default function GameHUD({
  health,
  ammo,
  maxAmmo,
  score,
  reloading,
}) {
  const healthColor =
    health > 60 ? "#35df75" :
    health > 30 ? "#ffbd35" :
    "#ff4545";

  return (
    <div className="game-hud">

      {/* Top HUD */}
      <div className="hud-top">

        {/* Health */}
        <div className="health-panel">
          <div className="hud-label">
            <span>HEALTH</span>
            <strong>{health} HP</strong>
          </div>

          <div className="health-bar">
            <div
              className="health-fill"
              style={{
                width: `${health}%`,
                background: healthColor,
              }}
            />
          </div>
        </div>

        {/* Score */}
        <div className="score-panel">
          <span>SCORE</span>
          <strong>{score.toLocaleString()}</strong>
        </div>

      </div>

      {/* Ammo */}
      <div className="ammo-panel">
        {reloading ? (
          <strong className="reload-text">
            RELOADING...
          </strong>
        ) : (
          <>
            <strong className="ammo-number">{ammo}</strong>
            <span className="ammo-total">
              / {maxAmmo} AMMO
            </span>
          </>
        )}
      </div>

    </div>
  );
}
