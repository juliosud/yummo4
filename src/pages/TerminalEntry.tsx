import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function TerminalEntry() {
  const { id } = useParams(); // table_id, e.g. "T-07"

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // autofocus name for quick entry
    nameRef.current?.focus();
  }, []);

  const isValidPhone = (v: string) => {
    // Simple permissive validation: 10-15 digits after stripping non-digits
    const digits = v.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  };

  const formatPhone = (raw: string) => {
    // Format US-style as (xxx) xxx-xxxx and append extension if any
    const d = raw.replace(/\D/g, "");
    const area = d.slice(0, 3);
    const mid = d.slice(3, 6);
    const last = d.slice(6, 10);
    const ext = d.slice(10);
    let out = "";
    if (area) out = `(${area}`;
    if (area && area.length === 3) out += ")";
    if (mid) out += `${area ? " " : ""}${mid}`;
    if (last) out += `-${last}`;
    if (ext) out += ` x${ext}`;
    return out;
  };

  const onStart = async () => {
    if (!id) return;
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    try {
      setSubmitting(true);

      // Ask the DB to create a brand-new session for this terminal
      const { data, error: rpcError } = await supabase.rpc("start_terminal_session", {
        p_table_id: id,
      });

      if (rpcError || !data) {
        console.error("start_terminal_session error:", rpcError);
        setError("We couldn't start your session. Please try again or ask for help.");
        setSubmitting(false);
        return;
      }

      const sessionCode = data as string;

      // Persist guest info for this session locally (works with/without DB)
      const guestKey = `guest-info-${id}-${sessionCode}`;
      const phoneDigits = phone.replace(/\D/g, "");
      try {
        localStorage.setItem(
          guestKey,
          JSON.stringify({ name: fullName.trim(), phone: phoneDigits, createdAt: new Date().toISOString() })
        );
      } catch {}

      // Redirect to menu with guest info in URL (for optional downstream usage)
      const url = new URL("/menu", window.location.origin);
      url.searchParams.set("table", id);
      url.searchParams.set("session", sessionCode);
      url.searchParams.set("guestName", fullName.trim());
      url.searchParams.set("guestPhone", phoneDigits);
      window.location.replace(url.toString());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-5 py-8 grid place-items-center">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Welcome</h1>
          <p className="text-gray-600 text-sm mt-1">
            Please enter your name and phone number to begin your order.
          </p>
          {id && (
            <p className="text-xs text-gray-500 mt-2">Table: {id}</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
              Name
            </label>
            <input
              id="fullName"
              ref={nameRef}
              type="text"
              inputMode="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Your full name"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="(555) 123-4567"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">We’ll use this to update you about your order.</p>
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={onStart}
            disabled={submitting}
            className="w-full rounded-2xl bg-gray-900 hover:bg-black text-white font-semibold py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Starting..." : "Start Ordering"}
          </button>
        </div>
      </div>
    </div>
  );
}
