const { Database, verifyPassword } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email, password } = JSON.parse(event.body);
    const db = new Database();

    const teacher = await db.getTeacherByEmail(email);
    
    if (!teacher) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Ungültige Anmeldedaten' })
      };
    }

    const validPassword = verifyPassword(password, teacher.password);
    if (!validPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Ungültige Anmeldedaten' })
      };
    }

    const sessionId = await db.createSession(teacher.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        sessionId,
        teacher: { id: teacher.id, email: teacher.email, name: teacher.name }
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler: ' + error.message })
    };
  }
};
