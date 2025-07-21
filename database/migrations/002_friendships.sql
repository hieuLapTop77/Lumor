-- Migration 002: Friendships System
-- Created: 2024
-- Description: Create friendship and notification systems

-- ===============================
-- FRIENDSHIPS TABLE
-- ===============================
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Create indexes for friendships
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_created_at ON friendships(created_at);

-- ===============================
-- NOTIFICATIONS TABLE
-- ===============================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'friend_request', 'photo_shared', 'comment', 'like', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- ===============================
-- TRIGGERS
-- ===============================

-- Create trigger for friendships updated_at
CREATE TRIGGER update_friendships_updated_at 
    BEFORE UPDATE ON friendships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- VIEWS
-- ===============================

-- View for user friends (both directions)
CREATE VIEW user_friends AS
SELECT 
    f.requester_id as user_id,
    f.addressee_id as friend_id,
    u.username as friend_username,
    u.display_name as friend_display_name,
    u.avatar_url as friend_avatar_url,
    f.created_at as friendship_date
FROM friendships f
JOIN users u ON u.id = f.addressee_id
WHERE f.status = 'accepted'
UNION
SELECT 
    f.addressee_id as user_id,
    f.requester_id as friend_id,
    u.username as friend_username,
    u.display_name as friend_display_name,
    u.avatar_url as friend_avatar_url,
    f.created_at as friendship_date
FROM friendships f
JOIN users u ON u.id = f.requester_id
WHERE f.status = 'accepted';

-- ===============================
-- COMMENTS
-- ===============================
COMMENT ON TABLE friendships IS 'Friend relationships between users';
COMMENT ON TABLE notifications IS 'User notifications';

-- Migration 002 Complete 