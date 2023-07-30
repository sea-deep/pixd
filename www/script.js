   function toggleMenu() {
      var nav = document.getElementById("nav");
      nav.classList.toggle("show");
    }

    function toggleAnswer(element) {
      var p = element.querySelector("p");
      p.style.display = p.style.display === "block" ? "none" : "block";
    }
    function updateTime() {
      const currentTimeElement = document.getElementById('time');
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      currentTimeElement.textContent = `Today at ${timeString.toUpperCase()}`;
    }
    setInterval(updateTime, 1000);
    updateTime();