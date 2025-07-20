import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import ThemedView from '../../../components/ThemedView';
import LevelGrammarSelector from '@/components/LevelGrammarSelector';
import ConversationManager from '@/components/ConversationManager';

const ConversationHome = () => {
  // State for selectors
  const [jlptLevel, setJlptLevel] = useState('');
  const [grammarPrompt, setGrammarPrompt] = useState('');

  return (
    <ThemedView style={{ flex: 1 }}>
      <LevelGrammarSelector
        selectedLevel={jlptLevel}
        setSelectedLevel={setJlptLevel}
        grammarPrompt={grammarPrompt}
        setGrammarPrompt={setGrammarPrompt}
      />
      <ConversationManager
        jlptLevel={jlptLevel}
        grammarPrompt={grammarPrompt}
      />
    </ThemedView>
  );
};

export default ConversationHome;

const styles = StyleSheet.create({});
