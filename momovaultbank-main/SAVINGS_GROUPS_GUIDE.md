# Savings Groups Feature - Implementation Guide

## 🎯 OVERVIEW

The Savings Groups feature allows admins to create collective savings groups where multiple users can join and save money together towards common goals. This feature integrates with the existing MoMo payment system and provides comprehensive group management capabilities.

## 🏗️ DATABASE SCHEMA

### SavingsGroup Model
```javascript
{
  name: String,                    // Group name
  description: String,             // Group description
  targetAmount: Number,            // Target savings amount
  currentAmount: Number,           // Current total saved
  currency: String,                // EUR/SZL
  maxMembers: Number,              // Maximum allowed members
  currentMembers: Number,          // Current member count
  minimumContribution: Number,     // Minimum contribution per transaction
  contributionFrequency: String,   // daily/weekly/monthly
  startDate: Date,                 // Group start date
  endDate: Date,                   // Group end date
  status: String,                  // active/completed/cancelled/draft
  createdBy: ObjectId,             // Admin who created the group
  members: [{
    userId: ObjectId,              // Member user ID
    joinedAt: Date,                // When they joined
    totalContributed: Number,      // Total amount contributed
    lastContribution: Date,        // Last contribution date
    isActive: Boolean              // Active membership status
  }],
  rules: {
    allowEarlyWithdrawal: Boolean, // Allow early withdrawal
    penaltyPercentage: Number,     // Penalty for early withdrawal
    requiresApproval: Boolean      // Require admin approval for actions
  },
  isPublic: Boolean,               // Public visibility
  inviteCode: String               // Unique invite code
}
```

### GroupContribution Model
```javascript
{
  groupId: ObjectId,               // Reference to savings group
  userId: ObjectId,                // User making contribution
  amount: Number,                  // Contribution amount
  currency: String,                // Currency
  contributionType: String,        // regular/bonus/penalty_refund
  paymentMethod: String,           // momo/bank_transfer/cash
  momoTransactionId: String,       // MoMo transaction reference
  status: String,                  // pending/completed/failed/cancelled
  description: String,             // Contribution description
  processedAt: Date,               // When payment was processed
  failureReason: String            // Reason for failure if applicable
}
```

## 🔧 API ENDPOINTS

### Admin Endpoints (Require Admin Role)

#### Create Savings Group
```
POST /api/savings-groups/create
Authorization: Bearer <admin-token>

Body:
{
  "name": "Emergency Fund Group",
  "description": "Collective emergency savings for group members",
  "targetAmount": 10000,
  "maxMembers": 20,
  "minimumContribution": 50,
  "contributionFrequency": "weekly",
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "allowEarlyWithdrawal": false,
  "penaltyPercentage": 15,
  "requiresApproval": true,
  "isPublic": true
}
```

#### Get All Groups (Admin)
```
GET /api/savings-groups/admin/all?status=active&page=1&limit=10
Authorization: Bearer <admin-token>
```

#### Update Group
```
PUT /api/savings-groups/:groupId
Authorization: Bearer <admin-token>

Body: (any updatable fields)
```

#### Delete Group
```
DELETE /api/savings-groups/:groupId
Authorization: Bearer <admin-token>
```

#### Activate Group
```
POST /api/savings-groups/:groupId/activate
Authorization: Bearer <admin-token>
```

#### Get Statistics
```
GET /api/savings-groups/admin/statistics
Authorization: Bearer <admin-token>
```

### User Endpoints

#### Browse Public Groups
```
GET /api/savings-groups/public?status=active&page=1&limit=10
Authorization: Bearer <token>
```

#### Get Single Group
```
GET /api/savings-groups/:groupId
Authorization: Bearer <token>
```

#### Join Group
```
POST /api/savings-groups/:groupId/join
Authorization: Bearer <token>
```

#### Join by Invite Code
```
POST /api/savings-groups/join-by-code
Authorization: Bearer <token>

Body:
{
  "inviteCode": "ABC123"
}
```

#### Leave Group
```
POST /api/savings-groups/:groupId/leave
Authorization: Bearer <token>
```

#### Get My Groups
```
GET /api/savings-groups/my-groups
Authorization: Bearer <token>
```

