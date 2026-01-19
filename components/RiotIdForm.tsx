"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";

export function RiotIdForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);

  const onSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const trimmed = value.trim();

    // validation minimale : doit contenir "#"
    if (!trimmed || !trimmed.includes("#")) {
      setError(t("landing.riotIdFormat"));
      return;
    }

    const [gameName, tagLine] = trimmed.split("#");
    if (!gameName || !tagLine) {
        setError(t("landing.riotIdFormat"));
        return;
    }

    setError(null);
    setLoading(true);

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameName, tagLine }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || "Une erreur est survenue");
            setLoading(false);
            return;
        }

        // Login successful, redirect via server or client
        // Using router.push to match page (which will now read cookie)
        router.refresh(); // Refresh to update server components with new cookie
        router.push("/match");
        
    } catch {
        setError("Impossible de contacter le serveur");
        setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <div className="mt-4 w-full lg:w-[360px]">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label htmlFor="riot-id" className="text-xs font-medium text-white/70">
          {t("landing.riotIdLabel")}
        </label>
        <div className="flex gap-2">
          <input
            id="riot-id"
            type="text"
            value={value}
            disabled={loading}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("landing.riotIdPlaceholder")}
            className="flex-1 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060b] disabled:opacity-50"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "riot-id-error" : "riot-id-helper"}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black shadow-md shadow-cyan-500/20 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060b] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "..." : t("landing.analyzeButtonForm")}
          </button>
        </div>
        {error ? (
          <p id="riot-id-error" className="mt-1 text-xs text-rose-300">
            {error}
          </p>
        ) : (
          <p id="riot-id-helper" className="mt-1 text-xs text-white/45">
            {t("landing.riotIdFormat")}
          </p>
        )}
      </form>
    </div>
  );
}


