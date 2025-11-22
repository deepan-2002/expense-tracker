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
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedView } from '@/components/themed-view';

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
  const theme = useAppTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', color: '#6366f1' });
  
  const dynamicStyles = getStyles(theme);

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
    <ThemedView style={dynamicStyles.container}>
      <ScrollView
        style={dynamicStyles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {categories.length === 0 && (
          <View style={dynamicStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>No categories yet</Text>
            <Text style={dynamicStyles.emptySubtext}>Create your first category or use quick add</Text>
          </View>
        )}

        {categories.length > 0 && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Your Categories</Text>
            {categories.map((category) => (
              <View key={category.id} style={dynamicStyles.categoryCard}>
                <View style={dynamicStyles.categoryInfo}>
                  {category.icon && (
                    <Text style={dynamicStyles.categoryIcon}>{category.icon}</Text>
                  )}
                  <View
                    style={[dynamicStyles.categoryColorDot, { backgroundColor: category.color }]}
                  />
                  <Text style={dynamicStyles.categoryName}>{category.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(category.id)}
                  style={dynamicStyles.deleteButton}
                >
                  <Text style={dynamicStyles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {!showModal && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Quick Add</Text>
            <View style={dynamicStyles.quickAddGrid}>
              {DEFAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={dynamicStyles.quickAddCard}
                  onPress={() => handleQuickCreate(cat)}
                >
                  <Text style={dynamicStyles.quickAddIcon}>{cat.icon}</Text>
                  <Text style={dynamicStyles.quickAddName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {!showModal && (
        <TouchableOpacity
          style={dynamicStyles.fab}
          onPress={() => setShowModal(true)}
        >
          <Text style={dynamicStyles.fabText}>+</Text>
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
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Create Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setNewCategory({ name: '', icon: '', color: '#6366f1' });
                }}
                style={dynamicStyles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={dynamicStyles.input}
              placeholder="Category Name"
              placeholderTextColor={theme.colors.textTertiary}
              value={newCategory.name}
              onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
            />

            <TouchableOpacity
              style={dynamicStyles.iconSelector}
              onPress={() => setShowIconPicker(true)}
            >
              <View style={dynamicStyles.iconSelectorContent}>
                {newCategory.icon ? (
                  <>
                    <Text style={dynamicStyles.iconSelectorIcon}>{newCategory.icon}</Text>
                    <Text style={dynamicStyles.iconSelectorText}>
                      {AVAILABLE_ICONS.find((i) => i.name === newCategory.icon)?.label ||
                        'Custom Icon'}
                    </Text>
                  </>
                ) : (
                  <Text style={dynamicStyles.iconSelectorPlaceholder}>Select Icon</Text>
                )}
                <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={dynamicStyles.buttonRow}>
              <TouchableOpacity
                style={[dynamicStyles.button, dynamicStyles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setNewCategory({ name: '', icon: '', color: '#6366f1' });
                }}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.button, dynamicStyles.createButton]}
                onPress={handleCreateCategory}
              >
                <Text style={dynamicStyles.createButtonText}>Create</Text>
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
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.iconPickerModal}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Select Icon</Text>
              <TouchableOpacity
                onPress={() => setShowIconPicker(false)}
                style={dynamicStyles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={AVAILABLE_ICONS}
              numColumns={4}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    dynamicStyles.iconOption,
                    newCategory.icon === item.name && dynamicStyles.iconOptionSelected,
                  ]}
                  onPress={() => handleSelectIcon(item.name)}
                >
                  <Text
                    style={[
                      dynamicStyles.iconOptionEmoji,
                      newCategory.icon === item.name && dynamicStyles.iconOptionEmojiSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      dynamicStyles.iconOptionLabel,
                      newCategory.icon === item.name && dynamicStyles.iconOptionLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={dynamicStyles.iconPickerList}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.styles.shadow,
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
    color: theme.colors.text,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.secondaryBackground,
  },
  deleteButtonText: {
    color: theme.colors.error,
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
    backgroundColor: theme.colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.styles.shadow,
  },
  quickAddIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickAddName: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
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
    backgroundColor: theme.colors.secondaryBackground,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
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
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.styles.shadow,
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
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  iconPickerModal: {
    backgroundColor: theme.colors.cardBackground,
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
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  iconSelector: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: theme.colors.inputBackground,
  },
  iconSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  iconSelectorText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    marginLeft: 12,
  },
  iconSelectorPlaceholder: {
    fontSize: 16,
    color: theme.colors.textTertiary,
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
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.secondaryBackground,
  },
  iconOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  iconOptionLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  iconOptionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  iconOptionEmoji: {
    fontSize: 32,
  },
  iconOptionEmojiSelected: {
    opacity: 1,
  },
});

