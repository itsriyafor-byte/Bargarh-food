import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { CartProvider } from '@/lib/cartContext';

export const metadata: Metadata = {
  title: 'Bargarh Food - Local Food Marketplace',
  description: 'Order food directly from local restaurants in Bargarh City, Odisha. Cash on delivery only.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fdf8ff] text-[#1c1b1f]">
        <CartProvider>
          {/* Header */}
          <header className="sticky top-0 z-50 bg-[#eaddff] border-b border-[#d0bcff] px-4 py-3 shadow-xs">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl">🍲</span>
                <div>
                  <span className="font-bold text-lg text-[#21005d] tracking-tight block">
                    Bargarh Food
                  </span>
                  <span className="text-[11px] text-[#6750a4] font-medium block">
                    Bargarh City, Odisha
                  </span>
                </div>
              </Link>

              <nav className="flex items-center gap-2.5 text-sm">
                <Link
                  href="/cart"
                  className="px-3 py-1.5 rounded-full bg-white text-[#21005d] font-medium shadow-xs hover:bg-[#f3edf7] transition-all flex items-center gap-1.5 text-xs"
                >
                  🛒 <span>Cart</span>
                </Link>
                <Link
                  href="/owner"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#21005d] text-white hover:bg-[#381e72] transition-colors"
                >
                  Owner Portal
                </Link>
                <Link
                  href="/admin"
                  className="px-2.5 py-1.5 text-xs text-[#49454f] hover:text-[#21005d] font-semibold"
                >
                  Admin
                </Link>
              </nav>
            </div>
          </header>

          {/* Main */}
          <main className="flex-1 max-w-4xl mx-auto w-full p-4">{children}</main>

          {/* Footer */}
          <footer className="bg-white border-t border-[#cac4d0] py-6 px-4 text-center text-xs text-[#49454f]">
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-1.5">
              <div className="font-bold text-sm text-[#21005d]">Bargarh Food Marketplace</div>
              <p>
                Connecting customers with authentic local eateries across Bargarh City, Odisha.
              </p>
              <div className="text-[11px] text-[#79747e]">
                Payment: Cash on Delivery (COD) • Direct restaurant preparation & delivery
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
