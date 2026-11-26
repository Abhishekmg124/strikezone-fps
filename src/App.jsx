
import { useEffect, useState } from "react";
import GameScene from "./components/GameScene";
import GameHUD from "./components/GameHUD";
import MobileControls from "./components/MobileControls";

import "./App.css";

function App() {
  const [hit, setHit] = useState(false);
  const [ammo, setAmmo] = useState(30);
  const [reloading, setReloading] = useState(false);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [sensitivity, setSensitivity] = useState(50);
  const [volume, setVolume] = useState(70);
  const [graphics, setGraphics] = useState("Low");

  // Notify game components whenever pause state changes
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("game-pause-state", {
        detail: { paused },
      })
    );
  }, [paused]);

  // Send settings values to game components
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("game-settings-update", {
        detail: {
          sensitivity: sensitivity / 100,
          volume: volume / 100,
          graphics,
        },
      })
    );
  }, [sensitivity, volume, graphics]);

  // Desktop ESC key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.code !== "Escape") return;

      event.preventDefault();

      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }

      setPaused((previous) => !previous);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [settingsOpen]);

  // Existing game events
  useEffect(() => {
    const handleHit = () => {
      setHit(true);
      setTimeout(() => setHit(false), 180);
    };

    const handleScore = (event) => {
      setScore((prev) => prev + event.detail.points);
    };

    const handleHUD = (event) => {
      setAmmo(event.detail.ammo);
      setReloading(event.detail.reloading);
    };

    window.addEventListener("player-hit", handleHit);
    window.addEventListener("score-update", handleScore);
    window.addEventListener("hud-update", handleHUD);

    return () => {
      window.removeEventListener("player-hit", handleHit);
      window.removeEventListener("score-update", handleScore);
      window.removeEventListener("hud-update", handleHUD);
    };
  }, []);

  const resumeGame = () => {
    setSettingsOpen(false);
    setPaused(false);
  };

  const restartGame = () => {
    window.location.reload();
  };

  const openSettings = () => {
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  return (
    <main className="game-container">
      <GameScene />
      <MobileControls />

      <GameHUD
        health={100}
        ammo={ammo}
        maxAmmo={30}
        score={score}
        reloading={reloading}
      />

      {!paused && (
        <button
          className="pause-button"
          onClick={() => setPaused(true)}
          aria-label="Pause game"
        >
          Ⅱ
        </button>
      )}

      <div className={`crosshair ${hit ? "hit" : ""}`}>
        <span className="crosshair-top"></span>
        <span className="crosshair-bottom"></span>
        <span className="crosshair-left"></span>
        <span className="crosshair-right"></span>
        <span className="crosshair-dot"></span>
        {hit && <div className="hit-marker">×</div>}
      </div>

      {paused && (
        <div className="pause-overlay">
          <div className="pause-menu">
            {settingsOpen ? (
              <>
                <h1>SETTINGS</h1>
                <p>Customize your game experience.</p>

                <div className="setting-item">
                  <label htmlFor="sensitivity">
                    Mouse Sensitivity
                    <strong>{sensitivity}%</strong>
                  </label>
                  <input
                    id="sensitivity"
                    type="range"
                    min="10"
                    max="100"
                    value={sensitivity}
                    onChange={(event) =>
                      setSensitivity(Number(event.target.value))
                    }
                  />
                </div>

                <div className="setting-item">
                  <label htmlFor="volume">
                    Sound Volume
                    <strong>{volume}%</strong>
                  </label>
                  <input
                    id="volume"
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(event) =>
                      setVolume(Number(event.target.value))
                    }
                  />
                </div>

                <div className="setting-item">
                  <label htmlFor="graphics">Graphics Quality</label>
                  <select
                    id="graphics"
                    value={graphics}
                    onChange={(event) => setGraphics(event.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <button onClick={closeSettings}>BACK</button>
              </>
            ) : (
              <>
                <h1>GAME PAUSED</h1>
                <p>Your training session is paused.</p>

                <button onClick={resumeGame}>RESUME</button>
                <button onClick={restartGame}>RESTART</button>
                <button onClick={openSettings}>SETTINGS</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
