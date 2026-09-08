import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { GameScreen } from "@/components/GameScreen";
import { CategoryLegend } from "@/components/CategoryLegend";
import { AdminPage } from "@/components/AdminPage";
import { fetchEntities, fetchConfig } from "@/supabaseClient";
import type { AnigenreEntity } from "@/types";
import { useTheme } from "@/lib/theme";
import { Loader2, AlertCircle, RotateCw } from "lucide-react";

function App() {
    const path = window.location.pathname.replace(/\/$/, '');
  const isAdmin = path === "/admin" || path === "/secadmin";
  const { theme } = useTheme();

  if (isAdmin) {
    return (
      <div className={`min-h-screen ${theme.bgGradientClass} text-white`}>
        <Header />
        <AdminPage />
      </div>
    );
  }

  return <GameApp />;
}

function GameApp() {
  const [entities, setEntities] = useState<AnigenreEntity[]>([]);
  const [launchDate, setLaunchDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { theme } = useTheme();

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [entityData, configData] = await Promise.all([
        fetchEntities(),
        fetchConfig(),
      ]);
      setEntities(entityData);
      setLaunchDate(configData?.launch_date ?? new Date().toISOString().slice(0, 10));
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={`min-h-screen ${theme.bgGradientClass} text-white`}>
      <Header />
      {loading ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <Loader2 className={`h-8 w-8 animate-spin ${theme.accentTextClass}`} />
          <p className="mt-3 text-sm text-slate-400">Loading today's puzzle...</p>
        </div>
      ) : error ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm text-slate-400">
            Could not load the game. Check your connection and try again.
          </p>
          <button
            onClick={loadData}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
          >
            <RotateCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : (
        <>
          <GameScreen entities={entities} launchDate={launchDate} />
          <CategoryLegend />
        </>
      )}
    </div>
  );
}

export default App;
