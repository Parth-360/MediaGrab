import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function SearchBar({ placeholder, onSearch, onClear, value, autoFocus }) {
  const [text, setText] = useState(value || '');

  const handleSubmit = () => {
    if (text.trim()) {
      Keyboard.dismiss();
      onSearch(text.trim());
    }
  };

  const handleClear = () => {
    setText('');
    onClear?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder || 'Search...'}
          placeholderTextColor={COLORS.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {text.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={handleSubmit} style={styles.searchBtn}>
        <Ionicons name="arrow-forward" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
