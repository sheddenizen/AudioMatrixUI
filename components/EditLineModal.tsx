// components/EditLineModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Api, { Port, LineItem, CreateLinePayload, UpdateLinePayload, LinePortConfiguration } from '../services/Api'; // Adjust path as needed

interface EditLineModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: CreateLinePayload | UpdateLinePayload) => void;
  line: LineItem | null;
  lineType: "src" | "dst";
}

const EditLineModal: React.FC<EditLineModalProps> = ({ visible, onClose, onSave, line, lineType }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Store selected port IDs. Your backend expects roles like 'left', 'right'.
  const [selectedPorts, setSelectedPorts] = useState<LinePortConfiguration>({});

  const [availablePorts, setAvailablePorts] = useState<Port[]>([]);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);

  // Define the roles you want to configure ports for
  const portRoles = ['left', 'right']; // Add more if needed, e.g., 'center', 'lfe'

  useEffect(() => {
    const fetchAvailablePorts = async () => {
      if (visible) {
        setIsLoadingPorts(true);
        try {
          // For lines, fetch unassigned line ports
          const response = await Api.getUnassignedLinePorts(lineType);
          setAvailablePorts(response.data || []);
        } catch (error) {
          console.error("Failed to fetch unassigned line ports:", error);
          Alert.alert("Error", "Could not load available ports.");
          setAvailablePorts([]);
        } finally {
          setIsLoadingPorts(false);
        }
      }
    };

    fetchAvailablePorts();

    if (line) {
      setName(line.name || '');
      setDescription(line.description || '');
      setSelectedPorts(line.ports || {});
    } else {
      // Reset for new line
      setName('');
      setDescription('');
      const initialPorts: LinePortConfiguration = {};
      portRoles.forEach(role => initialPorts[role] = 0); // 0 or undefined for "not selected"
      setSelectedPorts(initialPorts);
    }
  }, [line, visible]);

  const handlePortChange = (role: string, portId: string | number) => {
    // Picker on Android returns string, iOS can return number
    const id = portId ? parseInt(String(portId), 10) : 0; // 0 for "not selected"
    setSelectedPorts(prev => ({ ...prev, [role]: id }));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Line name cannot be empty.");
      return;
    }

    const portsToSave: LinePortConfiguration = {};
    for (const role in selectedPorts) {
        if (selectedPorts[role] && selectedPorts[role] !== 0) { // Ensure a port is selected (not 0 or undefined)
            portsToSave[role] = selectedPorts[role];
        }
    }

    const payload: CreateLinePayload | UpdateLinePayload = {
      name,
      description: description.trim() || undefined, // Send undefined if empty, backend handles ''
      ports: portsToSave,
    };
    onSave(payload);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.modalTitle}>{(line ? 'Edit ' : 'Add New ') + (lineType == 'src' ? 'Source' : 'Destination')}</Text>

            <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Main Microphone"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Studio condenser mic"
              multiline
            />

            {isLoadingPorts ? (
              <ActivityIndicator size="small" color="#007bff" style={{marginVertical: 10}}/>
            ) : (
              portRoles.map(role => (
                <View key={role}>
                  <Text style={styles.label}>{role.charAt(0).toUpperCase() + role.slice(1)} Port</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedPorts[role]?.toString() || ""} // Picker needs string value, ensure it's not undefined
                      style={styles.picker}
                      onValueChange={(itemValue) => handlePortChange(role, itemValue as string)}
                      prompt={`Select ${role} port`}
                    >
                      <Picker.Item label="-- Not Assigned --" value="" />
                      {availablePorts.map((p) => (
                        <Picker.Item key={p.id} label={`${p.name} (ID: ${p.id})`} value={p.id.toString()} />
                      ))}
                    </Picker>
                  </View>
                </View>
              ))
            )}


            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={onClose} color="#6c757d" />
              <Button title={line ? 'Save Changes' : 'Add Line'} onPress={handleSubmit} color="#007bff" />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 15, // Less bottom padding if buttons are outside scroll
    borderRadius: 10,
    width: '90%',
    maxHeight: '85%', // Adjust as needed
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollViewContent: {
    paddingBottom: 20, // Space for last element before buttons if buttons inside scroll
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
    marginTop: 12,
    fontWeight: '500',
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    borderRadius: 6,
    marginBottom: 15,
  },
  pickerContainer: { // Added for better styling of Picker on Android
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: Platform.OS === 'ios' ? undefined : 50, // iOS height is intrinsic
    width: '100%',
    // color: '#000', // Text color for picker items if needed
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    borderTopColor: '#eee',
    borderTopWidth: 1,
    paddingTop: 15,
  },
});

export default EditLineModal;
