import { Link, Stack } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
        <Text>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Button title='Go to Home' />
        </Link>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
