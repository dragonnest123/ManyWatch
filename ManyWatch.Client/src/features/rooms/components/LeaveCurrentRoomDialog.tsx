import { type ReactNode, useEffect } from 'react';

type Props = {
  description: ReactNode;
  confirmLabel: string;
  submittingLabel?: string;
  isSubmitting: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function LeaveCurrentRoomDialog({
  description,
  confirmLabel,
  submittingLabel,
  isSubmitting,
  error,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onCancel]);

  return (
    <div
      className="dialog-backdrop"
      onClick={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-current-room-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="leave-current-room-title">Leave current room?</h2>

        <p>{description}</p>

        {error && <p className="error">{error}</p>}

        <div className="dialog-actions">
          <button className="secondary" type="button" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </button>

          <button type="button" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? (submittingLabel ?? 'Switching...') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}