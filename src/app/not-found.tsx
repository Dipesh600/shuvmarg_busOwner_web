import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 gap-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(122, 29, 27, 0.08)",
          border: "1px solid rgba(122, 29, 27, 0.20)",
        }}
      >
        <span
          className="material-symbols-rounded text-maroon"
          style={{ fontSize: 40 }}
        >
          directions_bus
        </span>
      </div>
      <h1 className="text-5xl font-bold text-neutral-900">404</h1>
      <p className="text-neutral-500 text-base max-w-sm">
        This route doesn&apos;t exist. Let&apos;s get you back on track.
      </p>
      <Link href="/" className="btn-primary">
        <span className="material-symbols-rounded mr-1.5" style={{ fontSize: 18 }}>
          home
        </span>
        Back to Home
      </Link>
    </div>
  );
}
