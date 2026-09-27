import { useState } from "react";
import { useStudyStore } from "../store/useStudyStore";
import { Icon, biomeIcon } from "./Icon";
import { SubjectEditor } from "./PlanEditors";
import type { Subject } from "../types/study";
export type Page = "railway" | "planner" | "journal";
export function Sidebar({ page, setPage }: {
  page: Page;
  setPage: (page: Page) => void;
}) {
  const data = useStudyStore((s) => s.data);
  const select = useStudyStore((s) => s.selectSubject);
  const [editing, setEditing] = useState<Subject | "new" | null>(null);
  return (
    <aside className="sidebar">
      <a
        href="#main"
        className="brand"
        aria-label="Study Railway, go to content"
      >
        <span className="brand-icon">
          <Icon name="train" size={28} />
        </span>
        <span>
          study railway
          <span className="brand-tagline">SMALL STEPS. NEW PLACES.</span>
        </span>
      </a>
      <div className="sidebar-content">
        <div className="workspace-label">YOUR LITTLE WORLD</div>
        <nav className="main-nav" aria-label="Main navigation">
          {(
            [
              { id: "railway", icon: "route", name: "My railway" },
              { id: "planner", icon: "book", name: "Study planner" },
              { id: "journal", icon: "chart", name: "Journey journal" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => setPage(item.id)}
            >
              <Icon name={item.icon} size={19} />
              {item.name}
              {page === item.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="line-heading">
          <span className="workspace-label">MY SUBJECT LINES</span>
          <button
            className="icon-button small"
            disabled={!!data.timer}
            aria-label="Add subject"
            data-focus-fallback
            onClick={() => setEditing("new")}
          >
            <Icon name="plus" size={17} />
          </button>
        </div>
        <nav className="subject-nav" aria-label="Subject lines">
          {data.subjects.map((subject) => (
            <div
              key={subject.id}
              className={`subject-row ${data.selectedSubject === subject.id ? "active" : ""}`}
              style={{ "--line-color": subject.color } as React.CSSProperties}
            >
              <button
                className="subject-select"
                disabled={!!data.timer}
                onClick={() => {
                  select(subject.id);
                  setPage("railway");
                }}
                aria-pressed={data.selectedSubject === subject.id}
              >
                <span className="line-dot" />
                <span>{subject.name}</span>
                <Icon name={biomeIcon[subject.biome]} size={17} />
              </button>
              <button
                className="subject-edit icon-button small"
                disabled={!!data.timer}
                aria-label={`Edit ${subject.name}`}
                onClick={() => setEditing(subject)}
              >
                <Icon name="edit" size={13} />
              </button>
            </div>
          ))}
        </nav>
        <button
          className="add-line text-button"
          disabled={!!data.timer}
          onClick={() => setEditing("new")}
        >
          <Icon name="plus" size={16} />
          Create a new line
        </button>
        <div className="sidebar-note">
          <div className="note-landscape">
            <Icon name="mountain" size={60} />
            <Icon name="sprout" size={26} />
          </div>
          <p>
            Great things grow
            <br />
            one small step at a time.
          </p>
          <span>Enjoy the journey.</span>
        </div>
      </div>
      <div className="sidebar-footer">
        <span className="local-dot" />
        <div>
          Your own peaceful space<small>Private. Local. Just for you.</small>
        </div>
        <Icon name="leaf" size={18} />
      </div>
      {editing && (
        <SubjectEditor
          subject={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </aside>
  );
}
