import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

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
  const mapRef = useRef<MapView>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://thecon.ro/wp-content/uploads/2025/11/locatii.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const locationsArray = Array.isArray(data) ? data : [];
      setLocations(locationsArray);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load locations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleViewMode = () => {
    // Close side panel if open when switching modes
    if (selectedLocation) {
      handleClosePanel();
    }
    setViewMode(prev => prev === 'list' ? 'map' : 'list');
  };

  const handleLocationPress = (location: Location) => {
    router.push({
      pathname: '/details' as any,
      params: {
        location: JSON.stringify(location),
      },
    });
  };

  const handleMarkerPress = (location: Location) => {
    // Set selected location
    setSelectedLocation(location);
    
    // Animate side panel in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Zoom in on the location
    const region: Region = {
      latitude: location.coordinates.lat,
      longitude: location.coordinates.long,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    mapRef.current?.animateToRegion(region, 500);
  };

  const handleClosePanel = () => {
    Animated.spring(slideAnim, {
      toValue: 300,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      setSelectedLocation(null);
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
    if (locations.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>No locations to display on map</Text>
        </View>
      );
    }

    // Calculate initial region from locations using coordinates.lat and coordinates.long
    const latitudes = locations.map(loc => loc.coordinates.lat);
    const longitudes = locations.map(loc => loc.coordinates.long);
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
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}>
          {locations.map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.coordinates.lat,
                longitude: location.coordinates.long,
              }}
              title={location.name}
              description={`Rating: ${location.rating.toFixed(1)} ⭐`}
              onPress={() => handleMarkerPress(location)}
            />
          ))}
        </MapView>

        {/* Side Panel for Selected Location */}
        {selectedLocation && (
          <Animated.View
            style={[
              styles.sidePanel,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClosePanel}
              activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleClosePanel();
                setTimeout(() => handleLocationPress(selectedLocation), 300);
              }}
              activeOpacity={0.9}>
              <Image
                source={{ uri: selectedLocation.image_url }}
                style={styles.sidePanelImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.sidePanelContent}>
                <Text style={styles.sidePanelTitle}>{selectedLocation.name}</Text>
                <Text style={styles.sidePanelRating}>⭐ {selectedLocation.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Explore</Text>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleViewMode} disabled>
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
              <Text style={styles.toggleButtonText}>
                {viewMode === 'list' ? 'Hartă' : 'Listă'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchLocations}>
              <Text style={styles.retryButtonText}>Retry</Text>
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

        {viewMode === 'list' ? (
          <FlatList
            data={locations}
            renderItem={renderLocationCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.loadingText}>No locations found</Text>
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
    backgroundColor: '#0a0a0a',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#2a2a2a',
  },
  cardContent: {
    padding: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  cardDescription: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 4,
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 1,
    borderLeftColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: {
      width: -4,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    paddingTop: 50,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidePanelImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#2a2a2a',
  },
  sidePanelContent: {
    padding: 20,
  },
  sidePanelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sidePanelRating: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    marginTop: 10,
    color: '#b0b0b0',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
