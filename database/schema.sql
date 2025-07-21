-- Photo Sharing Backend - Complete Database Schema
-- Created: 2024
-- Description: Complete schema for photo sharing app with friends, sharing, sync, and permissions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- USERS TABLE
-- ===============================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE
);

-- Create indexes for users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_active ON users(is_active);

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
-- PHOTOS TABLE
-- ===============================
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    hash_md5 VARCHAR(32),
    description TEXT,
    location VARCHAR(255),
    taken_at TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tags TEXT[], -- Array of tags
    exif_data JSONB, -- EXIF metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for photos
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at);
CREATE INDEX idx_photos_is_public ON photos(is_public);
CREATE INDEX idx_photos_is_deleted ON photos(is_deleted);
CREATE INDEX idx_photos_hash_md5 ON photos(hash_md5);
CREATE INDEX idx_photos_tags ON photos USING GIN(tags);
CREATE INDEX idx_photos_exif_data ON photos USING GIN(exif_data);

-- ===============================
-- ALBUMS TABLE
-- ===============================
CREATE TABLE albums (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for albums
CREATE INDEX idx_albums_user_id ON albums(user_id);
CREATE INDEX idx_albums_created_at ON albums(created_at);
CREATE INDEX idx_albums_is_public ON albums(is_public);
CREATE INDEX idx_albums_is_deleted ON albums(is_deleted);

-- ===============================
-- ALBUM_PHOTOS TABLE (Many-to-Many)
-- ===============================
CREATE TABLE album_photos (
    id SERIAL PRIMARY KEY,
    album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    position INTEGER DEFAULT 0,
    UNIQUE(album_id, photo_id)
);

-- Create indexes for album_photos
CREATE INDEX idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX idx_album_photos_photo_id ON album_photos(photo_id);
CREATE INDEX idx_album_photos_position ON album_photos(position);

-- ===============================
-- PHOTO_SHARES TABLE
-- ===============================
CREATE TABLE photo_shares (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
    shared_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL for public shares
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'download', 'edit')),
    expires_at TIMESTAMP WITH TIME ZONE,
    access_token UUID DEFAULT uuid_generate_v4(),
    access_count INTEGER DEFAULT 0,
    max_access_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    message TEXT,
    require_auth BOOLEAN DEFAULT true,
    share_type VARCHAR(20) DEFAULT 'individual_photo' CHECK (share_type IN ('all_photos', 'album', 'individual_photo')),
    album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
    CONSTRAINT chk_photo_shares_resource_consistency 
    CHECK (
      (share_type = 'individual_photo' AND photo_id IS NOT NULL AND album_id IS NULL) OR
      (share_type = 'album' AND album_id IS NOT NULL AND photo_id IS NULL) OR
      (share_type = 'all_photos' AND photo_id IS NULL AND album_id IS NULL)
    )
);

-- Create indexes for photo_shares
CREATE INDEX idx_photo_shares_photo_id ON photo_shares(photo_id);
CREATE INDEX idx_photo_shares_shared_by ON photo_shares(shared_by);
CREATE INDEX idx_photo_shares_shared_with ON photo_shares(shared_with);
CREATE INDEX idx_photo_shares_access_token ON photo_shares(access_token);
CREATE INDEX idx_photo_shares_expires_at ON photo_shares(expires_at);
CREATE INDEX idx_photo_shares_is_active ON photo_shares(is_active);

-- ===============================
-- ALBUM_SHARES TABLE
-- ===============================
CREATE TABLE album_shares (
    id SERIAL PRIMARY KEY,
    album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    shared_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL for public shares
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'download', 'contribute')),
    expires_at TIMESTAMP WITH TIME ZONE,
    access_token UUID DEFAULT uuid_generate_v4(),
    access_count INTEGER DEFAULT 0,
    max_access_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    message TEXT,
    require_auth BOOLEAN DEFAULT true
);

-- Create indexes for album_shares
CREATE INDEX idx_album_shares_album_id ON album_shares(album_id);
CREATE INDEX idx_album_shares_shared_by ON album_shares(shared_by);
CREATE INDEX idx_album_shares_shared_with ON album_shares(shared_with);
CREATE INDEX idx_album_shares_access_token ON album_shares(access_token);
CREATE INDEX idx_album_shares_expires_at ON album_shares(expires_at);
CREATE INDEX idx_album_shares_is_active ON album_shares(is_active);

