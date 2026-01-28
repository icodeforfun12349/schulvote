const { Database, hashPassword, uuidv4 } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email, password, name } = JSON.parse(event.body);
    const db = new Database();

    // Check if teacher exists
    const existingTeacher = await db.getTeacherByEmail(email);
    if (existingTeacher) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'E-Mail bereits registriert' })
      };
    }

    const hashedPassword = hashPassword(password);
    const teacherId = uuidv4();

    const teacher = {
      id: teacherId,
      email,
      password: hashedPassword,
      name
    };

    await db.addTeacher(teacher);
    const sessionId = await db.createSession(teacherId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        sessionId,
        teacher: { id: teacherId, email, name }
      })
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler: ' + error.message })
    };
  }
};
