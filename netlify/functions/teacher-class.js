const { Database, generateClassCode, uuidv4 } = require('./db');

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

    const { name } = JSON.parse(event.body);
    const classId = uuidv4();
    const code = generateClassCode();

    const classData = {
      id: classId,
      teacherId: session.teacherId,
      name,
      code,
      activePollId: null,
      studentCount: 0
    };

    await db.addClass(classData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        class: {
          id: classId,
          name,
          code,
          studentCount: 0
        }
      })
    };
  } catch (error) {
    console.error('Create class error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler: ' + error.message })
    };
  }
};