-- ===============================
-- PERMISSION_GROUPS TABLE
-- ===============================
CREATE TABLE permission_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_photo_permission VARCHAR(20) DEFAULT 'view' CHECK (default_photo_permission IN ('none', 'view', 'download', 'edit')),
    default_album_permission VARCHAR(20) DEFAULT 'view' CHECK (default_album_permission IN ('none', 'view', 'download', 'contribute')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    UNIQUE(user_id, name)
);

-- Create indexes for permission_groups
CREATE INDEX idx_permission_groups_user_id ON permission_groups(user_id);
CREATE INDEX idx_permission_groups_name ON permission_groups(name);
CREATE INDEX idx_permission_groups_is_deleted ON permission_groups(is_deleted);

-- ===============================
-- PERMISSION_GROUP_MEMBERS TABLE
-- ===============================
CREATE TABLE permission_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

-- Create indexes for permission_group_members
CREATE INDEX idx_permission_group_members_group_id ON permission_group_members(group_id);
CREATE INDEX idx_permission_group_members_user_id ON permission_group_members(user_id);
CREATE INDEX idx_permission_group_members_added_by ON permission_group_members(added_by);

-- ===============================
-- DEVICE_SYNC TABLE
-- ===============================
CREATE TABLE device_sync (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'web'
    platform VARCHAR(50), -- 'ios', 'android', 'windows', 'macos', 'linux'
    app_version VARCHAR(50),
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_enabled BOOLEAN DEFAULT true,
    auto_backup BOOLEAN DEFAULT false,
    wifi_only BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, device_id)
);

-- Create indexes for device_sync
CREATE INDEX idx_device_sync_user_id ON device_sync(user_id);
CREATE INDEX idx_device_sync_device_id ON device_sync(device_id);
CREATE INDEX idx_device_sync_last_sync ON device_sync(last_sync);
CREATE INDEX idx_device_sync_is_active ON device_sync(is_active);

-- ===============================
-- SYNC_SESSIONS TABLE
-- ===============================
CREATE TABLE sync_sessions (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES device_sync(id) ON DELETE CASCADE,
    session_token UUID DEFAULT uuid_generate_v4(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
    files_total INTEGER DEFAULT 0,
    files_uploaded INTEGER DEFAULT 0,
    files_failed INTEGER DEFAULT 0,
    bytes_total BIGINT DEFAULT 0,
    bytes_uploaded BIGINT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sync_sessions
CREATE INDEX idx_sync_sessions_device_id ON sync_sessions(device_id);
CREATE INDEX idx_sync_sessions_session_token ON sync_sessions(session_token);
CREATE INDEX idx_sync_sessions_status ON sync_sessions(status);
CREATE INDEX idx_sync_sessions_started_at ON sync_sessions(started_at);

-- ===============================
-- SYNC_FILE_MAPPINGS TABLE
-- ===============================
CREATE TABLE sync_file_mappings (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES device_sync(id) ON DELETE CASCADE,
    local_path VARCHAR(1000) NOT NULL,
    local_filename VARCHAR(500) NOT NULL,
    local_hash VARCHAR(32),
    local_size BIGINT,
    local_modified TIMESTAMP WITH TIME ZONE,
    photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'uploading', 'completed', 'failed', 'skipped')),
    sync_attempts INTEGER DEFAULT 0,
    last_sync_attempt TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, local_path)
);

-- Create indexes for sync_file_mappings
CREATE INDEX idx_sync_file_mappings_device_id ON sync_file_mappings(device_id);
CREATE INDEX idx_sync_file_mappings_local_hash ON sync_file_mappings(local_hash);
CREATE INDEX idx_sync_file_mappings_photo_id ON sync_file_mappings(photo_id);
CREATE INDEX idx_sync_file_mappings_sync_status ON sync_file_mappings(sync_status);
CREATE INDEX idx_sync_file_mappings_created_at ON sync_file_mappings(created_at);

-- ===============================
-- PHOTO_LIKES TABLE
-- ===============================
CREATE TABLE photo_likes (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photo_id, user_id)
);

