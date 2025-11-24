import { signOut } from '@/lib/auth-helpers';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
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
  id: string;
  name: string;
  image: string;
  rating: number;
}

const mockSavedLocations: SavedLocation[] = [
  {
    id: '1',
    name: 'Castelul Bran',
    image: 'https://picsum.photos/300/200?random=1',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Palatul Peleș',
    image: 'https://picsum.photos/300/200?random=2',
    rating: 4.9,
  },
  {
    id: '3',
    name: 'Delta Dunării',
    image: 'https://picsum.photos/300/200?random=3',
    rating: 4.7,
  },
  {
    id: '4',
    name: 'Transfăgărășan',
    image: 'https://picsum.photos/300/200?random=4',
    rating: 5.0,
  },
  {
    id: '5',
    name: 'Sighișoara',
    image: 'https://picsum.photos/300/200?random=5',
    rating: 4.6,
  },
];

export default function ProfileScreen() {
  const router = useRouter();

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
      <View style={styles.locationCard}>
        <Image
          source={{ uri: item.image }}
          style={styles.locationImage}
          contentFit="cover"
        />
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{item.name}</Text>
          <Text style={styles.locationRating}>⭐ {item.rating.toFixed(1)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: 'https://picsum.photos/120/120?random=profile' }}
            style={styles.profileImage}
            contentFit="cover"
          />
          <Text style={styles.username}>Raul Developer</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Locații Vizitate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Recenzii</Text>
          </View>
        </View>

        {/* Saved Locations Section */}
        <View style={styles.savedSection}>
          <Text style={styles.sectionTitle}>Locații Salvate</Text>
          <FlatList
            data={mockSavedLocations}
            renderItem={renderSavedLocation}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationsList}
            scrollEnabled={true}
          />
        </View>

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
});
