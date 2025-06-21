import React, { useState, useEffect, useCallback } from 'react';

import { FlatList, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
// Import the themed components from your project structure
import { ThemedView } from '@/components/ThemedView'; // Adjust path as needed
import { ThemedText } from '@/components/ThemedText';
// ... other imports (Api, EditLineModal, FontAwesome)
import Api, { LineType, LineItem, CreateLinePayload, UpdateLinePayload } from '@/services/Api';
import EditLineModal from '@/components/EditLineModal';
import AntDesign from '@expo/vector-icons/AntDesign';

// Your Colors.ts might still be useful for non-View/Text elements or for passing to custom props
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

import Alerty from '@/components/Alerty';

// List Item Component (can be moved to components/LineListItem.tsx)
interface LineItemProps {
    item: LineItem;
    onEdit: (item: LineItem) => void;
    onDelete: (id: number) => void;
}

// ... (LineListItem could also use ThemedText/ThemedView)
const LineListItem: React.FC<LineItemProps> = ({ item, onEdit, onDelete }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme]; // For colors not directly handled by ThemedText/View props

  return (
    // ThemedView might take lightColor/darkColor props or use a default theme.
    // If it uses a global theme context, it might not need explicit color props.
    // Check the implementation of your specific ThemedView.
    // Example: Assuming ThemedView picks up default background from a theme context or its own logic.
    <ThemedView style={styles.itemContainer}>
      <ThemedView style={styles.itemTextContainer}>
        <ThemedText type="defaultSemiBold" style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText style={styles.itemDescription}>{item.description || 'No description'}</ThemedText>
        {item.ports && Object.keys(item.ports).length > 0 &&
//        {(<ThemedText style={styles.itemPorts}>
//          {Object.entries(item.ports).map(([role, portId]) => `${role}: ID ${portId}`).join(', ')}
//        </ThemedText>)}
          Object.entries(item.ports).map(([role, portId]) => (<ThemedText style={styles.itemPorts}>{`  ${role}: ID ${portId.join(', ')}`}</ThemedText>))}
        
      </ThemedView>
      <ThemedView style={styles.itemActions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconButton}>
          <AntDesign name="edit" size={24} color={themeColors.change} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconButton}>
          <AntDesign name="delete" size={24} color={themeColors.danger} />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

export default function ManageLinesScreen(lineType: LineType) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme]; // Still useful for things like Button colors, icons, RefreshControl
  const [lines, setLines] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLine, setEditingLine] = useState<LineItem | null>(null);

  const lineTypeName = lineType == 'src' ? 'Source' : 'Destination';

  const fetchLines = useCallback(async () => {
    if (!refreshing) setIsLoading(true);
    setError(null);
    try {
      const response = await Api.getLines(lineType);
      setLines(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch lines:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.message || `Failed to fetch ${lineTypeName.toLowerCase()}s.`);
      setLines([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchLines();
  }, [fetchLines]); // Initial fetch

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLines();
  }, [fetchLines]);

  const handleOpenModal = (line: LineItem | null = null) => {
    setEditingLine(line);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingLine(null);
  };

  const handleSaveLine = async (lineData: CreateLinePayload | UpdateLinePayload) => {
    const isCreating = !editingLine;
    try {
      if (isCreating) {
        await Api.createLine(lineType, lineData as CreateLinePayload);
      } else if (editingLine?.id) {
        await Api.updateLine(lineType, editingLine.id, lineData as UpdateLinePayload);
      }
      fetchLines(); // Refresh list
      handleCloseModal();
      Alert.alert("Success", `${lineTypeName} ${isCreating ? 'created' : 'updated'} successfully.`);
    } catch (err: any) {
      console.error("Failed to save line:", err.response?.data || err.message);
      Alert.alert("Error", `Failed to save ${lineTypeName.toLowerCase()}: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteLine = (id: number) => {
    Alerty(
      "Confirm Delete",
      `Are you sure you want to delete this ${lineTypeName.toLowerCase()}?`,
      [
        { text: "Cancel", style: "cancel", onPress:()=>{} },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
                console.log('handleDeleteLine yes', id);
                await Api.deleteLine(lineType, id);
              fetchLines(); // Refresh list
              // Alerty("Success", "Line deleted successfully.");
            } catch (err: any) {
              console.error("Failed to delete line:", err);
              Alerty("Error", `Failed to delete ${lineTypeName.toLowerCase}.`);
            }
          },
        },
      ]
    );
  };

  if (isLoading && lines.length === 0 && !refreshing) {
    return <ActivityIndicator size="large" style={styles.centeredLoader} />;
  }

  if (error && !isLoading) {
    return (
      <ThemedView style={styles.centeredMessage}>
        <ThemedText /* style={styles.errorText} */>{error}</ThemedText>
        <Button title="Retry" onPress={fetchLines} />
      </ThemedView>
    );
  }
  return (
    // ThemedView for the main screen background
    <ThemedView style={styles.container}>
      <Stack.Screen options={{
        title: `${lineTypeName}s`,
        // ThemedView/Text components usually don't control header styles directly.
        // Header styling is typically done via navigation options,
        // which can also use your themeColors.
        headerStyle: { backgroundColor: themeColors.background },
        headerTintColor: themeColors.text,
      }} />

      <ThemedView style={styles.addButtonContainer}>
        <Button title={`Add New ${lineTypeName}`} onPress={() => handleOpenModal(null)} color={themeColors.createButton} />
      </ThemedView>

      {/* ... loading/error states using ThemedText ... */}
      {isLoading && lines.length === 0 && !refreshing && (
        <ActivityIndicator size="large" color={themeColors.text} />
      )}
      {error && !isLoading && (
        <ThemedView style={styles.centeredMessage}>
          <ThemedText style={{ color: themeColors.text }}>{error}</ThemedText>
          <Button title="Retry" onPress={fetchLines} color={themeColors.text} />
        </ThemedView>
      )}

      <FlatList
        data={lines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <LineListItem
            item={item}
            onEdit={handleOpenModal}
            onDelete={handleDeleteLine}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.text]}
            tintColor={themeColors.text}
          />
        }
        ListHeaderComponent={isLoading && refreshing ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}
        contentContainerStyle={lines.length === 0 ? styles.listEmptyContainer : styles.listContainer}
        style={styles.list}
      />
      { isModalVisible && (
        <EditLineModal
            lineType={lineType}
            visible={isModalVisible}
            onClose={handleCloseModal}
            onSave={handleSaveLine}
            line={editingLine}
        />
      ) }
    </ThemedView>
  );
}

// Styles for ManageLinesScreen (can be simplified as ThemedView/Text handle some defaults)
const styles = StyleSheet.create({
  container: { // ThemedView will apply its own background based on the theme
    flex: 1,
  },
  addButtonContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    // No background needed here if ThemedView parent handles it
  },
  centeredMessage: { // ThemedView will apply its background
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  listEmptyContainer: {
    flexGrow: 1, // Ensures that when list is empty, the container can still be centered
    // justifyContent: 'center', // This is handled by centeredMessage now
    // alignItems: 'center',
  },

  // Styles for LineListItem
  itemContainer: { // ThemedView will apply its card-like background
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    // Shadows and borders might still be defined here or as part of ThemedView's capabilities
  },
  itemTextContainer: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 17 /* ThemedText type="defaultSemiBold" handles color and weight */ },
  itemDescription: { fontSize: 14, opacity: 0.8, marginTop: 3 },
  itemPorts: { fontSize: 13, color: '#777', fontStyle: 'italic', marginTop: 5 },
  itemActions: { flexDirection: 'row' },
  iconButton: { padding: 8, marginLeft: 8 },
});