import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface Location {
  id: string;
  name: string;
  image_url: string;
  rating: number;
  coordinates: {
    lat: number;
    long: number;
  };
  description?: string;
}

type ViewMode = 'list' | 'map';

export default function ExploreScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try hackathon URL first, fallback to original
      let response = await fetch('https://thecon.ro/hackathon/locatii.json').catch(() => null);
      if (!response || !response.ok) {
        response = await fetch('https://thecon.ro/wp-content/uploads/2025/11/locatii.json');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const locationsArray = Array.isArray(data) ? data : [];
      setLocations(locationsArray);
      setFilteredLocations(locationsArray);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load locations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'map' : 'list');
  };

  // Filter, search and sort locations
  useEffect(() => {
    let filtered = [...locations];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (loc) =>
          loc.name.toLowerCase().includes(query) ||
          loc.description?.toLowerCase().includes(query)
      );
    }

    // Sort by rating
    filtered.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.rating - a.rating; // Descending (highest first)
      } else {
        return a.rating - b.rating; // Ascending (lowest first)
      }
    });

    setFilteredLocations(filtered);
  }, [searchQuery, sortOrder, locations]);

  const handleLocationPress = (location: Location) => {
    router.push({
      pathname: '/details' as any,
      params: {
        location: JSON.stringify(location),
      },
    });
  };

  const renderLocationCard = ({ item }: { item: Location }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleLocationPress(item)}
        activeOpacity={0.7}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMapView = () => {
    if (filteredLocations.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text>No locations to display on map</Text>
        </View>
      );
    }

    // Calculate initial region from filtered locations using coordinates.lat and coordinates.long
    const latitudes = filteredLocations.map(loc => loc.coordinates.lat);
    const longitudes = filteredLocations.map(loc => loc.coordinates.long);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const initialRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.1),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.1),
    };

    return (
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}>
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.coordinates.lat,
              longitude: location.coordinates.long,
            }}
            title={location.name}
            description={`Rating: ${location.rating.toFixed(1)} ⭐`}
            onPress={() => handleLocationPress(location)}
          />
        ))}
      </MapView>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Explore</Text>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleViewMode}>
              <Text style={styles.toggleButtonText}>Loading...</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading locations...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Explore</Text>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleViewMode}>
              <Text style={styles.toggleButtonText}>Toggle</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Eroare de conexiune</Text>
            <Text style={styles.errorText}>
              Nu am putut încărca locațiile. Verifică conexiunea la internet.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchLocations}>
              <Text style={styles.retryButtonText}>Încearcă din nou</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <TouchableOpacity style={styles.toggleButton} onPress={toggleViewMode}>
            <Text style={styles.toggleButtonText}>
              {viewMode === 'list' ? 'Hartă' : 'Listă'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Sort Bar */}
        {viewMode === 'list' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Caută locații..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sortează după rating:</Text>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortOrder === 'desc' && styles.sortButtonActive,
                ]}
                onPress={() => setSortOrder('desc')}>
                <Text
                  style={[
                    styles.sortButtonText,
                    sortOrder === 'desc' && styles.sortButtonTextActive,
                  ]}>
                  ↓ Cel mai bun
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortOrder === 'asc' && styles.sortButtonActive,
                ]}
                onPress={() => setSortOrder('asc')}>
                <Text
                  style={[
                    styles.sortButtonText,
                    sortOrder === 'asc' && styles.sortButtonTextActive,
                  ]}>
                  ↑ Cel mai slab
                </Text>
              </TouchableOpacity>
            </View>
            {filteredLocations.length !== locations.length && (
              <Text style={styles.resultsCount}>
                {filteredLocations.length} din {locations.length} locații
              </Text>
            )}
          </View>
        )}

        {viewMode === 'list' ? (
          <FlatList
            data={filteredLocations}
            renderItem={renderLocationCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Nu s-au găsit locații' : 'Nu există locații'}
                </Text>
                {searchQuery && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setSearchQuery('');
                    }}>
                    <Text style={styles.clearFiltersText}>Șterge căutarea</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        ) : (
          renderMapView()
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    minWidth: 80,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
