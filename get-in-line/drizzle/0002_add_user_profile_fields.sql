-- Add phone and notification preferences to users table
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true, "queue_updates": true, "position_changes": true, "announcements": true}';
