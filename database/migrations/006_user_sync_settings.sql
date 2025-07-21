-- Migration 006: User Auto Sync Settings
-- Created: 2024
-- Description: Add auto sync settings to users table for photo permissions

-- Add auto sync columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_sync_permission_type VARCHAR(20) DEFAULT 'friends' CHECK (auto_sync_permission_type IN ('public', 'friends', 'close_friends', 'custom'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_sync_custom_group_id INTEGER REFERENCES permission_groups(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'never_synced' CHECK (sync_status IN ('never_synced', 'syncing', 'synced', 'error'));

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_users_auto_sync_enabled ON users(auto_sync_enabled);
CREATE INDEX IF NOT EXISTS idx_users_auto_sync_permission_type ON users(auto_sync_permission_type);
CREATE INDEX IF NOT EXISTS idx_users_last_sync_at ON users(last_sync_at);
CREATE INDEX IF NOT EXISTS idx_users_sync_status ON users(sync_status);

-- Add device sync status table to track sync per device
CREATE TABLE IF NOT EXISTS device_sync_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    sync_enabled BOOLEAN DEFAULT true,
    total_photos_synced INTEGER DEFAULT 0,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_id)
);

-- Create indexes for device_sync_status
CREATE INDEX IF NOT EXISTS idx_device_sync_status_user_id ON device_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sync_status_device_id ON device_sync_status(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sync_status_sync_enabled ON device_sync_status(sync_enabled);

-- Create trigger for device_sync_status updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_device_sync_status_updated_at 
    BEFORE UPDATE ON device_sync_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON COLUMN users.auto_sync_enabled IS 'Whether user has enabled automatic photo sync';
COMMENT ON COLUMN users.auto_sync_permission_type IS 'Default permission for auto-synced photos';
COMMENT ON COLUMN users.auto_sync_custom_group_id IS 'Custom group for auto-sync permissions';
COMMENT ON TABLE device_sync_status IS 'Track sync status per user device';

-- Migration 006 Complete 