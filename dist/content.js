// Content script for Job Bender
console.log('Job Bender content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
        const pageInfo = {
            title: document.title,
            url: window.location.href
        };
        sendResponse(pageInfo);
    }
    return true;
}); 