#### Contribute to Group
```
POST /api/savings-groups/:groupId/contribute
Authorization: Bearer <token>

Body:
{
  "amount": 100,
  "phoneNumber": "76123456",
  "description": "Weekly contribution"
}
```

#### Get Group Contributions
```
GET /api/savings-groups/:groupId/contributions?page=1&limit=20
Authorization: Bearer <token>
```

#### Get My Contributions
```
GET /api/savings-groups/my-contributions?page=1&limit=20
Authorization: Bearer <token>
```

## 📱 REACT NATIVE IMPLEMENTATION GUIDE

### 1. Install Required Dependencies

```bash
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @expo/vector-icons
npm install react-native-paper # For UI components
```

### 2. Create Savings Groups Context

```javascript
// contexts/SavingsGroupsContext.js
import React, { createContext, useContext, useReducer } from 'react';

const SavingsGroupsContext = createContext();

const initialState = {
  groups: [],
  myGroups: [],
  loading: false,
  error: null,
};

function savingsGroupsReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_GROUPS':
      return { ...state, groups: action.payload, loading: false };
    case 'SET_MY_GROUPS':
      return { ...state, myGroups: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_GROUP':
      return { ...state, groups: [action.payload, ...state.groups] };
    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(group =>
          group._id === action.payload._id ? action.payload : group
        ),
      };
    default:
      return state;
  }
}

export function SavingsGroupsProvider({ children }) {
  const [state, dispatch] = useReducer(savingsGroupsReducer, initialState);

  return (
    <SavingsGroupsContext.Provider value={{ state, dispatch }}>
      {children}
    </SavingsGroupsContext.Provider>
  );
}

export const useSavingsGroups = () => {
  const context = useContext(SavingsGroupsContext);
  if (!context) {
    throw new Error('useSavingsGroups must be used within SavingsGroupsProvider');
  }
  return context;
};
```

### 3. Create API Service

