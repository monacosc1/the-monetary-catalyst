import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#001e46] py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-[#00f0b4] font-bold mb-2">The Monetary Catalyst</h3>
            <p className="text-sm text-gray-400">Professional financial research and investment strategies</p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h4 className="text-[#00f0b4] font-bold mb-2">Quick Links</h4>
            <ul className="text-sm">
              <li><Link href="/about" className="hover:text-[#00f0b4] transition-colors">About Us</Link></li>
              <li><Link href="/research" className="hover:text-[#00f0b4] transition-colors">Research</Link></li>
              <li><Link href="/subscribe" className="hover:text-[#00f0b4] transition-colors">Subscribe</Link></li>
              <li><Link href="/contact" className="hover:text-[#00f0b4] transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div className="w-full md:w-1/3">
            <h4 className="text-[#00f0b4] font-bold mb-2">Legal</h4>
            <ul className="text-sm">
              <li><Link href="/privacy" className="hover:text-[#00f0b4] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#00f0b4] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} The Monetary Catalyst. All rights reserved.
        </div>
      </div>
    </footer>
  )
}