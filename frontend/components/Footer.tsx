import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#001e46] py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-start">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="The Monetary Catalyst"
                width={200}
                height={50}
                className="max-h-12 w-auto mb-4"
              />
            </Link>
            <p className="text-sm text-gray-400">Professional financial research and investment strategies</p>
          </div>
          <div className="w-full md:w-2/3 flex flex-wrap justify-end">
            <div className="w-full md:w-1/2 mb-6 md:mb-0 md:pr-4">
              <h4 className="text-[#01baef] font-bold mb-2">Quick Links</h4>
              <ul className="text-sm">
                <li><Link href="/about" className="text-white hover:text-[#01baef] transition-colors">About Us</Link></li>
                <li><Link href="/research" className="text-white hover:text-[#01baef] transition-colors">Research</Link></li>
                <li><Link href="/pricing" className="text-white hover:text-[#01baef] transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="text-white hover:text-[#01baef] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div className="w-full md:w-1/2">
              <h4 className="text-[#01baef] font-bold mb-2">Legal</h4>
              <ul className="text-sm">
                <li><Link href="/privacy" className="text-white hover:text-[#01baef] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white hover:text-[#01baef] transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
