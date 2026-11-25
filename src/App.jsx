
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

      <div className={`crosshair ${hit ? "hit" : ""}`}>
        <span className="crosshair-top"></span>
        <span className="crosshair-bottom"></span>
        <span className="crosshair-left"></span>
        <span className="crosshair-right"></span>
        <span className="crosshair-dot"></span>
        {hit && <div className="hit-marker">×</div>}
      </div>
    </main>
  );
}

export default App;
