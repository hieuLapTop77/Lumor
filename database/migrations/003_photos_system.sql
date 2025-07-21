-- Migration 003: Photos System
-- Created: 2024
-- Description: Create photos, albums, likes, and comments system

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
-- TRIGGERS
-- ===============================

-- Create triggers for updated_at
CREATE TRIGGER update_albums_updated_at 
    BEFORE UPDATE ON albums 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_comments_updated_at 
    BEFORE UPDATE ON photo_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
CREATE TRIGGER trigger_update_photo_like_count 
    AFTER INSERT OR DELETE ON photo_likes 
    FOR EACH ROW EXECUTE FUNCTION update_photo_counts();

CREATE TRIGGER trigger_update_photo_comment_count 
    AFTER INSERT OR DELETE ON photo_comments 
    FOR EACH ROW EXECUTE FUNCTION update_photo_counts();

-- ===============================
-- VIEWS
-- ===============================

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
-- COMMENTS
-- ===============================
COMMENT ON TABLE photos IS 'Photo uploads with metadata and permissions';
COMMENT ON TABLE albums IS 'Photo albums/collections';
COMMENT ON TABLE album_photos IS 'Photos within albums (many-to-many)';
COMMENT ON TABLE photo_likes IS 'Photo likes by users';
COMMENT ON TABLE photo_comments IS 'Comments on photos';

-- Migration 003 Complete 