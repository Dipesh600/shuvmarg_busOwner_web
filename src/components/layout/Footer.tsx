"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  if (pathname === "/register" || pathname === "/login" || pathname === "/forgot-password" || pathname === "/activate-account") return null;

  return (
    <>
      {/* Inline style for footer link hover */}
      <style>{`
        .footer-link {
          color: #666666;
          transition: color 0.15s ease;
        }
        .footer-link:hover {
          color: #7A1D1B;
        }
      `}</style>

      <footer className="bg-[#FEFBF5]">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-12 pb-6">
          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 pb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#7A1D1B]/5 border border-[#7A1D1B]/10">
                  <span className="material-symbols-rounded text-[18px] text-[#7A1D1B]">
                    directions_bus
                  </span>
                </div>
                <span className="font-black text-[20px] sm:text-[24px] tracking-tighter flex items-baseline">
                  <span style={{ color: "#111111", fontFamily: 'var(--font-manrope)' }}>Shuv</span><span style={{ color: "#D96B62", fontFamily: 'var(--font-display)' }}>marg</span>
                  <span className="font-normal text-[13px] ml-1 text-[#666666]" style={{ fontFamily: 'var(--font-sans)' }}>Partner</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed max-w-[200px] text-[#666666]">
                Nepal&apos;s trusted digital transit platform for bus operators.
              </p>
            </div>

            {/* Link columns */}
            {footerCols.map((col) => (
              <div key={col.heading}>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4 text-[#111111]">
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6 border-t border-black/5">
            <p className="text-xs text-[#888888]">
              © {new Date().getFullYear()} Shuvmarg Partner Platform. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <p className="text-xs text-[#888888]">
                Registered in Nepal · PAN: XXXXXXXXX
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
