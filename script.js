window.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  // Init Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    // easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });

  // Pour que Lenis fonctionne à chaque frame
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  /**
   * CARD ANIMATION
   */
  const container = document.querySelector(".container");
  const cardsContainer = container.querySelector(".cards");
  const cardRefs = cardsContainer.querySelectorAll(".card");

  const heightRatio = 562.406 / 953; // ≈ 59% size
  // const aspectRatio = 415.91 / 557.685;
  const aspectRatio = 395.91 / 557.685;

  const totalScrollHeight = window.innerHeight * 3;
  const positions = [-7, 16, 38.67, 61.33, 84, 107];
  // const rotations = [-22.5, -15, -7.5, 7.5, 15, 22.5];
  const rotations = [-11.25, -7.5, -3.75, 3.75, 7.5, 11.25];

  function setCardSize() {
    const h = window.innerHeight * heightRatio;
    const w = h * aspectRatio;
    cardsContainer.querySelectorAll(".card").forEach((card) => {
      card.style.height = `${h}px`;
      card.style.width = `${w}px`;
    });
  }

  setCardSize();
  window.addEventListener("resize", setCardSize);

  // Pin cards section
  const pinGlobal = ScrollTrigger.create({
    trigger: cardsContainer,
    start: "top top",
    end: `+=${totalScrollHeight} bottom`,
    pin: true,
    pinSpacing: true,
    // markers: { startColor: "violet", endColor: "black" },
  });

  // Rotate cards
  cardRefs.forEach((card, i) => {
    let floatingOn = false;

    ScrollTrigger.create({
      trigger: cardsContainer,
      start: "top center",
      end: "40% center",
      scrub: true,
      onUpdate: (self) => {
        // Rotate
        gsap.to(card, {
          rotation: rotations[i] * self.progress,
          ease: "none",
        });

        // When self.progress reached 0.8 (80%) = 20% before end
        // Then launch Floating animation
        if (!floatingOn && self.progress >= 0.8) {
          card.querySelector(".card-wrapper").classList.add("floating");
          floatingOn = true;
        }
        // Else if we backward under 80%
        // Then removed Floating animation
        if (floatingOn && self.progress < 0.8) {
          card.querySelector(".card-wrapper").classList.remove("floating");
          floatingOn = false;
        }
      },
    });
  });

  // Spread cards
  cardRefs.forEach((card, index) => {
    gsap.to(card, {
      left: `${positions[index]}%`,
      // rotation: `${rotations[index]}`,
      ease: "none",
      scrollTrigger: {
        trigger: cardsContainer,
        start: "top top",
        end: () => `+=${window.innerHeight / 2}`,
        scrub: 0.5,
        id: `spread-${index}`,
      },
    });
  });

  // Flip cards and reset rotation with stragger
  cardRefs.forEach((card, index) => {
    const frontEl = card.querySelector(".flip-card-front");
    const backEl = card.querySelector(".flip-card-back");

    const staggerOffset = index * 0.05;
    const startOffset = 1 / 3 + staggerOffset;
    const endOffset = 2 / 3 + staggerOffset;

    ScrollTrigger.create({
      trigger: cardsContainer,
      start: "top top",
      end: () => `${totalScrollHeight}`,
      scrub: 1,
      id: `rotate-flip-${index}`,
      onUpdate: (self) => {
        const progress = self.progress;
        if (progress >= startOffset && progress <= endOffset) {
          const animationProgress = (progress - startOffset) / (1 / 3);
          const frontRotation = -180 * animationProgress;
          const backRotation = 180 - 180 * animationProgress;
          const cardRotation = rotations[index] * (1 - animationProgress);

          gsap.to(frontEl, {
            rotateY: frontRotation,
            ease: "power1.out",
          });

          gsap.to(backEl, {
            rotateY: backRotation,
            ease: "power1.out",
          });

          gsap.to(card, {
            xPercent: -50,
            yPercent: -50,
            rotate: cardRotation,
            ease: "power1.out",
          });
        }
      },
    });
  });

  // Init horizontal scroll after flip cards
  let horizontalInitialized = false;
  let maxScrollX = cardsContainer.scrollWidth - window.innerWidth;
  let onScrollCallback;

  ScrollTrigger.create({
    trigger: cardsContainer,
    start: () => totalScrollHeight,
    // end: () => `+=${cardsContainer.scrollWidth * 2}`,
    end: () => `+=${totalScrollHeight + maxScrollX}`,
    pin: true,
    pinSpacing: true,
    onRefresh(self) {
      // Recalculate maxScrollX on resize
      maxScrollX = cardsContainer.scrollWidth - window.innerWidth;
      self.end = totalScrollHeight + maxScrollX;
    },
    onEnter: (self) => {
      if (horizontalInitialized) return;
      horizontalInitialized = true;

      // Reset & put cards right on rotate
      cardsContainer.querySelectorAll(".card").forEach((card) => {
        gsap.set(card, { rotation: 0 });
        // Show only back face
        const back = card.querySelector(".flip-card-back");
        if (back) gsap.set(back, { rotateY: 0 });
        const front = card.querySelector(".flip-card-front");
        if (front) gsap.set(front, { rotateY: -180 });
      });

      // Positionning duplicate cards
      const shiftPerCard = positions[1] - positions[0];
      const groupShift = shiftPerCard * positions.length;
      const baseCount = cardRefs.length;

      // Duplicate for seamless loop
      cardRefs.forEach((card, i) => {
        const clone = card.cloneNode(true);

        clone.id = `card-${baseCount + i + 1}`;

        clone.style.left = `${positions[i] + groupShift - 1}%`;
        clone.style.transform = "translate(0.047px, 0.164px)";

        // Reset rotation
        gsap.set(clone, { rotation: 0 });
        // Show only back face
        const backClone = clone.querySelector(".flip-card-back");
        const frontClone = clone.querySelector(".flip-card-front");
        if (backClone) gsap.set(backClone, { rotateY: 0 });
        if (frontClone) gsap.set(frontClone, { rotateY: -180 });

        cardsContainer.appendChild(clone);
      });

      // Recalculate maxScrollX after duplicate
      maxScrollX = cardsContainer.scrollWidth - window.innerWidth;
      self.end = totalScrollHeight + maxScrollX;

      // Lenis listener to pilote X
      onScrollCallback = ({ scroll }) => {
        if (scroll < totalScrollHeight) return;
        const delta = scroll - totalScrollHeight;
        const rawX = -delta;

        const x = gsap.utils.clamp(-maxScrollX, 0, rawX);
        gsap.set(cardsContainer, { x });
      };
      lenis.on("scroll", onScrollCallback);
    },
    onLeaveBack: () => {
      // Remove cloned cards
      const allCards = cardsContainer.querySelectorAll(".card");
      allCards.forEach((card, idx) => {
        if (idx >= cardRefs.length) cardsContainer.removeChild(card);
      });

      // Deactivate listener & reset
      lenis.off("scroll", onScrollCallback);
      gsap.set(cardsContainer, { x: 0 });

      horizontalInitialized = false;
      wrapWidth = cardsContainer.scrollWidth / 2;
    },
    // markers: { startColor: "orange", endColor: "cyan", fontSize: "20px" },
  });
});
