chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTab = tabs[0];
      let activeTabUrl = activeTab.url;

      console.log("Active tab URL:", activeTabUrl);
    });
  });
  