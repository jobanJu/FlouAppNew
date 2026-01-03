import { supabase } from './supabase';

export const messagesAPI = {
  // Fetch conversations for current user
  async getConversations(userId: string, limit = 50) {
    return await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false })
      .limit(limit);
  },

  // Fetch messages in a conversation
  async getMessages(conversationId: string, limit = 100) {
    return await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);
  },

  // Send a message
  async sendMessage(conversationId: string, userId: string, content: string) {
    return await supabase.from('messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
    });
  },

  // Mark message as read
  async markAsRead(messageId: string) {
    return await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
  },

  // Get or create conversation
  async getOrCreateConversation(userId1: string, userId2: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
      .single();

    if (data) return data;

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: userId1,
        user2_id: userId2,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return newConv;
  },
};
