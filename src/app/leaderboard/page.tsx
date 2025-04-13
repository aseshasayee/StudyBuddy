'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Trophy, Medal } from 'lucide-react'

interface UserRank {
  username: string
  level: number
  college: string
  bio: string
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserRank[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let { data, error } = await supabase
          .from('users')
          .select('username, level, college, bio')
          .not('username', 'is', null) // Only get users with usernames
          .order('level', { ascending: false })
          .order('username', { ascending: true }); // Secondary sort for consistent ordering

        if (error) {
          console.error('Fetch error:', error);
          throw error;
        }

        // Process the data
        const processedUsers = data?.map(user => ({
          username: user.username || 'Anonymous',
          level: user.level || 0,
          college: user.college || 'Not specified',
          bio: user.bio || 'No bio available'
        })) || [];

        console.log('Fetched users:', processedUsers); // Debug log
        setUsers(processedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold">{rank + 1}</span>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🏆 Leaderboard</h1>
        
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-2xl shadow-lg">
          <div className="space-y-4">
            {users.map((user, index) => (
              <div
                key={index}
                className="bg-white/20 backdrop-blur-lg p-4 rounded-xl flex items-center gap-4"
              >
                <div className="flex items-center justify-center w-12">
                  {getRankBadge(index)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{user.username}</h3>
                    <span className="bg-white/30 px-2 py-1 rounded text-sm text-white">
                      Level {user.level}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm">{user.college}</p>
                  <p className="text-white/60 text-sm truncate">{user.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}