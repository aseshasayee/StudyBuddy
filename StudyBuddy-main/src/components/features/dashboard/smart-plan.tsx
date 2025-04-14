interface Subject {
  name: string
  timeSlot: string
  icon: string
}

interface SmartPlanProps {
  progress: number
  subjects: Subject[]
}

export function SmartPlan({ progress, subjects }: SmartPlanProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">☁️ Today's Smart Plan</h2>
        <span className="text-sm text-gray-500">📊 Progress: {progress}%</span>
      </div>
      <div className="space-y-4">
        {subjects.map((subject, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <span>{subject.icon}</span>
              <div>
                <h3 className="font-medium">{subject.name}</h3>
                <p className="text-sm text-gray-500">{subject.timeSlot}</p>
              </div>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}