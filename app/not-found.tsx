import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">FSPM Contracts</p>
      <h1 className="mt-2 text-3xl font-semibold">That report is not in the archive.</h1>
      <p className="mt-3 text-neutral-700">The date may be off, or Monday&apos;s snapshot has not been published yet.</p>
      <Link href="/" className="mt-6 font-semibold text-brand underline">
        Open the current week
      </Link>
    </main>
  );
}
