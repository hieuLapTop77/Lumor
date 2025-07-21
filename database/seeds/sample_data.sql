-- Sample Data for Photo Sharing App
-- Created: 2024
-- Description: Sample data for testing and development

-- ===============================
-- SAMPLE USERS
-- ===============================

-- Insert sample users (password: 'password123' hashed with bcrypt)
INSERT INTO users (username, email, password_hash, display_name, bio, is_active, email_verified) VALUES
('john_doe', 'john@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', 'Photography enthusiast and travel blogger', true, true),
('jane_smith', 'jane@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'Nature photographer', true, true),
('mike_wilson', 'mike@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Wilson', 'Street photography lover', true, true),
('sarah_brown', 'sarah@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Brown', 'Portrait and wedding photographer', true, true),
('alex_lee', 'alex@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alex Lee', 'Landscape photography', true, true);

-- ===============================
-- SAMPLE FRIENDSHIPS
-- ===============================

-- Create some friendships
INSERT INTO friendships (requester_id, addressee_id, status) VALUES
(1, 2, 'accepted'),  -- John and Jane are friends
(1, 3, 'accepted'),  -- John and Mike are friends
(2, 3, 'accepted'),  -- Jane and Mike are friends
(2, 4, 'accepted'),  -- Jane and Sarah are friends
(3, 4, 'pending'),   -- Mike sent request to Sarah (pending)
(4, 5, 'accepted'),  -- Sarah and Alex are friends
(1, 5, 'pending');   -- John sent request to Alex (pending)

-- ===============================
-- SAMPLE PHOTOS
-- ===============================

-- Insert sample photos
INSERT INTO photos (user_id, filename, original_name, file_path, file_size, mime_type, width, height, hash_md5, description, is_public, tags) VALUES
(1, 'sunset_beach_001.jpg', 'DSC_001.jpg', '/uploads/photos/1/sunset_beach_001.jpg', 2548672, 'image/jpeg', 3024, 4032, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'Beautiful sunset at the beach during our vacation', true, ARRAY['sunset', 'beach', 'vacation', 'nature']),
(1, 'mountain_hike_002.jpg', 'IMG_002.jpg', '/uploads/photos/1/mountain_hike_002.jpg', 3124576, 'image/jpeg', 4032, 3024, 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7', 'Amazing view from the mountain top', false, ARRAY['mountain', 'hiking', 'landscape', 'adventure']),
(2, 'forest_morning_001.jpg', 'Morning.jpg', '/uploads/photos/2/forest_morning_001.jpg', 1876543, 'image/jpeg', 2816, 2112, 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8', 'Misty morning in the forest', true, ARRAY['forest', 'morning', 'mist', 'nature']),
(2, 'flower_macro_001.jpg', 'Flower.jpg', '/uploads/photos/2/flower_macro_001.jpg', 987654, 'image/jpeg', 2048, 1536, 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9', 'Close-up of a beautiful flower', true, ARRAY['flower', 'macro', 'nature', 'close-up']),
(3, 'street_art_001.jpg', 'StreetArt.jpg', '/uploads/photos/3/street_art_001.jpg', 1543210, 'image/jpeg', 3024, 4032, 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', 'Amazing street art in downtown', true, ARRAY['street', 'art', 'urban', 'colorful']),
(3, 'city_lights_001.jpg', 'CityNight.jpg', '/uploads/photos/3/city_lights_001.jpg', 2234567, 'image/jpeg', 4032, 3024, 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1', 'City lights at night', false, ARRAY['city', 'night', 'lights', 'urban']),
(4, 'wedding_couple_001.jpg', 'Wedding.jpg', '/uploads/photos/4/wedding_couple_001.jpg', 3456789, 'image/jpeg', 3024, 4032, 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2', 'Beautiful wedding couple portrait', false, ARRAY['wedding', 'portrait', 'couple', 'love']),
(5, 'lake_reflection_001.jpg', 'Lake.jpg', '/uploads/photos/5/lake_reflection_001.jpg', 2987654, 'image/jpeg', 4032, 3024, 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3', 'Perfect reflection on the lake', true, ARRAY['lake', 'reflection', 'landscape', 'peaceful']);

-- ===============================
-- SAMPLE ALBUMS
-- ===============================

-- Create sample albums
INSERT INTO albums (user_id, name, description, cover_photo_id, is_public) VALUES
(1, 'Vacation 2024', 'Photos from our amazing vacation trip', 1, true),
(1, 'Adventure Hiking', 'Mountain hiking adventures', 2, false),
(2, 'Nature Collection', 'Beautiful nature photography', 3, true),
(3, 'Urban Photography', 'Street and city photography', 5, true),
(4, 'Wedding Portfolio', 'Wedding photography samples', 7, false),
(5, 'Landscapes', 'Scenic landscape photography', 8, true);

-- ===============================
-- ALBUM PHOTOS
-- ===============================

-- Add photos to albums
INSERT INTO album_photos (album_id, photo_id, position) VALUES
(1, 1, 1),  -- Vacation album: sunset beach
(2, 2, 1),  -- Hiking album: mountain view
(3, 3, 1),  -- Nature album: forest morning
(3, 4, 2),  -- Nature album: flower macro
(4, 5, 1),  -- Urban album: street art
(4, 6, 2),  -- Urban album: city lights
(5, 7, 1),  -- Wedding album: couple portrait
(6, 8, 1);  -- Landscapes album: lake reflection

-- ===============================
-- SAMPLE PHOTO LIKES
-- ===============================

-- Add some likes to photos
INSERT INTO photo_likes (photo_id, user_id) VALUES
(1, 2), (1, 3), (1, 4),  -- Sunset beach liked by Jane, Mike, Sarah
(3, 1), (3, 4), (3, 5),  -- Forest morning liked by John, Sarah, Alex
(4, 1), (4, 3),          -- Flower macro liked by John, Mike
(5, 2), (5, 4),          -- Street art liked by Jane, Sarah
(8, 1), (8, 2), (8, 3);  -- Lake reflection liked by John, Jane, Mike

-- ===============================
-- SAMPLE PHOTO COMMENTS
-- ===============================

-- Add some comments
INSERT INTO photo_comments (photo_id, user_id, comment) VALUES
(1, 2, 'Absolutely stunning sunset! 🌅'),
(1, 3, 'Great composition and colors!'),
(3, 1, 'The mist creates such a magical atmosphere'),
(4, 1, 'Amazing macro shot! What lens did you use?'),
(5, 2, 'Love the vibrant colors in this street art'),
(8, 1, 'Perfect reflection! What time did you take this?'),
(8, 2, 'So peaceful and serene');

-- ===============================
-- SAMPLE PHOTO SHARES
-- ===============================

-- Create some photo shares
INSERT INTO photo_shares (photo_id, shared_by, shared_with, permission_level, message, expires_at) VALUES
(1, 1, 2, 'download', 'Here''s that sunset photo you wanted!', NOW() + INTERVAL '30 days'),
(2, 1, 3, 'view', 'Check out this mountain view', NOW() + INTERVAL '7 days'),
(3, 2, 1, 'download', 'Forest morning shot for your collection', NOW() + INTERVAL '14 days');

-- ===============================
-- SAMPLE PERMISSION GROUPS
-- ===============================

-- Create sample permission groups
INSERT INTO permission_groups (user_id, name, description, default_photo_permission, default_album_permission) VALUES
(1, 'Close Friends', 'My closest friends with full access', 'download', 'download'),
(1, 'Family', 'Family members', 'view', 'view'),
(2, 'Photography Club', 'Members of my photography club', 'download', 'contribute'),
(3, 'Art Enthusiasts', 'People interested in street art', 'view', 'view');

-- ===============================
-- SAMPLE PERMISSION GROUP MEMBERS
-- ===============================

-- Add users to permission groups
INSERT INTO permission_group_members (group_id, user_id, added_by) VALUES
(1, 2, 1),  -- Jane in John's Close Friends
(1, 3, 1),  -- Mike in John's Close Friends
(2, 4, 1),  -- Sarah in John's Family
(3, 1, 2),  -- John in Jane's Photography Club
(3, 4, 2),  -- Sarah in Jane's Photography Club
(4, 2, 3),  -- Jane in Mike's Art Enthusiasts
(4, 4, 3);  -- Sarah in Mike's Art Enthusiasts

-- ===============================
-- SAMPLE DEVICE SYNC
-- ===============================

-- Register some devices
INSERT INTO device_sync (user_id, device_id, device_name, device_type, platform, app_version, sync_enabled, auto_backup) VALUES
(1, 'iphone-12-john', 'John''s iPhone 12', 'mobile', 'ios', '1.0.0', true, true),
(1, 'macbook-pro-john', 'John''s MacBook Pro', 'desktop', 'macos', '1.0.0', true, false),
(2, 'pixel-6-jane', 'Jane''s Pixel 6', 'mobile', 'android', '1.0.0', true, true),
(3, 'samsung-s21-mike', 'Mike''s Galaxy S21', 'mobile', 'android', '1.0.0', true, false);

-- ===============================
-- SAMPLE NOTIFICATIONS
-- ===============================

-- Create sample notifications
INSERT INTO notifications (user_id, type, title, message, data, is_read) VALUES
(2, 'friend_request', 'New Friend Request', 'John Doe sent you a friend request', '{"from_user_id": 1, "from_username": "john_doe"}', true),
(4, 'friend_request', 'New Friend Request', 'Mike Wilson sent you a friend request', '{"from_user_id": 3, "from_username": "mike_wilson"}', false),
(1, 'photo_shared', 'Photo Shared', 'Jane Smith shared a photo with you', '{"photo_id": 3, "from_user_id": 2}', false),
(2, 'photo_like', 'Photo Liked', 'John Doe liked your photo', '{"photo_id": 3, "from_user_id": 1}', true),
(5, 'friend_request', 'New Friend Request', 'John Doe sent you a friend request', '{"from_user_id": 1, "from_username": "john_doe"}', false);

-- ===============================
-- SAMPLE ACTIVITY LOGS
-- ===============================

-- Log some activities
INSERT INTO activity_logs (user_id, action, resource_type, resource_id, metadata) VALUES
(1, 'photo_upload', 'photo', 1, '{"filename": "sunset_beach_001.jpg", "size": 2548672}'),
(1, 'photo_upload', 'photo', 2, '{"filename": "mountain_hike_002.jpg", "size": 3124576}'),
(2, 'photo_upload', 'photo', 3, '{"filename": "forest_morning_001.jpg", "size": 1876543}'),
(1, 'album_create', 'album', 1, '{"name": "Vacation 2024"}'),
(2, 'friend_request', 'user', 1, '{"action": "sent", "to_user": "john_doe"}'),
(1, 'photo_like', 'photo', 3, '{"liked_by": "john_doe"}'),
(3, 'photo_comment', 'photo', 1, '{"comment": "Great composition and colors!"}');

-- Sample data insertion complete! 