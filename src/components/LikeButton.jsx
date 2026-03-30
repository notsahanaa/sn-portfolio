import { useState, useEffect } from 'react'
import { likeProject } from '../api/client'
import '../styles/LikeButton.css'

function LikeButton({ slug, initialLikes = 0 }) {
  const [likes, setLikes] = useState(initialLikes)
  const [hasLiked, setHasLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check localStorage for previous like
    const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '[]')
    setHasLiked(likedProjects.includes(slug))
  }, [slug])

  const handleLike = async () => {
    if (hasLiked || isLoading) return

    setIsLoading(true)
    // Optimistic update
    setLikes(prev => prev + 1)
    setHasLiked(true)

    try {
      const result = await likeProject(slug)
      setLikes(result.likes)

      // Save to localStorage
      const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '[]')
      likedProjects.push(slug)
      localStorage.setItem('likedProjects', JSON.stringify(likedProjects))
    } catch (error) {
      // Revert optimistic update
      setLikes(prev => prev - 1)
      setHasLiked(false)
      console.error('Failed to like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      className={`like-button ${hasLiked ? 'liked' : ''}`}
      onClick={handleLike}
      disabled={hasLiked || isLoading}
      aria-label={hasLiked ? 'Already liked' : 'Like this project'}
    >
      <span className="heart">{hasLiked ? '♥' : '♡'}</span>
      <span className="count">{likes}</span>
    </button>
  )
}

export default LikeButton
