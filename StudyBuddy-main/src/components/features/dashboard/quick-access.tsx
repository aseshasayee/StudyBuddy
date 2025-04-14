export function QuickAccess() {
  const quickLinks = [
    { name: 'Flashcards', icon: '📝', href: '/flashcards' },
    { name: 'Study Planner', icon: '📅', href: '/planner' },
    { name: 'AI Tutor', icon: '🤖', href: '/ai-tutor' }
  ]

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">🚀 Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <span className="text-2xl mb-2">{link.icon}</span>
            <span className="font-medium">{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}