DELETE FROM "session" WHERE expire_at < current_timestamp;
