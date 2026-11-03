import { BrandMark } from "./BrandLogo";

/* Full-screen brand loader: DC monogram + bouncing acid/ink blocks. */
const Loader = ({ label = "Loading" }: { label?: string }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
      style={{ background: "var(--dc-bg)" }}
      role="status"
      aria-live="polite"
    >
      <BrandMark size="lg" className="shadow-brutal" />
      <div className="flex items-end gap-1.5" aria-hidden>
        {["var(--dc-acid)", "var(--dc-text)", "var(--dc-acid)"].map((color, index) => (
          <span
            key={index}
            className="h-3 w-3 animate-bounce rounded-[3px]"
            style={{
              background: color,
              border: "2px solid var(--dc-edge)",
              animationDelay: `${index * 120}ms`,
            }}
          />
        ))}
      </div>
      <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">{label}</span>
    </div>
  );
};

export default Loader;
