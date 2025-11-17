import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import ThemedView from '../../../components/ThemedView';
import Spacer from '../../../components/Spacer';
import ThemedText from '../../../components/ThemedText';
import { apiSetName, getName } from '@/app/api/api';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '@/utils/firebaseConfig';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';

const Profile = () => {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setUid(user?.uid ?? null));
    return unsub;
  }, []);

  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loadingName, setLoadingName] = useState(true);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    (async () => {
      try {
        const fetched = await getName(uid); // returns '' | null if none
        if (cancelled) return;

        if (fetched) {
          setName(fetched);
          setEditing(false);
        } else {
          // Fall back to auth displayName or email prefix
          const user = auth.currentUser;
          const fallback =
            user?.displayName ??
            user?.email?.split('@')[0] ??
            'User';

          setName(fallback);
          setEditing(true);                 // ask them to save a proper name
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch name:', err);
          setName('Unknown');
        }
      } finally {
        if (!cancelled) setLoadingName(false);
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  const saveName = async () => {
    if (!uid) return;
    try {
      await apiSetName(uid, name);                 // your API call
      await updateProfile(auth.currentUser!, { displayName: name });
      setEditing(false);
    } catch (err) {
      console.error('Could not save name:', err);
      alert('Failed to save name, please try again.');
    }
  };

  if (!uid) {
    return (
      <ThemedView style={styles.container}>
        <Spacer size={24} />
        <ThemedText style={{ textAlign: 'center' }}>
          You’re not signed in.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Spacer size={24} />

      <View style={{ alignItems: 'center' }}>
        <Ionicons name="person-circle-outline" size={64} color="black" />

        {/* Loading spinner while we fetch the name */}
        {loadingName ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : editing ? (
          // ---------- Name editor ----------
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              style={styles.input}
            />
            <TouchableOpacity onPress={saveName} style={styles.saveBtn}>
              <Ionicons name="checkmark" size={20} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          // ---------- Read-only -------------
          <>
            <ThemedText style={styles.hello}>
              Hello, {name}
            </ThemedText>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={18} color="#666" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <Spacer size={24} />
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1 },
  hello: { fontStyle: 'italic', color: '#666', marginVertical: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 160,
    marginTop: 6,
  },
  saveBtn: {
    marginTop: 8,
    backgroundColor: '#53C1DE',
    padding: 6,
    borderRadius: 6,
  },
});
