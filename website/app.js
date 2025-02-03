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

// DOM Elements for adding students
const addStudentBtn = document.getElementById('add-student-btn');
const studentFirstName = document.getElementById('student-first-name');
const studentLastName = document.getElementById('student-last-name');
const studentGrade = document.getElementById('student-grade');
const addStudentForm = document.getElementById('add-student-form');

// DOM Elements for removing students
const removeStudentBtn = document.getElementById('remove-student-btn');
const studentToRemove = document.getElementById('student-to-remove');

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
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Set to the start of the current week (Monday)
        fetchAndDisplayWeeklySummary(startDate);
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

// Fetch and display mood data for a specific student over time
async function fetchAndDisplayStudentDataOverTime(studentId) {
    try {
        let query = db.collection('moodEntries').where('studentId', '==', studentId).orderBy('timestamp', 'asc');
        const snapshot = await query.get();
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        displayStudentDataOverTime(data);
    } catch (error) {
        console.error('Failed to fetch student data over time:', error);
    }
}

// Display student data over time
function displayStudentDataOverTime(data) {
    const container = document.getElementById('student-data-over-time');
    container.innerHTML = ''; // Clear existing content

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No data available for the selected student.</p>';
        return;
    }

    // Create a table to display the data
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Mood</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach(entry => {
        const row = document.createElement('tr');
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
            <td>${entry.moodLabel}</td>
            <td>${entry.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    container.appendChild(table);
}

// Fetch and display mood data for all students on a specific date
async function fetchAndDisplayDataForDate(date) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let query = db.collection('moodEntries').where('timestamp', '>=', startOfDay).where('timestamp', '<=', endOfDay);
        const snapshot = await query.get();
        const data = await Promise.all(snapshot.docs.map(async doc => {
            const moodData = doc.data();
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
        displayDataForDate(data);
    } catch (error) {
        console.error('Failed to fetch data for date:', error);
    }
}

// Display data for all students on a specific date
function displayDataForDate(data) {
    const container = document.getElementById('data-for-date');
    container.innerHTML = ''; // Clear existing content

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No data available for the selected date.</p>';
        return;
    }

    // Create a table to display the data
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Student</th>
                <th>Mood</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.studentName}</td>
            <td>${entry.moodLabel}</td>
            <td>${entry.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    container.appendChild(table);
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

// Populate the student dropdowns with fetched students
function populateStudentSelect(students) {
    // Keep the "All Students" option
    studentSelect.innerHTML = '<option value="">All Students</option>';
    studentToRemove.innerHTML = '<option value="">Select Student</option>';
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.studentId;
        option.textContent = `${student.firstName} ${student.lastName}`;
        studentSelect.appendChild(option);

        const removeOption = document.createElement('option');
        removeOption.value = student.studentId;
        removeOption.textContent = `${student.firstName} ${student.lastName}`;
        studentToRemove.appendChild(removeOption);
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
    // Group data by date and calculate mood breakdown
    const dailyMoodBreakdown = {};
    data.forEach(entry => {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        if (!dailyMoodBreakdown[dateStr]) {
            dailyMoodBreakdown[dateStr] = { green: 0, blue: 0, yellow: 0, red: 0, count: 0 };
        }
        dailyMoodBreakdown[dateStr][entry.moodLabel]++;
        dailyMoodBreakdown[dateStr].count++;
    });

    // Sort dates
    const sortedDates = Object.keys(dailyMoodBreakdown).sort((a, b) => new Date(a) - new Date(b));

    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'mood-chart';
    chartContainer.innerHTML = '<h3>Daily Mood Averages</h3>';

    // Create bar chart
    const chart = document.createElement('div');
    chart.className = 'chart';

    sortedDates.forEach(date => {
        const data = dailyMoodBreakdown[date];
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';

        const totalHeight = 200; // Total height of the bar in pixels
        const greenHeight = (data.green / data.count) * totalHeight;
        const blueHeight = (data.blue / data.count) * totalHeight;
        const yellowHeight = (data.yellow / data.count) * totalHeight;
        const redHeight = (data.red / data.count) * totalHeight;

        const greenBar = document.createElement('div');
        greenBar.className = 'bar green';
        greenBar.style.height = `${greenHeight}px`;

        const blueBar = document.createElement('div');
        blueBar.className = 'bar blue';
        blueBar.style.height = `${blueHeight}px`;

        const yellowBar = document.createElement('div');
        yellowBar.className = 'bar yellow';
        yellowBar.style.height = `${yellowHeight}px`;

        const redBar = document.createElement('div');
        redBar.className = 'bar red';
        redBar.style.height = `${redHeight}px`;

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = date;

        barContainer.appendChild(greenBar);
        barContainer.appendChild(blueBar);
        barContainer.appendChild(yellowBar);
        barContainer.appendChild(redBar);
        barContainer.appendChild(label);

        chart.appendChild(barContainer);
    });

    chartContainer.appendChild(chart);
    moodContainer.appendChild(chartContainer);
}

// Add a new student to the database
async function addStudent(event) {
    event.preventDefault();
    const firstName = studentFirstName.value.trim();
    const lastName = studentLastName.value.trim();
    const grade = studentGrade.value.trim();

    if (!firstName || !lastName || !grade) {
        showError(addStudentForm, 'All fields are required.');
        return;
    }

    try {
        await db.collection('students').add({
            firstName,
            lastName,
            grade
        });
        studentFirstName.value = '';
        studentLastName.value = '';
        studentGrade.value = '';
        showSuccess(addStudentForm, 'Student added successfully.');
        await initializeDashboard(); // Refresh the student list
    } catch (error) {
        console.error('Error adding student:', error);
        showError(addStudentForm, 'Failed to add student. Please try again.');
    }
}

// Remove a student from the database
async function removeStudent(event) {
    event.preventDefault();
    const studentId = studentToRemove.value;

    if (!studentId) {
        showError(removeStudentForm, 'Please select a student to remove.');
        return;
    }

    try {
        await db.collection('students').doc(studentId).delete();
        showSuccess(removeStudentForm, 'Student removed successfully.');
        await initializeDashboard(); // Refresh the student list
    } catch (error) {
        console.error('Error removing student:', error);
        showError(removeStudentForm, 'Failed to remove student. Please try again.');
    }
}

// Fetch and display weekly summary data
async function fetchAndDisplayWeeklySummary(startDate) {
    try {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 4); // End date is 4 days after start date (Monday to Friday)

        let query = db.collection('moodEntries')
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate);
        
        const snapshot = await query.get();
        const data = snapshot.docs.map(doc => doc.data());

        const weeklySummary = {};

        // Initialize weekly summary structure
        for (let day = 0; day < 5; day++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + day);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            weeklySummary[dateStr] = {};

            for (let hour = 9; hour < 15; hour++) {
                const timeFrame = `${hour}:45 AM - ${hour + 1}:45 AM`;
                weeklySummary[dateStr][timeFrame] = { green: 0, blue: 0, yellow: 0, red: 0, count: 0 };
            }
        }

        // Populate weekly summary with data
        data.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            const hour = date.getHours();
            const timeFrame = `${hour}:45 AM - ${hour + 1}:45 AM`;

            if (weeklySummary[dateStr] && weeklySummary[dateStr][timeFrame]) {
                weeklySummary[dateStr][timeFrame][entry.moodLabel]++;
                weeklySummary[dateStr][timeFrame].count++;
            }
        });

        displayWeeklySummary(weeklySummary, startDate);
    } catch (error) {
        console.error('Failed to fetch weekly summary:', error);
    }
}

