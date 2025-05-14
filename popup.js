import applicationsService from './services/applications.js';

// Initialize UI elements
document.addEventListener("DOMContentLoaded", function() {
    initializeProfileInputs();
    initializeEventListeners();
    loadApplications();
});

function initializeProfileInputs() {
    const inputs = {
        firstName: document.getElementById("first-name"),
        lastName: document.getElementById("last-name"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        salary: document.getElementById("salary"),
        location: document.getElementById("location"),
        resume: document.getElementById('resume'),
        uploadedResume: document.getElementById('uploaded-resume')
    };

    // Load saved profile data
    chrome.storage.local.get(["profile"], function(result) {
        if (result.profile) {
            Object.keys(result.profile).forEach(key => {
                if (inputs[key]) inputs[key].value = result.profile[key];
            });
        }
    });

    // Load saved resume
    chrome.storage.local.get(["resume"], function(result) {
        if (result.resume) {
            inputs.uploadedResume.textContent = result.resume.name;
        }
    });

    // Handle resume upload
    inputs.resume.addEventListener('change', function() {
        const file = inputs.resume.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const resume = {
                    name: file.name,
                    content: e.target.result,
                    type: file.type
                };
                chrome.storage.local.set({ resume });
                inputs.uploadedResume.textContent = file.name;
            };
            reader.readAsDataURL(file);
        }
    });

    return inputs;
}

function initializeEventListeners() {
    // Save profile button
    document.querySelector(".btn-save").addEventListener("click", saveProfile);

    // Fill it button
    document.getElementById('fill-it').addEventListener('click', handleFillIt);

    // Open jobs button
    document.getElementById('open-jobs').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('jobs.html') });
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    // Filters
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        loadApplications({ status: e.target.value });
    });

    document.getElementById('dateFilter').addEventListener('change', (e) => {
        loadApplications({ startDate: e.target.value });
    });

    // Dark mode toggle
    document.getElementById('dark-mode').addEventListener('change', (e) => {
        document.body.classList.toggle('dark-mode', e.target.checked);
        scheduleSync();
    });

    // Data import/export
    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('import-data').addEventListener('click', importData);

    // Sync button
    document.getElementById('sync-now').addEventListener('click', handleSync);

    // Add new event listeners for enhanced features
    document.getElementById('show-stats').addEventListener('click', showApplicationStats);
    document.getElementById('show-interviews').addEventListener('click', showUpcomingInterviews);
    document.getElementById('show-followups').addEventListener('click', showFollowUpsNeeded);
}

async function handleFillIt() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tab.url);
        const title = tab.title;
        
        const titleMatch = title.match(/(.*?)(?:\s*[-|]\s*|\s+at\s+)(.*?)(?:\s*\|.*)?$/);
        
        const application = {
            companyName: titleMatch ? titleMatch[2].trim() : url.hostname,
            position: titleMatch ? titleMatch[1].trim() : 'Unknown Position',
            jobUrl: tab.url,
            status: 'applied',
            notes: ''
        };

        await applicationsService.recordApplication(application);
        showNotification('Application recorded successfully!');
        loadApplications();
    } catch (error) {
        console.error('Error recording application:', error);
        showNotification('Error recording application. Please try again.', 'error');
    }
}

async function loadApplications(filters = {}) {
    try {
        const applications = await applicationsService.getApplications(filters);
        const tbody = document.getElementById('applicationsList');
        tbody.innerHTML = '';

        applications.forEach(app => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${app.company_name}</td>
                <td>${app.position}</td>
                <td>${new Date(app.application_date).toLocaleDateString()}</td>
                <td>
                    <select class="status-select" data-id="${app.id}">
                        <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
                        <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Interview</option>
                        <option value="offered" ${app.status === 'offered' ? 'selected' : ''}>Offered</option>
                        <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                        <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="stale" ${app.status === 'stale' ? 'selected' : ''}>Stale</option>
                    </select>
                </td>
                <td>${app.job_type || '-'}</td>
                <td>${app.location || '-'}</td>
                <td>
                    ${app.interview_date ? new Date(app.interview_date).toLocaleDateString() : '-'}
                </td>
                <td>
                    <button class="btn-edit" data-id="${app.id}">Edit</button>
                    <button class="btn-delete" data-id="${app.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for edit buttons
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                showEditModal(applications.find(app => app.id === id));
            });
        });

        // Add event listeners for status changes
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const newStatus = e.target.value;
                try {
                    await applicationsService.updateApplication(id, { status: newStatus });
                    showNotification('Status updated successfully!');
                } catch (error) {
                    console.error('Error updating status:', error);
                    showNotification('Error updating status. Please try again.', 'error');
                }
            });
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this application?')) {
                    try {
                        await applicationsService.deleteApplication(id);
                        showNotification('Application deleted successfully!');
                        loadApplications();
                    } catch (error) {
                        console.error('Error deleting application:', error);
                        showNotification('Error deleting application. Please try again.', 'error');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading applications:', error);
        showNotification('Error loading applications. Please try again.', 'error');
    }
}

