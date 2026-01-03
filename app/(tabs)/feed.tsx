import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    first_name: string;
    avatar_url?: string;
  };
  liked_by_current_user?: boolean;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    loadPosts();
    subscribeToNewPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
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
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewPosts = () => {
    const subscription = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload: any) => {
          setPosts((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return subscription;
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user?.id) return;

    try {
      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          content: newPostContent.trim(),
          likes_count: 0,
          comments_count: 0,
        },
      ]);

      if (error) throw error;

      setNewPostContent('');
      setShowNewPostForm(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    try {
      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user?.id);

        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likes_count: Math.max(0, post.likes_count - 1),
                  liked_by_current_user: false,
                }
              : post
          )
        );
      } else {
        await supabase.from('post_likes').insert([
          {
            post_id: postId,
            user_id: user?.id,
          },
        ]);

        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likes_count: post.likes_count + 1,
                  liked_by_current_user: true,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
      }}
    >
      {/* Author */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {item.user?.avatar_url && (
          <Image
            source={{ uri: item.user.avatar_url }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              marginRight: 12,
            }}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 14 }}>
            {item.user?.first_name || 'Utilisateur'}
          </Text>
          <Text style={{ color: '#999', fontSize: 11 }}>
            {new Date(item.created_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={{ fontSize: 14, lineHeight: 20, color: '#333', marginBottom: 12 }}>
        {item.content}
      </Text>

      {/* Image */}
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={{
            width: '100%',
            height: 200,
            borderRadius: 8,
            marginBottom: 12,
          }}
        />
      )}

      {/* Actions */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
        }}
      >
        <TouchableOpacity
          onPress={() => toggleLike(item.id, item.liked_by_current_user || false)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            flex: 1,
          }}
        >
          <Text style={{ fontSize: 16, marginRight: 4 }}>
            {item.liked_by_current_user ? '❤️' : '🤍'}
          </Text>
          <Text style={{ color: '#666', fontSize: 12 }}>
            {item.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            flex: 1,
          }}
        >
          <Text style={{ fontSize: 16, marginRight: 4 }}>💬</Text>
          <Text style={{ color: '#666', fontSize: 12 }}>
            {item.comments_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            flex: 1,
          }}
        >
          <Text style={{ fontSize: 16 }}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {/* New Post Form */}
          {showNewPostForm && (
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 80,
                  fontSize: 16,
                  textAlignVertical: 'top',
                  marginBottom: 12,
                }}
                placeholder="Partage ton moment..."
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowNewPostForm(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    backgroundColor: '#F0F0F0',
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '600', color: '#333' }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    backgroundColor: newPostContent.trim() ? '#007AFF' : '#CCCCCC',
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '600', color: '#FFF' }}>Poster</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Create Post Button */}
          {!showNewPostForm && (
            <TouchableOpacity
              onPress={() => setShowNewPostForm(true)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#F9F9F9',
                borderBottomWidth: 1,
                borderBottomColor: '#F0F0F0',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>📸</Text>
                <Text style={{ color: '#999', flex: 1 }}>
                  Partage ton moment...
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Posts List */}
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            onRefresh={onRefresh}
            refreshing={refreshing}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, color: '#999' }}>
                  Aucun post pour le moment
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}
