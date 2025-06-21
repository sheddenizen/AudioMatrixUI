import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Api, { MatrixItem, CreateMatrixPayload, UpdateMatrixPayload } from '../../services/Api';
import EditMatrixModal from '../../components/EditMatrixModal';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '../../constants/Colors';
import Alerty from '@/components/Alerty';

// --- MatrixListItem Component (can be in its own file) ---
interface MatrixListItemProps {
    item: MatrixItem;
    onEdit: (item: MatrixItem) => void;
    onDelete: (id: number) => void;
    theme: ThemeColors;
}

const MatrixListItem: React.FC<MatrixListItemProps> = ({ item, onEdit, onDelete, theme }) => (
    <ThemedView style={styles.itemContainer}>
        <View style={styles.itemTextContainer}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>{item.name}</ThemedText>
            <ThemedText style={{ opacity: 0.8, marginTop: 4 }}>{item.description || 'No description'}</ThemedText>
            <ThemedText style={{ opacity: 0.7, fontStyle: 'italic', marginTop: 6 }}>Mode: {item.mode}</ThemedText>
        </View>
        <View style={styles.itemActions}>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconButton}>
                <AntDesign name="edit" size={24} color={theme.change} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconButton}>
                <AntDesign name="delete" size={24} color={theme.danger} />
            </TouchableOpacity>
        </View>
    </ThemedView>
);

// --- Main Screen Component ---
export default function ManageMatricesScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [matrices, setMatrices] = useState<MatrixItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingMatrix, setEditingMatrix] = useState<MatrixItem | null>(null);

    const fetchMatrices = useCallback(async () => {
        if (!refreshing) setIsLoading(true);
        setError(null);
        try {
            const response = await Api.getMatrices();
            setMatrices(response.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch matrices.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        fetchMatrices();
    }, [fetchMatrices]);

    const onRefresh = useCallback(() => setRefreshing(true), []);

    useEffect(() => {
        if (refreshing) fetchMatrices();
    }, [refreshing, fetchMatrices]);

    const handleOpenModal = (matrix: MatrixItem | null = null) => {
        setEditingMatrix(matrix);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => setIsModalVisible(false);

    const handleSaveMatrix = async (payload: CreateMatrixPayload | UpdateMatrixPayload) => {
        const isCreating = !editingMatrix;
        try {
            if (isCreating) {
                await Api.createMatrix(payload as CreateMatrixPayload);
            } else if (editingMatrix?.id) {
                await Api.updateMatrix(editingMatrix.id, payload as UpdateMatrixPayload);
            }
            fetchMatrices(); // Refresh list
            handleCloseModal();
            Alerty("Success", `Matrix ${isCreating ? 'created' : 'updated'} successfully.`);
        } catch (err: any) {
            Alerty("Error", `Failed to save matrix: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleDeleteMatrix = (id: number) => {
        Alerty(
            "Confirm Delete", "Are you sure you want to delete this matrix?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive",
                    onPress: async () => {
                        try {
                            await Api.deleteMatrix(id);
                            fetchMatrices();
                            Alert.alert("Success", "Matrix deleted successfully.");
                        } catch (err: any) {
                            Alert.alert("Error", "Failed to delete matrix.");
                        }
                    },
                },
            ]
        );
    };

    if (isLoading && matrices.length === 0) {
        return <ActivityIndicator size="large" color={theme.change} style={styles.centered} />;
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Matrix Editor' }} />
            <View style={styles.addButtonContainer}>
                <Button title="Add New Matrix" onPress={() => handleOpenModal()} color={theme.createButton} />
            </View>
            <FlatList
                data={matrices}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <MatrixListItem
                        item={item}
                        onEdit={handleOpenModal}
                        onDelete={handleDeleteMatrix}
                        theme={theme}
                    />
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.icon} />}
                contentContainerStyle={{ padding: 15 }}
                ListEmptyComponent={() => (
                    <View style={styles.centered}>
                        <ThemedText>No matrices found.</ThemedText>
                        {error && <ThemedText style={{ color: theme.danger, marginTop: 10 }}>Error: {error}</ThemedText>}
                    </View>
                )}
            />
            {isModalVisible && (
                <EditMatrixModal
                    visible={isModalVisible}
                    onClose={handleCloseModal}
                    onSave={handleSaveMatrix}
                    matrix={editingMatrix}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    addButtonContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    itemContainer: {
        flexDirection: 'row',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    itemTextContainer: { flex: 1, marginRight: 10 },
    itemActions: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { padding: 8, marginLeft: 8 },
});