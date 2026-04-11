import api from './api';

// Create a new post
export const createPost = async (postData) => {
  try {
    const response = await api.post('/posts', postData);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create post';
    return { success: false, message };
  }
};

// Get all posts with pagination
export const getAllPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/posts?page=${page}&limit=${limit}`);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch posts';
    return { success: false, message };
  }
};

// Get a single post by ID
export const getPostById = async (postId) => {
  try {
    const response = await api.get(`/posts/${postId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Post not found';
    return { success: false, message };
  }
};

// Get user's own posts
export const getUserPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/user/my-posts?page=${page}&limit=${limit}`);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch your posts';
    return { success: false, message };
  }
};

// Update an existing post
export const updatePost = async (postId, postData) => {
  try {
    const response = await api.put(`/posts/${postId}`, postData);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update post';
    return { success: false, message };
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to delete post';
    return { success: false, message };
  }
};
