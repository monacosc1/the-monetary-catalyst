import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-[#001e46] py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="w-1/4">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="The Monetary Catalyst"
              width={300}
              height={75}
              className="max-h-16 w-auto"
            />
          </Link>
        </div>
        <nav className="w-1/2 flex justify-center">
          <ul className="flex space-x-12">
            <li><Link href="/about" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">About</Link></li>
            <li><Link href="/research" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">Research</Link></li>
            <li><Link href="/contact" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">Contact</Link></li>
          </ul>
        </nav>
        <div className="w-1/4 flex justify-end items-center space-x-6">
          <Link href="/login" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">Login</Link>
          <Link 
            href="/subscribe" 
            className="bg-[#5064fa] hover:bg-[#01baef] text-[#ffffff] px-4 py-2 rounded transition-colors text-lg font-bold"
          >
            Subscribe
          </Link>
        </div>
      </div>
    </header>
  )
}
