DELETE FROM "session" WHERE session_id=decode($(sessionId),'hex');
