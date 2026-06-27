'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioTrack } from '@/types/api'
import { getAudioTrackForTime } from '@/lib/chapters/chapterEditorUtils'

interface UseChapterPreviewAudioOptions {
  tracks: AudioTrack[]
  token: string
}

export function useChapterPreviewAudio({ tracks, token }: UseChapterPreviewAudioOptions) {
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playStartTimeRef = useRef<number | null>(null)
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null)
  const [isPlayingChapter, setIsPlayingChapter] = useState(false)
  const [isLoadingChapter, setIsLoadingChapter] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  const stopElapsedTimeTracking = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }
    setElapsedTime(0)
    playStartTimeRef.current = null
  }, [])

  const destroyAudioEl = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.removeAttribute('src')
      audioElRef.current.load()
      audioElRef.current.remove()
      audioElRef.current = null
    }
    setSelectedChapterId(null)
    setIsPlayingChapter(false)
    setIsLoadingChapter(false)
    stopElapsedTimeTracking()
  }, [stopElapsedTimeTracking])

  const startElapsedTimeTracking = useCallback(() => {
    setElapsedTime(0)
    playStartTimeRef.current = Date.now()
    elapsedIntervalRef.current = setInterval(() => {
      if (playStartTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - playStartTimeRef.current) / 1000))
      }
    }, 100)
  }, [])

  const playTrackAtTime = useCallback(
    (audioTrack: AudioTrack, trackOffset: number) => {
      setCurrentTrackIndex(audioTrack.index)
      setIsLoadingChapter(true)

      const audioEl = document.createElement('audio')
      audioEl.src = `${audioTrack.contentUrl}?token=${token}`
      audioEl.id = 'chapter-audio'
      document.body.appendChild(audioEl)
      audioElRef.current = audioEl

      const handleLoadedData = () => {
        audioEl.currentTime = trackOffset
        void audioEl.play()
      }

      const handlePlay = () => {
        setIsLoadingChapter(false)
        setIsPlayingChapter(true)
        startElapsedTimeTracking()
      }

      const handleEnded = () => {
        const nextTrack = tracksRef.current.find((t) => t.index === audioTrack.index + 1)
        if (audioElRef.current) {
          audioElRef.current.remove()
          audioElRef.current = null
        }
        if (nextTrack) {
          playTrackAtTime(nextTrack, 0)
        } else {
          destroyAudioEl()
        }
      }

      audioEl.addEventListener('loadeddata', handleLoadedData, { once: true })
      audioEl.addEventListener('play', handlePlay, { once: true })
      audioEl.addEventListener('ended', handleEnded, { once: true })
    },
    [destroyAudioEl, startElapsedTimeTracking, token]
  )

  const playChapter = useCallback(
    (chapterId: number, chapterStart: number) => {
      if (selectedChapterId === chapterId) {
        if (isLoadingChapter) return
        if (isPlayingChapter) {
          destroyAudioEl()
          return
        }
      }

      if (selectedChapterId !== null) {
        destroyAudioEl()
      }

      const audioTrack = getAudioTrackForTime(tracks, chapterStart)
      if (!audioTrack) {
        return
      }

      setSelectedChapterId(chapterId)
      playTrackAtTime(audioTrack, chapterStart - audioTrack.startOffset)
    },
    [destroyAudioEl, isLoadingChapter, isPlayingChapter, playTrackAtTime, selectedChapterId, tracks]
  )

  useEffect(() => {
    return () => {
      destroyAudioEl()
    }
  }, [destroyAudioEl])

  return {
    selectedChapterId,
    isPlayingChapter,
    isLoadingChapter,
    currentTrackIndex,
    elapsedTime,
    playChapter,
    destroyAudioEl,
    getAudioTrackForTime: (time: number) => getAudioTrackForTime(tracks, time)
  }
}
