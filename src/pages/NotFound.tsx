import ComingSoon from "@/pages/ComingSoon";

/** 404 — any unknown route falls back here. */
export default function NotFound() {
  return (
    <ComingSoon
      title="Page not found"
      blurb="This page doesn’t exist — it may have moved or never taken off. Head back to the home page to continue exploring."
    />
  );
}
