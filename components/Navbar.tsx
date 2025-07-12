import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePathname, router } from 'expo-router';

type NavItem = {
  label: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', route: '/' },
  { label: 'Conversation', route: '/conversation' },
  { label: 'History', route: '/history' },
  { label: 'Profile', route: '/profile' },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.route || pathname.startsWith(item.route + '/');
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => router.push(item.route)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Text style={[styles.navText, isActive && styles.activeNavText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  navText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  activeNavItem: {
    backgroundColor: '#007AFF22',
  },
  activeNavText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default Navbar;
