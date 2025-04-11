import Link from "next/link"
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import Image from "next/image"
export default function Navbar() {
  return (
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6 bg-primary/2">
      <Link href="#" className="flex items-center mb-4 md:mb-0" prefetch={false}>
        <Image
          src="/logo.png"
          alt="IoT Hub Logo"
          width={32}
          height={32}
          className="mr-2"
        />
        <h2 className="font-semibold text-2xl">IoT Hub</h2>
      </Link>
      <nav className="ml-auto flex gap-6">
        <NavbarLink href="/">Home</NavbarLink>
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <NavbarLink href="/dashboard">Dashboard</NavbarLink>
          <UserButton />
        </SignedIn>
      </nav>
    </header>
  )
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}
function HiddenNavbarLink({ children, href, prefetch = false }: { children: React.ReactNode, href: string, prefetch?: boolean }) {
  return (
    <Link
      href={href}
      className="hidden lg:flex items-center py-2 text-lg font-semibold"
      prefetch={prefetch}
    >
      {children}
    </Link>
  )
}
function NavbarLink({ children, href, prefetch = false }: { children: React.ReactNode, href: string, prefetch?: boolean }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
      prefetch={prefetch}
    >
      {children}
    </Link>
  )
}




function MountainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  )
}