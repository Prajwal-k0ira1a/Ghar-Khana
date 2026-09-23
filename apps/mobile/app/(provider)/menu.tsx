import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/theme/tokens';
import { Plus, X } from 'lucide-react-native';

export interface MenuItemDisplay {
  id: string;
  name: string;
  description?: string;
  price: string;
  mealType: 'LUNCH' | 'DINNER';
  available: boolean;
  isVeg: boolean;
}

const INITIAL_MENU_ITEMS: MenuItemDisplay[] = [
  {
    id: 'item_1',
    name: 'Classic Dal Bhat Tarkari',
    description: 'Steamed basmati, yellow lentils, saag, and tomato achar.',
    price: '220.00',
    mealType: 'LUNCH',
    available: true,
    isVeg: true,
  },
  {
    id: 'item_2',
    name: 'Special Local Chicken Thali',
    description: 'Home-style chicken curry with gravy, fragrant rice, and black dal.',
    price: '350.00',
    mealType: 'LUNCH',
    available: true,
    isVeg: false,
  },
  {
    id: 'item_3',
    name: 'Mixed Veg Tarkari & Roti Set',
    description: 'Three whole-wheat rotis with seasonal sabzi and curd.',
    price: '190.00',
    mealType: 'LUNCH',
    available: true,
    isVeg: true,
  },
];

export default function ProviderMenuScreen() {
  const [items, setItems] = useState<MenuItemDisplay[]>(INITIAL_MENU_ITEMS);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMealType, setFormMealType] = useState<'LUNCH' | 'DINNER'>('LUNCH');
  const [formIsVeg, setFormIsVeg] = useState(true);

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, available: !it.available } : it))
    );
  };

  const openAddModal = () => {
    setEditingItemId(null);
    setFormName('');
    setFormPrice('');
    setFormDescription('');
    setFormMealType('LUNCH');
    setFormIsVeg(true);
    setIsModalVisible(true);
  };

  const openEditModal = (item: MenuItemDisplay) => {
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormPrice(item.price);
    setFormDescription(item.description || '');
    setFormMealType(item.mealType);
    setFormIsVeg(item.isVeg);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPrice.trim()) return;

    if (editingItemId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingItemId
            ? {
                ...it,
                name: formName.trim(),
                price: parseFloat(formPrice).toFixed(2),
                description: formDescription.trim() || undefined,
                mealType: formMealType,
                isVeg: formIsVeg,
              }
            : it
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}`,
          name: formName.trim(),
          price: parseFloat(formPrice).toFixed(2),
          description: formDescription.trim() || undefined,
          mealType: formMealType,
          available: true,
          isVeg: formIsVeg,
        },
      ]);
    }

    setIsModalVisible(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Menu Dishes</Text>
          <Text style={styles.subtitle}>Toggle live stock for daily subscribers.</Text>
        </View>
        <Button
          onPress={openAddModal}
          size="sm"
          title="Add dish"
          variant="primary"
          leftIcon={<Plus color="#FFFFFF" size={14} />}
        />
      </View>

      <View style={styles.list}>
        {items.map((item, idx, arr) => (
          <View
            key={item.id}
            style={[
              styles.dishRow,
              idx < arr.length - 1 && styles.dishRowBorder,
            ]}
          >
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.dishInfoCol}
              activeOpacity={0.6}
            >
              <Text style={styles.dishName}>{item.name}</Text>
              <Text style={styles.dishMeta}>
                {item.mealType} · {item.isVeg ? 'Vegetarian' : 'Non-Veg'} · NPR {parseFloat(item.price).toFixed(0)}
              </Text>
            </TouchableOpacity>

            <View style={styles.stockCol}>
              <Text style={styles.stockLabel}>
                {item.available ? 'In stock' : 'Paused'}
              </Text>
              <Switch
                onValueChange={() => toggleAvailability(item.id)}
                thumbColor={item.available ? Colors.primary : '#9CA3AF'}
                trackColor={{ false: '#CBD5E1', true: 'rgba(249, 115, 22, 0.4)' }}
                value={item.available}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Add / Edit Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItemId ? 'Edit dish' : 'Add new dish'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={Colors.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Dish name</Text>
              <TextInput
                onChangeText={setFormName}
                placeholder="e.g. Dal Bhat Tarkari"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={formName}
              />
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price (NPR)</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setFormPrice}
                  placeholder="220"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  value={formPrice}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Dietary type</Text>
                <TouchableOpacity
                  onPress={() => setFormIsVeg(!formIsVeg)}
                  style={styles.dietaryToggleBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dietaryToggleText}>
                    {formIsVeg ? 'Vegetarian' : 'Non-Veg'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                multiline
                numberOfLines={2}
                onChangeText={setFormDescription}
                placeholder="Key ingredients or accompaniments"
                placeholderTextColor={Colors.textMuted}
                style={[styles.input, { minHeight: 52 }]}
                value={formDescription}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                onPress={() => setIsModalVisible(false)}
                style={{ flex: 1 }}
                title="Cancel"
                variant="outline"
              />
              <Button
                onPress={handleSave}
                style={{ flex: 1 }}
                title="Save dish"
                variant="primary"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 4,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dishRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  dishInfoCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  dishName: {
    ...Typography.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dishMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  stockCol: {
    alignItems: 'flex-end',
  },
  stockLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.subtitle,
    fontSize: 17,
  },
  formGroup: {
    marginBottom: Spacing.sm + 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm + 2,
  },
  label: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  dietaryToggleBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.xs,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietaryToggleText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
