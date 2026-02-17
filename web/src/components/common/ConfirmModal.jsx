import PropTypes from "prop-types";
import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * ConfirmModal - Reusable confirmation dialog
 * Replaces window.confirm() with a styled, accessible modal dialog
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  confirmVariant = "is-danger",
  cancelText = "Cancel",
  icon = "fas fa-exclamation-triangle",
  loading = false,
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleBackgroundClick = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleBackgroundKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleBackgroundClick();
    }
  };

  return createPortal(
    <div className="modal is-active">
      <div
        className="modal-background"
        onClick={handleBackgroundClick}
        onKeyDown={handleBackgroundKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      <div className="modal-card" style={{ maxWidth: "500px" }}>
        <header className="modal-card-head">
          <p className="modal-card-title">
            {icon && (
              <span className="icon-text">
                <span className="icon has-text-warning">
                  <i className={icon} />
                </span>
                <span>{title}</span>
              </span>
            )}
            {!icon && title}
          </p>
          <button
            className="delete"
            aria-label="close"
            onClick={onClose}
            disabled={loading}
            type="button"
          />
        </header>

        <section className="modal-card-body">
          <div className="content">
            <p>{message}</p>
          </div>
        </section>

        <footer className="modal-card-foot">
          <button
            type="button"
            className={`button ${confirmVariant} ${loading ? "is-loading" : ""}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="button"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  confirmVariant: PropTypes.string,
  cancelText: PropTypes.string,
  icon: PropTypes.string,
  loading: PropTypes.bool,
};

export default ConfirmModal;
