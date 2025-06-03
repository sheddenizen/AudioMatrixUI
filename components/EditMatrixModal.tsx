// components/EditMatrixModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, TouchableOpacity, useColorScheme } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import Api, { LineItem, MatrixItem, CreateMatrixPayload, UpdateMatrixPayload } from '../services/Api';
import { Colors } from '../constants/Colors';
import AntDesign from '@expo/vector-icons/AntDesign';
import Checkbox from 'expo-checkbox'; // Install: npx expo install expo-checkbox

interface EditMatrixModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: CreateMatrixPayload | UpdateMatrixPayload) => void;
    matrix: MatrixItem | null;
}

// Sub-component for a single item in the re-orderable list
const OrderableListItem = ({ item, onMove, isFirst, isLast, theme }) => (
    <ThemedView style={[orderableListStyles.item, { borderColor: theme.border }]}>
        <ThemedText style={orderableListStyles.itemText}>{item.name}</ThemedText>
        <View style={orderableListStyles.buttons}>
            <TouchableOpacity onPress={() => onMove('up')} disabled={isFirst} style={orderableListStyles.button}>
                <AntDesign name="arrowup" size={20} color={isFirst ? theme.placeholderText : theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onMove('down')} disabled={isLast} style={orderableListStyles.button}>
                <AntDesign name="arrowdown" size={20} color={isLast ? theme.placeholderText : theme.text} />
            </TouchableOpacity>
        </View>
    </ThemedView>
);

