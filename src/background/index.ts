/**
 * Service Worker - Background Script
 * Handles message passing and centralized logic for email detection
 */

console.log('Service worker initialized');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Service worker received message:', message)

  sendResponse('PONG')
  // Return true to indicate we'll send a response asynchronously
  return true
})

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);
});

