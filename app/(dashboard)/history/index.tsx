import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { getSessions } from "@/app/api/api";
import { UUID } from "@/constants/consts";
;

const History = () => {
  const uid = UUID;
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;
    getSessions(uid).then(setSessions).catch(console.error);
    console.log("Fetched sessions for UID:", sessions);
  }, [uid]);

  return (
    <View style={styles.root}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.title}>{item.grammarPrompt}</Text>
            <Text>{item.jlptLevel} • {new Date(item.lastTurnAt._seconds * 1000).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No history yet.</Text>}
      />
    </View>
  );
};

export default History;

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  card: { padding: 12, borderBottomWidth: 1, borderColor: "#ddd" },
  title: { fontWeight: "bold", marginBottom: 4 },
});
