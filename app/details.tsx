import { generateVibeDescription, generateDetailedDescription, generateBaseDescription } from '@/lib/ai-service';
import { getSession } from '@/lib/auth-helpers';
import { isLocationSaved, removeSavedLocation, saveLocation } from '@/lib/database';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [baseDescription, setBaseDescription] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [detailedDescription, setDetailedDescription] = useState<string | null>(null);
  const [isGeneratingBase, setIsGeneratingBase] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDetailed, setIsGeneratingDetailed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(true);

  // Parse location data from params
  const location = params.location ? JSON.parse(params.location as string) : null;
  
  // Initialize description with original
  const originalDescription = location?.description || '';

  useEffect(() => {
    checkIfSaved();
    // Generate base description automatically when location loads
    if (location && !baseDescription) {
      generateBaseDescriptionForLocation();
    }
  }, [location]);

  const generateBaseDescriptionForLocation = async () => {
    if (!location) return;

    try {
      setIsGeneratingBase(true);
      const generatedBase = await generateBaseDescription(
        location.name,
        originalDescription
      );
      setBaseDescription(generatedBase);
    } catch (error: any) {
      console.error('Error generating base description:', error);
      // Fallback to original description if generation fails
      setBaseDescription(originalDescription || `${location.name} este o destinație turistică remarcabilă din România.`);
    } finally {
      setIsGeneratingBase(false);
    }
  };

  const checkIfSaved = async () => {
    if (!location) {
      setCheckingSaved(false);
      return;
    }

    try {
      const session = await getSession();
      if (!session) {
        setCheckingSaved(false);
        return;
      }

      const saved = await isLocationSaved(session.account.accid, location.id);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking if location is saved:', error);
    } finally {
      setCheckingSaved(false);
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

  const handleWhatsAppReservation = () => {
    const message = `Bună! Aș dori să rezerv pentru: ${location.name}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch((err) => {
      console.error('Error opening WhatsApp:', err);
    });
  };

  const handleGenerateVibe = async () => {
    if (!location) return;

    try {
      setIsGenerating(true);
      const generatedDescription = await generateVibeDescription(
        location.name,
        originalDescription
      );
      setDescription(generatedDescription);
    } catch (error: any) {
      console.error('Error generating vibe:', error);
      Alert.alert(
        'Eroare',
        'Nu am putut genera descrierea. Verifică conexiunea la internet sau API key-ul.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDetailed = async () => {
    if (!location || !baseDescription) return;

    try {
      setIsGeneratingDetailed(true);
      // Use base description as context to extend
      const generatedDetailed = await generateDetailedDescription(
        location.name,
        baseDescription
      );
      setDetailedDescription(generatedDetailed);
    } catch (error: any) {
      console.error('Error generating detailed description:', error);
      Alert.alert(
        'Eroare',
        'Nu am putut genera descrierea detaliată. Verifică conexiunea la internet sau API key-ul.'
      );
    } finally {
      setIsGeneratingDetailed(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!location) return;

    try {
      setIsSaving(true);
      const session = await getSession();
      
      if (!session) {
        Alert.alert('Eroare', 'Trebuie să fii autentificat pentru a salva locații');
        return;
      }

      if (isSaved) {
        // Remove saved location
        const result = await removeSavedLocation(session.account.accid, location.id);
        if (result.success) {
          setIsSaved(false);
          Alert.alert('Succes', 'Locația a fost ștearsă din lista ta');
        } else {
          Alert.alert('Eroare', result.error || 'Nu s-a putut șterge locația');
        }
      } else {
        // Save location
        const result = await saveLocation(
          session.account.accid,
          location.id,
          location.name,
          location.image_url,
          location.rating,
          location.description
        );

        if (result.success) {
          setIsSaved(true);
          Alert.alert('Succes', 'Locația a fost salvată!');
        } else {
          Alert.alert('Eroare', result.error || 'Nu s-a putut salva locația');
        }
      }
    } catch (error: any) {
      console.error('Error saving/removing location:', error);
      Alert.alert('Eroare', 'A apărut o eroare. Te rog încearcă din nou.');
    } finally {
      setIsSaving(false);
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

          {/* Base Description (always shown, generated automatically) */}
          {isGeneratingBase ? (
            <View style={styles.descriptionContainer}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#007AFF" size="small" />
                <Text style={styles.loadingText}>Generând descriere de bază...</Text>
              </View>
            </View>
          ) : baseDescription ? (
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{baseDescription}</Text>
              
              {/* Button to generate detailed description */}
              <TouchableOpacity
                style={[styles.detailedButton, isGeneratingDetailed && styles.buttonDisabled]}
                onPress={handleGenerateDetailed}
                disabled={isGeneratingDetailed || !baseDescription}>
                {isGeneratingDetailed ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#007AFF" size="small" />
                    <Text style={styles.detailedButtonText}>Extindând descrierea...</Text>
                  </View>
                ) : (
                  <Text style={styles.detailedButtonText}>
                    📖 Extinde cu descriere detaliată AI
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Detailed Description (shown when generated) */}
          {detailedDescription && (
            <View style={styles.detailedContainer}>
              <Text style={styles.detailedTitle}>Descriere detaliată</Text>
              <Text style={styles.detailedText}>{detailedDescription}</Text>
              <Text style={styles.generatedLabel}>✨ Generată cu AI</Text>
            </View>
          )}

          {/* Vibe Description (if generated) */}
          {description && description !== casualDescription && (
            <View style={styles.vibeContainer}>
              <Text style={styles.vibeTitle}>✨ Descriere creativă</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleWhatsAppReservation}>
          <Text style={styles.whatsappButtonText}>Rezervă pe WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaved && styles.saveButtonActive, isSaving && styles.buttonDisabled]}
          onPress={handleSaveLocation}
          disabled={isSaving || checkingSaved}>
          {isSaving ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.saveButtonText}>Se procesează...</Text>
            </View>
          ) : checkingSaved ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : (
            <Text style={styles.saveButtonText}>
              {isSaved ? '✓ Locație Salvată' : '💾 Salvează Locația'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.vibeButton, isGenerating && styles.buttonDisabled]}
          onPress={handleGenerateVibe}
          disabled={isGenerating}>
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.vibeButtonText}>Generând...</Text>
            </View>
          ) : (
            <Text style={styles.vibeButtonText}>✨ Generează Vibe AI</Text>
          )}
        </TouchableOpacity>
      </View>
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
});

