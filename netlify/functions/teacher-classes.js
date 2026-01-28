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

    const classes = await db.getClassesByTeacher(session.teacherId);
    
    const classesData = classes.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      studentCount: c.studentCount || 0
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ classes: classesData })
    };
  } catch (error) {
    console.error('Get classes error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler: ' + error.message })
    };
  }
};
