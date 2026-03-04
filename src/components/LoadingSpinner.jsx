export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      {/* Vinyl record */}
      <div className="relative w-24 h-24 vinyl-spin">
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Outer vinyl */}
          <circle cx="50" cy="50" r="48" fill="#111" />
          {/* Grooves */}
          {[38, 30, 22].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#1a1a2e" strokeWidth="1.5" />
          ))}
          {/* Label */}
          <circle cx="50" cy="50" r="16" fill="#1a1a2e" />
          <circle cx="50" cy="50" r="10" fill="#e8b86d" opacity="0.15" />
          {/* Center hole */}
          <circle cx="50" cy="50" r="3" fill="#111" />
          {/* Highlight */}
          <path d="M 20 20 Q 50 10 80 20" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" />
        </svg>
      </div>

      <p className="font-body text-[var(--text-muted)] text-sm tracking-widest uppercase">
        {message}
      </p>
    </div>
  )
}
