// Initialize Firebase (replace with your config)
import { initializeApp } from "firebase/app";
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
        const date = new Date(entry.timestamp).toLocaleDateString();
        
        row.innerHTML = `
            <td>${date}</td>
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
        const date = new Date(entry.timestamp).toLocaleDateString();
        if (!dailyAverages[date]) {
            dailyAverages[date] = { sum: 0, count: 0 };
        }
        dailyAverages[date].sum += entry.moodScore;
        dailyAverages[date].count += 1;
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

// Initialize the dashboard when the page loads
initializeDashboard(); 