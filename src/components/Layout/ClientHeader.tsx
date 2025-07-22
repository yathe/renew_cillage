"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { Nav, NavLink } from "@/app/components/Nav"; // Assumed Nav component
// optional utility for class merging

export const dynamic = "force-dynamic";

export function ClientHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <Nav>
        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-6 items-center">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/products">Products</NavLink>
          <NavLink href="/users">My Orders</NavLink>
        </div>

        {/* Right-side buttons */}
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <div className="hidden md:flex gap-2">
              <SignInButton>
                <Button variant="ghost">Login</Button>
              </SignInButton>
              <SignUpButton>
                <Button>Sign Up</Button>
              </SignUpButton>
            </div>
          </SignedOut>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </Nav>

      {/* Mobile Nav Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 py-2 bg-white shadow-sm space-y-3">
          <NavLink href="/" onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink href="/products" onClick={() => setIsMobileMenuOpen(false)}>
            Products
          </NavLink>
          <NavLink href="/users" onClick={() => setIsMobileMenuOpen(false)}>
            My Orders
          </NavLink>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button className="w-full" variant="ghost">Login</Button>
            </SignInButton>
            <SignUpButton>
              <Button className="w-full">Sign Up</Button>
            </SignUpButton>
          </SignedOut>
        </div>
      )}
    </>
  );
}
