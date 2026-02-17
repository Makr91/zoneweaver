import PropTypes from "prop-types";

const PasswordManagement = ({
  showPasswordChange,
  setShowPasswordChange,
  passwordData,
  setPasswordData,
  handlePasswordChange,
  loading,
  setMsg,
}) => (
  <div className="box">
    <h2 className="title is-5">Password Management</h2>

    {!showPasswordChange ? (
      <div>
        <p className="mb-3">
          Change your account password for enhanced security.
        </p>
        <button
          className="button is-primary"
          onClick={() => setShowPasswordChange(true)}
        >
          Change Password
        </button>
      </div>
    ) : (
      <form onSubmit={handlePasswordChange}>
        <div className="field">
          <label className="label" htmlFor="currentPassword">
            Current Password
          </label>
          <div className="control">
            <input
              id="currentPassword"
              className="input"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="newPassword">
            New Password
          </label>
          <div className="control">
            <input
              id="newPassword"
              className="input"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              required
              minLength="8"
            />
          </div>
          <p className="help">Must be at least 8 characters long</p>
        </div>

        <div className="field">
          <label className="label" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <div className="control">
            <input
              id="confirmPassword"
              className="input"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              required
            />
          </div>
        </div>

        <div className="field is-grouped">
          <div className="control">
            <button
              type="submit"
              className={`button is-primary ${loading ? "is-loading" : ""}`}
              disabled={loading}
            >
              Update Password
            </button>
          </div>
          <div className="control">
            <button
              type="button"
              className="button"
              onClick={() => {
                setShowPasswordChange(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setMsg("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    )}
  </div>
);

PasswordManagement.propTypes = {
  showPasswordChange: PropTypes.bool.isRequired,
  setShowPasswordChange: PropTypes.func.isRequired,
  passwordData: PropTypes.object.isRequired,
  setPasswordData: PropTypes.func.isRequired,
  handlePasswordChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  setMsg: PropTypes.func.isRequired,
};

export default PasswordManagement;
