import { iniciarSesion } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-8 dark:bg-black">
      <form
        action={iniciarSesion}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-950"
      >
        <h1 className="text-xl font-bold text-brand-navy dark:text-white">
          Quales <span className="font-normal text-zinc-500 dark:text-zinc-400">ATS</span>
        </h1>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="campo"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Contraseña
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="campo"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
