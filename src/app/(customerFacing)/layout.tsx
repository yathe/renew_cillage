import { Nav,NavLink } from "../components/Nav";

export const dynamic = "force-dynamic"; 
// Force this page to always be dynamic not cached , so it always fetch fresh data

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>){
  return <>
  <Nav>
<NavLink href="/">Home</NavLink>
<NavLink href="/products">Products</NavLink>
<NavLink href="/users">My Orders</NavLink>
  </Nav>
  <div className="container my-6">{children}</div>
  </>
}