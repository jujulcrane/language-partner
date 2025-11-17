import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../../../constants/consts';

const Setup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handlePing = async () => {
    setIsLoading(true);
    setPingResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/ping`);
      const text = await res.text();          // should be "pong"
      setPingResult(text);
    } catch (err) {
      console.error('Ping failed:', err);
      setPingResult('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup / Connectivity Test</Text>

      <Button
        title={isLoading ? 'Pinging…' : 'Test /ping'}
        onPress={handlePing}
        disabled={isLoading}
      />

      {pingResult && (
        <Text style={styles.result}>
          Response: {pingResult}
        </Text>
      )}
    </View>
  );
};

export default Setup;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, marginBottom: 12 },
  result: { marginTop: 12, fontWeight: 'bold' },
});
