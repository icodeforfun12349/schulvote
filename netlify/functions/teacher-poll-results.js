const { Database } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
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

    const pollId = event.path.split('/').filter(p => p).pop().replace('-results', '');
    const poll = await db.getPollById(pollId);

    if (!poll) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Abstimmung nicht gefunden' })
      };
    }

    const classData = await db.getClassById(poll.classId);
    if (classData.teacherId !== session.teacherId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Zugriff verweigert' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        question: poll.question,
        mode: poll.mode,
        active: poll.active,
        options: poll.options,
        votes: poll.votes,
        totalVotes: poll.votes.length
      })
    };
  } catch (error) {
    console.error('Get results error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler: ' + error.message })
    };
  }
};
