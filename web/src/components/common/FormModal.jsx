import PropTypes from "prop-types";
import { useEffect } from "react";

/**
 * FormModal - Reusable modal for forms and interactive content
 * Perfect for create/edit forms, user management, configuration wizards, etc.
 */
const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  icon = null,
  className = "",
  children,
  submitText = "Submit",
  submitVariant = "is-primary",
  submitIcon = null,
  loading = false,
  disabled = false,
  showCancelButton = false,
  cancelText = "Cancel",
  additionalActions = null,
  "aria-label": ariaLabel,
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
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, loading]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading && !disabled && onSubmit) {
      onSubmit(e);
    }
  };

  // Handle background click (only close if not loading)
  const handleBackgroundClick = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="modal is-active">
      {/* Background - clicking closes modal (unless loading) */}
      <div
        className="modal-background"
        onClick={handleBackgroundClick}
        aria-label="Close modal"
      />

      {/* Modal content */}
      <div className={`modal-card ${className}`}>
        {/* Header with title and close button */}
        <header className="modal-card-head">
          <p className="modal-card-title" id="modal-title">
            {icon && (
              <span className="icon-text">
                <span className="icon">
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

        {/* Body with form content */}
        <form onSubmit={handleSubmit}>
          <section
            className="modal-card-body"
            role="document"
            aria-labelledby="modal-title"
            aria-label={ariaLabel || title}
          >
            {children}
          </section>

          {/* Footer with action buttons */}
          <footer className="modal-card-foot">
            {/* Main submit button */}
            <button
              type="submit"
              className={`button ${submitVariant} ${loading ? "is-loading" : ""}`}
              disabled={loading || disabled}
            >
              {submitIcon && !loading && (
                <span className="icon is-small">
                  <i className={submitIcon} />
                </span>
              )}
              <span>{submitText}</span>
            </button>

            {/* Optional cancel button */}
            {showCancelButton && (
              <button
                type="button"
                className="button"
                onClick={onClose}
                disabled={loading}
              >
                {cancelText}
              </button>
            )}

            {/* Additional custom action buttons */}
            {additionalActions && (
              <div className="buttons">{additionalActions}</div>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
};

FormModal.propTypes = {
  /** Whether the modal is open/visible */
  isOpen: PropTypes.bool.isRequired,
  /** Function called when modal should close */
  onClose: PropTypes.func.isRequired,
  /** Function called when form is submitted */
  onSubmit: PropTypes.func,
  /** Modal title displayed in header */
  title: PropTypes.string.isRequired,
  /** Optional FontAwesome icon class for header */
  icon: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Modal form content */
  children: PropTypes.node.isRequired,
  /** Text for submit button */
  submitText: PropTypes.string,
  /** Bulma variant class for submit button (is-primary, is-success, etc.) */
  submitVariant: PropTypes.string,
  /** Optional FontAwesome icon class for submit button */
  submitIcon: PropTypes.string,
  /** Whether form is in loading state */
  loading: PropTypes.bool,
  /** Whether submit button is disabled */
  disabled: PropTypes.bool,
  /** Whether to show a cancel button */
  showCancelButton: PropTypes.bool,
  /** Text for cancel button */
  cancelText: PropTypes.string,
  /** Additional action buttons to render in footer */
  additionalActions: PropTypes.node,
  /** Accessibility label for screen readers */
  "aria-label": PropTypes.string,
};

export default FormModal;
