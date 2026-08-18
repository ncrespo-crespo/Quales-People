const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 px-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          ATS Interno — Qualesgroup
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Hola mundo. El pipeline de deploy está funcionando.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Conexión a Supabase:{" "}
          <span
            className={
              supabaseConfigured
                ? "font-medium text-green-600 dark:text-green-500"
                : "font-medium text-amber-600 dark:text-amber-500"
            }
          >
            {supabaseConfigured ? "configurada" : "pendiente de configurar"}
          </span>
        </p>
      </main>
    </div>
  );
}
