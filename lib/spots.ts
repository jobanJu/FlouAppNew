import { supabase } from './supabase';

// Get all spots
export const getSpots = async (limit: number = 100) => {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Get spot details
export const getSpotDetails = async (spotId: string) => {
  const { data, error } = await supabase
    .from('spots')
    .select(`
      *,
      reviews:spot_reviews(
        id,
        user_id,
        rating,
        comment,
        created_at,
        user:profiles(first_name, avatar_url)
      )
    `)
    .eq('id', spotId)
    .single();

  if (error) throw error;
  return data;
};

// Filter spots by difficulty
export const getSpotsByDifficulty = async (difficulty: string, limit: number = 50) => {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('difficulty', difficulty)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Get nearby spots (geospatial)
export const getNearbySpots = async (lat: number, lng: number, radiusKm: number = 50) => {
  // Simple distance calculation (radius-based)
  // In production, use PostGIS for better performance
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .order('rating', { ascending: false });

  if (error) throw error;

  return data?.filter((spot) => {
    const distance = Math.sqrt(
      Math.pow(spot.lat - lat, 2) + Math.pow(spot.lng - lng, 2)
    );
    return distance * 111 <= radiusKm; // Approximate km conversion
  }) || [];
};

// Create spot review
export const createSpotReview = async (
  spotId: string,
  userId: string,
  rating: number,
  comment: string
) => {
  const { data: review, error: reviewError } = await supabase
    .from('spot_reviews')
    .insert([
      {
        spot_id: spotId,
        user_id: userId,
        rating,
        comment,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (reviewError) throw reviewError;

  // Update spot average rating
  const { data: reviews } = await supabase
    .from('spot_reviews')
    .select('rating')
    .eq('spot_id', spotId);

  if (reviews && reviews.length > 0) {
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await supabase
      .from('spots')
      .update({
        rating: Math.round(averageRating * 10) / 10,
        reviews_count: reviews.length,
      })
      .eq('id', spotId);
  }

  return review;
};

// Get spot reviews
export const getSpotReviews = async (spotId: string, limit: number = 20) => {
  const { data, error } = await supabase
    .from('spot_reviews')
    .select(`
      id,
      user_id,
      rating,
      comment,
      created_at,
      user:profiles(first_name, avatar_url)
    `)
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Create spot
export const createSpot = async (
  name: string,
  description: string,
  lat: number,
  lng: number,
  difficulty: string,
  bestSeason: string,
  waveHeight: string,
  imageUrl?: string
) => {
  const { data, error } = await supabase
    .from('spots')
    .insert([
      {
        name,
        description,
        lat,
        lng,
        difficulty,
        best_season: bestSeason,
        wave_height: waveHeight,
        image_url: imageUrl,
        rating: 5.0,
        reviews_count: 0,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Favorite a spot
export const favoriteSpot = async (spotId: string, userId: string) => {
  const { error } = await supabase
    .from('user_favorite_spots')
    .insert([
      {
        spot_id: spotId,
        user_id: userId,
      },
    ]);

  if (error && error.code !== '23505') throw error; // 23505 = unique violation
};

// Unfavorite a spot
export const unfavoriteSpot = async (spotId: string, userId: string) => {
  const { error } = await supabase
    .from('user_favorite_spots')
    .delete()
    .eq('spot_id', spotId)
    .eq('user_id', userId);

  if (error) throw error;
};

// Get user favorite spots
export const getUserFavoriteSpots = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_favorite_spots')
    .select(`
      spot:spots(*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map((item: any) => item.spot) || [];
};
