import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

type Props = {
  imageUrl?: string;
  size?: number;
};

export default function BulleProfilFlou({ imageUrl, size = 96 }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#e9e9e9',
  },
});
