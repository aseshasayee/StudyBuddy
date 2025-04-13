'use client'

import { useState, useEffect } from 'react'

interface QuizSecurityState {
  isFullscreen: boolean
  hasLeftTab: boolean
  onTabSwitch?: () => void
}

export function useQuizSecurity(onTabSwitch?: () => void) {
  const [securityState, setSecurityState] = useState<QuizSecurityState>({
    isFullscreen: false,
    hasLeftTab: false,
    onTabSwitch
  })

  // Initialize audio context and warning sound
  let audioContext: AudioContext | null = null
  let oscillator: OscillatorNode | null = null

  const playWarningSound = () => {
    if (!audioContext) {
      audioContext = new AudioContext()
    }

    // Stop previous oscillator if exists
    if (oscillator) {
      oscillator.stop()
      oscillator.disconnect()
    }

    // Create and configure oscillator
    oscillator = audioContext.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4 note
    oscillator.connect(audioContext.destination)
    
    // Play a short beep
    oscillator.start()
    setTimeout(() => {
      oscillator?.stop()
      oscillator?.disconnect()
    }, 500) // 500ms duration
  }

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      }
      setSecurityState(prev => ({ ...prev, isFullscreen: true }))
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen()
      }
      setSecurityState(prev => ({ ...prev, isFullscreen: false }))
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setSecurityState(prev => ({ ...prev, hasLeftTab: true }))
        playWarningSound()
        securityState.onTabSwitch?.()
      } else {
        setSecurityState(prev => ({ ...prev, hasLeftTab: false }))
      }
    }

    const handleFullscreenChange = () => {
      setSecurityState(prev => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement
      }))
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      // Cleanup audio context
      if (oscillator) {
        oscillator.stop()
        oscillator.disconnect()
      }
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  return {
    ...securityState,
    enterFullscreen,
    exitFullscreen
  }
}