-- Create indexes for photo_likes
CREATE INDEX idx_photo_likes_photo_id ON photo_likes(photo_id);
CREATE INDEX idx_photo_likes_user_id ON photo_likes(user_id);
CREATE INDEX idx_photo_likes_created_at ON photo_likes(created_at);

-- ===============================
-- PHOTO_COMMENTS TABLE
-- ===============================
CREATE TABLE photo_comments (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES photo_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for photo_comments
CREATE INDEX idx_photo_comments_photo_id ON photo_comments(photo_id);
CREATE INDEX idx_photo_comments_user_id ON photo_comments(user_id);
CREATE INDEX idx_photo_comments_parent_comment_id ON photo_comments(parent_comment_id);
CREATE INDEX idx_photo_comments_created_at ON photo_comments(created_at);
CREATE INDEX idx_photo_comments_is_deleted ON photo_comments(is_deleted);

-- ===============================
-- ACTIVITY_LOGS TABLE
-- ===============================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- 'photo', 'album', 'user', 'friend', etc.
    resource_id INTEGER,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activity_logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_metadata ON activity_logs USING GIN(metadata);

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
-- FUNCTIONS AND TRIGGERS
-- ===============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permission_groups_updated_at BEFORE UPDATE ON permission_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_file_mappings_updated_at BEFORE UPDATE ON sync_file_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photo_comments_updated_at BEFORE UPDATE ON photo_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update photo counts
CREATE OR REPLACE FUNCTION update_photo_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'photo_likes' THEN
            UPDATE photos SET like_count = like_count + 1 WHERE id = NEW.photo_id;
        ELSIF TG_TABLE_NAME = 'photo_comments' THEN
            UPDATE photos SET comment_count = comment_count + 1 WHERE id = NEW.photo_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'photo_likes' THEN
            UPDATE photos SET like_count = like_count - 1 WHERE id = OLD.photo_id;
        ELSIF TG_TABLE_NAME = 'photo_comments' THEN
            UPDATE photos SET comment_count = comment_count - 1 WHERE id = OLD.photo_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for photo counts
CREATE TRIGGER trigger_update_photo_like_count AFTER INSERT OR DELETE ON photo_likes FOR EACH ROW EXECUTE FUNCTION update_photo_counts();
CREATE TRIGGER trigger_update_photo_comment_count AFTER INSERT OR DELETE ON photo_comments FOR EACH ROW EXECUTE FUNCTION update_photo_counts();

-- ===============================
-- VIEWS FOR COMMON QUERIES
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

-- View for photo feed with user info
CREATE VIEW photo_feed AS
SELECT 
    p.*,
    u.username,
    u.display_name,
    u.avatar_url,
    COALESCE(p.like_count, 0) as likes,
    COALESCE(p.comment_count, 0) as comments
FROM photos p
JOIN users u ON u.id = p.user_id
WHERE p.is_deleted = false
ORDER BY p.uploaded_at DESC;

-- ===============================
-- INITIAL DATA (Optional)
-- ===============================

-- Insert default permission groups
-- This can be used by the application to create default groups for new users

-- ===============================
-- DATABASE COMMENTS
-- ===============================

COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE friendships IS 'Friend relationships between users';
COMMENT ON TABLE photos IS 'Photo uploads with metadata and permissions';
COMMENT ON TABLE albums IS 'Photo albums/collections';
COMMENT ON TABLE album_photos IS 'Photos within albums (many-to-many)';
COMMENT ON TABLE photo_shares IS 'Individual photo sharing permissions';
COMMENT ON TABLE album_shares IS 'Album sharing permissions';
COMMENT ON TABLE permission_groups IS 'User-defined permission groups';
COMMENT ON TABLE permission_group_members IS 'Users within permission groups';
COMMENT ON TABLE device_sync IS 'Registered devices for syncing';
COMMENT ON TABLE sync_sessions IS 'Device sync session tracking';
COMMENT ON TABLE sync_file_mappings IS 'File mappings between device and server';
COMMENT ON TABLE photo_likes IS 'Photo likes by users';
COMMENT ON TABLE photo_comments IS 'Comments on photos';
COMMENT ON TABLE activity_logs IS 'User activity tracking';
COMMENT ON TABLE notifications IS 'User notifications';

-- ===============================
-- SCHEMA COMPLETE
-- =============================== 