const EditMatrixModal: React.FC<EditMatrixModalProps> = ({ visible, onClose, onSave, matrix }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [mode, setMode] = useState('0');
    const [isLoading, setIsLoading] = useState(true);

    // Data for selection lists
    const [allSources, setAllSources] = useState<LineItem[]>([]);
    const [allDestinations, setAllDestinations] = useState<LineItem[]>([]);

    // Data for the ordered lists
    const [orderedSources, setOrderedSources] = useState<LineItem[]>([]);
    const [orderedDestinations, setOrderedDestinations] = useState<LineItem[]>([]);

    // --- Data Loading ---
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // Fetch all available sources and destinations for selection
                const [srcResponse, dstResponse] = await Promise.all([Api.getLines('src'), Api.getLines('dst')]);
                setAllSources(srcResponse.data || []);
                setAllDestinations(dstResponse.data || []);

                // If editing an existing matrix, fetch its details to pre-populate everything
                if (matrix) {
                    setName(matrix.name);
                    setDescription(matrix.description || '');
                    setMode(matrix.mode.toString());
                    const detailsResponse = await Api.getMatrixDetails(matrix.id);
                    const { srcs: currentSrcs, dsts: currentDsts } = detailsResponse.data;
                    
                    // The backend returns {id, name}. We need the full LineItem from our 'all' lists.
                    const findInAll = (list: LineItem[], id: number) => list.find(item => item.id === id);
                    setOrderedSources(currentSrcs.map(s => findInAll(srcResponse.data, s.id)).filter(Boolean) as LineItem[]);
                    setOrderedDestinations(currentDsts.map(d => findInAll(dstResponse.data, d.id)).filter(Boolean) as LineItem[]);
                } else {
                    // Reset fields for "create new"
                    setName('');
                    setDescription('');
                    setMode('0');
                    setOrderedSources([]);
                    setOrderedDestinations([]);
                }
            } catch (error) {
                Alert.alert("Error", "Failed to load necessary data for the matrix editor.");
                onClose(); // Close modal on critical data load failure
            } finally {
                setIsLoading(false);
            }
        };
        if (visible) {
            loadInitialData();
        }
    }, [matrix, visible]);

    // --- Handlers for Selection & Ordering ---
    const handleToggleSelection = (item: LineItem, type: 'src' | 'dst') => {
        const isSelected = type === 'src'
            ? orderedSources.some(s => s.id === item.id)
            : orderedDestinations.some(d => d.id === item.id);

        if (isSelected) {
            // Remove from ordered list
            if (type === 'src') setOrderedSources(prev => prev.filter(s => s.id !== item.id));
            else setOrderedDestinations(prev => prev.filter(d => d.id !== item.id));
        } else {
            // Add to ordered list
            if (type === 'src') setOrderedSources(prev => [...prev, item]);
            else setOrderedDestinations(prev => [...prev, item]);
        }
    };

    const handleMoveItem = (index: number, direction: 'up' | 'down', type: 'src' | 'dst') => {
        const list = type === 'src' ? orderedSources : orderedDestinations;
        const setList = type === 'src' ? setOrderedSources : setOrderedDestinations;

        if ((direction === 'up' && index === 0) || (direction === 'down' && index === list.length - 1)) {
            return;
        }

        const newList = [...list];
        const item = newList.splice(index, 1)[0];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        newList.splice(newIndex, 0, item);
        setList(newList);
    };

    // --- Save Handler ---
    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert("Validation Error", "Matrix name cannot be empty.");
            return;
        }
        const payload: CreateMatrixPayload | UpdateMatrixPayload = {
            name,
            description,
            mode: parseInt(mode, 10) || 0,
            srcs: orderedSources.map(s => s.id),
            dsts: orderedDestinations.map(d => d.id),
        };
        onSave(payload);
    };

    // Use Sets for quick O(1) lookup of selected IDs in the selection list
    const selectedSrcIds = React.useMemo(() => new Set(orderedSources.map(s => s.id)), [orderedSources]);
    const selectedDstIds = React.useMemo(() => new Set(orderedDestinations.map(d => d.id)), [orderedDestinations]);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <ThemedView style={styles.modalContainer}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <ThemedText type="title" style={styles.modalTitle}>{matrix ? 'Edit Matrix' : 'Add New Matrix'}</ThemedText>
                    {isLoading ? (
                        <ActivityIndicator size="large" color={theme.primary} />
                    ) : (
                        <>
                            {/* --- Basic Info Form --- */}
                            <ThemedText style={styles.label}>Name*</ThemedText>
                            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]} value={name} onChangeText={setName} placeholder="e.g., Main Studio Setup" placeholderTextColor={theme.placeholderText} />
                            
                            <ThemedText style={styles.label}>Description</ThemedText>
                            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]} value={description} onChangeText={setDescription} placeholder="e.g., For recording and streaming" placeholderTextColor={theme.placeholderText} />
                            
                            <View style={[styles.separator, { backgroundColor: theme.border }]} />

                            {/* --- Sources Selection & Ordering --- */}
                            <View style={styles.dualPanel}>
                                <View style={styles.panel}>
                                    <ThemedText type="defaultSemiBold" style={styles.panelTitle}>Available Sources</ThemedText>
                                    <View style={[styles.listContainer, { borderColor: theme.border }]}>
                                        {allSources.map(src => (
                                            <View key={src.id} style={styles.checkItem}>
                                                <Checkbox value={selectedSrcIds.has(src.id)} onValueChange={() => handleToggleSelection(src, 'src')} color={theme.createButton} />
                                                <ThemedText style={styles.checkLabel}>{src.name}</ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View style={styles.panel}>
                                    <ThemedText type="defaultSemiBold" style={styles.panelTitle}>Selected & Ordered Sources</ThemedText>
                                    <View style={[styles.listContainer, { borderColor: theme.border }]}>
                                        {orderedSources.map((src, index) => (
                                            <OrderableListItem key={src.id} item={src} onMove={(dir) => handleMoveItem(index, dir, 'src')} isFirst={index === 0} isLast={index === orderedSources.length - 1} theme={theme} />
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.separator, { backgroundColor: theme.border }]} />

                            {/* --- Destinations Selection & Ordering --- */}
                            <View style={styles.dualPanel}>
                                <View style={styles.panel}>
                                    <ThemedText type="defaultSemiBold" style={styles.panelTitle}>Available Destinations</ThemedText>
                                     <View style={[styles.listContainer, { borderColor: theme.border }]}>
                                        {allDestinations.map(dst => (
                                            <View key={dst.id} style={styles.checkItem}>
                                                <Checkbox value={selectedDstIds.has(dst.id)} onValueChange={() => handleToggleSelection(dst, 'dst')} color={theme.createButton}/>
                                                <ThemedText style={styles.checkLabel}>{dst.name}</ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View style={styles.panel}>
                                    <ThemedText type="defaultSemiBold" style={styles.panelTitle}>Selected & Ordered Destinations</ThemedText>
                                    <View style={[styles.listContainer, { borderColor: theme.border }]}>
                                        {orderedDestinations.map((dst, index) => (
                                            <OrderableListItem key={dst.id} item={dst} onMove={(dir) => handleMoveItem(index, dir, 'dst')} isFirst={index === 0} isLast={index === orderedDestinations.length - 1} theme={theme} />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>
                <View style={[styles.buttonContainer, { borderTopColor: theme.border }]}>
                    <Button title="Cancel" onPress={onClose} color={Platform.OS === 'ios' ? theme.destructive : theme.cancelButton} />
                    <Button title={matrix ? 'Save Changes' : 'Create Matrix'} onPress={handleSubmit} color={theme.createButton} disabled={isLoading} />
                </View>
            </ThemedView>
        </Modal>
    );
};

// Styles for the modal content
const styles = StyleSheet.create({
    modalContainer: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 50 },
    scrollViewContent: { paddingHorizontal: 20, paddingBottom: 20 },
    modalTitle: { textAlign: 'center', marginBottom: 20 },
    label: { fontSize: 16, marginBottom: 6, marginTop: 12, fontWeight: '500' },
    input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, borderRadius: 6, marginBottom: 15 },
    separator: { height: 1, marginVertical: 25 },
    dualPanel: { flexDirection: 'row', justifyContent: 'space-between' },
    panel: { width: '48%' },
    panelTitle: { marginBottom: 10, textAlign: 'center' },
    listContainer: { borderWidth: 1, borderRadius: 6, padding: 10, minHeight: 150 },
    checkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    checkLabel: { marginLeft: 10 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, borderTopWidth: 1 },
});

// Styles for the re-orderable list item
const orderableListStyles = StyleSheet.create({
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, },
    itemText: { flex: 1, marginRight: 5 },
    buttons: { flexDirection: 'row' },
    button: { padding: 5 },
});

export default EditMatrixModal;