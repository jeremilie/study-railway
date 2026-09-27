import { useStudyStore } from "../store/useStudyStore";
import { dailyStats } from "../lib/model";
import { useNow } from "../lib/hooks";
import { Icon } from "./Icon";
export function DailyProgress({
  onJournal,
  linkLabel = "View your journey journal",
}: {
  onJournal: () => void;
  linkLabel?: string;
}) {
  const data = useStudyStore((s) => s.data);
  const now = useNow();
  const stats = dailyStats(data, now);
  return (
    <section className="daily-panel panel" aria-labelledby="daily-heading">
      <div className="card-heading">
        <h2 id="daily-heading">
          <Icon name="sun" size={18} />
          Today’s little wins
        </h2>
        <span className="today-badge">TODAY</span>
      </div>
      <div className="daily-stats">
        <div>
          <span className="stat-icon">
            <Icon name="clock" size={18} />
          </span>
          <strong>
            {stats.minutes}
            <small>min</small>
          </strong>
          <span>Time well spent</span>
        </div>
        <div>
          <span className="stat-icon">
            <Icon name="flag" size={18} />
          </span>
          <strong>{stats.sessions}</strong>
          <span>Focus sessions</span>
        </div>
        <div>
          <span className="stat-icon">
            <Icon name="book" size={18} />
          </span>
          <strong>{stats.subjects}</strong>
          <span>Subjects explored</span>
        </div>
      </div>
      <div className="daily-note">
        <Icon name="sprout" size={19} />
        <p>
          {stats.sessions
            ? "Look at you, making room to grow."
            : "A fresh page. A world of possibility."}
        </p>
      </div>
      <button className="journal-link text-button" onClick={onJournal}>
        {linkLabel}
        <Icon name="arrow" size={16} />
      </button>
    </section>
  );
}
