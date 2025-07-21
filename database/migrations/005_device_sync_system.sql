-- Migration 005: Device Sync System
-- Created: 2024
-- Description: Create device synchronization system for photo uploads

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
-- TRIGGERS
-- ===============================

-- Create trigger for sync_file_mappings updated_at
CREATE TRIGGER update_sync_file_mappings_updated_at 
    BEFORE UPDATE ON sync_file_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- COMMENTS
-- ===============================
COMMENT ON TABLE device_sync IS 'Registered devices for syncing';
COMMENT ON TABLE sync_sessions IS 'Device sync session tracking';
COMMENT ON TABLE sync_file_mappings IS 'File mappings between device and server';

-- Migration 005 Complete 