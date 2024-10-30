// Add this script tag to your HTML temporarily
// <script src="seed-database.js"></script>
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
async function seedDatabase() {
    try {
        // Add students
        const studentsData = [
            {
                firstName: "John",
                lastName: "Doe",
                grade: 10,
                class: "10A"
            },
            {
                firstName: "Jane",
                lastName: "Smith",
                grade: 10,
                class: "10B"
            }
        ];

        // Add each student and store their IDs
        const studentIds = [];
        for (const student of studentsData) {
            const docRef = await db.collection('students').add(student);
            studentIds.push(docRef.id);
            console.log(`Added student with ID: ${docRef.id}`);
        }

        // Add mood entries
        const moodData = [
            {
                studentId: studentIds[0],
                timestamp: new Date(),
                moodScore: 4,
                moodLabel: "Happy",
                notes: "Had a great day in class"
            },
            {
                studentId: studentIds[0],
                timestamp: new Date(Date.now() - 86400000), // Yesterday
                moodScore: 3,
                moodLabel: "Neutral",
                notes: "Regular day"
            },
            {
                studentId: studentIds[1],
                timestamp: new Date(),
                moodScore: 5,
                moodLabel: "Excited",
                notes: "Aced the test!"
            }
        ];

        for (const mood of moodData) {
            await db.collection('moodEntries').add(mood);
            console.log('Added mood entry');
        }

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

// Add a button to your HTML temporarily to run this:
// <button onclick="seedDatabase()">Seed Database</button> 