import React from "react";

import { useAuth } from "../contexts/AuthContext";

export default function GravatarImage() {
  const { user } = useAuth();

  if (!user || !user.gravatar) {
    return (
      <figure className="image is-32x32">
        <span className="skeleton__avatar is-rounded" />
      </figure>
    );
  }

  return (
    <figure className="image is-32x32">
      <img
        src={`${user.gravatar.avatar_url}?size=32`}
        className="is-rounded"
        alt="User avatar"
      />
    </figure>
  );
}
