import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-[#001e46] py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/white-logo.png"
            alt="The Monetary Catalyst"
            width={200}
            height={50}
            className="max-h-12 w-auto"
          />
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li><Link href="/research" className="hover:text-[#00f0b4] transition-colors">Research</Link></li>
            <li><Link href="/about" className="hover:text-[#00f0b4] transition-colors">About</Link></li>
            <li><Link href="/contact" className="hover:text-[#00f0b4] transition-colors">Contact</Link></li>
            <li><Link href="/login" className="hover:text-[#00f0b4] transition-colors">Login</Link></li>
            <li>
              <Link 
                href="/subscribe" 
                className="bg-[#5064fa] hover:bg-[#01baef] text-white px-4 py-2 rounded transition-colors"
              >
                Subscribe
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}