import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected && !previous.closest("dialog"))
        previous.focus();
      else {
        const fallback = Array.from(
          document.querySelectorAll<HTMLElement>(
            "[data-focus-fallback]:not(:disabled)",
          ),
        ).find((element) => element.getClientRects().length > 0);
        (fallback ?? document.getElementById("main"))?.focus();
      }
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <div>
          <span className="eyebrow">MAKE ROOM TO GROW</span>
          <h2 id="modal-title">{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
