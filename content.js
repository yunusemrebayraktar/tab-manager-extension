// Check if the square already exists
let square = document.getElementById("movable-square");

if (!square) {
  square = document.createElement("div");
  square.id = "movable-square";
  document.body.appendChild(square);
}

const savedPosition = JSON.parse(localStorage.getItem("squarePosition")) || { top: 100, left: 100 };
square.style.top = `${savedPosition.top}px`;
square.style.left = `${savedPosition.left}px`;

let isVisible = true;

document.addEventListener("keydown", (e) => {
  if (e.key === "T" && e.shiftKey) {
    isVisible = !isVisible;
    square.style.display = isVisible ? "flex" : "none";
  }
});

// Click event to expand and show URLs
square.addEventListener("click", (e) => {
  if (!square.classList.contains("expanded") && !e.target.classList.contains("tab-link")) {
    chrome.runtime.sendMessage({ type: "getTabs" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error fetching tabs: ", chrome.runtime.lastError.message);
        return;
      }
      if (response && response.urls && response.urls.length > 0) {
        const urlsHtml = response.urls
          .map((url) => `<p class="tab-link" data-url="${url}">${url}</p>`)
          .join("");
        square.innerHTML = `
          <div class="content">
            <div class="heading">Open Tabs</div>
            <div class="urls-content">${urlsHtml}</div>
          </div>
        `;
        square.classList.add("expanded");
      }
    });
  } else if (!e.target.classList.contains("tab-link")) {
    square.innerHTML = "";
    square.classList.remove("expanded");
  }
});

// Handle updates to the list of open tabs
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "updateTabs") {
    chrome.tabs.query({}, (tabs) => {
      const urls = tabs.map((tab) => tab.url);
      const urlsHtml = urls
        .map((url) => `<p class="tab-link" data-url="${url}">${url}</p>`)
        .join("");
      const urlsContent = square.querySelector(".urls-content");
      if (urlsContent) {
        urlsContent.innerHTML = urlsHtml;
      }
    });
  }
});

// Add click event to the links inside the square
square.addEventListener("click", (e) => {
  if (e.target && e.target.classList.contains("tab-link")) {
    const url = e.target.getAttribute("data-url");

    // Check if the URL is already open in any tab
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find((tab) => tab.url === url);
      if (existingTab) {
        // If the tab is open, switch to it
        chrome.tabs.update(existingTab.id, { active: true });
      } else {
        // If the tab is not open, open a new tab with the URL
        chrome.tabs.create({ url: url });
      }
    });

    // Prevent the click from closing the square
    e.stopPropagation();
  }
});

// Make the square draggable
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

square.addEventListener("mousedown", (e) => {
  isDragging = true;
  document.body.style.userSelect = "none";
  offsetX = e.clientX - square.offsetLeft;
  offsetY = e.clientY - square.offsetTop;

  const onMouseMove = (e) => {
    if (isDragging) {
      square.style.left = `${e.clientX - offsetX}px`;
      square.style.top = `${e.clientY - offsetY}px`;

      const position = { top: e.clientY - offsetY, left: e.clientX - offsetX };
      localStorage.setItem("squarePosition", JSON.stringify(position));
    }
  };

  const onMouseUp = () => {
    isDragging = false;
    document.body.style.userSelect = "auto";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});
