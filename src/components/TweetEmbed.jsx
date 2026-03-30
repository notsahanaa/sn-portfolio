import { useEffect, useRef, useState, useMemo } from 'react'
import '../styles/TweetEmbed.css'

function TweetEmbed({ tweetUrl }) {
  const wrapperRef = useRef(null)
  const tweetContainerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Extract tweet ID outside effect
  const tweetId = useMemo(() => {
    const match = tweetUrl.match(/status\/(\d+)/)
    return match ? match[1] : null
  }, [tweetUrl])

  // Determine if URL is valid upfront
  const isValidUrl = tweetId !== null

  useEffect(() => {
    if (!isValidUrl) {
      return
    }

    let cancelled = false

    // Load Twitter widget script if not already loaded
    const loadTwitterWidget = () => {
      return new Promise((resolve) => {
        // If already loaded and ready
        if (window.twttr && window.twttr.widgets) {
          resolve(window.twttr)
          return
        }

        // Check if script is already in DOM
        const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')

        if (!existingScript) {
          const script = document.createElement('script')
          script.src = 'https://platform.twitter.com/widgets.js'
          script.async = true
          document.head.appendChild(script)
        }

        // Wait for twttr to be ready
        const checkReady = () => {
          if (window.twttr && window.twttr.widgets) {
            resolve(window.twttr)
          } else {
            setTimeout(checkReady, 100)
          }
        }
        checkReady()
      })
    }

    const embedTweet = async () => {
      try {
        const twttr = await loadTwitterWidget()

        if (!cancelled && tweetContainerRef.current) {
          const tweet = await twttr.widgets.createTweet(tweetId, tweetContainerRef.current, {
            theme: 'light',
            width: '100%'
          })

          // createTweet returns null if tweet doesn't exist or is unavailable
          if (!tweet && !cancelled) {
            setLoadError(true)
          }
        }
        if (!cancelled) {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to embed tweet:', err)
        if (!cancelled) {
          setLoadError(true)
          setIsLoading(false)
        }
      }
    }

    // Use IntersectionObserver for lazy loading - observe wrapper, not tweet container
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          embedTweet()
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current)
    }

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [tweetId, isValidUrl])

  if (!isValidUrl || loadError) {
    return (
      <div className="tweet-embed tweet-error">
        <p>Tweet unavailable</p>
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
          View on Twitter →
        </a>
      </div>
    )
  }

  // Wrapper for IntersectionObserver, separate container for Twitter widget
  // This prevents React/Twitter DOM conflicts
  return (
    <div className="tweet-embed" ref={wrapperRef}>
      {isLoading && <div className="tweet-loading">Loading tweet...</div>}
      <div ref={tweetContainerRef} />
    </div>
  )
}

export default TweetEmbed
