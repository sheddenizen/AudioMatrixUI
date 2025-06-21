// components/MatrixListItem.tsx
import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MatrixItem } from '../services/Api'; // Adjust path if needed

interface MatrixListItemProps {
    item: MatrixItem;
    onNavigate: () => void;
}

export const MatrixListItem: React.FC<MatrixListItemProps> = ({ item, onNavigate }) => {
    return (
        <Pressable onPress={onNavigate}>
            {({ pressed }) => (
                <ThemedView style={[styles.itemContainer, { opacity: pressed ? 0.7 : 1 }]}>
                    <ThemedText type="defaultSemiBold" style={styles.itemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.itemDescription}>
                        {item.description || 'No description'}
                    </ThemedText>
                </ThemedView>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        padding: 18,
        marginBottom: 12,
        borderRadius: 10,
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    itemName: {
        fontSize: 18,
    },
    itemDescription: {
        opacity: 0.8,
        marginTop: 5,
    },
});