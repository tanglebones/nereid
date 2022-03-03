delete from session where session_id = decode($(sessionId), 'hex');
