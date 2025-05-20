// app/(tabs)/sources.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack } from 'expo-router'; // For setting screen options like title
import Api, { LineItem, CreateLinePayload, UpdateLinePayload } from '../../services/Api';
import EditSourceModal from '../../components/EditSourceModal';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// List Item Component (can be moved to components/SourceListItem.tsx)
interface SourceItemProps {
  item: LineItem;
  onEdit: (item: LineItem) => void;
  onDelete: (id: number) => void;
}

const SourceListItem: React.FC<SourceItemProps> = ({ item, onEdit, onDelete }) => (
  <View style={styles.itemContainer}>
    <View style={styles.itemTextContainer}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDescription}>{item.description || 'No description'}</Text>
      {item.ports && Object.keys(item.ports).length > 0 && (
        <Text style={styles.itemPorts}>
          Ports: {Object.entries(item.ports).map(([role, portId]) => `${role}: ID ${portId}`).join(', ')}
        </Text>
      )}
    </View>
    <View style={styles.itemActions}>
      <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconButton}>
        <FontAwesome name="edit" size={24} color="#007bff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconButton}>
        <FontAwesome name="trash" size={24} color="#dc3545" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function ManageSourcesScreen() {
  const [sources, setSources] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSource, setEditingSource] = useState<LineItem | null>(null);

  const fetchSources = useCallback(async () => {
    if (!refreshing) setIsLoading(true);
    setError(null);
    try {
      const response = await Api.getSources();
      setSources(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch sources:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.message || 'Failed to fetch sources.');
      setSources([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]); // Initial fetch

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSources();
  }, [fetchSources]);

  const handleOpenModal = (source: LineItem | null = null) => {
    setEditingSource(source);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingSource(null);
  };

  const handleSaveSource = async (sourceData: CreateLinePayload | UpdateLinePayload) => {
    const isCreating = !editingSource;
    try {
      if (isCreating) {
        await Api.createSource(sourceData as CreateLinePayload);
      } else if (editingSource?.id) {
        await Api.updateSource(editingSource.id, sourceData as UpdateLinePayload);
      }
      fetchSources(); // Refresh list
      handleCloseModal();
      Alert.alert("Success", `Source ${isCreating ? 'created' : 'updated'} successfully.`);
    } catch (err: any) {
      console.error("Failed to save source:", err.response?.data || err.message);
      Alert.alert("Error", `Failed to save source: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteSource = (id: number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this source?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Api.deleteSource(id);
              fetchSources(); // Refresh list
              Alert.alert("Success", "Source deleted successfully.");
            } catch (err: any) {
              console.error("Failed to delete source:", err);
              Alert.alert("Error", "Failed to delete source.");
            }
          },
        },
      ]
    );
  };

  if (isLoading && sources.length === 0 && !refreshing) {
    return <ActivityIndicator size="large" style={styles.centeredLoader} />;
  }

  if (error && !isLoading) {
    return (
      <View style={styles.centeredMessage}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={fetchSources} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Manage Audio Sources' }} />
      <View style={styles.addButtonContainer}>
        <Button title="Add New Source" onPress={() => handleOpenModal(null)} />
      </View>

      {sources.length === 0 && !isLoading && (
        <View style={styles.centeredMessage}>
          <Text style={styles.emptyText}>No sources found. Pull down to refresh or add a new one.</Text>
        </View>
      )}

      <FlatList
        data={sources}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SourceListItem
            item={item}
            onEdit={handleOpenModal}
            onDelete={() => handleDeleteSource(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]} tintColor={"#007bff"} />
        }
        ListHeaderComponent={isLoading && refreshing ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}
        contentContainerStyle={sources.length === 0 ? styles.listEmptyContainer : styles.listContainer}
        style={styles.list}
      />
      {isModalVisible && (
        <EditSourceModal
          visible={isModalVisible}
          onClose={handleCloseModal}
          onSave={handleSaveSource}
          source={editingSource}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  addButtonContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
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
  // Item styles (can also be in SourceListItem.tsx)
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  itemDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 3,
  },
  itemPorts: {
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 5,
  },
  itemActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
});
