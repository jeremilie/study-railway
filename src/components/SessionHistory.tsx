import { useStudyStore } from "../store/useStudyStore";
import { Icon } from "./Icon";
export function SessionHistory() {
  const sessions = useStudyStore((s) => s.data.sessions);
  return (
    <section className="history-panel panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LOOK HOW FAR YOU’VE COME</span>
          <h2>Your journey journal</h2>
        </div>
        <span className="count-pill">{sessions.length} sessions</span>
      </div>
      {sessions.length ? (
        <ol className="history-list">
          {[...sessions]
            .sort((a, b) => b.endedAt - a.endedAt)
            .map((session) => (
              <li key={session.id}>
                <span className="history-icon" style={{ color: session.color }}>
                  <Icon name="train" size={23} />
                </span>
                <div>
                  <strong>{session.stationTitle}</strong>
                  <span>
                    {session.subjectName} ·{" "}
                    {new Date(session.endedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(session.endedAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="session-duration">
                  {session.seconds < 60
                    ? `${session.seconds} sec`
                    : `${Math.round(session.seconds / 60)} min`}
                  <Icon name="check" size={16} />
                </span>
              </li>
            ))}
        </ol>
      ) : (
        <div className="empty-state journal-empty">
          <span className="empty-illustration">
            <Icon name="book" size={43} />
            <Icon name="sprout" size={30} />
          </span>
          <h3>A beautiful journey starts small.</h3>
          <p>
            Your completed focus sessions will find a home here.
            <br />
            Pick a station, settle in, and take your first step.
          </p>
        </div>
      )}
    </section>
  );
}
