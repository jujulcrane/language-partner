import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  Platform
} from 'react-native';
import { useColorScheme } from 'react-native';

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

const createStyles = (theme: { text: string; title: string; background: string; navBackground: string; iconColor: string; iconColorFocused: string; uiBackground: string; } | { text: string; title: string; background: string; navBackground: string; iconColor: string; iconColorFocused: string; uiBackground: string; }) => StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 24,
    backgroundColor: theme.navBackground,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  label: {
    padding: 6,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    color: theme.text,
  },
  dropdownButton: {
    backgroundColor: theme.background,
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.iconColor,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.text,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '78%',
    backgroundColor: theme.background,
    borderRadius: 10,
    padding: 20,
  },
  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.iconColor,
  },
  optionText: {
    fontSize: 16,
    color: theme.text,
  },
  closeButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: Colors.warning,
    borderRadius: 5,
  },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.iconColor,
    borderRadius: 8,
    minHeight: 60,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.background,
  },
});

type LevelGrammarSelectorProps = {
  selectedLevel: string | null;
  setSelectedLevel: (level: string) => void;
  grammarPrompt: string;
  setGrammarPrompt: (prompt: string) => void;
};

const LevelGrammarSelector: React.FC<LevelGrammarSelectorProps> = ({
  selectedLevel,
  setSelectedLevel,
  grammarPrompt,
  setGrammarPrompt,
}) => {
  const scheme = useColorScheme() as 'light' | 'dark' | null;
  const theme = Colors[scheme ?? 'light'];
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [modalVisible, setModalVisible] = React.useState(false);

  return (
    <>
      {/* Toggle Button */}
      <TouchableOpacity style={styles.label} onPress={() => setModalVisible(true)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.label}>Level & Grammar </Text>
          <Ionicons name={'settings'} size={17} style={{ marginBottom: 1, marginLeft: 3 }} color={styles.label.color} />
        </View>
        {selectedLevel ? (
          <Text style={styles.label}>
            {selectedLevel}
            {grammarPrompt ? ` ・ ${grammarPrompt.length > 12 ? grammarPrompt.substring(0, 12) + '…' : grammarPrompt}` : ''}
          </Text>
        ) : (
          <Text style={[styles.optionText, { color: theme.iconColor }]}>
            (Not set)
          </Text>
        )}
      </TouchableOpacity>
      {/* Modal Contents */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            keyboardVerticalOffset={0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ width: '100%', alignItems: 'center', flex: 1 }}>
                <ScrollView
                  contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.modalContent}>
                    <Text style={styles.label}>JLPT Level</Text>
                    {JLPT_LEVELS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.option}
                        onPress={() => setSelectedLevel(item)}
                      >
                        <Text style={styles.optionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                    <Text style={styles.label}>Grammar Patterns to Practice</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 〜てしまう、〜ながら、passive forms"
                      value={grammarPrompt}
                      onChangeText={setGrammarPrompt}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholderTextColor={theme.iconColor}
                      autoFocus={false}
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                      <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

export default LevelGrammarSelector;
