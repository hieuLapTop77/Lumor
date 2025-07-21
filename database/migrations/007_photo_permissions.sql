-- Migration 007: Photo Permissions
-- Created: 2024
-- Description: Add permission and caption columns to photos table

-- Create custom permission groups table first
CREATE TABLE custom_permission_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

-- Create indexes for custom_permission_groups
CREATE INDEX idx_custom_permission_groups_user_id ON custom_permission_groups(user_id);
CREATE INDEX idx_custom_permission_groups_is_deleted ON custom_permission_groups(is_deleted);

-- Add missing columns to photos table
ALTER TABLE photos 
ADD COLUMN caption TEXT,
ADD COLUMN permission_type VARCHAR(20) DEFAULT 'friends' CHECK (permission_type IN ('public', 'friends', 'close_friends', 'custom')),
ADD COLUMN custom_group_id INTEGER REFERENCES custom_permission_groups(id) ON DELETE SET NULL;

-- Create indexes for new columns
CREATE INDEX idx_photos_permission_type ON photos(permission_type);
CREATE INDEX idx_photos_custom_group_id ON photos(custom_group_id);

-- Update existing photos to have default permission
UPDATE photos SET permission_type = 'friends' WHERE permission_type IS NULL; 