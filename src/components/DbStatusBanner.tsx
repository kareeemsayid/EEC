import React, { useEffect, useState } from "react";
import { RefreshCw, Database } from "lucide-react";

type DbStatus = "checking" | "connected" | "unavailable";

export default function DbStatusBanner() {
  const [status, setStatus] = useState<DbStatus>("checking");
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setStatus(data.db === "connected" ? "connected" : "unavailable");
    } catch {
      setStatus("unavailable");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  if (status !== "unavailable") return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 z-50">
      <Database className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        <span className="font-semibold">Database unreachable.</span>{" "}
        The Azure SQL server is blocking this connection. Add IP{" "}
        <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs font-bold">
          35.227.25.119
        </code>{" "}
        to your Azure SQL firewall — or enable{" "}
        <span className="font-semibold">"Allow Azure services"</span> in the Azure Portal firewall settings.
      </p>
      <button
        onClick={check}
        disabled={checking}
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors flex-shrink-0"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
        Retry
      </button>
    </div>
  );
}
