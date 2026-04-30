import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl">offer not found</h1>
      <p className="text-muted text-sm">
        this offer id doesn't match any row in the offers table. it may have
        been dropped, or the id is wrong.
      </p>
      <Link href="/offers" className="text-accent text-sm hover:underline">
        ← back to offers
      </Link>
    </div>
  );
}
