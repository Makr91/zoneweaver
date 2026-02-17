import PropTypes from "prop-types";

const ProfileInfo = ({ user }) => (
  <div className="box">
    <h2 className="title is-5">Profile Information</h2>
    <div className="content">
      {user?.gravatar?.avatar_url && (
        <div className="field has-text-centered mb-4">
          <figure className="image is-128x128 is-inline-block">
            <img
              src={user.gravatar.avatar_url}
              alt="Profile Avatar"
              className="is-rounded"
            />
          </figure>
        </div>
      )}

      {user?.gravatar?.display_name && (
        <div className="field">
          <label className="label" htmlFor="display_name">
            Display Name
          </label>
          <div className="control">
            <input
              id="display_name"
              className="input"
              type="text"
              value={user.gravatar.display_name}
              disabled
            />
          </div>
        </div>
      )}

      {user?.gravatar?.first_name && (
        <div className="field">
          <label className="label" htmlFor="first_name">
            First Name
          </label>
          <div className="control">
            <input
              id="first_name"
              className="input"
              type="text"
              value={user.gravatar.first_name}
              disabled
            />
          </div>
        </div>
      )}

      {user?.gravatar?.last_name && (
        <div className="field">
          <label className="label" htmlFor="last_name">
            Last Name
          </label>
          <div className="control">
            <input
              id="last_name"
              className="input"
              type="text"
              value={user.gravatar.last_name}
              disabled
            />
          </div>
        </div>
      )}

      {user?.gravatar?.job_title && (
        <div className="field">
          <label className="label" htmlFor="job_title">
            Job Title
          </label>
          <div className="control">
            <input
              id="job_title"
              className="input"
              type="text"
              value={user.gravatar.job_title}
              disabled
            />
          </div>
        </div>
      )}

      {user?.gravatar?.location && (
        <div className="field">
          <label className="label" htmlFor="location">
            Location
          </label>
          <div className="control">
            <input
              id="location"
              className="input"
              type="text"
              value={user.gravatar.location}
              disabled
            />
          </div>
        </div>
      )}

      {user?.gravatar?.timezone && (
        <div className="field">
          <label className="label" htmlFor="timezone">
            Timezone
          </label>
          <div className="control">
            <input
              id="timezone"
              className="input"
              type="text"
              value={user.gravatar.timezone}
              disabled
            />
          </div>
        </div>
      )}

      {(!user?.gravatar || Object.keys(user.gravatar).length === 0) && (
        <div className="notification is-info">
          <p>No Gravatar profile found for this email address.</p>
          <p className="is-size-7 mt-2">
            <a
              href="https://gravatar.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Create a Gravatar profile
            </a>{" "}
            to display your profile information here.
          </p>
        </div>
      )}
    </div>
  </div>
);

ProfileInfo.propTypes = {
  user: PropTypes.shape({
    gravatar: PropTypes.shape({
      avatar_url: PropTypes.string,
      display_name: PropTypes.string,
      first_name: PropTypes.string,
      last_name: PropTypes.string,
      job_title: PropTypes.string,
      location: PropTypes.string,
      timezone: PropTypes.string,
    }),
  }),
};

export default ProfileInfo;
