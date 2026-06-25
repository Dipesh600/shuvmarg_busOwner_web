import Link from "next/link";

const footerCols = [
  {
    heading: "Platform",
    links: [
      { label: "How it Works", href: "#how-it-works" },
      { label: "Benefits", href: "#benefits" },
      { label: "Partner Types", href: "#partners" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Compliance Rules", href: "#" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Partner Helpline", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Documentation", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <>
      {/* Inline style for footer link hover — keeps Footer a Server Component */}
      <style>{`
        .footer-link {
          color: rgba(248,241,227,0.75);
          transition: color 0.15s ease;
        }
        .footer-link:hover {
          color: #C99A4A;
        }
      `}</style>

      <footer style={{ background: "#7A1D1B" }}>
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-12">
          {/* Top row */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 pb-12"
            style={{ borderBottom: "1px solid rgba(248,241,227,0.15)" }}
          >
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(248,241,227,0.15)" }}>
                  <span className="material-symbols-rounded text-[18px]" style={{ color: "#F8F1E3" }}>
                    directions_bus
                  </span>
                </div>
                <span className="font-black text-[20px] sm:text-[24px] tracking-tighter">
                  <span style={{ color: "#F8F1E3" }}>Shuv</span><span style={{ color: "#D96B62" }}>marg</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed max-w-[200px]" style={{ color: "rgba(248,241,227,0.65)" }}>
                Nepal&apos;s trusted digital transit platform for bus operators.
              </p>
            </div>

            {/* Link columns */}
            {footerCols.map((col) => (
              <div key={col.heading}>
                <h4
                  className="text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ color: "rgba(248,241,227,0.50)" }}
                >
                  {col.heading}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="footer-link text-sm">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs" style={{ color: "rgba(248,241,227,0.45)" }}>
              © {new Date().getFullYear()} Shuvmarg Partner Platform. All Rights Reserved.
            </p>
            <p className="text-xs" style={{ color: "rgba(248,241,227,0.45)" }}>
              Registered in Nepal · PAN: XXXXXXXXX
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
