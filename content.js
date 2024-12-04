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
  if (e.key.toLowerCase() === "t" && e.shiftKey) {
    isVisible = !isVisible;
    square.style.display = isVisible ? "flex" : "none";
  }
});

square.addEventListener("click", async (e) => {
  if (!square.classList.contains("expanded") && !e.target.classList.contains("tab-link")) {
    try {
      const response = await chrome.runtime.sendMessage({ type: "getTabs" });
      console.log("Response from background:", response);
      
      if (response && response.urls) {
        const urlsHtml = response.urls
          .map((url) => `<p class="tab-link" data-url="${url}">${url}</p>`)
          .join("");
          
        square.innerHTML = `
          <div class="heading">Tabs</div>
          <div class="urls-content">${urlsHtml}</div>
        `;
        square.classList.add("expanded");
      }
    } catch (error) {
      console.error("Error fetching tabs:", error);
    }
  } else if (!e.target.classList.contains("tab-link")) {
    square.innerHTML = "";
    square.classList.remove("expanded");
  }
});

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

square.addEventListener("mousedown", (e) => {
  if (e.target.classList.contains("tab-link")) return;
  
  isDragging = true;
  document.body.style.userSelect = "none";
  offsetX = e.clientX - square.offsetLeft;
  offsetY = e.clientY - square.offsetTop;

  const onMouseMove = (e) => {
    if (isDragging) {
      const left = e.clientX - offsetX;
      const top = e.clientY - offsetY;
      
      square.style.left = `${left}px`;
      square.style.top = `${top}px`;

      localStorage.setItem("squarePosition", JSON.stringify({ top, left }));
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

square.addEventListener("click", async (e) => {
  if (e.target.classList.contains("tab-link")) {
    const url = e.target.getAttribute("data-url");
    try {
      await chrome.runtime.sendMessage({ 
        type: "switchToTab", 
        url: url 
      });
    } catch (error) {
      console.error("Error switching tabs:", error);
    }
    e.stopPropagation();
  }
});

// Listen for tab updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateTabs" && square.classList.contains("expanded")) {
    const urlsHtml = message.urls
      .map((url) => `<p class="tab-link" data-url="${url}">${url}</p>`)
      .join("");
    
    const urlsContent = square.querySelector(".urls-content");
    if (urlsContent) {
      urlsContent.innerHTML = urlsHtml;
    }
  }
});