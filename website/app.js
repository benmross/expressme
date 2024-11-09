// Initialize Firebase (replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyCBHaULBqHDi1UASQMYZ1lc1st3y67qpH0",
    authDomain: "expressme-27298.firebaseapp.com",
    projectId: "expressme-27298",
    storageBucket: "expressme-27298.appspot.com",
    messagingSenderId: "719261410743",
    appId: "1:719261410743:web:294854748d08aac2abb432"
  };
  

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const studentSelect = document.getElementById('student-select');
const dateStart = document.getElementById('date-start');
const dateEnd = document.getElementById('date-end');
const applyFiltersBtn = document.getElementById('apply-filters');
const moodContainer = document.getElementById('mood-data');
const modeSwitch = document.getElementById('mode-switch');
const teacherDashboard = document.getElementById('teacher-dashboard');
const studentInterface = document.getElementById('student-interface');
const studentSelection = document.getElementById('student-selection');
const zoneSelection = document.getElementById('zone-selection');
const thankYou = document.getElementById('thank-you');
const studentPicker = document.getElementById('student-picker');
const confirmStudent = document.getElementById('confirm-student');
const resetStudent = document.getElementById('reset-student');
const teacherAuth = document.getElementById('teacher-auth');
const teacherCode = document.getElementById('teacher-code');
const submitCode = document.getElementById('submit-code');
const cancelAuth = document.getElementById('cancel-auth');

let selectedStudent = null;
let isProcessing = false; // Prevent multiple submissions

// Teacher code (in a real app, this would be managed securely)
const TEACHER_CODE = '1234';

