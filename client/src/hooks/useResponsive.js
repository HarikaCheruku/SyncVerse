import { useState, useEffect } from "react";

function useResponsive() {
  const [viewHeight, setViewHeight] = useState("100vh");
  const [minHeightReached, setMinHeightReached] = useState(false);

  useEffect(() => {
    function handleResize() {
      setViewHeight(`${window.innerHeight}px`);
      setMinHeightReached(window.innerHeight < 500);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { viewHeight, minHeightReached };
}

export default useResponsive;