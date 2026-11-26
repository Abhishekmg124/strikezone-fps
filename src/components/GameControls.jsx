
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { shoot } from "./Shooting.js";

export default function GameControls() {
  const { camera, scene } = useThree();

  const ammo = useRef(30);
  const reloading = useRef(false);
  const reloadTimer = useRef(null);
  const paused = useRef(false);

  useEffect(() => {
    console.log("GameControls activated!");

    const updateHUD = () => {
      window.dispatchEvent(
        new CustomEvent("hud-update", {
          detail: {
            ammo: ammo.current,
            maxAmmo: 30,
            reloading: reloading.current,
          },
        })
      );
    };

    const handlePause = (event) => {
      paused.current = event.detail.paused;
    };

    updateHUD();

    // Shared shooting function
    const fireWeapon = () => {
      if (paused.current) return;
      if (reloading.current) return;

      if (ammo.current <= 0) {
        console.log("Magazine empty! Reload.");
        return;
      }

      ammo.current--;
      updateHUD();

      console.log("FIRE! Ammo:", ammo.current);

      shoot(camera, scene);

      window.dispatchEvent(new Event("weapon-fire"));
    };

    const handleMouseShoot = (event) => {
    if (event.button !== 0) return;

     // Ignore clicks on menu buttons and other UI elements
     if (event.target.closest("button")) return;

      fireWeapon();
      };

    const handleMobileShoot = () => {
      fireWeapon();
    };

    const reloadWeapon = () => {
      if (paused.current) return;
      if (reloading.current) return;
      if (ammo.current === 30) return;

      reloading.current = true;
      updateHUD();

      console.log("Reloading...");

      reloadTimer.current = window.setTimeout(() => {
        ammo.current = 30;
        reloading.current = false;
        reloadTimer.current = null;

        updateHUD();

        console.log("Reloaded!");
      }, 1500);
    };

    const handleKeyboardReload = (event) => {
      if (event.code !== "KeyR") return;
      reloadWeapon();
    };

    const handleMobileReload = () => {
      reloadWeapon();
    };

    window.addEventListener("game-pause-state", handlePause);

    document.addEventListener("mousedown", handleMouseShoot);
    window.addEventListener("mobile-fire", handleMobileShoot);

    window.addEventListener("keydown", handleKeyboardReload);
    window.addEventListener("mobile-reload", handleMobileReload);

    return () => {
      window.removeEventListener("game-pause-state", handlePause);

      document.removeEventListener("mousedown", handleMouseShoot);
      window.removeEventListener("mobile-fire", handleMobileShoot);

      window.removeEventListener("keydown", handleKeyboardReload);
      window.removeEventListener("mobile-reload", handleMobileReload);

      if (reloadTimer.current !== null) {
        window.clearTimeout(reloadTimer.current);
      }
    };
  }, [camera, scene]);

  return null;
}
