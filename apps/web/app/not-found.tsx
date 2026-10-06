import Link from "next/link";
import { Blobs } from "@/components/Blobs";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Blobs />
      <Logo />
      <h1 className="mt-8 text-6xl font-extrabold text-gradient">404</h1>
      <p className="mt-2 text-slate">That page does not exist.</p>
      <Link href="/" className="btn-primary mt-6">Back home</Link>
    </main>
  );
}
