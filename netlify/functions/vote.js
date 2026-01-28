const { Database, uuidv4 } = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { pollId, option, studentName } = JSON.parse(event.body);
    const db = new Database();

    const poll = await db.getPollById(pollId);
    if (!poll || !poll.active) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Abstimmung nicht verfügbar' })
      };
    }

    const voteId = uuidv4();
    const vote = {
      id: voteId,
      option,
      studentName: poll.mode === 'public' ? studentName : null,
      timestamp: Date.now()
    };

    poll.votes.push(vote);

    // Update vote count
    const optionIndex = poll.options.findIndex(o => o.text === option);
    if (optionIndex !== -1) {
      poll.options[optionIndex].votes++;
    }

    await db.updatePoll(pollId, {
      votes: poll.votes,
      options: poll.options
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Vote error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler: ' + error.message })
    };
  }
};
