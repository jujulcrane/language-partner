import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import ThemedView from '../../../components/ThemedView';
import Spacer from '../../../components/Spacer';
import ThemedText from '../../../components/ThemedText';
import AppButton from '@/components/ThemedButton';
import { API_BASE_URL, UUID } from '@/constants/consts';
import { getName } from '@/app/api/api';
import { Ionicons } from '@expo/vector-icons';

const Profile = () => {
  const [name, setName] = useState<string>(''); // Placeholder for user name

  useEffect(() => {
    if (!UUID) return;

    let cancelled = false;

    const fetchName = async () => {
      try {
        const userName = await getName(UUID);
        if (!cancelled) {
          setName(userName);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch name:', error);
          setName('Error fetching name');
        }
      }
    };
    fetchName();

    return () => { cancelled = true; };
  }, [UUID]);

  return (
    <ThemedView style={styles.container}>
      <Spacer size={24} />

      <View style={{ alignItems: 'center' }}>
        <Ionicons name="person-circle-outline" size={64} color="black" />
        <ThemedText style={{ fontStyle: 'italic', color: '#666' }}>
          {name ? `Hello, ${name}` : 'Loading name...'}
        </ThemedText>
      </View>

      <Spacer size={24} />
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultBox: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#eaeaea50',
    borderRadius: 8,
  },
});
