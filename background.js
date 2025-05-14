// Remove Firebase importScripts and replace with Supabase imports if needed
// Remove all references to db, auth, and firebase.firestore
// Use Supabase for user authentication and data storage
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import AuthService from './auth.js';
import ApplicationsService from './services/applications.js';

const authService = new AuthService();
const applicationsService = new ApplicationsService();

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

// Handle new application using Supabase
async function handleNewApplication(data) {
    try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        // Add new application using ApplicationsService
        await applicationsService.recordApplication({
            companyName: data.company,
            position: data.position,
            jobUrl: data.jobUrl || '',
            status: 'applied',
            notes: '',
            salaryRange: '',
            location: '',
            jobType: '',
            interviewDate: null,
            interviewType: '',
            followUpDate: null,
            contactName: '',
            contactEmail: '',
            contactPhone: ''
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

// Handle periodic sync (if needed, can be expanded for Supabase)
chrome.alarms.create('syncData', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'syncData') {
        syncData();
    }
});

// Example syncData function using Supabase (can be expanded as needed)
async function syncData() {
    try {
        const user = await authService.getCurrentUser();
        if (!user) return;
        // Optionally, trigger a refresh or sync logic here using Supabase
        // For now, just log sync event
        console.log('Sync event triggered for user:', user.id);
    } catch (error) {
        console.error('Error syncing data:', error);
    }
}