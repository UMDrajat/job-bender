document.addEventListener("DOMContentLoaded", function() {
    const firstNameInput = document.getElementById("first-name");
    const lastNameInput = document.getElementById("last-name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const salaryInput = document.getElementById("salary");
    const locationInput = document.getElementById("location");
    const resumeInput = document.getElementById('resume');
    const uploadedResumeInput = document.getElementById('uploaded-resume');
    resumeInput.addEventListener('change', function() {
        const file = resumeInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const fileContent = e.target.result;
                console.log(file)
                console.log(fileContent)
                const resume = {
                    name: file.name,
                    content: fileContent,
                    type: file.type
                };
                chrome.storage.local.set({
                    resume: resume
                })
            };
            reader.readAsDataURL(file);
        }
    });
    chrome.storage.local.get(["profile"], function(result) {
        firstNameInput.value = result.profile.firstName
        lastNameInput.value = result.profile.lastName
        emailInput.value = result.profile.email
        phoneInput.value = result.profile.phone
        salaryInput.value = result.profile.salary
        locationInput.value = result.profile.location
    });
    chrome.storage.local.get(["resume"], function(result) {
        uploadedResumeInput.textContent = result.resume.name
    });
    const saveButton = document.querySelector(".btn-save");
    saveButton.addEventListener("click", function() {
        const profile = {
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            salary: salaryInput.value,
            location: locationInput.value,
        };
        chrome.storage.local.set({
            profile: profile
        }).then(() => {
            alert("Data saved successfully!");
        });
    });
    document.getElementById('fill-it').addEventListener('click', function() {
        chrome.runtime.sendMessage({
            message: 'fill'
        });
    });
    var openButton = document.getElementById('open-jobs');
    openButton.addEventListener('click', function() {
        chrome.tabs.create({
            url: chrome.runtime.getURL('jobs.html')
        });
    });
});

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Job tracking functionality
let applications = [];

// Load applications from storage
chrome.storage.local.get(['applications'], function(result) {
    applications = result.applications || [];
    updateApplicationsList();
});

// Update applications list
function updateApplicationsList() {
    const tbody = document.getElementById('applicationsList');
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    tbody.innerHTML = '';
    
    applications
        .filter(app => {
            if (statusFilter !== 'all' && app.status !== statusFilter) return false;
            if (dateFilter && app.date !== dateFilter) return false;
            return true;
        })
        .forEach(app => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${app.company}</td>
                <td>${app.position}</td>
                <td>${app.date}</td>
                <td>
                    <select class="status-select" data-id="${app.id}">
                        <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
                        <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Interview</option>
                        <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="stale" ${app.status === 'stale' ? 'selected' : ''}>Stale</option>
                    </select>
                </td>
                <td>
                    <button class="btn-delete" data-id="${app.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
}

// Add new application
function addApplication(company, position) {
    const newApp = {
        id: Date.now(),
        company,
        position,
        date: new Date().toISOString().split('T')[0],
        status: 'applied'
    };
    
    applications.push(newApp);
    chrome.storage.local.set({ applications }, updateApplicationsList);
}

// Update application status
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('status-select')) {
        const id = parseInt(e.target.dataset.id);
        const app = applications.find(a => a.id === id);
        if (app) {
            app.status = e.target.value;
            chrome.storage.local.set({ applications }, updateApplicationsList);
        }
    }
});

// Delete application
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-delete')) {
        const id = parseInt(e.target.dataset.id);
        applications = applications.filter(app => app.id !== id);
        chrome.storage.local.set({ applications }, updateApplicationsList);
    }
});

// Filter applications
document.getElementById('statusFilter').addEventListener('change', updateApplicationsList);
document.getElementById('dateFilter').addEventListener('change', updateApplicationsList);