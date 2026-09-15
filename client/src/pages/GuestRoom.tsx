import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Rooms } from "./Room";

/**
 * Guest entry point for /join/:id — validates the guest token from
 * sessionStorage, checks that the embedded roomCode matches the URL,
 * then renders the standard Room component in guest mode.
 */
export function GuestRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const guestToken = sessionStorage.getItem("podstudio_guest_token");
    const guestRoom = sessionStorage.getItem("podstudio_guest_room");

    if (!guestToken || !guestRoom) {
      console.warn("No guest token found — redirecting to landing.");
      navigate("/", { replace: true });
      return;
    }

    // Check that the token's room matches the URL param
    if (guestRoom !== id) {
      console.warn(
        `Guest token room "${guestRoom}" doesn't match URL param "${id}" — redirecting.`
      );
      navigate("/", { replace: true });
      return;
    }

    setIsValid(true);
  }, [id, navigate]);

  if (!isValid) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0a0a",
          color: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="dash-loading-spinner" />
          <p
            style={{
              marginTop: "14px",
              color: "var(--color-text-secondary, #9c9c9c)",
              fontSize: "0.82rem",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            VALIDATING GUEST SESSION...
          </p>
        </div>
      </div>
    );
  }

  return <Rooms isGuest={true} />;
}