```javascript
// services/savingsGroupsApi.js
import { API_BASE_URL } from '../config';

class SavingsGroupsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/savings-groups`;
  }

  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Admin methods
  async createGroup(groupData) {
    return this.request('/create', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async getAllGroups(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/all?${queryString}`);
  }

  async updateGroup(groupId, updates) {
    return this.request(`/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteGroup(groupId) {
    return this.request(`/${groupId}`, {
      method: 'DELETE',
    });
  }

  async activateGroup(groupId) {
    return this.request(`/${groupId}/activate`, {
      method: 'POST',
    });
  }

  async getStatistics() {
    return this.request('/admin/statistics');
  }

  // User methods
  async getPublicGroups(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/public?${queryString}`);
  }

  async getGroup(groupId) {
    return this.request(`/${groupId}`);
  }

  async joinGroup(groupId) {
    return this.request(`/${groupId}/join`, {
      method: 'POST',
    });
  }

  async joinByInviteCode(inviteCode) {
    return this.request('/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  }

  async leaveGroup(groupId) {
    return this.request(`/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async getMyGroups() {
    return this.request('/my-groups');
  }

  async contributeToGroup(groupId, contributionData) {
    return this.request(`/${groupId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(contributionData),
    });
  }

  async getGroupContributions(groupId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/${groupId}/contributions?${queryString}`);
  }

  async getMyContributions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/my-contributions?${queryString}`);
  }
}

export default new SavingsGroupsAPI();
```

### 4. Admin Create Group Screen

```javascript
// screens/admin/CreateSavingsGroupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import savingsGroupsAPI from '../../services/savingsGroupsApi';

export default function CreateSavingsGroupScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    maxMembers: '',
    minimumContribution: '',
    contributionFrequency: 'weekly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    allowEarlyWithdrawal: false,
    penaltyPercentage: '10',
    requiresApproval: true,
    isPublic: true,
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.name || !formData.description || !formData.targetAmount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (formData.endDate <= formData.startDate) {
        Alert.alert('Error', 'End date must be after start date');
        return;
      }

      setLoading(true);

      const groupData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        maxMembers: parseInt(formData.maxMembers),
        minimumContribution: parseFloat(formData.minimumContribution),
        penaltyPercentage: parseFloat(formData.penaltyPercentage),
      };

      const response = await savingsGroupsAPI.createGroup(groupData);

      Alert.alert(
        'Success',
        'Savings group created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Create Savings Group</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter group name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe the purpose of this savings group"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Target Amount (EUR) *</Text>
            <TextInput
              style={styles.input}
              value={formData.targetAmount}
              onChangeText={(text) => setFormData({ ...formData, targetAmount: text })}
              placeholder="10000"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Max Members *</Text>
            <TextInput
              style={styles.input}
              value={formData.maxMembers}
              onChangeText={(text) => setFormData({ ...formData, maxMembers: text })}
              placeholder="20"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Min Contribution (EUR) *</Text>
            <TextInput
              style={styles.input}
              value={formData.minimumContribution}
              onChangeText={(text) => setFormData({ ...formData, minimumContribution: text })}
              placeholder="50"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.contributionFrequency}
                onValueChange={(value) => setFormData({ ...formData, contributionFrequency: value })}
                style={styles.picker}
              >
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text>{formData.startDate.toDateString()}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text>{formData.endDate.toDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Savings Group'}
          </Text>
        </TouchableOpacity>
      </View>

      {showStartDatePicker && (
        <DateTimePicker
          value={formData.startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, startDate: selectedDate });
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, endDate: selectedDate });
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

### 5. Admin Groups Management Screen

```javascript
// screens/admin/ManageSavingsGroupsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import savingsGroupsAPI from '../../services/savingsGroupsApi';

export default function ManageSavingsGroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsResponse, statsResponse] = await Promise.all([
        savingsGroupsAPI.getAllGroups(),
        savingsGroupsAPI.getStatistics(),
      ]);

      setGroups(groupsResponse.data.groups);
      setStatistics(statsResponse.data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleActivateGroup = async (groupId) => {
    try {
      await savingsGroupsAPI.activateGroup(groupId);
      Alert.alert('Success', 'Group activated successfully');
      loadData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteGroup = (group) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await savingsGroupsAPI.deleteGroup(group._id);
              Alert.alert('Success', 'Group deleted successfully');
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderGroupItem = ({ item }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.groupDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            €{item.currentAmount.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            €{item.targetAmount.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Target</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {item.currentMembers}/{item.maxMembers}
          </Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
      </View>

      <View style={styles.groupActions}>
        {item.status === 'draft' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => handleActivateGroup(item._id)}
          >
            <Text style={styles.actionButtonText}>Activate</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditSavingsGroup', { group: item })}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteGroup(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.overview.totalGroups}</Text>
            <Text style={styles.statTitle}>Total Groups</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.overview.activeGroups}</Text>
            <Text style={styles.statTitle}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>€{statistics.overview.totalSavings.toLocaleString()}</Text>
            <Text style={styles.statTitle}>Total Savings</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings Groups</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateSavingsGroup')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  groupCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusactive: {
    backgroundColor: '#4CAF50',
  },
  statusdraft: {
    backgroundColor: '#FF9800',
  },
  statuscompleted: {
    backgroundColor: '#2196F3',
  },
  statuscancelled: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  groupDescription: {
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

## 🔐 SECURITY CONSIDERATIONS

1. **Admin Role Verification**: All admin endpoints verify the user's role
2. **Member Validation**: Users can only contribute to groups they've joined
3. **Phone Number Validation**: Eswatini phone number format validation
4. **Transaction Security**: MoMo integration with proper error handling
5. **Data Sanitization**: Input validation and sanitization on all endpoints

## 🚀 DEPLOYMENT STEPS

1. **Update Database**: The new models will be automatically created when first used
2. **Environment Variables**: Ensure MoMo credentials are properly configured
3. **Admin User**: Create at least one admin user in the database
4. **Test Endpoints**: Test all API endpoints with proper authentication
5. **Mobile App**: Integrate the React Native screens into your existing app

## 📊 MONITORING & ANALYTICS

The system provides comprehensive statistics including:
- Total groups and their statuses
- Total savings across all groups
- Member participation rates
- Contribution patterns
- Revenue from penalties and fees

This implementation provides a complete savings groups feature that integrates seamlessly with your existing MoMo Vault system while maintaining security and scalability.