
import { useRef } from "react";

export default function MobileControls() {
  const joystickRef = useRef(null);
  const activePointer = useRef(null);
  const lookPointer = useRef(null);
  const lastLookPosition = useRef({ x: 0, y: 0 });

  // Virtual joystick
  const updateJoystick = (event) => {
    if (activePointer.current !== event.pointerId) return;

    const rect = joystickRef.current.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxDistance = rect.width * 0.32;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }

    window.dispatchEvent(
      new CustomEvent("mobile-move", {
        detail: {
          x: dx / maxDistance,
          y: dy / maxDistance,
        },
      })
    );

    const knob = joystickRef.current.querySelector(".joystick-knob");
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const stopJoystick = (event) => {
    if (activePointer.current !== event.pointerId) return;

    activePointer.current = null;

    window.dispatchEvent(
      new CustomEvent("mobile-move", {
        detail: { x: 0, y: 0 },
      })
    );

    const knob = joystickRef.current.querySelector(".joystick-knob");
    knob.style.transform = "translate(0px, 0px)";
  };

  // Touch camera aiming
  const startLooking = (event) => {
    event.preventDefault();

    lookPointer.current = event.pointerId;

    lastLookPosition.current = {
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateLooking = (event) => {
    if (lookPointer.current !== event.pointerId) return;

    event.preventDefault();

    const deltaX = event.clientX - lastLookPosition.current.x;
    const deltaY = event.clientY - lastLookPosition.current.y;

    lastLookPosition.current = {
      x: event.clientX,
      y: event.clientY,
    };

    window.dispatchEvent(
      new CustomEvent("mobile-look", {
        detail: { deltaX, deltaY },
      })
    );
  };

  const stopLooking = (event) => {
    if (lookPointer.current !== event.pointerId) return;
    lookPointer.current = null;
  };

  return (
    <div className="mobile-controls">

      {/* Right-side camera aiming area */}
      <div
        className="mobile-look-area"
        onPointerDown={startLooking}
        onPointerMove={updateLooking}
        onPointerUp={stopLooking}
        onPointerCancel={stopLooking}
      />

      {/* Left-side joystick */}
      <div
        className="joystick-base"
        ref={joystickRef}
        onPointerDown={(event) => {
          event.preventDefault();

          activePointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);

          updateJoystick(event);
        }}
        onPointerMove={updateJoystick}
        onPointerUp={stopJoystick}
        onPointerCancel={stopJoystick}
      >
        <div className="joystick-knob"></div>
      </div>

{/* Mobile action buttons */}
<div className="mobile-action-buttons">

  <button
    className="mobile-button fire-button"
    onPointerDown={(event) => {
      event.preventDefault();
      window.dispatchEvent(new Event("mobile-fire"));
    }}
  >
    FIRE
  </button>

  <button
    className="mobile-button jump-button"
    onPointerDown={(event) => {
      event.preventDefault();
      window.dispatchEvent(new Event("mobile-jump"));
    }}
  >
    JUMP
  </button>

  <button
    className="mobile-button reload-button"
    onPointerDown={(event) => {
      event.preventDefault();
      window.dispatchEvent(new Event("mobile-reload"));
    }}
  >
    RELOAD
  </button>

</div>

    </div>
  );
}
