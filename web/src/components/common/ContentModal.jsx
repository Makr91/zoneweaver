import PropTypes from "prop-types";
import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * ContentModal - Reusable modal for displaying read-only content
 * Perfect for charts, device details, service information, etc.
 */
const ContentModal = ({
  isOpen,
  onClose,
  title,
  icon = null,
  className = "",
  children,
  "aria-label": ariaLabel,
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
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
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal is-active">
      {/* Background - clicking closes modal */}
      <div
        className="modal-background"
        onClick={onClose}
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
            type="button"
          />
        </header>

        {/* Body with flexible content */}
        <section
          className="modal-card-body"
          role="document"
          aria-labelledby="modal-title"
          aria-label={ariaLabel || title}
        >
          {children}
        </section>
      </div>
    </div>,
    document.body
  );
};

ContentModal.propTypes = {
  /** Whether the modal is open/visible */
  isOpen: PropTypes.bool.isRequired,
  /** Function called when modal should close */
  onClose: PropTypes.func.isRequired,
  /** Modal title displayed in header */
  title: PropTypes.string.isRequired,
  /** Optional FontAwesome icon class for header */
  icon: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Modal content */
  children: PropTypes.node.isRequired,
  /** Accessibility label for screen readers */
  "aria-label": PropTypes.string,
};

export default ContentModal;
