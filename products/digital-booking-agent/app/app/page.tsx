import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl">digital booking agent</h1>
        <p className="text-muted mt-2 max-w-2xl">
          autonomous booking agent for the 10 research group roster. drafts in thomas's voice,
          backed by market data, undetectable as ai. phase 0 — shadow mode.
        </p>
      </section>
      <section className="grid grid-cols-2 gap-4">
        <Link href="/dashboard" className="panel">
          <div className="text-muted text-xs">phase 0 status</div>
          <div className="text-xl mt-1">dashboard →</div>
        </Link>
        <Link href="/drafts" className="panel">
          <div className="text-muted text-xs">awaiting thomas</div>
          <div className="text-xl mt-1">drafts →</div>
        </Link>
        <Link href="/contacts" className="panel">
          <div className="text-muted text-xs">crm</div>
          <div className="text-xl mt-1">contacts →</div>
        </Link>
        <Link href="/markets" className="panel">
          <div className="text-muted text-xs">artist heat map</div>
          <div className="text-xl mt-1">markets →</div>
        </Link>
      </section>
      <style>{`.panel{display:block;background:#141416;border:1px solid rgba(255,255,255,.08);padding:1.25rem;border-radius:8px}.panel:hover{border-color:#39ff14}`}</style>
    </div>
  );
}
