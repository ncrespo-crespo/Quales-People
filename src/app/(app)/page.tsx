import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-brand-navy dark:text-white">
        Quales <span className="font-normal text-zinc-500 dark:text-zinc-400">ATS</span>
      </h1>
      <div className="flex gap-4">
        <Link
          href="/vacantes"
          className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          Ver vacantes
        </Link>
        <Link
          href="/candidatos"
          className="rounded bg-brand-green px-4 py-2 text-sm font-medium text-brand-navy hover:brightness-95"
        >
          Ver candidatos
        </Link>
      </div>
    </div>
  );
}
