import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function GravatarImage() {
    const { user } = useAuth();

    if (!user || !user.gravatar) {
        return <span className="skeleton__avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />;
    }
 
    return (
        <img src={ user.gravatar.avatar_url + '?size=64' } style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
    )
}
