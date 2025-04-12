'use client'

import React from 'react'
import { useUser } from '@/contexts/user-context'
import { Card } from '@/components/ui/card'
import { calculateAge } from '@/lib/utils'

export default function ProfileCard() {
  const { user, userProfile } = useUser()

  if (!user || !userProfile) {
    return null
  }

  const age = userProfile.date_of_birth ? calculateAge(userProfile.date_of_birth) : null

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Profile Information</h2>
      
      <div className="space-y-3">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Username</span>
          <span className="font-medium">{userProfile.username}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
          <span className="font-medium">{user.email}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Age</span>
          <span className="font-medium">{age} years old</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</span>
          <span className="font-medium">{userProfile.date_of_birth}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Education</span>
          <span className="font-medium">{userProfile.education}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Level</span>
          <span className="font-medium">{userProfile.level || 'Beginner'}</span>
        </div>
      </div>
    </Card>
  )
}