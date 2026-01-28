const app = {
    state: {
        sessionId: null,
        teacher: null,
        currentClassId: null,
        currentClass: null,
        currentPollId: null,
        ws: null,
        studentClassId: null
    },

    init() {
        // Check if teacher is logged in
        const sessionId = localStorage.getItem('teacherSession');
        if (sessionId) {
            this.state.sessionId = sessionId;
            const teacher = JSON.parse(localStorage.getItem('teacherData') || '{}');
            this.state.teacher = teacher;
            
            // Verify session and load dashboard
            this.verifySession();
        }

        // Auto-uppercase class code input
        const codeInput = document.getElementById('class-code-input');
        if (codeInput) {
            codeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    },

    async verifySession() {
        // In production, verify session with backend
        this.showScreen('teacher-dashboard');
        this.loadClasses();
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    },

    switchTab(tab) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(t => t.classList.remove('active'));
        
        if (tab === 'login') {
            tabs[0].classList.add('active');
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
        } else {
            tabs[1].classList.add('active');
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        }
    },

    async teacherLogin(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;

        try {
            const response = await fetch('/api/teacher/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.state.sessionId = data.sessionId;
                this.state.teacher = data.teacher;
                localStorage.setItem('teacherSession', data.sessionId);
                localStorage.setItem('teacherData', JSON.stringify(data.teacher));
                
                this.showScreen('teacher-dashboard');
                this.loadClasses();
            } else {
                alert(data.error || 'Anmeldung fehlgeschlagen');
            }
        } catch (error) {
            alert('Verbindungsfehler. Bitte versuche es erneut.');
        }
    },

    async teacherRegister(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('input[type="text"]').value;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;

        try {
            const response = await fetch('/api/teacher/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.state.sessionId = data.sessionId;
                this.state.teacher = data.teacher;
                localStorage.setItem('teacherSession', data.sessionId);
                localStorage.setItem('teacherData', JSON.stringify(data.teacher));
                
                this.showScreen('teacher-dashboard');
                this.loadClasses();
            } else {
                alert(data.error || 'Registrierung fehlgeschlagen');
            }
        } catch (error) {
            alert('Verbindungsfehler. Bitte versuche es erneut.');
        }
    },

    logout() {
        localStorage.removeItem('teacherSession');
        localStorage.removeItem('teacherData');
        this.state.sessionId = null;
        this.state.teacher = null;
        this.showScreen('home-screen');
    },

    async loadClasses() {
        try {
            const response = await fetch('/api/teacher/classes', {
                headers: {
                    'Authorization': `Bearer ${this.state.sessionId}`
                }
            });

            const data = await response.json();
            
            document.getElementById('teacher-name').textContent = this.state.teacher.name;
            
            const grid = document.getElementById('classes-grid');
            
            if (data.classes.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-secondary);">
                        <p>Noch keine Klassen erstellt.</p>
                        <p style="margin-top: 0.5rem;">Erstelle deine erste Klasse!</p>
                    </div>
                `;
            } else {
                grid.innerHTML = data.classes.map(c => `
                    <div class="class-card" onclick="app.openClassroom('${c.id}')">
                        <h3>${c.name}</h3>
                        <div class="class-info-row">
                            <span>Code</span>
                            <span>${c.code}</span>
                        </div>
                        <div class="class-info-row">
                            <span>Schüler</span>
                            <span>${c.studentCount || 0}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            alert('Fehler beim Laden der Klassen');
        }
    },

    showCreateClass() {
        document.getElementById('modal-overlay').classList.add('active');
        document.getElementById('create-class-modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
        document.getElementById('create-class-modal').classList.remove('active');
    },

    async createClass(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('input').value;

        try {
            const response = await fetch('/api/teacher/class', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.sessionId}`
                },
                body: JSON.stringify({ name })
            });

            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                form.reset();
                this.loadClasses();
            } else {
                alert(data.error || 'Fehler beim Erstellen');
            }
        } catch (error) {
            alert('Verbindungsfehler');
        }
    },

    async openClassroom(classId) {
        this.state.currentClassId = classId;
        
        // Get class details
        try {
            const response = await fetch('/api/teacher/classes', {
                headers: {
                    'Authorization': `Bearer ${this.state.sessionId}`
                }
            });

            const data = await response.json();
            this.state.currentClass = data.classes.find(c => c.id === classId);
            
            document.getElementById('classroom-name').textContent = this.state.currentClass.name;
            document.getElementById('classroom-code').textContent = this.state.currentClass.code;
            
            this.showScreen('teacher-classroom');
            
            // Setup WebSocket
            this.connectWebSocket(classId);
            
            // Reset poll creator
            document.getElementById('poll-creator').style.display = 'block';
            document.getElementById('poll-results').style.display = 'none';
            
        } catch (error) {
            alert('Fehler beim Laden der Klasse');
        }
    },

    connectWebSocket(classId) {
        if (this.state.ws) {
            this.state.ws.close();
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.state.ws = new WebSocket(`${protocol}//${window.location.host}`);

        this.state.ws.onopen = () => {
            this.state.ws.send(JSON.stringify({
                type: 'join_class',
                classId: classId
            }));
        };

        this.state.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'vote_update') {
                this.updateResults(data.results);
            }
        };
    },

    copyClassCode() {
        const code = this.state.currentClass.code;
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.querySelector('.copy-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        });
    },

    addPollOption() {
        const container = document.getElementById('poll-options-container');
        const count = container.querySelectorAll('input').length + 1;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'poll-option-input';
        input.placeholder = `Option ${count}`;
        input.required = true;
        container.appendChild(input);
    },

    async createPoll(e) {
        e.preventDefault();
        const form = e.target;
        
        const question = document.getElementById('poll-question').value;
        const optionInputs = document.querySelectorAll('.poll-option-input');
        const options = Array.from(optionInputs).map(input => input.value).filter(v => v);
        const mode = form.querySelector('input[name="poll-mode"]:checked').value;

        if (options.length < 2) {
            alert('Mindestens 2 Optionen erforderlich');
            return;
        }

        try {
            const response = await fetch('/api/teacher/poll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.sessionId}`
                },
                body: JSON.stringify({
                    classId: this.state.currentClassId,
                    question,
                    options,
                    mode
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.state.currentPollId = data.pollId;
                document.getElementById('poll-creator').style.display = 'none';
                document.getElementById('poll-results').style.display = 'block';
                
                // Load initial results
                this.loadPollResults(data.pollId);
            }
        } catch (error) {
            alert('Fehler beim Erstellen der Abstimmung');
        }
    },

    async loadPollResults(pollId) {
        try {
            const response = await fetch(`/api/teacher/poll/${pollId}/results`, {
                headers: {
                    'Authorization': `Bearer ${this.state.sessionId}`
                }
            });

            const data = await response.json();
            this.displayResults(data);
        } catch (error) {
            console.error('Fehler beim Laden der Ergebnisse');
        }
    },

    displayResults(data) {
        const total = data.totalVotes;
        
        // Summary
        const summaryHTML = data.options.map(opt => `
            <div class="result-stat">
                <div class="result-stat-label">${opt.text}</div>
                <div class="result-stat-value">${opt.votes}</div>
            </div>
        `).join('');
        
        document.getElementById('results-summary').innerHTML = summaryHTML;
        
        // Chart
        const chartHTML = data.options.map(opt => {
            const percentage = total > 0 ? (opt.votes / total * 100).toFixed(0) : 0;
            return `
                <div class="chart-bar">
                    <div class="chart-bar-header">
                        <span class="chart-bar-label">${opt.text}</span>
                        <span class="chart-bar-value">${opt.votes} Stimmen</span>
                    </div>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="width: ${percentage}%">
                            ${percentage > 10 ? percentage + '%' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('results-chart').innerHTML = chartHTML;
        
        // Voter list
        if (data.mode === 'public' && data.votes.length > 0) {
            const votersHTML = `
                <h3>Wer hat abgestimmt (${data.votes.length})</h3>
                <div class="voter-list">
                    ${data.votes.map(vote => `
                        <div class="voter-item">
                            <span class="voter-name">${vote.studentName}</span>
                            <span class="voter-choice">${vote.option}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            document.getElementById('results-voters').innerHTML = votersHTML;
        } else if (data.mode === 'anonymous') {
            document.getElementById('results-voters').innerHTML = `
                <h3>Anonyme Abstimmung</h3>
                <p style="color: var(--color-text-secondary);">Insgesamt ${data.votes.length} Stimmen abgegeben</p>
            `;
        } else {
            document.getElementById('results-voters').innerHTML = '';
        }
    },

    updateResults(results) {
        const total = results.totalVotes;
        
        // Update summary
        const summaryHTML = results.options.map(opt => `
            <div class="result-stat">
                <div class="result-stat-label">${opt.text}</div>
                <div class="result-stat-value">${opt.votes}</div>
            </div>
        `).join('');
        
        document.getElementById('results-summary').innerHTML = summaryHTML;
        
        // Update chart
        results.options.forEach(opt => {
            const percentage = total > 0 ? (opt.votes / total * 100).toFixed(0) : 0;
            const barFill = document.querySelector(`[data-option="${opt.text}"] .chart-bar-fill`);
            if (barFill) {
                barFill.style.width = percentage + '%';
                barFill.textContent = percentage > 10 ? percentage + '%' : '';
            }
        });
        
        // Update voters if public
        if (results.votes && results.votes[0]?.studentName) {
            const votersHTML = `
                <h3>Wer hat abgestimmt (${results.votes.length})</h3>
                <div class="voter-list">
                    ${results.votes.map(vote => `
                        <div class="voter-item">
                            <span class="voter-name">${vote.studentName}</span>
                            <span class="voter-choice">${vote.option}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            document.getElementById('results-voters').innerHTML = votersHTML;
        }
    },

    async stopPoll() {
        if (!confirm('Abstimmung wirklich beenden?')) return;
        
        try {
            const response = await fetch(`/api/teacher/poll/${this.state.currentPollId}/stop`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.state.sessionId}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                document.getElementById('poll-results').style.display = 'none';
                document.getElementById('poll-creator').style.display = 'block';
                document.getElementById('create-poll-form').reset();
                
                // Reset to 2 options
                const container = document.getElementById('poll-options-container');
                container.innerHTML = `
                    <input type="text" class="poll-option-input" placeholder="Option 1" required>
                    <input type="text" class="poll-option-input" placeholder="Option 2" required>
                `;
            }
        } catch (error) {
            alert('Fehler beim Beenden');
        }
    },

    async resetPoll() {
        if (!confirm('Alle Stimmen zurücksetzen?')) return;
        
        try {
            const response = await fetch(`/api/teacher/poll/${this.state.currentPollId}/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.state.sessionId}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.loadPollResults(this.state.currentPollId);
            }
        } catch (error) {
            alert('Fehler beim Zurücksetzen');
        }
    },

    // Student functions
    async joinClass(e) {
        e.preventDefault();
        const code = document.getElementById('class-code-input').value.toUpperCase();

        try {
            const response = await fetch(`/api/class/${code}`);
            
            if (!response.ok) {
                alert('Klasse nicht gefunden. Bitte überprüfe den Code.');
                return;
            }

            const data = await response.json();
            
            this.state.studentClassId = data.classId;
            document.getElementById('student-class-name').textContent = data.className;
            
            this.showScreen('student-vote');
            
            // Show poll if active
            if (data.poll) {
                this.showStudentPoll(data.poll);
            } else {
                document.getElementById('waiting-message').style.display = 'block';
                document.getElementById('vote-box').style.display = 'none';
            }
            
            // Start polling for poll updates every 3 seconds
            this.state.studentPollInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/class/${code}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.poll) {
                            this.showStudentPoll(data.poll);
                        } else {
                            document.getElementById('waiting-message').style.display = 'block';
                            document.getElementById('vote-box').style.display = 'none';
                        }
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 3000);
        } catch (error) {
            alert('Verbindungsfehler. Bitte versuche es erneut.');
        }
    },

    // Removed WebSocket - using polling instead

    showStudentPoll(poll) {
        this.state.currentPollId = poll.id;
        
        document.getElementById('waiting-message').style.display = 'none';
        document.getElementById('vote-box').style.display = 'block';
        document.getElementById('vote-success').style.display = 'none';
        
        document.getElementById('vote-question').textContent = poll.question;
        
        // Show name input for public polls
        if (poll.mode === 'public') {
            document.getElementById('name-input-box').style.display = 'block';
        } else {
            document.getElementById('name-input-box').style.display = 'none';
        }
        
        // Create option buttons
        const optionsHTML = poll.options.map(opt => `
            <button class="vote-option" onclick="app.submitVote('${opt.text}', '${poll.mode}')">${opt.text}</button>
        `).join('');
        
        document.getElementById('vote-options').innerHTML = optionsHTML;
    },

    async submitVote(option, mode) {
        let studentName = null;
        
        if (mode === 'public') {
            studentName = document.getElementById('student-name-input').value.trim();
            if (!studentName) {
                alert('Bitte gib deinen Namen ein');
                return;
            }
        }

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pollId: this.state.currentPollId,
                    option: option,
                    studentName: studentName
                })
            });

            const data = await response.json();
            
            if (data.success) {
                document.getElementById('vote-options').style.display = 'none';
                document.getElementById('name-input-box').style.display = 'none';
                document.getElementById('vote-success').style.display = 'block';
            } else {
                alert(data.error || 'Fehler beim Abstimmen');
            }
        } catch (error) {
            alert('Verbindungsfehler');
        }
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
