import { useGSAP } from "@gsap/react";

import gsap from "gsap";

function useProblem2Animation(
  containerRef: React.RefObject<HTMLDivElement | null>,
  imgRef: React.RefObject<HTMLImageElement | null>,
) {
  useGSAP(
    () => {
      if (!containerRef.current || !imgRef.current) return;

      gsap.fromTo(
        imgRef.current,
        {
          yPercent: 60,
        },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 25%", // when the top of the trigger hits the bottom of the viewport
            end: "center 30%", // when the bottom of the trigger hits the top of the viewport
            // markers: true,
            refreshPriority: 1,
            scrub: 1,
          },
          yPercent: 0,
        },
      );
    },
    { scope: containerRef },
  );
}

export default useProblem2Animation;
