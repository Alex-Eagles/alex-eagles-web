import { useGSAP } from "@gsap/react";

import gsap from "gsap";

function useFooterAnimation(
  triggerRef: React.RefObject<HTMLElement | null>,
  footerRef: React.RefObject<HTMLElement | null>,
) {
  useGSAP(() => {
    if (!triggerRef.current || !footerRef.current) return;

    gsap.fromTo(
      footerRef.current,
      {
        yPercent: -70,
      },
      {
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "bottom 100%", // when the top of the trigger hits the bottom of the viewport
          end: "+=90%", // when the bottom of the trigger hits the top of the viewport
          // markers: true,
          // refreshPriority: 1,
          scrub: 0.1,
        },
        yPercent: 0,
      },
    );
  });
}

export default useFooterAnimation;
