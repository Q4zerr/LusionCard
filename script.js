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
  const cardHeight = window.innerHeight * heightRatio;
  const totalScrollHeight = window.innerHeight * 3;
  const positions = [-7, 16, 38.67, 61.33, 84, 107];
  // const rotations = [-22.5, -15, -7.5, 7.5, 15, 22.5];
  const rotations = [-11.25, -7.5, -3.75, 3.75, 7.5, 11.25];

  cardRefs.forEach((card) => {
    card.style.height = `${cardHeight}px`;
  });

  // Pin cards section
  ScrollTrigger.create({
    trigger: cardsContainer,
    start: "top top",
    end: `+=${totalScrollHeight}`,
    pin: true,
    pinSpacing: true,
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
      markers: true,
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
        end: () => `+=${window.innerHeight}`,
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
});
