chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTabs") {
    chrome.tabs.query({}, (tabs) => {
      const urls = tabs.map(tab => tab.url);
      sendResponse({ urls: urls });
    });
    return true;
  }
  
  if (message.type === "switchToTab") {
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find(tab => tab.url === message.url);
      if (existingTab) {
        chrome.tabs.update(existingTab.id, { active: true });
      } else {
        chrome.tabs.create({ url: message.url });
      }
    });
  }
});

// Function to broadcast tab updates to all content scripts
function broadcastTabsUpdate() {
  chrome.tabs.query({}, (tabs) => {
    const urls = tabs.map(tab => tab.url);
    chrome.tabs.query({}, (allTabs) => {
      allTabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: "updateTabs",
          urls: urls
        }).catch(() => {
          // Ignore errors from inactive tabs
        });
      });
    });
  });
}

// Listen for tab creation
chrome.tabs.onCreated.addListener(() => {
  broadcastTabsUpdate();
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener(() => {
  broadcastTabsUpdate();
});