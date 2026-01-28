const { Database, uuidv4 } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const sessionId = event.headers.authorization?.replace('Bearer ', '');
    const db = new Database();
    
    const session = await db.getSession(sessionId);
    if (!session) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Nicht authentifiziert' })
      };
    }

    const { classId, question, options, mode } = JSON.parse(event.body);
    const classData = await db.getClassById(classId);

    if (!classData || classData.teacherId !== session.teacherId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Zugriff verweigert' })
      };
    }

    const pollId = uuidv4();

    const poll = {
      id: pollId,
      classId,
      question,
      options: options.map(opt => ({ text: opt, votes: 0 })),
      mode,
      active: true,
      votes: []
    };

    await db.addPoll(poll);
    await db.updateClass(classId, { activePollId: pollId });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, pollId })
    };
  } catch (error) {
    console.error('Create poll error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler: ' + error.message })
    };
  }
};
