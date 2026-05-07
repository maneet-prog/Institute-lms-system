export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell py-10">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="rounded-[2rem] bg-[#A93A30] p-8 text-white shadow-xl shadow-[#A93A30]/15">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f0b44c]">TecOnline Campus</p>
          <h1 className="mt-3 text-3xl font-semibold">A smoother coaching platform for every role.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Sign in, register, and manage your learning journey inside the new TecOnline experience inspired by Tajinder&apos;s English Classes.
          </p>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
