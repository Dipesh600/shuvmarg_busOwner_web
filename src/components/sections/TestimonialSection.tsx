export default function TestimonialSection() {
  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">
        {/* Maroon strip — the one place where maroon bg is intentional for contrast */}
        <div
          className="rounded-[32px] p-10 md:p-16 relative overflow-hidden flex flex-col items-center text-center shadow-xl"
          style={{ background: "#7A1D1B" }}
        >
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #F8F1E3 0, #F8F1E3 1px, transparent 0, transparent 50%)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Gold quote mark */}
          <span
            className="material-symbols-rounded block mb-6 relative z-10 drop-shadow-md"
            style={{ fontSize: 48, color: "#C99A4A" }}
          >
            format_quote
          </span>

          <span
            className="text-[12px] font-bold tracking-widest uppercase mb-6 relative z-10"
            style={{ color: "rgba(248, 241, 227, 0.70)" }}
          >
            Operator Success Story
          </span>

          <blockquote className="max-w-3xl relative z-10">
            <p
              className="text-xl md:text-2xl font-medium italic leading-relaxed"
              style={{ color: "#F8F1E3" }}
            >
              &ldquo;Partnering with Shuv Marg has transformed Koshi Travels. We onboarded our 12 AC
              Deluxe buses and online ticket booking alone has doubled our seat occupancy on the
              KTM-Dharan sector. Weekly bank deposits arrive on time, every time.&rdquo;
            </p>
          </blockquote>

          <div className="mt-10 flex flex-col items-center relative z-10">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-3 border border-[#C99A4A]/20"
              style={{ background: "rgba(248, 241, 227, 0.15)", color: "#F8F1E3" }}
            >
              BP
            </div>
            <h4 className="font-bold text-[15px]" style={{ color: "#F8F1E3" }}>
              Bhupendra Pandey
            </h4>
            <p className="text-sm mt-1" style={{ color: "rgba(248, 241, 227, 0.60)" }}>
              Proprietor, Koshi Travels Nepal
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
