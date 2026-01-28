const { Database } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const code = event.path.split('/').pop().toUpperCase();
    const db = new Database();

    const classData = await db.getClassByCode(code);
    
    if (!classData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Klasse nicht gefunden' })
      };
    }

    let poll = null;
    if (classData.activePollId) {
      const pollData = await db.getPollById(classData.activePollId);
      if (pollData && pollData.active) {
        poll = {
          id: pollData.id,
          question: pollData.question,
          options: pollData.options.map(opt => ({ text: opt.text, votes: opt.votes })),
          mode: pollData.mode
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        classId: classData.id,
        className: classData.name,
        poll
      })
    };
  } catch (error) {
    console.error('Get class error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler: ' + error.message })
    };
  }
};
