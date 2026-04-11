/**
 * OptimizedImage - 优化的图片组件
 * 支持懒加载、占位符、错误处理
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  objectFit?: 'contain' | 'cover'
  skeleton?: boolean
}

export function OptimizedImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  objectFit = 'cover',
  skeleton = true,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // priority图片立即加载
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer 懒加载
  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '100px', // 提前100px开始加载
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [priority])

  // 错误占位符
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`flex items-center justify-center bg-zinc-900 ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-zinc-600">
          <ImageIcon className="w-8 h-8" />
          <span className="text-xs">加载失败</span>
        </div>
      </div>
    )
  }

  // 骨架屏占位符
  if (!isInView || isLoading) {
    return (
      <div
        ref={imgRef}
        className={`bg-zinc-900 ${skeleton ? 'animate-pulse' : ''} ${className}`}
      >
        {isInView && (
          <Image
            src={src}
            alt={alt}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            className={`object-${objectFit} opacity-0`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true)
              setIsLoading(false)
            }}
            priority={priority}
          />
        )}
      </div>
    )
  }

  // 正常显示
  return (
    <div ref={imgRef} className={className}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={`object-${objectFit} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        priority={priority}
      />
    </div>
  )
}
