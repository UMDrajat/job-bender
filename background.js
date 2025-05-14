// Initialize Firebase
importScripts('firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js', 'firebase-config.js');

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NEW_APPLICATION') {
        handleNewApplication(message.data);
    } else if (message.message === 'fill') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { message: 'fill' });
        });
    }
});

// Handle new application
async function handleNewApplication(data) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Get existing applications
        const doc = await db.collection('users').doc(user.uid).get();
        const userData = doc.data() || {};
        const applications = userData.applications || [];

        // Add new application
        const newApp = {
            id: Date.now(),
            company: data.company,
            position: data.position,
            date: new Date().toISOString().split('T')[0],
            status: 'applied'
        };

        applications.push(newApp);

        // Save to Firestore
        await db.collection('users').doc(user.uid).update({
            applications,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon48.png',
            title: 'New Application Tracked',
            message: `Successfully tracked application for ${data.position} at ${data.company}`
        });
    } catch (error) {
        console.error('Error handling new application:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon48.png',
            title: 'Error',
            message: 'Failed to track application. Please try again.'
        });
    }
}

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: 'https://github.com/UMDrajat/job-bender#readme'
        });
    }
});

// Handle periodic sync
chrome.alarms.create('syncData', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'syncData') {
        syncData();
    }
});

async function syncData() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists) return;

        const data = doc.data();
        if (!data.lastUpdated) return;

        // Check if data needs sync
        const lastSync = data.lastUpdated.toDate();
        const now = new Date();
        const hoursSinceLastSync = (now - lastSync) / (1000 * 60 * 60);

        if (hoursSinceLastSync >= 24) {
            // Sync data
            await db.collection('users').doc(user.uid).update({
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error syncing data:', error);
    }
}