// Initialize the dashboard
async function initializeDashboard() {
    try {
        // Fetch and populate student list
        const students = await fetchStudents();
        populateStudentSelect(students);
        
        // Load initial data
        await fetchAndDisplayMoodData();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
}

// Fetch mood data based on filters
async function fetchAndDisplayMoodData() {
    const filters = {
        student: studentSelect.value,
        startDate: dateStart.value,
        endDate: dateEnd.value
    };

    try {
        let query = db.collection('moodEntries');
        
        if (filters.student) {
            query = query.where('studentId', '==', filters.student);
        }
        if (filters.startDate) {
            query = query.where('timestamp', '>=', new Date(filters.startDate));
        }
        if (filters.endDate) {
            query = query.where('timestamp', '<=', new Date(filters.endDate));
        }

        const snapshot = await query.get();
        const data = await Promise.all(snapshot.docs.map(async doc => {
            const moodData = doc.data();
            // Get student name if needed
            if (moodData.studentId) {
                const studentDoc = await db.collection('students').doc(moodData.studentId).get();
                const studentData = studentDoc.data();
                moodData.studentName = `${studentData.firstName} ${studentData.lastName}`;
            }
            return {
                id: doc.id,
                ...moodData
            };
        }));

        displayMoodData(data);
    } catch (error) {
        console.error('Failed to fetch mood data:', error);
    }
}

// Fetch list of students from the database
async function fetchStudents() {
    try {
        const snapshot = await db.collection('students').get();
        return snapshot.docs.map(doc => ({
            studentId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Failed to fetch students:', error);
        return [];
    }
}

// Populate the student dropdown with fetched students
function populateStudentSelect(students) {
    // Keep the "All Students" option
    studentSelect.innerHTML = '<option value="">All Students</option>';
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.studentId;
        option.textContent = `${student.firstName} ${student.lastName}`;
        studentSelect.appendChild(option);
    });
}

// Display mood data in the container
function displayMoodData(data) {
    moodContainer.innerHTML = ''; // Clear existing content
    
    if (!data || data.length === 0) {
        moodContainer.innerHTML = '<p>No mood data available for the selected filters.</p>';
        return;
    }

    // Create a table to display the mood data
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Mood</th>
                <th>Score</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach(entry => {
        const row = document.createElement('tr');
        // Convert timestamp to Date object
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${entry.studentName}</td>
            <td>${entry.moodLabel}</td>
            <td>${entry.moodScore}/5</td>
            <td>${entry.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    moodContainer.appendChild(table);

    // Add a simple visualization (bar chart showing average mood by day)
    createMoodChart(data);
}

// Create a simple visualization of mood data
function createMoodChart(data) {
    // Group data by date and calculate average mood
    const dailyAverages = {};
    data.forEach(entry => {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        if (!dailyAverages[dateStr]) {
            dailyAverages[dateStr] = { sum: 0, count: 0 };
        }
        dailyAverages[dateStr].sum += entry.moodScore;
        dailyAverages[dateStr].count += 1;
    });

    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'mood-chart';
    chartContainer.innerHTML = '<h3>Daily Mood Averages</h3>';

    // Create bar chart
    const chart = document.createElement('div');
    chart.className = 'chart';

    Object.entries(dailyAverages).forEach(([date, data]) => {
        const average = data.sum / data.count;
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${average * 20}px`; // Scale height by mood score
        bar.title = `${date}: ${average.toFixed(1)}/5`;
        chart.appendChild(bar);
    });

    chartContainer.appendChild(chart);
    moodContainer.appendChild(chartContainer);
}

// Event Listeners
applyFiltersBtn.addEventListener('click', fetchAndDisplayMoodData);

// Mode switching
modeSwitch.addEventListener('click', async () => {
    if (teacherDashboard.classList.contains('hidden')) {
        // Trying to enter teacher mode
        teacherAuth.classList.remove('hidden');
        teacherCode.value = ''; // Clear any previous input
        teacherCode.focus();
    } else {
        // Exit teacher mode
        exitFullscreen();
        teacherDashboard.classList.add('hidden');
        studentInterface.classList.remove('hidden');
        modeSwitch.textContent = 'Teacher Mode';
    }
});

// Handle teacher authentication
submitCode.addEventListener('click', async () => {
    if (teacherCode.value === TEACHER_CODE) {
        // Correct code entered
        teacherAuth.classList.add('hidden');
        teacherCode.value = '';
        studentInterface.classList.add('hidden');
        teacherDashboard.classList.remove('hidden');
        modeSwitch.textContent = 'Exit Teacher Mode';
        await initializeDashboard();
    } else {
        // Wrong code
        alert('Incorrect code');
        teacherCode.value = '';
        teacherCode.focus();
    }
});

// Cancel authentication
cancelAuth.addEventListener('click', () => {
    teacherAuth.classList.add('hidden');
    teacherCode.value = '';
});

// Allow Enter key to submit code
teacherCode.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        submitCode.click();
    }
});

// Populate student picker
async function populateStudentPicker() {
    try {
        const students = await fetchStudents();
        studentPicker.innerHTML = '<option value="">Choose your name</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.studentId;
            option.textContent = `${student.firstName} ${student.lastName}`;
            studentPicker.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating student picker:', error);
    }
}

// Confirm student selection
confirmStudent.addEventListener('click', async () => {
    selectedStudent = studentPicker.value;
    if (selectedStudent) {
        await enterFullscreen();  // Enter fullscreen when student confirms
        studentSelection.classList.add('hidden');
        zoneSelection.classList.remove('hidden');
    } else {
        alert('Please choose your name first!');
    }
});

// Handle zone selection
zoneSelection.addEventListener('click', async (e) => {
    if (isProcessing) return; // Prevent multiple submissions

    const zoneElement = e.target.closest('.zone');
    if (!zoneElement) return;

    isProcessing = true;

    try {
        const zone = zoneElement.dataset.zone;
        await db.collection('moodEntries').add({
            studentId: selectedStudent,
            timestamp: Date.now(), // Store as milliseconds since epoch
            moodLabel: zone,
            moodScore: getMoodScore(zone),
            notes: `Student selected ${zone} zone`
        });

        zoneSelection.classList.add('hidden');
        thankYou.classList.remove('hidden');
    } catch (error) {
        console.error('Error logging mood:', error);
        alert('Oops! Something went wrong. Please try again.');
    } finally {
        isProcessing = false;
    }
});

// Reset for new student
resetStudent.addEventListener('click', () => {
    resetStudentInterface();
});

// Helper functions
function getMoodScore(zone) {
    const scores = {
        green: 5,
        blue: 2,
        yellow: 3,
        red: 1
    };
    return scores[zone] || 3;
}

function resetStudentInterface() {
    selectedStudent = null;
    studentPicker.value = '';
    thankYou.classList.add('hidden');
    zoneSelection.classList.add('hidden');
    studentSelection.classList.remove('hidden');
}

async function enterFullscreen() {
    try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            await elem.msRequestFullscreen();
        }
    } catch (error) {
        console.error('Error entering fullscreen:', error);
    }
}

function exitFullscreen() {
    try {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    } catch (error) {
        console.error('Error exiting fullscreen:', error);
    }
}


// Initialize student mode by default
document.addEventListener('DOMContentLoaded', () => {
    populateStudentPicker();
}); 