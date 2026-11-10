export default function ConfirmationDialog({ action, onConfirm, onCancel }) {
  return (
    <div className="confirmation-dialog__backdrop" role="presentation">
      <div
        className="confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
      >
        <h3 id="confirmation-dialog-title">Confirmar acción</h3>
        <p>¿Deseas {action.toLowerCase()} este objeto?</p>
        <div className="confirmation-dialog__actions">
          <button type="button" onClick={onCancel}>
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="confirmation-dialog__confirm-button"
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  );
}
