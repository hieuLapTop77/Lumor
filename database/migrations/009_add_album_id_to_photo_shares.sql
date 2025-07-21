-- Migration 009: Add album_id to photo_shares table
-- Created: 2024
-- Description: Add missing album_id column to photo_shares table for album sharing support

-- Add album_id column to photo_shares table (share_type already exists from migration 008)
ALTER TABLE photo_shares 
ADD COLUMN album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE;

-- Create index for new column
CREATE INDEX idx_photo_shares_album_id ON photo_shares(album_id);

-- Add constraint to ensure either photo_id or album_id is set (but not both for individual shares)
-- For 'individual_photo' shares, photo_id must be set and album_id must be NULL
-- For 'album' shares, album_id must be set and photo_id must be NULL  
-- For 'all_photos' shares, both can be NULL
ALTER TABLE photo_shares 
ADD CONSTRAINT chk_photo_shares_resource_consistency 
CHECK (
  (share_type = 'individual_photo' AND photo_id IS NOT NULL AND album_id IS NULL) OR
  (share_type = 'album' AND album_id IS NOT NULL AND photo_id IS NULL) OR
  (share_type = 'all_photos' AND photo_id IS NULL AND album_id IS NULL)
); 