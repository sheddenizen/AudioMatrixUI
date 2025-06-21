// app/matrix/[id].tsx (Example Usage)
import { Stack, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { MatrixView } from '@/components/MatrixView'; // Adjust path
import { ThemedText } from '@/components/ThemedText';

export default function MatrixScreen() {
  const { id } = useLocalSearchParams();
  const matrixId = Number(id);

  if (isNaN(matrixId)) {
    return <ThemedText>Invalid Matrix ID.</ThemedText>;
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `Matrix ${id}` }} />
      <MatrixView matrixId={matrixId} />
    </ThemedView>
  );
}