// public/docs/help.js
document.addEventListener("DOMContentLoaded", () => {
  const starCanvas = document.getElementById("star-canvas");
  const ctx = starCanvas.getContext("2d");
  let stars = [];
  let animationFrameId;

  function setCanvasSize() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    const starCount = Math.floor((starCanvas.width * starCanvas.height) / 8000);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * starCanvas.width,
        y: Math.random() * starCanvas.height,
        radius: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
  }

  function drawStars() {
    ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();

      star.x += star.vx;
      star.y += star.vy;

      if (star.x < 0 || star.x > starCanvas.width) star.vx = -star.vx;
      if (star.y < 0 || star.y > starCanvas.height) star.vy = -star.vy;
    });

    drawLines();
    animationFrameId = requestAnimationFrame(drawStars);
  }

  function drawLines() {
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const dist = Math.hypot(
          stars[i].x - stars[j].x,
          stars[i].y - stars[j].y
        );
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - dist / 150})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function initStarfield() {
    setCanvasSize();
    createStars();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    drawStars();
  }

  initStarfield();
  window.addEventListener("resize", initStarfield);

  const tiltElements = document.querySelectorAll(".tilt-card");
  if (window.VanillaTilt) {
    VanillaTilt.init(tiltElements, {
      max: 8,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
      perspective: 1000,
      scale: 1.05,
    });
  }

  const revealElements = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay =
            entry.target.style.getPropertyValue("--animation-delay") || "0ms";
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  const backToTopButton = document.getElementById("back-to-top");
  if (backToTopButton) {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add("visible");
      } else {
        backToTopButton.classList.remove("visible");
      }
    });
    backToTopButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
