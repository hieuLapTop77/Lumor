-- Migration 004: Sharing System
-- Created: 2024
-- Description: Create photo and album sharing system with permissions

-- ===============================
-- PHOTO_SHARES TABLE
-- ===============================
CREATE TABLE photo_shares (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
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
    require_auth BOOLEAN DEFAULT true
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
-- TRIGGERS
-- ===============================

-- Create trigger for permission_groups updated_at
CREATE TRIGGER update_permission_groups_updated_at 
    BEFORE UPDATE ON permission_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- COMMENTS
-- ===============================
COMMENT ON TABLE photo_shares IS 'Individual photo sharing permissions';
COMMENT ON TABLE album_shares IS 'Album sharing permissions';
COMMENT ON TABLE permission_groups IS 'User-defined permission groups';
COMMENT ON TABLE permission_group_members IS 'Users within permission groups';

-- Migration 004 Complete 