import { Ionicons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { db } from '../../firebaseConfig';
import styles from '../style';
import { CustomButton, CustomInput, showAlert } from './ReusableComponents';

const TableHeader = () => (
  <View style={styles.crudTableHeader}>
    <Text style={styles.crudTableHeaderCellNo}>No.</Text>
    <Text style={styles.crudTableHeaderCellName}>Name</Text>
  </View>
);

const NameRow = React.memo(({ item, index }) => (
  <Animated.View
    entering={FadeInRight.delay(index * 30)}
    exiting={FadeOutLeft}
    layout={LinearTransition}
    style={[styles.crudTableRow, { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }]}
  >
    <Text style={styles.crudTableCellNo}>{index + 1}</Text>
    <Text style={styles.crudTableCellName}>{item.name}</Text>
  </Animated.View>
));

export default function CrudTemplate({
  title = "CRUD OPERATIONS",
  collectionName = "names",
  canAdd = false,
  canUpdate = false,
  canDelete = false,
  canView = false
}) {
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newName, setNewName] = useState('');
  const [updateOldName, setUpdateOldName] = useState('');
  const [updateNewName, setUpdateNewName] = useState('');
  const [deleteOldName, setDeleteOldName] = useState('');

  const namesCollectionRef = useMemo(() => collection(db, collectionName), [collectionName]);

  useEffect(() => {
    const q = query(namesCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const namesData = snapshot.docs.map(document => ({
        id: document.id,
        ...document.data()
      }));
      setNames(namesData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [namesCollectionRef]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      return showAlert('Error', 'Please enter a name to add.');
    }
    try {
      const docId = String(Number.MAX_SAFE_INTEGER - Date.now());
      await setDoc(doc(db, collectionName, docId), {
        name: newName.trim(),
        createdAt: new Date()
      });
      setNewName('');
      showAlert('Success', 'Name added successfully!');
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to add name.');
    }
  };

  const handleUpdate = async () => {
    if (!updateOldName.trim() || !updateNewName.trim()) {
      return showAlert('Error', 'Please enter both original and new names.');
    }
    try {
      const q = query(namesCollectionRef, where('name', '==', updateOldName.trim()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return showAlert('Error', 'Original name not found.');
      }
      await Promise.all(querySnapshot.docs.map(document =>
        updateDoc(doc(db, collectionName, document.id), { name: updateNewName.trim() })
      ));
      setUpdateOldName(''); setUpdateNewName('');
      showAlert('Success', 'Updated successfully!');
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to update name.');
    }
  };

  const handleDelete = async () => {
    if (!deleteOldName.trim()) {
      return showAlert('Error', 'Please enter a name to delete.');
    }
    try {
      const q = query(namesCollectionRef, where('name', '==', deleteOldName.trim()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return showAlert('Error', 'Name not found.');
      }
      await Promise.all(querySnapshot.docs.map(document =>
        deleteDoc(doc(db, collectionName, document.id))
      ));
      setDeleteOldName('');
      showAlert('Success', 'Deleted successfully!');
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to delete name.');
    }
  };

  if (!canView) {
    return (
      <View style={styles.crudRestrictedContainer}>
        <Ionicons name="lock-closed" size={80} color="#FF3B30" />
        <Text style={styles.crudRestrictedTitle}>Access Restricted</Text>
      </View>
    );
  }

  const ListHeader = () => (
    <View style={styles.crudHeaderContent}>
      <Text style={styles.crudMainTitle}>{title}</Text>

      {/* ADD SECTION */}
      {canAdd && (
        <Animated.View entering={FadeInDown.delay(100)} style={styles.crudCardSection}>
          <Text style={styles.crudSectionHeaderCentered}>Add</Text>
          <CustomInput
            label="Full Name:"
            styleType="crud"
            placeholder="Your Name Here"
            value={newName}
            onChangeText={setNewName}
          />
          <CustomButton
            title="Add"
            onPress={handleAdd}
            customStyle={styles.crudAddBtn}
          />
        </Animated.View>
      )}

      {/* VIEW SECTION HEADER */}
      <Animated.View entering={FadeInDown.delay(200)} style={[styles.crudCardSection, { marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
        <Text style={styles.crudSectionHeaderCentered}>View</Text>
        <Text style={styles.crudTableSubtitle}>Table with data</Text>
        {loading && <ActivityIndicator size="small" color="#007AFF" />}
        {!loading && names.length === 0 && <Text style={styles.crudEmptyText}>No names found.</Text>}
        {names.length > 0 && <TableHeader />}
      </Animated.View>
    </View>
  );

  const ListFooter = () => (
    <View style={styles.crudFooterContent}>
      <View style={{ height: 20 }} />

      {/* UPDATE SECTION */}
      {canUpdate && (
        <Animated.View entering={FadeInDown.delay(100)} style={styles.crudCardSection}>
          <Text style={styles.crudSectionHeaderCentered}>Update</Text>
          <CustomInput
            label="Old Name:"
            styleType="crud"
            placeholder="Your Old Name Here"
            value={updateOldName}
            onChangeText={setUpdateOldName}
          />
          <CustomInput
            label="New Name:"
            styleType="crud"
            placeholder="Your New Name Here"
            value={updateNewName}
            onChangeText={setUpdateNewName}
          />
          <CustomButton
            title="Update"
            onPress={handleUpdate}
            customStyle={[styles.crudActionBtn, { backgroundColor: '#007AFF' }]}
          />
        </Animated.View>
      )}

      {/* DELETE SECTION */}
      {canDelete && (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.crudCardSection}>
          <Text style={styles.crudSectionHeaderCentered}>Delete</Text>
          <CustomInput
            label="Name:"
            styleType="crud"
            placeholder="Name to delete"
            value={deleteOldName}
            onChangeText={setDeleteOldName}
          />
          <CustomButton
            title="Delete Name"
            onPress={handleDelete}
            customStyle={[styles.crudActionBtn, { backgroundColor: '#FF3B30' }]}
          />
        </Animated.View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={names}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <NameRow item={item} index={index} />}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.crudFlatListContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </KeyboardAvoidingView>
  );
} 
