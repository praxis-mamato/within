import { useEffect, useRef, useState } from "react";
import { accountService, type Plan } from "../services/account";
import { rememberReturn } from "../services/afterSignIn";
import { GOOGLE_CLIENT_ID } from "../services/config";

interface GoogleId {
  initialize(o: {
    client_id: string;
    callback: (r: { credential: string }) => void;
    nonce: string;
    ux_mode: "popup";
    context: "signin";
  }): void;
  renderButton(el: HTMLElement, o: Record<string, string | number>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let script: Promise<void> | null = null;
const loadGoogle = () =>
  (script ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google sign-in couldn’t load."));
    document.head.appendChild(s);
  }));

const hex = (b: ArrayBuffer) =>
  [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

/**
 * Google's own sign-in button, on Within's address: Google shows "withinoracle.app" and returns an ID token,
 * which Supabase checks against a one-time nonce. No redirect, so the person stays where they are.
 */
export function GoogleButton({
  plan,
  onFail,
}: {
  plan?: Plan;
  onFail: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    (async () => {
      const raw = hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
      const hashed = hex(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)),
      );
      await loadGoogle();
      if (!live || !box.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashed,
        ux_mode: "popup",
        context: "signin",
        callback: async ({ credential }) => {
          setError("");
          rememberReturn(plan);
          try {
            await accountService().signInWithGoogle(credential, raw);
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Sign-in didn’t work. Try again.",
            );
          }
        },
      });
      window.google.accounts.id.renderButton(box.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 300,
      });
    })().catch(() => live && onFail());
    return () => {
      live = false;
    };
  }, [plan, onFail]);
  return (
    <>
      <div ref={box} className="google-gis" />
      {error && (
        <p role="alert" className="small">
          {error}
        </p>
      )}
    </>
  );
}