// Display weekly summary data
function displayWeeklySummary(data, startDate) {
    const container = document.getElementById('weekly-summary');
    container.innerHTML = `
        <h2>Weekly Summary</h2>
        <button id="prev-week-btn" class="small-button">Previous Week</button>
        <button id="next-week-btn" class="small-button">Next Week</button>
    `;
    container.dataset.startDate = startDate.toISOString();

    const table = document.createElement('table');
    table.className = 'weekly-summary-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Time</th>
                <th>Monday<br>${formatDate(startDate)}</th>
                <th>Tuesday<br>${formatDate(addDays(startDate, 1))}</th>
                <th>Wednesday<br>${formatDate(addDays(startDate, 2))}</th>
                <th>Thursday<br>${formatDate(addDays(startDate, 3))}</th>
                <th>Friday<br>${formatDate(addDays(startDate, 4))}</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    const timeFrames = [
        '9:45 AM - 10:45 AM',
        '10:45 AM - 11:45 AM',
        '11:45 AM - 12:45 PM',
        '12:45 PM - 1:45 PM',
        '1:45 PM - 2:45 PM',
        '2:45 PM - 3:45 PM'
    ];

    timeFrames.forEach(timeFrame => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${timeFrame}</td>`;

        for (let day = 0; day < 5; day++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + day);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

            const cellData = data[dateStr][timeFrame];
            if (cellData && cellData.count > 0) {
                const totalResponses = cellData.count;
                const averageMood = {
                    green: cellData.green / totalResponses,
                    blue: cellData.blue / totalResponses,
                    yellow: cellData.yellow / totalResponses,
                    red: cellData.red / totalResponses
                };

                const cell = document.createElement('td');
                cell.style.backgroundColor = `rgba(${averageMood.green * 255}, ${averageMood.blue * 255}, ${averageMood.yellow * 255}, ${averageMood.red * 255}, ${totalResponses / 10})`;
                cell.title = `Responses: ${totalResponses}`;
                row.appendChild(cell);
            } else {
                const cell = document.createElement('td');
                cell.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                cell.title = 'No responses';
                row.appendChild(cell);
            }
        }

        tbody.appendChild(row);
    });

    container.appendChild(table);

    // Reattach event listeners for week navigation buttons
    document.getElementById('prev-week-btn').addEventListener('click', () => {
        const currentStartDate = new Date(document.getElementById('weekly-summary').dataset.startDate);
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        fetchAndDisplayWeeklySummary(currentStartDate);
    });

    document.getElementById('next-week-btn').addEventListener('click', () => {
        const currentStartDate = new Date(document.getElementById('weekly-summary').dataset.startDate);
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        fetchAndDisplayWeeklySummary(currentStartDate);
    });
}

// Helper functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Show success message
function showSuccess(parentElement, message) {
    // Remove any existing success messages
    const existingSuccess = parentElement.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }

    // Create and add new success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    parentElement.appendChild(successDiv);

    // Make it visible after a brief delay (for animation)
    requestAnimationFrame(() => {
        successDiv.classList.add('visible');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.classList.remove('visible');
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

// Event Listeners
applyFiltersBtn.addEventListener('click', fetchAndDisplayMoodData);
document.getElementById('view-student-data-btn').addEventListener('click', () => {
    const studentId = studentSelect.value;
    if (studentId) {
        fetchAndDisplayStudentDataOverTime(studentId);
    }
});
document.getElementById('view-date-data-btn').addEventListener('click', () => {
    const date = document.getElementById('specific-date').value;
    if (date) {
        fetchAndDisplayDataForDate(date);
    }
});

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
        // Wrong code - replace alert with showError
        showError(document.querySelector('.auth-content'), 'Incorrect code');
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
        await enterFullscreen();
        studentSelection.classList.add('hidden');
        zoneSelection.classList.remove('hidden');
    } else {
        showError(studentSelection, 'Please choose your name first!');
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
            timestamp: Date.now(),
            moodLabel: zone,
            notes: `Student selected ${zone} zone`
        });

        zoneSelection.classList.add('hidden');
        thankYou.classList.remove('hidden');
    } catch (error) {
        console.error('Error logging mood:', error);
        showError(zoneSelection, 'Something went wrong. Please try again.');
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

function showError(parentElement, message) {
    // Remove any existing error messages
    const existingError = parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Create and add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    parentElement.appendChild(errorDiv);

    // Make it visible after a brief delay (for animation)
    requestAnimationFrame(() => {
        errorDiv.classList.add('visible');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        errorDiv.classList.remove('visible');
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
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

// Event Listeners for weekly summary navigation
document.getElementById('prev-week-btn').addEventListener('click', () => {
    const currentStartDate = new Date(document.getElementById('weekly-summary').dataset.startDate);
    currentStartDate.setDate(currentStartDate.getDate() - 7);
    fetchAndDisplayWeeklySummary(currentStartDate);
});

document.getElementById('next-week-btn').addEventListener('click', () => {
    const currentStartDate = new Date(document.getElementById('weekly-summary').dataset.startDate);
    currentStartDate.setDate(currentStartDate.getDate() + 7);
    fetchAndDisplayWeeklySummary(currentStartDate);
});

// Initialize student mode by default
document.addEventListener('DOMContentLoaded', () => {
    populateStudentPicker();
});

addStudentBtn.addEventListener('click', addStudent);
removeStudentBtn.addEventListener('click', removeStudent);