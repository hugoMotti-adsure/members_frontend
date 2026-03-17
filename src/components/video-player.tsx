'use client'

import { useMemo } from 'react'
import { Play } from 'lucide-react'

interface VideoPlayerProps {
  url: string
  title?: string
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const embedUrl = useMemo(() => {
    if (!url) return null

    // Se já é um iframe/embed HTML, retorna null para usar dangerouslySetInnerHTML
    if (url.includes('<iframe') || url.includes('<embed')) {
      return { type: 'html', content: url }
    }

    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    )
    if (youtubeMatch) {
      return {
        type: 'iframe',
        content: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
      }
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) {
      return {
        type: 'iframe',
        content: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      }
    }

    // Panda Video
    const pandaMatch = url.match(/player-vz-([a-z0-9]+)\.tv\.pandavideo\.com\.br\/embed\/\?v=([a-z0-9-]+)/i)
    if (pandaMatch || url.includes('pandavideo.com')) {
      // Se é uma URL do Panda, apenas usa ela diretamente
      return {
        type: 'iframe',
        content: url,
      }
    }

    // Bunny Stream
    if (url.includes('iframe.mediadelivery.net') || url.includes('bunny')) {
      return {
        type: 'iframe',
        content: url,
      }
    }

    // SmartPlayer / ScaleUp
    if (url.includes('player.scaleup.com.br') || url.includes('smartplayer')) {
      return {
        type: 'iframe',
        content: url,
      }
    }

    // URL direta de vídeo (mp4, webm, etc.)
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
      return {
        type: 'video',
        content: url,
      }
    }

    // Se não reconhece, tenta como iframe genérico
    return {
      type: 'iframe',
      content: url,
    }
  }, [url])

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <div className="text-center text-zinc-500">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nenhum vídeo disponível</p>
        </div>
      </div>
    )
  }

  if (!embedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <div className="text-center text-zinc-500">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Formato de vídeo não suportado</p>
        </div>
      </div>
    )
  }

  if (embedUrl.type === 'html') {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: embedUrl.content }}
      />
    )
  }

  if (embedUrl.type === 'video') {
    return (
      <video
        src={embedUrl.content}
        controls
        className="w-full h-full"
        title={title}
      >
        Seu navegador não suporta vídeos HTML5.
      </video>
    )
  }

  // iframe (YouTube, Vimeo, etc.)
  return (
    <iframe
      src={embedUrl.content}
      title={title || 'Video'}
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      frameBorder="0"
    />
  )
}
