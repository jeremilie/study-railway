import { useState } from "react";
import type { Biome, Station, Subject } from "../types/study";
import { useStudyStore } from "../store/useStudyStore";
import { Modal } from "./Modal";
import { Icon, biomeIcon } from "./Icon";
const colors = [
  "#54866a",
  "#b28c53",
  "#8b81a9",
  "#578f9d",
  "#ad6f62",
  "#648399",
];
export function SubjectEditor({
  subject,
  onClose,
}: {
  subject?: Subject;
  onClose: () => void;
}) {
  const [name, setName] = useState(subject?.name ?? "");
  const [color, setColor] = useState(subject?.color ?? colors[0]);
  const [biome, setBiome] = useState<Biome>(subject?.biome ?? "forest");
  const [confirm, setConfirm] = useState(false);
  const update = useStudyStore((s) => s.saveSubject);
  const remove = useStudyStore((s) => s.deleteSubject);
  return (
    <Modal
      title={subject ? "Edit your railway line" : "A new line of discovery"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          update({
            id: subject?.id ?? crypto.randomUUID(),
            name: name.trim(),
            color,
            biome,
          });
          onClose();
        }}
      >
        <label className="field">
          Subject name
          <input
            autoFocus
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Where will your curiosity take you?"
          />
        </label>
        <fieldset>
          <legend>Line color</legend>
          <div className="color-options">
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                style={{ background: c }}
                className={color === c ? "chosen" : ""}
                aria-label={`Choose ${c} color`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
              >
                {color === c && <Icon name="check" size={18} />}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Your scenery</legend>
          <div className="biome-options">
            {(
              ["forest", "mountains", "village", "coast", "tundra"] as Biome[]
            ).map((b) => (
              <button
                type="button"
                key={b}
                className={biome === b ? "selected" : ""}
                aria-pressed={biome === b}
                onClick={() => setBiome(b)}
              >
                <Icon name={biomeIcon[b]} />
                {b}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="modal-actions">
          {subject && (
            <button
              type="button"
              className="text-button danger"
              onClick={() => setConfirm(true)}
            >
              <Icon name="delete" size={16} />
              Delete line
            </button>
          )}
          <button className="primary" type="submit">
            {subject ? "Save changes" : "Create railway line"}
            <Icon name="right" size={17} />
          </button>
        </div>
        {confirm && (
          <div className="confirm-box" role="alert">
            <p>
              Delete {subject?.name} and all its stations? Your session history
              will stay.
            </p>
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                remove(subject!.id);
                onClose();
              }}
            >
              Yes, delete line
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setConfirm(false)}
            >
              Keep it
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
export function StationEditor({
  station,
  subjectId,
  onClose,
}: {
  station?: Station;
  subjectId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(station?.title ?? "");
  const [description, setDescription] = useState(station?.description ?? "");
  const [target, setTarget] = useState(station?.target ?? 4);
  const [confirm, setConfirm] = useState(false);
  const save = useStudyStore((s) => s.saveStation);
  const remove = useStudyStore((s) => s.deleteStation);
  return (
    <Modal
      title={station ? "Edit this little destination" : "Your next destination"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          save({
            id: station?.id ?? crypto.randomUUID(),
            subjectId,
            title: title.trim(),
            description: description.trim(),
            target,
            completed: station?.completed ?? 0,
            manualComplete: station?.manualComplete ?? false,
          });
          onClose();
        }}
      >
        <label className="field">
          Station title
          <input
            autoFocus
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Understand cell division"
          />
        </label>
        <label className="field">
          A note for the journey <span>(optional)</span>
          <textarea
            maxLength={500}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What would you like to learn?"
          />
        </label>
        <label className="field">
          Planned focus sessions
          <input
            required
            type="number"
            min="1"
            max="100"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </label>
        <p className="field-hint">
          One session, one small step. You can change this anytime.
        </p>
        <div className="modal-actions">
          {station && (
            <button
              type="button"
              className="text-button danger"
              onClick={() => setConfirm(true)}
            >
              <Icon name="delete" size={16} />
              Delete station
            </button>
          )}
          <button type="submit" className="primary">
            {station ? "Save changes" : "Add station"}
            <Icon name="right" size={17} />
          </button>
        </div>
        {confirm && (
          <div className="confirm-box" role="alert">
            <p>Delete this station? Completed sessions stay in your journal.</p>
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                remove(station!.id);
                onClose();
              }}
            >
              Yes, delete station
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setConfirm(false)}
            >
              Keep it
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
