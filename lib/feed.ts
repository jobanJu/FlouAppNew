import { supabase } from './supabase';

// Create a post
export const createPost = async (userId: string, content: string, imageUrl?: string) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        user_id: userId,
        content,
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get posts feed
export const getFeed = async (limit: number = 50, offset: number = 0) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      content,
      image_url,
      likes_count,
      comments_count,
      created_at,
      user:profiles(first_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

// Like a post
export const likePost = async (postId: string, userId: string) => {
  const { error: insertError } = await supabase
    .from('post_likes')
    .insert([
      {
        post_id: postId,
        user_id: userId,
      },
    ]);

  if (insertError && insertError.code !== '23505') throw insertError;

  // Increment likes count
  const { data: post } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('id', postId)
    .single();

  await supabase
    .from('posts')
    .update({ likes_count: (post?.likes_count || 0) + 1 })
    .eq('id', postId);
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string) => {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw error;

  // Decrement likes count
  const { data: post } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('id', postId)
    .single();

  await supabase
    .from('posts')
    .update({ likes_count: Math.max(0, (post?.likes_count || 1) - 1) })
    .eq('id', postId);
};

// Check if user liked a post
export const checkIfLiked = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

// Create comment
export const createComment = async (postId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('post_comments')
    .insert([
      {
        post_id: postId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Increment comment count
  const { data: post } = await supabase
    .from('posts')
    .select('comments_count')
    .eq('id', postId)
    .single();

  await supabase
    .from('posts')
    .update({ comments_count: (post?.comments_count || 0) + 1 })
    .eq('id', postId);

  return data;
};

// Get post comments
export const getPostComments = async (postId: string, limit: number = 20) => {
  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      id,
      user_id,
      content,
      created_at,
      user:profiles(first_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Delete post
export const deletePost = async (postId: string, userId: string) => {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) throw error;
};
