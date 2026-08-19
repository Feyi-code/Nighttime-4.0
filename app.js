```javascript
/**
 * SLUMBERSPACE — Core Application Architecture & State Management
 * Pure Vanilla JS handling 24-question wizard, paced generation, timeline customizations,
 * file parser, wind-down timer, Web Audio noise/chimes, and localStorage persistence.
 */

document.addEventListener('DOMContentLoaded', () => {// --- Supabase Authentication Functions ---

// 1. Sign Up New User
async function signUpUser(email, password) {
    if (!supabase) return alert("Supabase client is not initialized.");
    
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        alert(`Sign Up Failed: ${error.message}`);
    } else {
        alert("Sign-up successful! Please check your email for a confirmation link.");
    }
}

// 2. Log In Existing User
async function loginUser(email, password) {
    if (!supabase) return alert("Supabase client is not initialized.");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert(`Login Failed: ${error.message}`);
    } else {
        alert("Logged in successfully!");
    }
}

// 3. Log Out Current User
async function logoutUser() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) alert(`Logout Failed: ${error.message}`);
}

// 4. Auth State Change Listener (Auto-updates UI and state)
function initAuthListener() {
    if (!supabase) return;

    supabase.auth.onAuthStateChange((event, session) => {
        const statusElem = document.getElementById('auth-user-status');
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (session && session.user) {
            // User is logged in
            if (statusElem) statusElem.textContent = `Logged in as: ${session.user.email}`;
            if (loginBtn) loginBtn.classList.add('hidden');
            if (signupBtn) signupBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            
            // Optionally link user ID to local state
            state.userId = session.user.id;
        } else {
            // User is logged out
            if (statusElem) statusElem.textContent = "Not logged in";
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (signupBtn) signupBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
            
            state.userId = null;
        }
    });
}

    // 24 Question Master Dataset
    const QUESTIONS = [
        // Sleep (Q1 - Q7)
        { id: 'q1', cat: 'Sleep', label: '1. What is your typical bedtime right now?', type: 'time', default: '01:30' },
        { id: 'q2', cat: 'Sleep', label: '2. What is your typical wake-up time?', type: 'time', default: '08:00' },
        { id: 'q3', cat: 'Sleep', label: '3. How many hours of sleep do you currently get?', type: 'select', options: ['Under 5 hours', '5 - 6 hours', '6 - 7 hours', '7 - 8 hours', '8+ hours'] },
        { id: 'q4', cat: 'Sleep', label: '4. How many hours of sleep would you like to get?', type: 'select', options: ['7 hours', '8 hours', '9 hours'] },
        { id: 'q5', cat: 'Sleep', label: '5. How consistent is your current sleep schedule?', type: 'select', options: ['Very inconsistent', 'Somewhat inconsistent', 'Fairly consistent'] },
        { id: 'q6', cat: 'Sleep', label: '6. How different is your sleep schedule on weekends?', type: 'select', options: ['1-2 hours later', '3+ hours later', 'Same as weekdays'] },
        { id: 'q7', cat: 'Sleep', label: '7. What usually prevents you from going to sleep?', type: 'select', options: ['Phone scrolling', 'Racing thoughts / stress', 'Homework / studying', 'Noise / roommates'] },

        // Phone Usage (Q8 - Q12)
        { id: 'q8', cat: 'Phone', label: '8. Why are you usually on your phone at night?', type: 'select', options: ['Social media feeds (TikTok, IG)', 'Watching videos / shows', 'Texting / group chats', 'Decompressing / quiet time'] },
        { id: 'q9', cat: 'Phone', label: '9. What apps keep you awake most often?', type: 'select', options: ['TikTok / Reels', 'YouTube / Netflix', 'Messaging / Discord', 'Mobile games'] },
        { id: 'q10', cat: 'Phone', label: '10. How long do you typically use your phone in bed before trying to sleep?', type: 'select', options: ['Under 15 mins', '15 - 45 mins', '1 - 2 hours', '2+ hours'] },
        { id: 'q11', cat: 'Phone', label: '11. Do you physically use your phone while lying in bed?', type: 'select', options: ['Yes, always', 'Sometimes', 'No, strictly at desk'] },
        { id: 'q12', cat: 'Phone', label: '12. Would reducing nighttime phone use be helpful to you?', type: 'select', options: ['Yes, absolutely', 'Maybe a little', 'Not sure'] },

        // School / Work (Q13 - Q16)
        { id: 'q13', cat: 'School/Work', label: '13. What time is your first class or work commitment on your earliest day?', type: 'time', default: '08:30' },
        { id: 'q14', cat: 'School/Work', label: '14. What days are your earliest commitments?', type: 'select', options: ['Mon / Wed / Fri', 'Tue / Thu', 'Every day', 'Varies weekly'] },
        { id: 'q15', cat: 'School/Work', label: '15. Do you have a changing or unpredictable schedule?', type: 'select', options: ['Yes, changes frequently', 'Somewhat', 'No, static schedule'] },
        { id: 'q16', cat: 'School/Work', label: '16. Would you like to upload your class or work schedule?', type: 'select', options: ['Yes, I have a file ready', 'No, handle manually'] },

        // Food & Caffeine (Q17 - Q20)
        { id: 'q17', cat: 'Food/Caffeine', label: '17. What time do you normally eat dinner?', type: 'time', default: '19:30' },
        { id: 'q18', cat: 'Food/Caffeine', label: '18. Do you frequently eat late-night snacks within an hour of bed?', type: 'select', options: ['Yes, often', 'Sometimes', 'Rarely / Never'] },
        { id: 'q19', cat: 'Food/Caffeine', label: '19. When do you usually stop consuming caffeine?', type: 'select', options: ['Before 2 PM', 'Late afternoon (2 PM - 6 PM)', 'Nighttime study sessions', 'I do not drink caffeine'] },
        { id: 'q20', cat: 'Food/Caffeine', label: '20. How much caffeine do you typically consume per day?', type: 'select', options: ['None', '1 cup/drink', '2-3 cups/drinks', '4+ cups/drinks'] },

        // Lifestyle & Relaxation (Q21 - Q24)
        { id: 'q21', cat: 'Lifestyle', label: '21. When do you usually exercise if at all?', type: 'select', options: ['Morning / Afternoon', 'Late Evening', 'I do not exercise regularly'] },
        { id: 'q22', cat: 'Lifestyle', label: '22. Do you take naps during the day?', type: 'select', options: ['No naps', 'Short naps (<30 mins)', 'Long naps (1+ hour)'] },
        { id: 'q23', cat: 'Lifestyle', label: '23. Which calming activity sounds most enjoyable for winding down?', type: 'select', options: ['Reading a physical book', 'Listening to music / audiobooks', 'Journaling / brain dump', 'Gentle stretching / breathing'] },
        { id: 'q24', cat: 'Lifestyle', label: '24. How much time would you realistically spend winding down?', type: 'select', options: ['15 minutes', '30 minutes', '45 minutes', '60 minutes'] }
    ];

    // Supabase Configuration Credentials
    const SUPABASE_URL = 'https://phkxgatgwkmnkwbqayeb.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_10qfUn7zMKPQ5tAXlK6IKw_Rx5GW_72';

    // Initialize Supabase Client (if CDN script is present in index.html)
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    const LOCAL_STORAGE_KEY = 'slumberspace_state_v3';

    // Application State
    let state = {
        answers: {},
        currentQIndex: 0,
        theme: 'moonlight',
        accent: 'amber',
        showEmojis: true,
        routineLevel: 'balanced',
        scheduleItems: [],
        calculatedTimes: { windDown: '10:45 PM', bedtime: '11:30 PM', wake: '07:30 AM' },
        uploadedFile: ''
    };

    // Web Audio State
    let audioCtx = null;
    let whiteNoiseSource = null;
    let isMuted = false;
    let winddownTimer = null;
    let countdownTimer = null;
    let breathingTimer = null;

    // Element References
    const views = {
        auth: document.getElementById('auth-view'),
        quiz: document.getElementById('questionnaire-view'),
        transition: document.getElementById('transition-view'),
        schedule: document.getElementById('schedule-view'),
        winddown: document.getElementById('winddown-view')
    };

    const prevQBtn = document.getElementById('prev-q-btn');
    const nextQBtn = document.getElementById('next-q-btn');
    const qContainer = document.getElementById('question-card-container');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');

    const scheduleBullets = document.getElementById('schedule-bullets');
    const themeSelect = document.getElementById('theme-select');
    const emojiToggle = document.getElementById('emoji-toggle');
    const routineLevelSelect = document.getElementById('routine-level-select');

    const lockdownOverlay = document.getElementById('lockdown-overlay');
    const alarmOverlay = document.getElementById('alarm-overlay');

    // Initialize App
    init();

    function init() {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            try {
                state = { ...state, ...JSON.parse(saved) };
                applyAppearance();
                renderScheduleDashboard();
                switchView('schedule');
            } catch (e) {
                renderQuestion(0);
                switchView('quiz');
            }
        } else {
            renderQuestion(0);
            switchView('quiz');
        }

        setupEventListeners();
    }

    // Question Rendering Engine
    function renderQuestion(index) {
        state.currentQIndex = index;
        const q = QUESTIONS[index];

        const total = QUESTIONS.length;
        const pct = Math.round(((index + 1) / total) * 100);
        progressBarFill.style.width = pct + '%';
        progressText.textContent = 'Question ${index + 1} of ${total} (${q.cat})';

        prevQBtn.disabled = index === 0;
        nextQBtn.textContent = (index === total - 1) ? 'Generate My Schedule ✨' : 'Next Question \u2192';

        let html = `
            <label class="q-label" for="q-input-${q.id}">${q.label}</label>
        `;

        const savedValue = state.answers[q.id] || q.default || '';

        if (q.type === 'time') {
            html += `
                <input type="time" id="q-input-${q.id}" class="input-field" value="${savedValue || '22:00'}" style="max-width: 200px;">
            `;
        } else if (q.type === 'select') {
            html += `<div class="pill-group">`;
            q.options.forEach((opt, idx) => {
                const checked = (savedValue === opt || (!savedValue && idx === 0)) ? 'checked' : '';
                const selectedClass = checked ? 'selected' : '';
                html += `
                    <label class="pill-option ${selectedClass}">
                        <input type="radio" name="q-option" value="${opt}" ${checked}>
                        <span>${opt}</span>
                    </label>
                `;
            });
            html += `</div>`;
        }

        qContainer.innerHTML = html;

        // Pill option select listener
        qContainer.querySelectorAll('.pill-option').forEach(pill => {
            pill.addEventListener('click', () => {
                qContainer.querySelectorAll('.pill-option').forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
                const radio = pill.querySelector('input');
                if (radio) radio.checked = true;
            });
        });
    }

    function saveCurrentQuestionAnswer() {
        const q = QUESTIONS[state.currentQIndex];
        if (q.type === 'time') {
            const input = document.getElementById(`q-input-${q.id}`);
            if (input) state.answers[q.id] = input.value;
        } else if (q.type === 'select') {
            const checked = qContainer.querySelector('input[name="q-option"]:checked');
            if (checked) state.answers[q.id] = checked.value;
        }
    }

    // Event Handling
    function setupEventListeners() {
        prevQBtn.addEventListener('click', () => {
            saveCurrentQuestionAnswer();
            if (state.currentQIndex > 0) renderQuestion(state.currentQIndex - 1);
        });

        nextQBtn.addEventListener('click', () => {
            saveCurrentQuestionAnswer();
            if (state.currentQIndex < QUESTIONS.length - 1) {
                renderQuestion(state.currentQIndex + 1);
            } else {
                startPacedGeneration();
            }
        });

        // Toolbar Toggle
        document.getElementById('toggle-toolbar-btn').addEventListener('click', (e) => {
            const body = document.getElementById('toolbar-body');
            const hidden = body.classList.toggle('hidden');
            e.target.setAttribute('aria-expanded', !hidden);
        });

        // Theme & Color Selectors
        themeSelect.addEventListener('change', (e) => {
            state.theme = e.target.value;
            applyAppearance();
            saveState();
        });

        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                state.accent = dot.dataset.color;
                applyAppearance();
                saveState();
            });
        });

        emojiToggle.addEventListener('click', () => {
            state.showEmojis = !state.showEmojis;
            emojiToggle.textContent = state.showEmojis ? 'Show Emojis' : 'Hide Emojis';
            emojiToggle.setAttribute('aria-pressed', state.showEmojis);
            applyAppearance();
            saveState();
        });

        routineLevelSelect.addEventListener('change', (e) => {
            state.routineLevel = e.target.value;
            generateScheduleFromAnswers();
            renderScheduleDashboard();
            saveState();
        });

        // Add Step Form
        document.getElementById('add-step-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const emoji = document.getElementById('new-emoji-select').value;
            const timeRaw = document.getElementById('new-step-time').value;
            const text = document.getElementById('new-step-text').value.trim();

            if (!text) return;

            state.scheduleItems.push({
                id: Date.now(),
                time: formatTimeStr(timeRaw),
                timeRaw: timeRaw,
                emoji: emoji,
                text: text,
                completed: false
            });

            state.scheduleItems.sort((a, b) => (a.timeRaw || '').localeCompare(b.timeRaw || ''));

            document.getElementById('new-step-text').value = '';
            renderScheduleDashboard();
            saveState();
        });

        // Upload File Setup
        setupFileUpload();

        // Wind-Down & Alarm Buttons
        document.getElementById('start-winddown-btn').addEventListener('click', () => startWindDown(5 * 60));
        document.getElementById('dev-quick-test-btn').addEventListener('click', () => startWindDown(5)); // 5 second test
        document.getElementById('cancel-winddown-btn').addEventListener('click', stopWindDown);
        document.getElementById('emergency-exit-btn').addEventListener('click', exitSleepMode);
        document.getElementById('stop-alarm-btn').addEventListener('click', stopAlarm);
        document.getElementById('toggle-sound-btn').addEventListener('click', toggleMuteSound);

        document.getElementById('retake-quiz-btn').addEventListener('click', () => {
            if (confirm('Retake the questionnaire and reset your schedule?')) {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                state.answers = {};
                renderQuestion(0);
                switchView('quiz');
            }
        });
    }

    // Paced Generation Transition
    function startPacedGeneration() {
        switchView('transition');
        const heading = document.getElementById('transition-heading');
        const status = document.getElementById('transition-status');

        const steps = [
            { h: "Let's find a rhythm that fits your life.", s: "Looking at your sleep patterns…" },
            { h: "Balancing your morning commitments…", s: "Adjusting for early classes & study load…" },
            { h: "Finding a realistic wind-down window…", s: "Minimizing nighttime friction & phone triggers…" },
            { h: "Building your gentle routine…", s: "Almost ready!" }
        ];

        let idx = 0;
        const interval = setInterval(() => {
            idx++;
            if (idx < steps.length) {
                heading.textContent = steps[idx].h;
                status.textContent = steps[idx].s;
            } else {
                clearInterval(interval);
                generateScheduleFromAnswers();
                saveState();
                applyAppearance();
                renderScheduleDashboard();
                switchView('schedule');
            }
        }, 850);
    }

    // Smart Schedule Calculation Algorithm
    function generateScheduleFromAnswers() {
        const wakeTimeVal = state.answers['q13'] || state.answers['q2'] || '08:00';
        const desiredHours = parseInt((state.answers['q4'] || '8 hours').split(' ')[0], 10) || 8;
        const windDownMins = parseInt((state.answers['q24'] || '30 minutes').split(' ')[0], 10) || 30;

        const [wakeH, wakeM] = wakeTimeVal.split(':').map(Number);
        const wakeDate = new Date();
        wakeDate.setHours(wakeH, wakeM, 0, 0);

        const bedtimeDate = new Date(wakeDate.getTime() - (desiredHours * 60 * 60 * 1000));
        const windDownDate = new Date(bedtimeDate.getTime() - (windDownMins * 60 * 1000));

        state.calculatedTimes = {
            windDown: formatTime(windDownDate),
            bedtime: formatTime(bedtimeDate),
            wake: formatTime(wakeDate)
        };

        const activity = state.answers['q23'] || 'Reading a physical book';
        let actEmoji = '📖';
        if (activity.includes('music')) actEmoji = '🎵';
        if (activity.includes('Journaling')) actEmoji = '📝';
        if (activity.includes('stretching')) actEmoji = '🧘';

        // Base Step List
        let allSteps = [
            { id: 1, timeRaw: getTimeOffset(windDownDate, -30), emoji: '📚', text: 'School & Study Shutdown: Close tabs and pack bag for morning', completed: false },
            { id: 2, timeRaw: getTimeOffset(windDownDate, -15), emoji: '🍵', text: 'Light Snack / Water & Caffeine Stop', completed: false },
            { id: 3, timeRaw: getTimeOffset(windDownDate, 0), emoji: '📱', text: 'Digital Sunset: Place phone on charger across the room', completed: false },
            { id: 4, timeRaw: getTimeOffset(windDownDate, 10), emoji: '🚿', text: 'Nighttime Hygiene: Brush teeth, skincare, dim room lights', completed: false },
            { id: 5, timeRaw: getTimeOffset(windDownDate, 20), emoji: actEmoji, text: `Wind-Down Activity: ${activity}`, completed: false },
            { id: 6, timeRaw: getTimeOffset(bedtimeDate, -5), emoji: '🧘', text: 'In Bed: Gentle deep breathing & eyes closed', completed: false },
            { id: 7, timeRaw: getTimeOffset(bedtimeDate, 0), emoji: '😴', text: 'Target Bedtime: Sleeping for full recharge', completed: false }
        ];

        // Filter based on Gradual Level Selector
        if (state.routineLevel === 'starter') {
            allSteps = [allSteps[2], allSteps[3], allSteps[6]]; // Core 3
        } else if (state.routineLevel === 'balanced') {
            allSteps = [allSteps[0], allSteps[2], allSteps[3], allSteps[4], allSteps[6]]; // 5 Steps
        }

        allSteps.forEach(s => s.time = formatTimeStr(s.timeRaw));
        state.scheduleItems = allSteps;
    }

    // Dashboard UI Rendering
    function renderScheduleDashboard() {
        document.getElementById('display-wind-down').textContent = state.calculatedTimes.windDown;
        document.getElementById('display-bedtime').textContent = state.calculatedTimes.bedtime;
        document.getElementById('display-wake-time').textContent = state.calculatedTimes.wake;

        scheduleBullets.innerHTML = '';

        state.scheduleItems.forEach(item => {
            const li = document.createElement('li');
            li.className = `bullet-item ${item.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="bullet-main">
                    <input type="checkbox" class="bullet-checkbox" ${item.completed ? 'checked' : ''} aria-label="Mark completed">
                    <span class="bullet-emoji">${item.emoji}</span>
                    <span class="bullet-time" data-id="${item.id}">${item.time}</span>
                    <span class="bullet-text" data-id="${item.id}">${escapeHtml(item.text)}</span>
                </div>
                <div class="bullet-actions">
                    <button class="item-btn edit-btn" title="Edit Step">&#9998;</button>
                    <button class="item-btn delete-btn" title="Delete Step">&times;</button>
                </div>
            `;

            // Checkbox event
            li.querySelector('.bullet-checkbox').addEventListener('change', (e) => {
                item.completed = e.target.checked;
                li.classList.toggle('completed', item.completed);
                saveState();
            });

            // Delete event
            li.querySelector('.delete-btn').addEventListener('click', () => {
                state.scheduleItems = state.scheduleItems.filter(i => i.id !== item.id);
                renderScheduleDashboard();
                saveState();
            });

            // Edit inline event
            li.querySelector('.edit-btn').addEventListener('click', () => {
                makeItemEditable(li, item);
            });

            scheduleBullets.appendChild(li);
        });
    }

    function makeItemEditable(liElem, item) {
        const textSpan = liElem.querySelector('.bullet-text');
        const currentText = item.text;
        
        textSpan.innerHTML = `<input type="text" class="bullet-text-input" value="${escapeHtml(currentText)}">`;
        const input = textSpan.querySelector('input');
        input.focus();

        const saveEdit = () => {
            const newText = input.value.trim() || currentText;
            item.text = newText;
            renderScheduleDashboard();
            saveState();
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEdit(); });
    }

    // Schedule Upload Drag & Drop Handling
    function setupFileUpload() {
        const dropZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('schedule-file');
        const display = document.getElementById('file-name-display');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); });
        });

        dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        
        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleFile(e.target.files[0]);
        });

        function handleFile(file) {
            state.uploadedFile = file.name;
            display.textContent = `Attached: ${file.name} (Schedule synced)`;
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                parseScheduleContent(evt.target.result);
                saveState();
            };
            reader.readAsText(file);
        }
    }

    function parseScheduleContent(content) {
        // Quick parser looking for morning time patterns like 08:00 or 8:30
        const match = content.match(/\b([01]?[0-9]|2[0-3]):[0-5][0-9]\b/);
        if (match) {
            state.answers['q13'] = match[0];
            generateScheduleFromAnswers();
            renderScheduleDashboard();
            alert(`Detected earliest schedule commitment at ${match[0]}. Routine updated!`);
        }
    }

    // 5-MINUTE WIND-DOWN TIMER
    function startWindDown(durationSeconds) {
        switchView('winddown');
        let remaining = durationSeconds;
        const timerElem = document.getElementById('winddown-timer-display');
        const breathingText = document.getElementById('breathing-text');

        updateTimerDisplay(remaining, timerElem);

        const prompts = [
            "Take a slow breath. You don't need to do anything else right now.",
            "Put your phone down on your desk or charger.",
            "Exhale softly... release any lingering thoughts of the day.",
            "Relax your shoulders and unclench your jaw."
        ];
        let pIdx = 0;

        breathingTimer = setInterval(() => {
            pIdx = (pIdx + 1) % prompts.length;
            breathingText.textContent = prompts[pIdx];
        }, 4000);

        winddownTimer = setInterval(() => {
            remaining--;
            updateTimerDisplay(remaining, timerElem);

            if (remaining <= 0) {
                stopWindDown();
                enterSleepMode();
            }
        }, 1000);
    }

    function stopWindDown() {
        if (winddownTimer) clearInterval(winddownTimer);
        if (breathingTimer) clearInterval(breathingTimer);
        switchView('schedule');
    }

    function updateTimerDisplay(sec, elem) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        elem.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // SLEEP MODE & WEB AUDIO NOISE GENERATOR
    function enterSleepMode() {
        lockdownOverlay.classList.add('active');
        startWhiteNoise();

        const countdownElem = document.getElementById('lockdown-countdown');
        let sleepSecs = 8 * 3600; // Default 8 hrs countdown simulation

        countdownTimer = setInterval(() => {
            sleepSecs--;
            if (sleepSecs <= 0) {
                clearInterval(countdownTimer);
                triggerWakeAlarm();
            } else {
                const h = Math.floor(sleepSecs / 3600);
                const m = Math.floor((sleepSecs % 3600) / 60);
                const s = sleepSecs % 60;
                countdownElem.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    function exitSleepMode() {
        if (confirm('Exit Sleep Mode and return to main dashboard?')) {
            if (countdownTimer) clearInterval(countdownTimer);
            stopWhiteNoise();
            lockdownOverlay.classList.remove('active');
            switchView('schedule');
        }
    }

    // Web Audio Brownian / White Noise Generator
    function startWhiteNoise() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = audioCtx.sampleRate * 2;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                // Brown noise filter formula for deeper, warmer sleep sound
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; 
            }

            whiteNoiseSource = audioCtx.createBufferSource();
            whiteNoiseSource.buffer = buffer;
            whiteNoiseSource.loop = true;

            const gainNode = audioCtx.createGain();
            gainNode.gain.value = isMuted ? 0 : 0.05;

            whiteNoiseSource.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            whiteNoiseSource.start();
        } catch (e) {
            console.log("Audio Context initialization waiting for user gesture.");
        }
    }

    function stopWhiteNoise() {
        if (whiteNoiseSource) {
            try { whiteNoiseSource.stop(); whiteNoiseSource.disconnect(); } catch (e) {}
        }
    }

    function toggleMuteSound() {
        isMuted = !isMuted;
        const btn = document.getElementById('toggle-sound-btn');
        btn.textContent = isMuted ? 'Unmute' : 'Mute';
        stopWhiteNoise();
        if (!isMuted) startWhiteNoise();
    }

    // WAKE-UP ALARM EXPERIENCE
    function triggerWakeAlarm() {
        stopWhiteNoise();
        lockdownOverlay.classList.remove('active');
        alarmOverlay.classList.add('active');

        playGentleAlarmChime();
    }

    function playGentleAlarmChime() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [261.63, 329.63, 392.00, 523.25]; // C major gentle chord
        const now = audioCtx.currentTime;

        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, now + (i * 0.4));
            gain.gain.exponentialRampToValueAtTime(0.0001, now + (i * 0.4) + 1.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + (i * 0.4));
            osc.stop(now + (i * 0.4) + 1.6);
        });
    }

    function stopAlarm() {
        alarmOverlay.classList.remove('active');
        switchView('schedule');
    }

    // Helper Functions
    function switchView(viewKey) {
        Object.keys(views).forEach(k => views[k].classList.remove('active'));
        if (views[viewKey]) views[viewKey].classList.add('active');
    }

    function applyAppearance() {
        document.body.setAttribute('data-theme', state.theme);
        document.body.setAttribute('data-accent', state.accent);
        themeSelect.value = state.theme;
        routineLevelSelect.value = state.routineLevel;
        document.body.classList.toggle('hide-emojis', !state.showEmojis);
    }

    function saveState() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }

    function getTimeOffset(baseDate, offsetMinutes) {
        const d = new Date(baseDate.getTime() + (offsetMinutes * 60 * 1000));
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    function formatTimeStr(time24) {
        if (!time24) return '10:00 PM';
        const [h, m] = time24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = (h % 12) || 12;
        return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    function formatTime(dateObj) {
        let h = dateObj.getHours();
        let m = dateObj.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = (h % 12) || 12;
        return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
// --- EventListeners ---
function setupEventListeners() {
    // Add button  event listeners here
}
});

```
