export default function SiteFooter({ children }) {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
        &copy; 2026 JustStretch. Just a team with a big dream.
      </p>
      {children && <p className="mx-auto mt-3 max-w-xl px-6 text-xs font-medium text-slate-400">{children}</p>}
    </footer>
  )
}
