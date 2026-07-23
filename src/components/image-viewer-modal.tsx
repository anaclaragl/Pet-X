import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, Image, Pressable, Dimensions } from 'react-native';
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
      <View style={styles.overlay}>
        {/* Header Bar */}
        <View style={styles.header}>
          <ThemedText style={styles.counterText}>
            {images.length > 1 ? `${currentIndex + 1} / ${images.length}` : ''}
          </ThemedText>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={28} color="#FFF" />
          </Pressable>
        </View>

        {/* Image Content Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Pressable style={[styles.arrowButton, styles.leftArrow]} onPress={handlePrev}>
                <MaterialIcons name="chevron-left" size={36} color="#FFF" />
              </Pressable>
              <Pressable style={[styles.arrowButton, styles.rightArrow]} onPress={handleNext}>
                <MaterialIcons name="chevron-right" size={36} color="#FFF" />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 16,
    zIndex: 10,
  },
  counterText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  leftArrow: {
    left: 16,
  },
  rightArrow: {
    right: 16,
  },
});
