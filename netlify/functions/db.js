const { getStore } = require('@netlify/blobs');
const { v4: uuidv4 } = require('uuid');

// Get blob store
const getDbStore = () => getStore('schulvote-db');

// Database operations
class Database {
  // Teachers
  async getTeachers() {
    const store = getDbStore();
    const data = await store.get('teachers');
    return data ? JSON.parse(data) : {};
  }

  async saveTeachers(teachers) {
    const store = getDbStore();
    await store.set('teachers', JSON.stringify(teachers));
  }

  async addTeacher(teacher) {
    const teachers = await this.getTeachers();
    teachers[teacher.id] = teacher;
    await this.saveTeachers(teachers);
    return teacher;
  }

  async getTeacherByEmail(email) {
    const teachers = await this.getTeachers();
    return Object.values(teachers).find(t => t.email === email);
  }

  async getTeacherById(id) {
    const teachers = await this.getTeachers();
    return teachers[id];
  }

  // Sessions
  async getSessions() {
    const store = getDbStore();
    const data = await store.get('sessions');
    return data ? JSON.parse(data) : {};
  }

  async saveSessions(sessions) {
    const store = getDbStore();
    await store.set('sessions', JSON.stringify(sessions));
  }

  async createSession(teacherId) {
    const sessionId = uuidv4();
    const sessions = await this.getSessions();
    sessions[sessionId] = {
      teacherId,
      createdAt: Date.now()
    };
    await this.saveSessions(sessions);
    return sessionId;
  }

  async getSession(sessionId) {
    const sessions = await this.getSessions();
    return sessions[sessionId];
  }

  // Classes
  async getClasses() {
    const store = getDbStore();
    const data = await store.get('classes');
    return data ? JSON.parse(data) : {};
  }

  async saveClasses(classes) {
    const store = getDbStore();
    await store.set('classes', JSON.stringify(classes));
  }

  async addClass(classData) {
    const classes = await this.getClasses();
    classes[classData.id] = classData;
    await this.saveClasses(classes);
    return classData;
  }

  async getClassById(id) {
    const classes = await this.getClasses();
    return classes[id];
  }

  async getClassByCode(code) {
    const classes = await this.getClasses();
    return Object.values(classes).find(c => c.code === code.toUpperCase());
  }

  async getClassesByTeacher(teacherId) {
    const classes = await this.getClasses();
    return Object.values(classes).filter(c => c.teacherId === teacherId);
  }

  async updateClass(classId, updates) {
    const classes = await this.getClasses();
    if (classes[classId]) {
      classes[classId] = { ...classes[classId], ...updates };
      await this.saveClasses(classes);
      return classes[classId];
    }
    return null;
  }

  // Polls
  async getPolls() {
    const store = getDbStore();
    const data = await store.get('polls');
    return data ? JSON.parse(data) : {};
  }

  async savePolls(polls) {
    const store = getDbStore();
    await store.set('polls', JSON.stringify(polls));
  }

  async addPoll(poll) {
    const polls = await this.getPolls();
    polls[poll.id] = poll;
    await this.savePolls(polls);
    return poll;
  }

  async getPollById(id) {
    const polls = await this.getPolls();
    return polls[id];
  }

  async updatePoll(pollId, updates) {
    const polls = await this.getPolls();
    if (polls[pollId]) {
      polls[pollId] = { ...polls[pollId], ...updates };
      await this.savePolls(polls);
      return polls[pollId];
    }
    return null;
  }
}

// Helper functions
function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function hashPassword(password) {
  // Simple hash - in production use bcrypt
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

module.exports = {
  Database,
  generateClassCode,
  hashPassword,
  verifyPassword,
  uuidv4
};
