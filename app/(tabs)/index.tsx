import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
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
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<ViewMode>('list');
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    fetchLocations();
  }, []);

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
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.92,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [pulseAnim]);

  useEffect(() => {
    return () => {
      if (transitionTimeout.current) {
        clearTimeout(transitionTimeout.current);
      }
    };
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

      // Use locations as-is (no AI/generated descriptions)
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
    if (isTransitioning) return;

    // Close side panel if open when switching modes
    if (selectedLocation) {
      handleClosePanel();
    }

    const nextMode = viewMode === 'list' ? 'map' : 'list';
    setTransitionTarget(nextMode);
    setIsTransitioning(true);
    setViewMode(nextMode);

    if (transitionTimeout.current) {
      clearTimeout(transitionTimeout.current);
    }
    transitionTimeout.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 700);
  };

  // Filter, search and sort locations
  useEffect(() => {
    let filtered = [...locations];

    // Search filter (only by name, no descriptions)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((loc) =>
        loc.name.toLowerCase().includes(query)
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

  // Location Card Component with animation
  const LocationCard = React.memo(({ item, index, onPress }: { item: Location; index: number; onPress: (item: Location) => void }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, [cardAnim, index]);

    return (
      <Animated.View
        style={{
          opacity: cardAnim,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => onPress(item)}
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
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  const renderLocationCard = ({ item, index }: { item: Location; index: number }) => {
    return <LocationCard item={item} index={index} onPress={handleLocationPress} />;
  };

  const renderMapView = () => {
    if (filteredLocations.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>No locations to display on map</Text>
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
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
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

  const loadingHighlights = [
    'Sincronizăm ratingurile și recenziile',
    'Pregătim experiența pe hartă',
    'Optimizăm lista pentru filtre',
  ];
  const transitionMessages: Record<ViewMode, { title: string; subtitle: string }> = {
    list: {
      title: 'Comutăm în modul listă',
      subtitle: 'Aranjăm cărțile pentru o parcurgere fluidă.',
    },
    map: {
      title: 'Comutăm în modul hartă',
      subtitle: 'Repoziționăm marcajele și camera interactivă.',
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingShell}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Explore</Text>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleViewMode} disabled>
              <Text style={styles.toggleButtonText}>Se pregătește...</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContent}>
            <Animated.View
              style={[
                styles.loadingHalo,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <View style={styles.loadingCard}>
              <View style={styles.loadingBadge}>
                <Text style={styles.loadingBadgeText}>UX Sync</Text>
              </View>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingTitle}>Pregătim harta inteligentă</Text>
              <Text style={styles.loadingSubtitle}>
                Agregăm locații din surse multiple și le ordonăm pentru ambele moduri de vizualizare.
              </Text>
              <View style={styles.loadingSteps}>
                {loadingHighlights.map((highlight) => (
                  <View key={highlight} style={styles.loadingStep}>
                    <View style={styles.loadingStepBullet} />
                    <Text style={styles.loadingStepText}>{highlight}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.loadingFootnote}>Experiența nu îngheață — doar rafinăm rezultatele.</Text>
            </View>
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
            <TouchableOpacity
              style={[styles.toggleButton, isTransitioning && styles.toggleButtonDisabled]}
              onPress={toggleViewMode}
              disabled={isTransitioning}>
              <Text style={styles.toggleButtonText}>
                {viewMode === 'list' ? 'Hartă' : 'Listă'}
              </Text>
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
        {isTransitioning && (
          <View style={styles.transitionOverlay}>
            <View style={styles.transitionCard}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.transitionTitle}>{transitionMessages[transitionTarget].title}</Text>
              <Text style={styles.transitionSubtitle}>{transitionMessages[transitionTarget].subtitle}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }) }],
            },
          ]}>
          <Text style={styles.headerTitle}>Explore</Text>
          <TouchableOpacity
            style={[styles.toggleButton, isTransitioning && styles.toggleButtonDisabled]}
            onPress={toggleViewMode}
            disabled={isTransitioning}>
            <Text style={styles.toggleButtonText}>
              {viewMode === 'list' ? 'Hartă' : 'Listă'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

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
      {isTransitioning && (
        <View style={styles.transitionOverlay}>
          <View style={styles.transitionCard}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.transitionTitle}>{transitionMessages[transitionTarget].title}</Text>
            <Text style={styles.transitionSubtitle}>{transitionMessages[transitionTarget].subtitle}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  loadingShell: {
    flex: 1,
    backgroundColor: '#050505',
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
  loadingContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingHalo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#007AFF22',
    shadowColor: '#007AFF',
    shadowOpacity: 0.45,
    shadowRadius: 30,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    backgroundColor: '#111113',
    borderWidth: 1,
    borderColor: '#1f1f25',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  loadingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1c1c28',
    borderWidth: 1,
    borderColor: '#2f2f3d',
    marginBottom: 20,
  },
  loadingBadgeText: {
    color: '#9aa0ff',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  loadingTitle: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#b0b0c0',
  },
  loadingSteps: {
    marginTop: 24,
    gap: 12,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingStepBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  loadingStepText: {
    flex: 1,
    color: '#d7d7e3',
    fontSize: 15,
    fontWeight: '500',
  },
  loadingFootnote: {
    marginTop: 30,
    color: '#777789',
    fontSize: 13,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    color: '#FFFFFF',
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
    color: '#b0b0b0',
    marginRight: 4,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#b0b0b0',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 12,
    color: '#b0b0b0',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 12,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
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
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleButtonDisabled: {
    opacity: 0.5,
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
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#b0b0b0',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
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
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(3, 3, 8, 0.86)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  transitionCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#111113',
    borderWidth: 1,
    borderColor: '#1f1f25',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
    alignItems: 'center',
    gap: 18,
  },
  transitionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  transitionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#b0b0c0',
    textAlign: 'center',
  },
});
