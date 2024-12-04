// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message in background.js: ", message);
  if (message.type === "getTabs") {
    chrome.tabs.query({}, (tabs) => {
      const urls = tabs.map((tab) => tab.url);
      console.log("Fetched URLs: ", urls);
      sendResponse({ urls });
    });
    return true;
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  // Send message to content script with updated tab URLs
  chrome.runtime.sendMessage({ type: "updateTabs" });
});
