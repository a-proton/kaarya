import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="p-4">
        <Link href="/">
          <img
            src="/logo.png"
            alt="Kaarya"
            className="h-25 w-auto cursor-pointer"
          />
        </Link>
      </div>
      {children}
    </div>
  );
}
