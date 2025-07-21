import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import ThemedView from '../../../components/ThemedView';
import Spacer from '../../../components/Spacer';
import ThemedText from '../../../components/ThemedText';
import AppButton from '@/components/ThemedButton';
import { API_BASE_URL, UUID } from '@/constants/consts';
import { getName } from '@/app/api/api';

const Profile = () => {
  const [name, setName] = useState<string>(''); // Placeholder for user name
  const [getResult, setGetResult] = useState<string>('');
  const [postResult, setPostResult] = useState<string>('');
  const [loadingGet, setLoadingGet] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);

  useEffect(() => {
    if (!UUID) return;

    let cancelled = false;

    const fetchName = async () => {
      try {
        setLoadingGet(true);
        const userName = await getName(UUID);
        if (!cancelled) {
          setName(userName);
          setLoadingGet(false);
          setGetResult('');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch name:', error);
          setName('Error fetching name');
          setLoadingGet(false);
        }
      }
    };
    fetchName();

    return () => { cancelled = true; };
  }, [UUID]);


  // Test GET /api/items
  const handleGet = async () => {
    setLoadingGet(true);
    setGetResult('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      setGetResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setGetResult(error?.message || 'Unknown error');
    }
    setLoadingGet(false);
  };

  // Test POST /api/items
  const handlePost = async () => {
    setLoadingPost(true);
    setPostResult('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Item',
          description: 'Posted from React Native!',
          createdAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      setPostResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setPostResult(error?.message || 'Unknown error');
    }
    setLoadingPost(false);
  };

  return (
    <ThemedView style={styles.container}>
      <Spacer />
      {loadingGet ? (
        <ThemedText title={true}>Loading …</ThemedText>
      ) : (
        <ThemedText title={true}>{name || 'Unnamed user'}</ThemedText>
      )}
      <AppButton
        title="Test GET /api/items"
        onPress={handleGet}
        loading={loadingGet}
      />
      {getResult ? (
        <View style={styles.resultBox}>
          <ThemedText>{getResult}</ThemedText>
        </View>
      ) : null}
      <AppButton
        title="Test POST /api/items"
        onPress={handlePost}
        loading={loadingPost}
      />
      {postResult ? (
        <View style={styles.resultBox}>
          <ThemedText>{postResult}</ThemedText>
        </View>
      ) : null}
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