function saveProfile() {
    const profile = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        salary: document.getElementById('salary').value,
        location: document.getElementById('location').value
    };

    chrome.storage.local.set({ profile }).then(() => {
        showNotification('Profile saved successfully!');
    });
}

function exportData() {
    const data = {
        profile: {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            salary: document.getElementById('salary').value,
            location: document.getElementById('location').value
        },
        settings: {
            autoSync: document.getElementById('auto-sync').checked,
            darkMode: document.getElementById('dark-mode').checked
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job-bender-data.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Update profile
            Object.keys(data.profile).forEach(key => {
                const input = document.getElementById(key);
                if (input) input.value = data.profile[key];
            });
            
            // Update settings
            document.getElementById('auto-sync').checked = data.settings.autoSync;
            document.getElementById('dark-mode').checked = data.settings.darkMode;
            if (data.settings.darkMode) {
                document.body.classList.add('dark-mode');
            }
            
            showNotification('Data imported successfully', 'success');
        } catch (error) {
            console.error('Error importing data:', error);
            showNotification('Error importing data', 'error');
        }
    };
    
    input.click();
}

async function handleSync() {
    const button = document.getElementById('sync-now');
    button.disabled = true;
    button.innerHTML = '<div class="loading"></div>';
    
    try {
        await saveProfile();
        await loadApplications();
        showNotification('Sync completed successfully', 'success');
    } catch (error) {
        console.error('Error syncing data:', error);
        showNotification('Error syncing data', 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Sync Now';
    }
}

let syncTimeout;
function scheduleSync() {
    if (document.getElementById('auto-sync').checked) {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(saveProfile, 1000);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add event listeners for data changes
document.querySelectorAll('input, select').forEach(element => {
    element.addEventListener('change', scheduleSync);
});

async function showApplicationStats() {
    try {
        const stats = await applicationsService.getApplicationStats();
        const statsContainer = document.getElementById('stats-container');
        
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Applications</h3>
                    <p class="stat-value">${stats.total}</p>
                </div>
                <div class="stat-card">
                    <h3>Interview Rate</h3>
                    <p class="stat-value">${stats.interviewRate.toFixed(1)}%</p>
                </div>
                <div class="stat-card">
                    <h3>Offer Rate</h3>
                    <p class="stat-value">${stats.offerRate.toFixed(1)}%</p>
                </div>
            </div>
            <div class="stats-details">
                <h3>Status Breakdown</h3>
                <div class="status-chart">
                    ${Object.entries(stats.byStatus).map(([status, count]) => `
                        <div class="status-bar">
                            <span class="status-label">${status}</span>
                            <div class="status-progress" style="width: ${(count / stats.total * 100)}%"></div>
                            <span class="status-count">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Show stats tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('[data-tab="stats"]').classList.add('active');
        document.getElementById('stats').classList.add('active');
    } catch (error) {
        console.error('Error showing stats:', error);
        showNotification('Error loading statistics', 'error');
    }
}

async function showUpcomingInterviews() {
    try {
        const interviews = await applicationsService.getUpcomingInterviews();
        const interviewsContainer = document.getElementById('interviews-container');
        
        if (interviews.length === 0) {
            interviewsContainer.innerHTML = '<p class="no-data">No upcoming interviews</p>';
            return;
        }

        interviewsContainer.innerHTML = `
            <div class="interviews-list">
                ${interviews.map(interview => `
                    <div class="interview-card">
                        <div class="interview-header">
                            <h3>${interview.company_name}</h3>
                            <span class="interview-date">${new Date(interview.interview_date).toLocaleDateString()}</span>
                        </div>
                        <div class="interview-details">
                            <p><strong>Position:</strong> ${interview.position}</p>
                            <p><strong>Type:</strong> ${interview.interview_type}</p>
                            ${interview.contact_name ? `<p><strong>Contact:</strong> ${interview.contact_name}</p>` : ''}
                            ${interview.notes ? `<p><strong>Notes:</strong> ${interview.notes}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Show interviews tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('[data-tab="interviews"]').classList.add('active');
        document.getElementById('interviews').classList.add('active');
    } catch (error) {
        console.error('Error showing interviews:', error);
        showNotification('Error loading interviews', 'error');
    }
}

async function showFollowUpsNeeded() {
    try {
        const followUps = await applicationsService.getFollowUpsNeeded();
        const followUpsContainer = document.getElementById('followups-container');
        
        if (followUps.length === 0) {
            followUpsContainer.innerHTML = '<p class="no-data">No follow-ups needed</p>';
            return;
        }

        followUpsContainer.innerHTML = `
            <div class="followups-list">
                ${followUps.map(followUp => `
                    <div class="followup-card">
                        <div class="followup-header">
                            <h3>${followUp.company_name}</h3>
                            <span class="followup-date">${new Date(followUp.follow_up_date).toLocaleDateString()}</span>
                        </div>
                        <div class="followup-details">
                            <p><strong>Position:</strong> ${followUp.position}</p>
                            <p><strong>Status:</strong> ${followUp.status}</p>
                            ${followUp.contact_name ? `<p><strong>Contact:</strong> ${followUp.contact_name}</p>` : ''}
                            ${followUp.notes ? `<p><strong>Notes:</strong> ${followUp.notes}</p>` : ''}
                        </div>
                        <div class="followup-actions">
                            <button class="btn-followup" data-id="${followUp.id}">Mark as Followed Up</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners for follow-up buttons
        document.querySelectorAll('.btn-followup').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                try {
                    await applicationsService.updateApplication(id, { follow_up_date: null });
                    showNotification('Follow-up marked as completed');
                    showFollowUpsNeeded();
                } catch (error) {
                    console.error('Error updating follow-up:', error);
                    showNotification('Error updating follow-up', 'error');
                }
            });
        });
        
        // Show follow-ups tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('[data-tab="followups"]').classList.add('active');
        document.getElementById('followups').classList.add('active');
    } catch (error) {
        console.error('Error showing follow-ups:', error);
        showNotification('Error loading follow-ups', 'error');
    }
}

// Add function to show edit modal
function showEditModal(application) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit Application</h2>
            <form id="edit-application-form">
                <div class="form-group">
                    <label>Company Name</label>
                    <input type="text" name="company_name" value="${application.company_name}" required>
                </div>
                <div class="form-group">
                    <label>Position</label>
                    <input type="text" name="position" value="${application.position}" required>
                </div>
                <div class="form-group">
                    <label>Job Type</label>
                    <select name="job_type">
                        <option value="">Select Type</option>
                        <option value="full-time" ${application.job_type === 'full-time' ? 'selected' : ''}>Full Time</option>
                        <option value="part-time" ${application.job_type === 'part-time' ? 'selected' : ''}>Part Time</option>
                        <option value="contract" ${application.job_type === 'contract' ? 'selected' : ''}>Contract</option>
                        <option value="internship" ${application.job_type === 'internship' ? 'selected' : ''}>Internship</option>
                        <option value="remote" ${application.job_type === 'remote' ? 'selected' : ''}>Remote</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" name="location" value="${application.location || ''}">
                </div>
                <div class="form-group">
                    <label>Salary Range</label>
                    <input type="text" name="salary_range" value="${application.salary_range || ''}">
                </div>
                <div class="form-group">
                    <label>Interview Date</label>
                    <input type="datetime-local" name="interview_date" value="${application.interview_date ? new Date(application.interview_date).toISOString().slice(0, 16) : ''}">
                </div>
                <div class="form-group">
                    <label>Interview Type</label>
                    <select name="interview_type">
                        <option value="">Select Type</option>
                        <option value="phone" ${application.interview_type === 'phone' ? 'selected' : ''}>Phone</option>
                        <option value="video" ${application.interview_type === 'video' ? 'selected' : ''}>Video</option>
                        <option value="onsite" ${application.interview_type === 'onsite' ? 'selected' : ''}>Onsite</option>
                        <option value="technical" ${application.interview_type === 'technical' ? 'selected' : ''}>Technical</option>
                        <option value="behavioral" ${application.interview_type === 'behavioral' ? 'selected' : ''}>Behavioral</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Follow-up Date</label>
                    <input type="datetime-local" name="follow_up_date" value="${application.follow_up_date ? new Date(application.follow_up_date).toISOString().slice(0, 16) : ''}">
                </div>
                <div class="form-group">
                    <label>Contact Name</label>
                    <input type="text" name="contact_name" value="${application.contact_name || ''}">
                </div>
                <div class="form-group">
                    <label>Contact Email</label>
                    <input type="email" name="contact_email" value="${application.contact_email || ''}">
                </div>
                <div class="form-group">
                    <label>Contact Phone</label>
                    <input type="tel" name="contact_phone" value="${application.contact_phone || ''}">
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes">${application.notes || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-save">Save Changes</button>
                    <button type="button" class="btn-cancel">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    modal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        
        try {
            await applicationsService.updateApplication(application.id, updates);
            showNotification('Application updated successfully');
            loadApplications();
            modal.remove();
        } catch (error) {
            console.error('Error updating application:', error);
            showNotification('Error updating application', 'error');
        }
    });

    // Handle cancel button
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
        modal.remove();
    });
}