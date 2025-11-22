import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { apiService } from '@/src/services/api';
import { Category } from '@/src/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#ef4444' },
  { name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { name: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
  { name: 'Bills', icon: '💳', color: '#f59e0b' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { name: 'Health', icon: '🏥', color: '#10b981' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
];

const AVAILABLE_ICONS = [
  { name: '🍔', label: 'Food' },
  { name: '🍕', label: 'Pizza' },
  { name: '☕', label: 'Coffee' },
  { name: '🍰', label: 'Dessert' },
  { name: '🚗', label: 'Car' },
  { name: '🚕', label: 'Taxi' },
  { name: '🚌', label: 'Bus' },
  { name: '✈️', label: 'Flight' },
  { name: '🚇', label: 'Train' },
  { name: '🛍️', label: 'Shopping' },
  { name: '🛒', label: 'Cart' },
  { name: '🏪', label: 'Store' },
  { name: '💳', label: 'Bills' },
  { name: '💰', label: 'Money' },
  { name: '💵', label: 'Cash' },
  { name: '🎬', label: 'Movie' },
  { name: '🎮', label: 'Gaming' },
  { name: '🎵', label: 'Music' },
  { name: '🎭', label: 'Theater' },
  { name: '⚽', label: 'Sports' },
  { name: '🏋️', label: 'Fitness' },
  { name: '🏥', label: 'Hospital' },
  { name: '💊', label: 'Medicine' },
  { name: '❤️', label: 'Health' },
  { name: '📚', label: 'Education' },
  { name: '✏️', label: 'School' },
  { name: '📖', label: 'Book' },
  { name: '🧳', label: 'Travel' },
  { name: '🏨', label: 'Hotel' },
  { name: '🏖️', label: 'Beach' },
  { name: '👤', label: 'Personal' },
  { name: '💇', label: 'Salon' },
  { name: '🎁', label: 'Gift' },
  { name: '💝', label: 'Donation' },
  { name: '📦', label: 'Other' },
  { name: '🏠', label: 'Home' },
  { name: '🔧', label: 'Repair' },
  { name: '📱', label: 'Phone' },
  { name: '💻', label: 'Tech' },
];

export default function CategoriesScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', color: '#6366f1' });

  useEffect(() => {
    loadCategories();
  }, []);

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const loadCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!newCategory.icon) {
      Alert.alert('Error', 'Please select an icon');
      return;
    }

    try {
      await apiService.createCategory(newCategory);
      setNewCategory({ name: '', icon: '', color: '#6366f1' });
      setShowModal(false);
      loadCategories();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleSelectIcon = (iconName: string) => {
    setNewCategory({ ...newCategory, icon: iconName });
    setShowIconPicker(false);
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteCategory(id);
            loadCategories();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete category');
          }
        },
      },
    ]);
  };

  const handleQuickCreate = async (category: typeof DEFAULT_CATEGORIES[0]) => {
    try {
      await apiService.createCategory({
        name: category.name,
        icon: category.icon,
        color: category.color,
      });
      loadCategories();
    } catch (error: any) {
      if (error.response?.status !== 409) {
        Alert.alert('Error', 'Failed to create category');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Categories</Text>
        </View>

        {categories.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories yet</Text>
            <Text style={styles.emptySubtext}>Create your first category or use quick add</Text>
          </View>
        )}

        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Categories</Text>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryInfo}>
                  {category.icon && (
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                  )}
                  <View
                    style={[styles.categoryColorDot, { backgroundColor: category.color }]}
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(category.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {!showModal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <View style={styles.quickAddGrid}>
              {DEFAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={styles.quickAddCard}
                  onPress={() => handleQuickCreate(cat)}
                >
                  <Text style={styles.quickAddIcon}>{cat.icon}</Text>
                  <Text style={styles.quickAddName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {!showModal && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Create Category Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModal(false);
          setNewCategory({ name: '', icon: '', color: '#6366f1' });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setNewCategory({ name: '', icon: '', color: '#6366f1' });
                }}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Category Name"
              value={newCategory.name}
              onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
            />

            <TouchableOpacity
              style={styles.iconSelector}
              onPress={() => setShowIconPicker(true)}
            >
              <View style={styles.iconSelectorContent}>
                {newCategory.icon ? (
                  <>
                    <Text style={styles.iconSelectorIcon}>{newCategory.icon}</Text>
                    <Text style={styles.iconSelectorText}>
                      {AVAILABLE_ICONS.find((i) => i.name === newCategory.icon)?.label ||
                        'Custom Icon'}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.iconSelectorPlaceholder}>Select Icon</Text>
                )}
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </View>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setNewCategory({ name: '', icon: '', color: '#6366f1' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateCategory}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIconPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.iconPickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Icon</Text>
              <TouchableOpacity
                onPress={() => setShowIconPicker(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={AVAILABLE_ICONS}
              numColumns={4}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconOption,
                    newCategory.icon === item.name && styles.iconOptionSelected,
                  ]}
                  onPress={() => handleSelectIcon(item.name)}
                >
                  <Text
                    style={[
                      styles.iconOptionEmoji,
                      newCategory.icon === item.name && styles.iconOptionEmojiSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.iconOptionLabel,
                      newCategory.icon === item.name && styles.iconOptionLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.iconPickerList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddCard: {
    width: '30%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickAddIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickAddName: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#6366f1',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  iconPickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  iconSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  iconSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  iconSelectorText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 12,
  },
  iconSelectorPlaceholder: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  iconSelectorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  iconPickerList: {
    padding: 10,
  },
  iconOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#f9f9f9',
  },
  iconOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  iconOptionLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  iconOptionLabelSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  iconOptionEmoji: {
    fontSize: 32,
  },
  iconOptionEmojiSelected: {
    opacity: 1,
  },
});

