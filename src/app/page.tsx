import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-xl text-text">EduChat</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-text-light hover:text-text transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-all shadow-sm hover:shadow-md"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 text-sm text-text-light mb-6 shadow-sm">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Powered by AI
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text leading-tight">
          Your AI-Powered
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Educational Assistant
          </span>
        </h1>

        <p className="mt-6 text-lg text-text-light max-w-2xl mx-auto leading-relaxed">
          Teachers share course information. Students ask the AI. Get instant answers about exams, schedules, and more - all powered by your teacher&apos;s knowledge.
        </p>

        <div className="flex items-center justify-center gap-4 mt-10">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 text-sm"
          >
            Start Learning
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-white text-text font-medium rounded-xl border border-border hover:bg-surface-dark transition-all shadow-sm text-sm"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-text mb-2">AI-Powered Answers</h3>
            <p className="text-sm text-text-light leading-relaxed">
              Ask questions about any subject and get instant, accurate answers based on your teacher&apos;s provided information.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-text mb-2">Direct Teacher Chat</h3>
            <p className="text-sm text-text-light leading-relaxed">
              When the AI can&apos;t help, connect directly with your teacher through real-time messaging for personalized answers.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-semibold text-text mb-2">Teacher Knowledge Base</h3>
            <p className="text-sm text-text-light leading-relaxed">
              Teachers add exam dates, room numbers, and schedules. The AI uses this data to provide accurate, up-to-date answers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white/50 py-6 text-center">
        <p className="text-sm text-text-light">EduChat - AI-Powered Educational Assistant</p>
      </footer>
    </div>
  )
}
