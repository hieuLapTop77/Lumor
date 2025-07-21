-- Migration 008: Sharing System Fixes
-- Created: 2024
-- Description: Add missing share_type column to photo_shares table

-- Add missing share_type column to photo_shares table
ALTER TABLE photo_shares 
ADD COLUMN share_type VARCHAR(20) DEFAULT 'individual_photo' CHECK (share_type IN ('all_photos', 'album', 'individual_photo'));

-- Create index for new column
CREATE INDEX idx_photo_shares_share_type ON photo_shares(share_type);

-- Update existing records to have default share_type
UPDATE photo_shares SET share_type = 'individual_photo' WHERE share_type IS NULL; 