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
  useColorScheme,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { getSessions, getTurns, deleteSession } from '@/app/api/api';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import RepeatButton from '@/components/RepeatButton';
import { auth } from '@/utils/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Session = {
  id: string;
  jlptLevel: string;
  grammarPrompt: string;
  lastTurnAt: { _seconds: number };
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
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setUid(user?.uid ?? null));
    return unsub;
  }, []);

  const uidStr = uid ?? '';  //'' = "not signed in"

  const [sessions, setSessions] = useState<Session[]>([]);
  const scheme = useColorScheme() as 'light' | 'dark' | null;
  const theme = Colors[scheme ?? 'light'];

  /* ─ fetch sessions once ─ */
  useEffect(() => {
    if (!uid) return;
    getSessions(uid)
      .then((raw) => setSessions(raw.map((s) => ({ ...s, expanded: false }))))
      .catch(console.error);
  }, [uidStr]);

  /* ─ expand / collapse ─ */
  const toggle = (sid: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSessions(prev =>
      prev.map(sess =>
        sess.id === sid
          ? { ...sess, expanded: !sess.expanded, loadingTurns: !sess.turns && !sess.expanded }
          : sess
      )
    );

    // lazy-load turns
    if (!uidStr) return;
    const target = sessions.find(s => s.id === sid);
    if (target?.turns || target?.loadingTurns) return;

    (async () => {
      try {
        const turns = await getTurns(uidStr, sid);
        setSessions(prev =>
          prev.map(sess =>
            sess.id === sid ? { ...sess, turns, loadingTurns: false } : sess
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

  /* ─ delete ─ */
  const onDelete = async (sid: string) => {
    if (!uidStr) return;
    try {
      await deleteSession(uidStr, sid);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSessions(prev => prev.filter(s => s.id !== sid));
    } catch (e) {
      console.error(e);
    }
  };

  const renderTurn = (t: Turn) => (
    <View key={t.id} style={styles.turnContainer}>

      {/* user line ---------------------------------------------------- */}
      <View style={styles.line}>
        <Text style={[styles.text, styles.user]}>
          You: {t.userText}
        </Text>
        <RepeatButton
          text={t.userText}
          size={18}
          style={styles.repeatBtn}
        />
      </View>

      {/* partner line ------------------------------------------------- */}
      <View style={styles.line}>
        <Text style={[styles.text, styles.partner]}>
          Partner: {t.partnerReply}
        </Text>
        <RepeatButton
          text={t.partnerReply}
          size={18}
          style={styles.repeatBtn}
        />
      </View>

      {/* optional feedback ------------------------------------------- */}
      {t.feedback ? (
        <View style={styles.line}>
          <Text style={[styles.text, styles.feedback]}>
            Feedback: {t.feedback}
          </Text>
          <RepeatButton
            text={t.feedback}
            size={18}
            style={styles.repeatBtn}
          />
        </View>
      ) : null}

    </View>
  );

  const renderItem = ({ item }: { item: Session }) => (
    <View>
      {/* header */}
      <View style={styles.card}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => toggle(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.title}>{item.grammarPrompt}</Text>
          <Text>
            {item.jlptLevel} • {new Date(item.lastTurnAt._seconds * 1000).toLocaleString()}
          </Text>
        </TouchableOpacity>

        {/* trash icon */}
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Ionicons name="trash" size={20} color={Colors.warning} />
        </TouchableOpacity>
      </View>

      {/* body */}
      {item.expanded && (
        <View style={styles.body}>
          {item.loadingTurns && !item.turns && <ActivityIndicator />}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  title: { fontWeight: 'bold', marginBottom: 4 },
  body: { padding: 12, backgroundColor: '#fafafa' },

  turnRow: { marginBottom: 12 },
  user: { fontWeight: '600' },
  partner: { marginTop: 4 },
  feedback: { marginTop: 4, fontStyle: 'italic', color: Colors.primary },

  turnContainer: {
    marginVertical: 8,
  },

  /* one horizontal row */
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  /* text stretches; pushes icon to the far right */
  text: {
    flex: 1,
    fontSize: 16,
  },

  /* make the repeat button compact */
  repeatBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 6,
  },
});
