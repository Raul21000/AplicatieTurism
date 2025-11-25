import { getAllAccounts, getDatabaseStats } from '@/lib/database';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Account {
  accid: string;
  username: string;
  email: string;
  created_at?: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState({ accounts: 0, locations: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsResult, statsResult] = await Promise.all([getAllAccounts(), getDatabaseStats()]);
      setAccounts(accountsResult ?? []);
      setStats(statsResult);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAccount = ({ item }: { item: Account }) => {
    return (
      <View style={styles.accountCard}>
        <Text style={styles.accountId}>ID: {item.accid}</Text>
        <Text style={styles.accountUsername}>👤 {item.username || 'Fără nume'}</Text>
        <Text style={styles.accountEmail}>📧 {item.email || '—'}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Se încarcă datele...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Înapoi</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin - Baza de Date</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.accounts}</Text>
          <Text style={styles.statLabel}>Conturi</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.locations}</Text>
          <Text style={styles.statLabel}>Locații</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.reviews}</Text>
          <Text style={styles.statLabel}>Recenzii</Text>
        </View>
      </View>

      {/* Info about local database */}
      <View style={styles.warningContainer}>
        <Text style={styles.warningTitle}>ℹ️ Date stocate local</Text>
        <Text style={styles.warningText}>
          Toate conturile, locațiile și recenziile sunt salvate în baza de date locală a aplicației, astfel încât poți
          lucra offline și sincroniza doar când dorești.
        </Text>
      </View>

      {/* Accounts List */}
      <View style={styles.accountsSection}>
            <Text style={styles.sectionTitle}>Conturi ({accounts.length})</Text>
        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nu există conturi în baza de date</Text>
          </View>
        ) : (
          <FlatList
            data={accounts}
            renderItem={renderAccount}
                keyExtractor={(item) => item.accid}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
        <Text style={styles.refreshButtonText}>🔄 Reîncarcă Datele</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#b0b0b0',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: '#FF9500',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B00',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  accountsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  accountCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  accountId: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  accountUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  accountEmail: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

