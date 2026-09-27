import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useStudyStore } from "../store/useStudyStore";
import { Sidebar, type Page } from "../components/Sidebar";
import { MapPanel } from "../components/MapPanel";
import { TimerPanel } from "../components/TimerPanel";
import { StationList } from "../components/StationList";
import { DailyProgress } from "../components/DailyProgress";
import { SessionHistory } from "../components/SessionHistory";
import { Icon } from "../components/Icon";
import { useMedia } from "../lib/hooks";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import "../styles/layout-modes.css";

export function App() {
  const [page, setPage] = useState<Page>("railway");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ownership, setOwnership] = useState<
    "waiting" | "owner" | "blocked" | "error"
  >("waiting");
  const { loaded, hydrate, tick, error, retrySave, saveStatus, notice, data } =
    useStudyStore();
  const content = useRef<HTMLElement>(null);
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  useEffect(() => {
    let release: (() => void) | undefined;
    let unmounted = false;
    async function initialize() {
      if (!navigator.locks) {
        setOwnership("owner");
        await hydrate();
        return;
      }
      await navigator.locks.request(
        "study-railway-writer",
        { ifAvailable: true },
        async (lock) => {
          if (unmounted) return;
          if (!lock) {
            setOwnership("blocked");
            return;
          }
          setOwnership("owner");
          await hydrate();
          if (!unmounted)
            await new Promise<void>((resolve) => {
              release = resolve;
            });
        },
      );
    }
    void initialize().catch(() => {
      if (!unmounted) setOwnership("error");
    });
    return () => {
      unmounted = true;
      release?.();
    };
  }, [hydrate]);
  useEffect(() => {
    if (!loaded || ownership !== "owner") return;
    const id = window.setInterval(tick, 500);
    const visible = () => tick();
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [loaded, ownership, tick]);
  useEffect(() => {
    if (reduced || !loaded) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        ".page-intro, .journey-grid, .lower-grid, .planner-layout, .journal-layout",
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.07,
          ease: "power2.out",
          clearProps: "all",
        },
      );
    }, content);
    return () => context.revert();
  }, [page, reduced, loaded]);
  if (ownership === "error")
    return (
      <div className="startup">
        <Icon name="train" size={42} />
        <h1>We couldn’t open your journey safely.</h1>
        <p>
          Your browser couldn’t reserve this study space. Reload to try again.
        </p>
        <button className="primary" onClick={() => location.reload()}>
          Try opening again
        </button>
      </div>
    );
  if (ownership === "blocked")
    return (
      <div className="startup">
        <Icon name="train" size={42} />
        <h1>Your journey is open in another tab.</h1>
        <p>Keep studying there, or close that tab and return here.</p>
        <button className="primary" onClick={() => location.reload()}>
          Continue in this tab
          <Icon name="right" size={16} />
        </button>
      </div>
    );
  if (!loaded)
    return (
      <div className="startup">
        <Icon name="train" size={42} />
        <h1>
          {error ? "Let’s get you back on track." : "A little journey awaits."}
        </h1>
        <p>{error || "Opening your peaceful study space…"}</p>
        {error && (
          <button className="primary" onClick={retrySave}>
            Try again
          </button>
        )}
      </div>
    );
  const date = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <div
      className={`app-layout${sidebarCollapsed ? " sidebar-collapsed" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to study controls
      </a>
      <div className="sidebar-shell">
        <Sidebar page={page} setPage={setPage} collapsed={sidebarCollapsed} />
      </div>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              type="button"
              className="icon-button sidebar-toggle"
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              aria-expanded={!sidebarCollapsed}
              aria-controls="study-sidebar"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={19} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={19} aria-hidden="true" />
              )}
            </button>
            <div className="breadcrumb">
              <Icon name="leaf" size={16} />
              <span>Your space to grow</span>
              <span>/</span>
              <strong>
                {page === "railway"
                  ? "My railway"
                  : page === "planner"
                    ? "Study planner"
                    : "Journey journal"}
              </strong>
            </div>
          </div>
          <div className="topbar-right">
            <span className="save-indicator">
              <span
                className={saveStatus === "error" ? "error-dot" : "local-dot"}
              />
              {saveStatus === "saving"
                ? "Saving…"
                : saveStatus === "error"
                  ? "Not saved"
                  : "Saved on this device"}
            </span>
            <span className="header-date">
              <Icon name="sun" size={17} />
              {date}
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1} ref={content}>
          <div className="page-intro">
            <div>
              <div className="intro-eyebrow">
                <span />A LITTLE FURTHER, EVERY DAY
              </div>
              <h1>
                {page === "railway"
                  ? "Good things take a little focus."
                  : page === "planner"
                    ? "Make space for what matters."
                    : "Every small step counts."}
              </h1>
              <p>
                {page === "railway"
                  ? "Pick a destination, find your rhythm, and enjoy the journey."
                  : page === "planner"
                    ? "Turn big ideas into small, meaningful destinations."
                    : "A collection of quiet effort, curiosity, and moments well spent."}
              </p>
            </div>
            <div className="intro-stamp" aria-hidden="true">
              <Icon name="sprout" size={29} />
              <span>
                GROW AT
                <br />
                YOUR OWN PACE
              </span>
            </div>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button onClick={retrySave}>Retry saving</button>
            </div>
          )}
          {data.timer && (
            <div className="journey-status">
              <span className="local-dot" />
              {data.timer.kind === "focus"
                ? "Your focus journey is underway."
                : "A quiet rest by the lake."}{" "}
              {data.timer.status === "paused"
                ? "Paused — take your time."
                : "There’s no need to rush."}
              <span>Finish or cancel to edit your route.</span>
            </div>
          )}
          {page === "railway" ? (
            <>
              <div className="journey-grid">
                <MapPanel />
                <TimerPanel />
              </div>
              <div className="lower-grid">
                <StationList />
                <DailyProgress onJournal={() => setPage("journal")} />
              </div>
            </>
          ) : page === "planner" ? (
            <div className="planner-layout">
              <StationList expanded />
              <TimerPanel />
            </div>
          ) : (
            <div className="journal-layout">
              <SessionHistory />
              <div>
                <DailyProgress
                  onJournal={() => setPage("railway")}
                  linkLabel="Back to your railway"
                />
                <TimerPanel />
              </div>
            </div>
          )}
          <footer className="page-footer">
            <span>
              <Icon name="leaf" size={14} />
              No rush. You’re right where you need to be.
            </span>
            <span>Made for a more mindful kind of progress.</span>
          </footer>
        </main>
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {notice}
        </div>
      </div>
    </div>
  );
}
