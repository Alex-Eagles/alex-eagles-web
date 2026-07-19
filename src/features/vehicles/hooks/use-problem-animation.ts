import { useGSAP } from "@gsap/react";
import type { DotLottie } from "@lottiefiles/dotlottie-react";
import gsap from "gsap";
import GSDevTools from "gsap/GSDevTools";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState, type RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, GSDevTools);

function useProblemAnimation(
  containerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  animationRef: RefObject<DotLottie | null>,
) {
  const [totalFrames, setTotalFrames] = useState<number>(0);

  useEffect(() => {
    if (!animationRef.current) return;

    const handleLoad = () => {
      setTotalFrames(animationRef.current!.totalFrames);
    };

    animationRef.current.addEventListener("load", handleLoad);

    return () => animationRef.current?.removeEventListener("load", handleLoad);
  });

  useGSAP(
    () => {
      if (!containerRef.current || !animationRef.current || totalFrames === 0)
        return;

      const finalFrame = animationRef.current.totalFrames - 1;

      gsap.to(contentRef, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top", // when the top of the trigger hits the top of the viewport
          end: "+200%", // end after scrolling 500px beyond the start
          // markers: true,
          scrub: 1,
          pin: true,
          refreshPriority: 1,
          onUpdate(self) {
            const requiredFrame = Math.round(self.progress * finalFrame);

            animationRef.current!.setFrame(finalFrame - requiredFrame);
            // console.log(self.progress, requiredFrame, finalFrame);
          },
        },
      });
    },
    { scope: containerRef, dependencies: [totalFrames] },
  );
}

export default useProblemAnimation;
