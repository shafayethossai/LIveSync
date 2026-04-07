export const mockPosts = [
  {
    id: '1',
    type: 'family',
    postType: 'offer',
    userId: '1',
    userName: 'Ahmed Rahman',
    area: 'Dhanmondi',
    rent: 25000,
    rooms: 3,
    floor: 5,
    bathrooms: 2,
    balconies: 1,
    hasLift: true,
    utilityCost: 3000,
    availableFrom: 'March 2026',
    distanceFrom: 'Dhaka University',
    distanceKm: 2.5,
    description: 'Spacious 3 bedroom apartment with modern amenities. Very close to Dhaka University and shopping centers.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
    ],
    createdAt: '2026-02-20T10:00:00Z'
  },
  // ... (all other 7 posts remain exactly the same)
  {
    id: '8',
    type: 'family',
    postType: 'offer',
    userId: '8',
    userName: 'Nasrin Akter',
    area: 'Dhanmondi',
    rent: 30000,
    rooms: 3,
    floor: 3,
    bathrooms: 2,
    balconies: 1,
    hasLift: false,
    utilityCost: 3500,
    availableFrom: 'March 2026',
    distanceFrom: 'Dhanmondi Lake',
    distanceKm: 0.6,
    description: 'Well maintained apartment in prime location. Close to schools and hospitals.',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
    ],
    createdAt: '2026-02-14T12:00:00Z'
  }
];

// Helper functions (no TypeScript)
export function getPosts() {
  const saved = localStorage.getItem('livesync_posts');
  if (saved) return JSON.parse(saved);
  
  localStorage.setItem('livesync_posts', JSON.stringify(mockPosts));
  return mockPosts;
}

export function savePosts(posts) {
  try {
    // Keep only the last 50 posts to save space
    const postsToSave = posts.slice(0, 50);
    
    // Limit images per post to save storage space
    const compressedPosts = postsToSave.map(post => ({
      ...post,
      images: post.images ? post.images.slice(0, 3) : [] // Keep only first 3 images
    }));
    
    localStorage.setItem('livesync_posts', JSON.stringify(compressedPosts));
  } catch (error) {
    console.error('Failed to save posts:', error);
    // If quota exceeded, clear old posts and try again
    if (error.name === 'QuotaExceededError') {
      localStorage.removeItem('livesync_posts');
      const recentPosts = posts.slice(0, 10).map(post => ({
        ...post,
        images: post.images ? post.images.slice(0, 1) : [] // Keep only first image
      }));
      localStorage.setItem('livesync_posts', JSON.stringify(recentPosts));
    }
  }
}

export function addPost(post) {
  try {
    const posts = getPosts();
    
    // Limit images to first 3 for new posts
    const limitedPost = {
      ...post,
      images: post.images ? post.images.slice(0, 3) : []
    };
    
    posts.unshift(limitedPost);
    savePosts(posts);
  } catch (error) {
    console.error('Failed to add post:', error);
    throw error;
  }
}

export function getMessages(userId) {
  const saved = localStorage.getItem(`livesync_messages_${userId}`);
  return saved ? JSON.parse(saved) : [];
}

export function saveMessage(message) {
  const messages = getMessages(message.senderId);
  messages.push(message);
  localStorage.setItem(`livesync_messages_${message.senderId}`, JSON.stringify(messages));
}