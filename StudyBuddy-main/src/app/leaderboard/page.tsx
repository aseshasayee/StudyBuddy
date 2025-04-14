'use client'

import { Trophy, Medal, Star } from 'lucide-react'

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Leaderboard
            </span>
          </h1>
          <p className="text-gray-400">Top performers in your learning journey</p>
        </div>

        <div className="space-y-4">
          {/* Top player card */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-md p-6 rounded-2xl border border-yellow-500/20 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Aakash</h3>
                  <span className="px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-300 text-sm">
                    Level 3
                  </span>
                </div>
                <p className="text-gray-400 text-sm">VIT Chennai</p>
              </div>
            </div>
          </div>

          {/* Other players */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center">
                <Medal className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">John</h3>
                  <span className="px-3 py-1 bg-gray-700/50 rounded-full text-gray-300 text-sm">
                    Level 1
                  </span>
                </div>
                <p className="text-gray-400 text-sm">VELS</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center">
                <Medal className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Saksham</h3>
                  <span className="px-3 py-1 bg-gray-700/50 rounded-full text-gray-300 text-sm">
                    Level 1
                  </span>
                </div>
                <p className="text-gray-400 text-sm">SRMIST KTR</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 transform hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center">
                <Medal className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">sesh</h3>
                  <span className="px-3 py-1 bg-gray-700/50 rounded-full text-gray-300 text-sm">
                    Level 1
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Not specified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}