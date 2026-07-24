import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, Image, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';

interface ImageViewerModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageViewerModal({ visible, images, initialIndex = 0, onClose }: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex >= 0 && initialIndex < images.length ? initialIndex : 0);
    }
  }, [visible, initialIndex, images]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, currentIndex, images]);

  if (!visible || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(images.length - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Header Bar */}
        <View style={styles.header}>
          <ThemedText style={styles.counterText}>
            {images.length > 1 ? `${currentIndex + 1} / ${images.length}` : ''}
          </ThemedText>
          <Pressable style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]} onPress={onClose}>
            <MaterialIcons name="close" size={26} color="#FFF" />
          </Pressable>
        </View>

        {/* Image Content Container */}
        <View style={[styles.imageContainer, { pointerEvents: 'box-none' as const }]}>
          <Pressable style={styles.imageWrapper} onPress={(e) => e.stopPropagation()}>
            <Image
              source={{ uri: currentImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </Pressable>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Pressable
                style={({ pressed }) => [styles.arrowButton, styles.leftArrow, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
                onPress={(e) => { e.stopPropagation(); handlePrev(); }}
              >
                <MaterialIcons name="chevron-left" size={36} color="#FFF" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.arrowButton, styles.rightArrow, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
                onPress={(e) => { e.stopPropagation(); handleNext(); }}
              >
                <MaterialIcons name="chevron-right" size={36} color="#FFF" />
              </Pressable>
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 48,
    paddingBottom: 16,
    zIndex: 10,
  },
  counterText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 60,
    paddingBottom: 24,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    maxWidth: 1200,
    maxHeight: '90%',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -28,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  leftArrow: {
    left: 20,
  },
  rightArrow: {
    right: 20,
  },
});
