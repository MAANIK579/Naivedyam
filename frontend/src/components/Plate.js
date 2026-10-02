// src/components/Plate.js — Round Plate Component with radial gradient & real image fallback
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { MOODS } from '../theme';

const SIZES = {
  sm: 48,
  md: 68,
  lg: 84,
  xl: 190,
};

export default function Plate({
  size = 'md',
  mood = 'comfort',
  imageUrl,
  style,
}) {
  const pixelSize = typeof size === 'number' ? size : (SIZES[size] || 68);
  const moodCfg = MOODS[mood] || MOODS.comfort;

  const c1 = moodCfg.gradientFrom || '#E69E2E';
  const c2 = moodCfg.blobColor || '#FFD998';

  return (
    <View
      style={[
        styles.plateContainer,
        {
          width: pixelSize,
          height: pixelSize,
          borderRadius: pixelSize / 2,
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            {
              width: pixelSize,
              height: pixelSize,
              borderRadius: pixelSize / 2,
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        /* Render Artisanal Ceramic Culinary Dish sphere with highlights */
        <View
          style={[
            styles.ceramicPlate,
            {
              width: pixelSize,
              height: pixelSize,
              borderRadius: pixelSize / 2,
              backgroundColor: c1,
            },
          ]}
        >
          {/* Subtle rim highlight */}
          <View
            style={[
              styles.rimHighlight,
              {
                borderRadius: pixelSize / 2,
              },
            ]}
          />

          {/* Spherical center depth glow */}
          <View
            style={[
              styles.innerGlow,
              {
                width: pixelSize * 0.72,
                height: pixelSize * 0.72,
                borderRadius: (pixelSize * 0.72) / 2,
                backgroundColor: c2,
              },
            ]}
          />

          {/* Specular gleam light */}
          <View
            style={[
              styles.specularSpot,
              {
                width: pixelSize * 0.35,
                height: pixelSize * 0.22,
                borderRadius: pixelSize * 0.18,
                top: pixelSize * 0.16,
                left: pixelSize * 0.22,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  plateContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ceramicPlate: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rimHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  innerGlow: {
    opacity: 0.85,
  },
  specularSpot: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    transform: [{ rotate: '-25deg' }],
  },
});
