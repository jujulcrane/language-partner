import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { getSessions, getTurns } from '@/app/api/api';
import { UUID } from '@/constants/consts';

// enable smooth accordion animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Session = {
  id: string;
  jlptLevel: string;
  grammarPrompt: string;
  lastTurnAt: { _seconds: number };
  // local UI state
  expanded?: boolean;
  turns?: Turn[];
  loadingTurns?: boolean;
};
type Turn = {
  id: string;
  userText: string;
  partnerReply: string;
  feedback: string;
  createdAt: { _seconds: number };
};

const History = () => {
  const uid = UUID;
  const [sessions, setSessions] = useState<Session[]>([]);

  /* ───────────── fetch session list ───────────── */
  useEffect(() => {
    if (!uid) return;
    getSessions(uid)
      .then((raw) => {
        // attach UI flags
        setSessions(raw.map((s) => ({ ...s, expanded: false })));
      })
      .catch(console.error);
  }, [uid]);

  /* ───────────── expand / collapse ───────────── */
  const toggle = (sid: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setSessions(prev => {
      // map by id instead of relying on array index
      return prev.map(sess => {
        if (sess.id !== sid) return sess;                 // untouched rows

        // flip expanded
        const willExpand = !sess.expanded;

        // if we already have the turns, just expand/collapse – no loading flag
        if (sess.turns) {
          return { ...sess, expanded: willExpand };
        }

        // first time we open → mark as loading, keep collapsed state in sync
        return { ...sess, expanded: willExpand, loadingTurns: willExpand };
      });
    });

    // fetch only if we never cached this session
    const target = sessions.find(s => s.id === sid);
    if (target?.turns || target?.loadingTurns) return;

    (async () => {
      try {
        const turns = await getTurns(uid, sid);

        setSessions(prev =>
          prev.map(sess =>
            sess.id === sid
              ? { ...sess, turns, loadingTurns: false }
              : sess
          )
        );
      } catch (e) {
        console.error(e);
        setSessions(prev =>
          prev.map(sess =>
            sess.id === sid ? { ...sess, loadingTurns: false } : sess
          )
        );
      }
    })();
  };

  /* ───────────── render ───────────── */
  const renderTurn = (t: Turn) => (
    <View key={t.id} style={styles.turnRow}>
      <Text style={styles.user}>You: {t.userText}</Text>
      <Text style={styles.partner}>Partner: {t.partnerReply}</Text>
      {t.feedback ? <Text style={styles.feedback}>Feedback: {t.feedback}</Text> : null}
    </View>
  );

  const renderItem = ({ item, index }: { item: Session; index: number }) => (
    <View>
      {/* header */}
      <TouchableOpacity style={styles.card} onPress={() => toggle(item.id)}>
        <Text style={styles.title}>{item.grammarPrompt}</Text>
        <Text>
          {item.jlptLevel} •{' '}
          {new Date(item.lastTurnAt._seconds * 1000).toLocaleString()}
        </Text>
      </TouchableOpacity>

      {/* body */}
      {item.expanded && (
        <View style={styles.body}>
          {item.loadingTurns && <ActivityIndicator />}
          {!item.loadingTurns && item.turns?.map(renderTurn)}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No history yet.</Text>}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
};

export default History;

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  title: { fontWeight: 'bold', marginBottom: 4 },
  body: { padding: 12, backgroundColor: '#fff' },

  turnRow: { marginBottom: 12 },
  user: { fontWeight: '600' },
  partner: { marginTop: 4 },
  feedback: { marginTop: 4, fontStyle: 'italic', color: '#a66' },
});
