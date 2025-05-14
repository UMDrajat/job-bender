chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message && message.message === 'fill') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { message: 'fill' });
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NEW_APPLICATION') {
        // Get existing applications
        chrome.storage.local.get(['applications'], function(result) {
            const applications = result.applications || [];
            
            // Add new application
            const newApp = {
                id: Date.now(),
                company: message.data.company,
                position: message.data.position,
                date: new Date().toISOString().split('T')[0],
                status: 'applied'
            };
            
            applications.push(newApp);
            
            // Save updated applications
            chrome.storage.local.set({ applications });
            
            // Show notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon48.png',
                title: 'New Application Tracked',
                message: `Successfully tracked application for ${message.data.position} at ${message.data.company}`
            });
        });
    }
});