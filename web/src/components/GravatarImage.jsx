import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function GravatarImage() {
    const { user } = useAuth();

    if (!user || !user.gravatar) {
        return <span className="skeleton__avatar is-32x32 is-rounded" />;
    }
 
    return (
        <img src={ user.gravatar.avatar_url + '?size=64' } className="is-32x32" style={{ borderRadius: '50%' }} />
    )
}
