
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { shoot } from "./Shooting.js";

export default function GameControls() {
  const { camera, scene } = useThree();

  const ammo = useRef(30);
  const reloading = useRef(false);
  const reloadTimer = useRef(null);

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

    updateHUD();

    // Shared shooting function
    const fireWeapon = () => {
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

    // Desktop shooting
    const handleMouseShoot = (event) => {
      if (event.button !== 0) return;
      fireWeapon();
    };

    // Mobile shooting
    const handleMobileShoot = () => {
      fireWeapon();
    };

    // Shared reload function
    const reloadWeapon = () => {
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

    // Desktop reload
    const handleKeyboardReload = (event) => {
      if (event.code !== "KeyR") return;
      reloadWeapon();
    };

    // Mobile reload
    const handleMobileReload = () => {
      reloadWeapon();
    };

    document.addEventListener("mousedown", handleMouseShoot);
    window.addEventListener("mobile-fire", handleMobileShoot);

    window.addEventListener("keydown", handleKeyboardReload);
    window.addEventListener("mobile-reload", handleMobileReload);

    return () => {
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
