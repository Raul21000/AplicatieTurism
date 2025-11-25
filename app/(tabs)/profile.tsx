import { getSession, signOut } from '@/lib/auth-helpers';
import { getVisitedLocations, getVisitStats } from '@/lib/database';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface VisitedLocation {
  revid: string;
  location_id: string;
  location_name: string;
  location_image_url: string | null;
  rating: number;
  review_text: string | null;
  visited_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('Utilizator');
  const [visitedLocations, setVisitedLocations] = useState<VisitedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ visited: 0, reviews: 0 });
  const [showVisitedModal, setShowVisitedModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Filter locations with reviews
  const reviewedLocations = visitedLocations.filter(
    (location) => location.review_text && location.review_text.trim().length > 0
  );

  // Fade in animation when screen is focused
  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.95);
      };
    }, [fadeAnim, scaleAnim])
  );

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const session = await getSession();
      
      if (session) {
        // Get username from session
        setUsername(session.account.username || session.account.email.split('@')[0]);
        
        // Get visited locations
        const visited = await getVisitedLocations(session.account.accid);
        setVisitedLocations(visited);
        
        // Get statistics (visited locations and reviews count)
        const visitStats = await getVisitStats(session.account.accid);
        setStats(visitStats);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Deconectare',
      'Ești sigur că vrei să te deconectezi?',
      [
        {
          text: 'Anulează',
          style: 'cancel',
        },
        {
          text: 'Deconectează-te',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await signOut();
              if (error) {
                Alert.alert('Eroare', 'Nu s-a putut efectua deconectarea');
              } else {
                // Navigate to login page
                router.replace('/login' as any);
              }
            } catch (err: any) {
              console.error('Logout error:', err);
              Alert.alert('Eroare', 'A apărut o eroare la deconectare');
            }
          },
        },
      ]
    );
  };

  const renderVisitedLocation = ({ item }: { item: VisitedLocation }) => {
    return (
      <View style={styles.visitedLocationCardInline}>
        <Image
          source={{ uri: item.location_image_url || 'https://picsum.photos/300/200?random=1' }}
          style={styles.visitedLocationImageInline}
          contentFit="cover"
        />
        <View style={styles.visitedLocationInfoInline}>
          <Text style={styles.visitedLocationNameInline}>{item.location_name}</Text>
          <View style={styles.visitedLocationMetaInline}>
            <Text style={styles.visitedLocationRatingInline}>
              {'⭐'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} {item.rating}/5
            </Text>
            {item.review_text && (
              <Text style={styles.visitedLocationReviewInline} numberOfLines={2}>
                "{item.review_text}"
              </Text>
            )}
            <Text style={styles.visitedLocationDateInline}>
              {new Date(item.visited_at).toLocaleDateString('ro-RO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView 
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Se încarcă...</Text>
          </View>
        ) : (
          <>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <Image
                source={{ uri: 'https://picsum.photos/120/120?random=profile' }}
                style={styles.profileImage}
                contentFit="cover"
              />
              <Text style={styles.username}>{username}</Text>
            </View>

            {/* Statistics */}
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => {
                  if (visitedLocations.length > 0) {
                    setShowVisitedModal(true);
                  }
                }}>
                <Text style={styles.statNumber}>{stats.visited}</Text>
                <Text style={styles.statLabel}>Locații Vizitate</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => {
                  if (reviewedLocations.length > 0) {
                    setShowVisitedModal(true);
                  }
                }}>
                <Text style={styles.statNumber}>{stats.reviews}</Text>
                <Text style={styles.statLabel}>Recenzii</Text>
              </TouchableOpacity>
            </View>

            {/* Reviews Section */}
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Recenzii</Text>
              {reviewedLocations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nu ai recenzii încă</Text>
                  <Text style={styles.emptySubtext}>Marchează locații ca vizitate și adaugă recenzii pentru a le vedea aici</Text>
                </View>
              ) : (
                <View style={styles.reviewsContainer}>
                  {reviewedLocations.map((item) => (
                    <View key={item.revid} style={styles.reviewCard}>
                      <Image
                        source={{ uri: item.location_image_url || 'https://picsum.photos/300/200?random=1' }}
                        style={styles.reviewImage}
                        contentFit="cover"
                      />
                      <View style={styles.reviewInfo}>
                        <Text style={styles.reviewLocationName}>{item.location_name}</Text>
                        <View style={styles.reviewMeta}>
                          <Text style={styles.reviewRating}>
                            {'⭐'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} {item.rating}/5
                          </Text>
                          <Text style={styles.reviewText}>
                            "{item.review_text}"
                          </Text>
                          <Text style={styles.reviewDate}>
                            {new Date(item.visited_at).toLocaleDateString('ro-RO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Visited Locations Section */}
            <View style={styles.visitedSection}>
              <Text style={styles.sectionTitle}>Locații Vizitate</Text>
              {visitedLocations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nu ai vizitat încă nicio locație</Text>
                  <Text style={styles.emptySubtext}>Marchează locații ca vizitate pentru a le vedea aici</Text>
                </View>
              ) : (
                <View style={styles.visitedLocationsContainer}>
                  {visitedLocations.map((item) => (
                    <View key={item.revid}>
                      {renderVisitedLocation({ item })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Reviews Modal */}
      <Modal
        visible={showVisitedModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVisitedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recenzii</Text>
              <TouchableOpacity
                onPress={() => setShowVisitedModal(false)}
                style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {reviewedLocations.length === 0 ? (
              <View style={styles.emptyModalContainer}>
                <Text style={styles.emptyModalText}>Nu ai recenzii încă</Text>
                <Text style={styles.emptyModalSubtext}>Marchează locații ca vizitate și adaugă recenzii pentru a le vedea aici</Text>
              </View>
            ) : (
              <FlatList
                data={reviewedLocations}
                keyExtractor={(item) => item.revid}
                renderItem={({ item }) => (
                  <View style={styles.visitedLocationCard}>
                    <Image
                      source={{ uri: item.location_image_url || 'https://picsum.photos/300/200?random=1' }}
                      style={styles.visitedLocationImage}
                      contentFit="cover"
                    />
                    <View style={styles.visitedLocationInfo}>
                      <Text style={styles.visitedLocationName}>{item.location_name}</Text>
                      <View style={styles.visitedLocationMeta}>
                        <Text style={styles.visitedLocationRating}>
                          {'⭐'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} {item.rating}/5
                        </Text>
                        {item.review_text && (
                          <Text style={styles.visitedLocationReview} numberOfLines={2}>
                            {item.review_text}
                          </Text>
                        )}
                        <Text style={styles.visitedLocationDate}>
                          {new Date(item.visited_at).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.visitedLocationsList}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
    marginBottom: 15,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#b0b0b0',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3a3a3a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    paddingLeft: 5,
  },
  reviewsSection: {
    marginBottom: 20,
  },
  reviewsContainer: {
    gap: 16,
  },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  reviewImage: {
    width: 100,
    height: 100,
  },
  reviewInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  reviewLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reviewMeta: {
    gap: 6,
  },
  reviewRating: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 14,
    color: '#d0d0d0',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#b0b0b0',
    fontSize: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  visitedSection: {
    marginBottom: 20,
  },
  visitedLocationsContainer: {
    gap: 12,
  },
  visitedLocationCardInline: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  visitedLocationImageInline: {
    width: 120,
    height: 120,
  },
  visitedLocationInfoInline: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  visitedLocationNameInline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  visitedLocationMetaInline: {
    gap: 6,
  },
  visitedLocationRatingInline: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  visitedLocationReviewInline: {
    fontSize: 13,
    color: '#b0b0b0',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },
  visitedLocationDateInline: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  visitedLocationsList: {
    padding: 20,
  },
  visitedLocationCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  visitedLocationImage: {
    width: 100,
    height: 100,
  },
  visitedLocationInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  visitedLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  visitedLocationMeta: {
    gap: 4,
  },
  visitedLocationRating: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  visitedLocationReview: {
    fontSize: 13,
    color: '#b0b0b0',
    marginTop: 4,
  },
  visitedLocationDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyModalContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  emptyModalSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
