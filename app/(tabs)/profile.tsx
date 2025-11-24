import { getSession, signOut } from '@/lib/auth-helpers';
import { getSavedLocations, removeSavedLocation } from '@/lib/database';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SavedLocation {
  saved_id: string;
  location_id: string;
  location_name: string;
  location_image_url: string | null;
  location_rating: number;
  location_description: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('Utilizator');
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ visited: 0, reviews: 0 });

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
        
        // Get saved locations
        const saved = await getSavedLocations(session.account.accid);
        setSavedLocations(saved);
        
        // Get statistics (visited locations and reviews count)
        // For now, we'll use saved locations count as visited
        setStats({
          visited: saved.length,
          reviews: 0, // Can be updated later if reviews are implemented
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLocation = async (locationId: string) => {
    try {
      const session = await getSession();
      if (!session) return;

      const result = await removeSavedLocation(session.account.accid, locationId);
      if (result.success) {
        // Reload saved locations
        await loadProfileData();
        Alert.alert('Succes', 'Locația a fost ștearsă');
      } else {
        Alert.alert('Eroare', result.error || 'Nu s-a putut șterge locația');
      }
    } catch (error) {
      console.error('Error removing location:', error);
      Alert.alert('Eroare', 'A apărut o eroare la ștergerea locației');
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

  const renderSavedLocation = ({ item }: { item: SavedLocation }) => {
    return (
      <TouchableOpacity
        style={styles.locationCard}
        onLongPress={() => {
          Alert.alert(
            'Șterge locație',
            `Ești sigur că vrei să ștergi "${item.location_name}"?`,
            [
              { text: 'Anulează', style: 'cancel' },
              {
                text: 'Șterge',
                style: 'destructive',
                onPress: () => handleRemoveLocation(item.location_id),
              },
            ]
          );
        }}>
        <Image
          source={{ uri: item.location_image_url || 'https://picsum.photos/300/200?random=1' }}
          style={styles.locationImage}
          contentFit="cover"
        />
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{item.location_name}</Text>
          <Text style={styles.locationRating}>⭐ {item.location_rating.toFixed(1)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
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
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.visited}</Text>
                <Text style={styles.statLabel}>Locații Salvate</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.reviews}</Text>
                <Text style={styles.statLabel}>Recenzii</Text>
              </View>
            </View>

            {/* Saved Locations Section */}
            <View style={styles.savedSection}>
              <Text style={styles.sectionTitle}>Locații Salvate</Text>
              {savedLocations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nu ai locații salvate încă</Text>
                  <Text style={styles.emptySubtext}>Apasă lung pe o locație pentru a o salva</Text>
                </View>
              ) : (
                <FlatList
                  data={savedLocations}
                  renderItem={renderSavedLocation}
                  keyExtractor={(item) => item.saved_id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.locationsList}
                  scrollEnabled={true}
                />
              )}
            </View>
          </>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
  savedSection: {
    marginBottom: 20,
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    paddingLeft: 5,
  },
  locationsList: {
    paddingRight: 20,
  },
  locationCard: {
    width: 200,
    marginRight: 15,
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
  locationImage: {
    width: '100%',
    height: 120,
  },
  locationInfo: {
    padding: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
  },
  locationRating: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
});
