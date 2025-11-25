import { generateDetailedDescription } from '@/lib/ai-service';
import { getSession } from '@/lib/auth-helpers';
import { saveVisitAndReview, isLocationVisited } from '@/lib/database';
import { getStaticDescriptionForLocation } from '@/lib/location-static-descriptions';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [extraDescription, setExtraDescription] = useState<string | null>(null);
  const [isGeneratingExtra, setIsGeneratingExtra] = useState(false);
  const [hasGeneratedExtra, setHasGeneratedExtra] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [isVisited, setIsVisited] = useState(false);

  // Parse location data from params
  const location = params.location ? JSON.parse(params.location as string) : null;
  const staticDescription = location ? getStaticDescriptionForLocation(location.name) : null;
  const baseDescription = staticDescription ?? location?.description ?? '';
  const hasBaseDescription = baseDescription.trim().length > 0;
  const aiBaseDescription =
    baseDescription.trim().length > 0
      ? baseDescription
      : `Experiența la ${location?.name ?? 'această locație'} merită descoperită. Creează o descriere creativă care să redea vibe-ul locului chiar dacă nu avem detalii inițiale.`;

  useEffect(() => {
    checkIfVisited();
  }, [location]);

  const checkIfVisited = async () => {
    if (!location) return;
    try {
      const session = await getSession();
      if (!session) return;
      const visited = await isLocationVisited(session.account.accid, location.id);
      setIsVisited(visited);
    } catch (error) {
      console.error('Error checking if location is visited:', error);
    }
  };


  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Location data not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleGenerateExtraDescription = async () => {
    if (!location) return;

    try {
      setIsGeneratingExtra(true);

      const detailed = await generateDetailedDescription(location.name, aiBaseDescription);
      setExtraDescription(detailed);
      setHasGeneratedExtra(true); // hide button after generation
    } catch (error: any) {
      console.error('Error generating extra description:', error);
      Alert.alert(
        'Eroare',
        'Nu am putut genera descrierea suplimentară. Verifică conexiunea la internet sau API key-ul.'
      );
    } finally {
      setIsGeneratingExtra(false);
    }
  };

  const handleMarkAsVisited = () => {
    setShowReviewModal(true);
  };

  const handleSaveReview = async () => {
    if (!location) return;

    try {
      setIsSavingVisit(true);
      const session = await getSession();
      
      if (!session) {
        Alert.alert('Eroare', 'Trebuie să fii autentificat pentru a marca locația ca vizitată');
        setShowReviewModal(false);
        return;
      }

      const result = await saveVisitAndReview(
        session.account.accid,
        location.id,
        location.name,
        location.image_url,
        rating,
        reviewText.trim() || undefined
      );

      if (result.success) {
        setIsVisited(true);
        setShowReviewModal(false);
        setReviewText('');
        setRating(5);
        Alert.alert('Succes', 'Locația a fost marcată ca vizitată!');
      } else {
        Alert.alert('Eroare', result.error || 'Nu s-a putut salva vizita');
      }
    } catch (error: any) {
      console.error('Error saving visit:', error);
      Alert.alert('Eroare', 'A apărut o eroare. Te rog încearcă din nou.');
    } finally {
      setIsSavingVisit(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <Image
          source={{ uri: location.image_url }}
          style={styles.coverImage}
          contentFit="cover"
          transition={200}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Rating */}
          <Text style={styles.title}>{location.name}</Text>
          <Text style={styles.rating}>⭐ {location.rating.toFixed(1)}</Text>

          <View style={styles.descriptionContainer}>
            {hasBaseDescription ? (
              <Text style={styles.description}>{baseDescription}</Text>
            ) : (
              <Text style={styles.descriptionPlaceholder}>
                Nu avem încă o descriere pentru această locație, dar poți genera una cu AI.
              </Text>
            )}

            {/* Button to generate extra, more in-depth description with AI */}
            {!hasGeneratedExtra && !extraDescription && (
              <TouchableOpacity
                style={[styles.extraButton, isGeneratingExtra && styles.buttonDisabled]}
                onPress={handleGenerateExtraDescription}
                disabled={isGeneratingExtra}
              >
                {isGeneratingExtra ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.extraButtonText}>Se generează descrierea...</Text>
                  </View>
                ) : (
                  <Text style={styles.extraButtonText}>Extinde descrierea cu AI</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Extra AI-generated description (shown only after button is used) */}
          {extraDescription && (
            <View style={styles.extraDescriptionContainer}>
              <Text style={styles.extraDescription}>{extraDescription}</Text>
            </View>
          )}

          {/* Mark as Visited Button */}
          <TouchableOpacity
            style={[styles.visitedButton, isVisited && styles.visitedButtonActive]}
            onPress={handleMarkAsVisited}
            disabled={isSavingVisit}>
            {isVisited ? (
              <Text style={styles.visitedButtonText}>✓ Marcat ca Vizitat</Text>
            ) : (
              <Text style={styles.visitedButtonText}>📍 Marchează ca Vizitat</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adaugă o recenzie</Text>
            
            {/* Rating Selection */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Rating:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}>
                    <Text style={[styles.star, star <= rating && styles.starActive]}>
                      ⭐
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingValue}>{rating}/5</Text>
            </View>

            {/* Review Text Input */}
            <Text style={styles.reviewLabel}>Recenzie (opțional):</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Scrie recenzia ta aici..."
              placeholderTextColor="#777"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              textAlignVertical="top"
            />

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowReviewModal(false);
                  setReviewText('');
                  setRating(5);
                }}>
                <Text style={styles.modalButtonCancelText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, isSavingVisit && styles.buttonDisabled]}
                onPress={handleSaveReview}
                disabled={isSavingVisit}>
                {isSavingVisit ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonSaveText}>Salvează</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 350,
    backgroundColor: '#2a2a2a',
  },
  content: {
    padding: 24,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  rating: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#007AFF',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#b0b0b0',
    lineHeight: 26,
    marginBottom: 16,
  },
  descriptionPlaceholder: {
    fontSize: 16,
    color: '#777',
    lineHeight: 26,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  extraButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  extraDescriptionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  extraDescription: {
    fontSize: 15,
    color: '#d0d0d0',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginLeft: 8,
  },
  detailedButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  detailedButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  detailedContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  detailedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  detailedText: {
    fontSize: 16,
    color: '#d0d0d0',
    lineHeight: 26,
    marginBottom: 8,
  },
  vibeContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#5856D6',
  },
  vibeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5856D6',
    marginBottom: 8,
  },
  generatedLabel: {
    fontSize: 12,
    color: '#5856D6',
    fontStyle: 'italic',
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 30,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  vibeButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5856D6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  vibeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: '#3a3a3a',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonActive: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  errorText: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  visitedButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#34C759',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  visitedButtonActive: {
    backgroundColor: '#5856D6',
    shadowColor: '#5856D6',
  },
  visitedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
    opacity: 0.3,
  },
  starActive: {
    opacity: 1,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 4,
  },
  reviewLabel: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#3a3a3a',
  },
  modalButtonSave: {
    backgroundColor: '#007AFF',
  },
  modalButtonCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

