# State Management Documentation

## Overview
The Monetary Catalyst implements a hybrid state management approach, combining React Context for global state with local component state for UI-specific data. This architecture emphasizes type safety and clear data flow patterns.

## Global State Management

### Authentication Context
```typescript
// context/AuthContext.tsx
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}
```

Key features:
- User authentication state
- Login/Register methods
- OAuth integration
- Session management

### Subscription State
```typescript
interface SubscriptionState {
  status: 'active' | 'inactive' | 'cancelled';
  plan: string;
  expiresAt: string;
}
```

Manages:
- Subscription status
- Plan details
- Payment state
- Access control

## Local State Management

### Form State
```typescript
// Example from contact form
const [formData, setFormData] = useState({
  name: '',
  email: '',
  message: ''
});

// Form validation state
const [errors, setErrors] = useState<FormErrors>({});
```

### UI State
```typescript
// Loading states
const [isLoading, setIsLoading] = useState(false);

// Toggle states
const [isOpen, setIsOpen] = useState(false);

// Pagination
const [currentPage, setCurrentPage] = useState(1);
```

## Data Flow Patterns

### Context Provider Setup
```typescript
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  
  // Context logic
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Custom Hooks
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Usage in components
const { user, isLoggedIn, login } = useAuth();
```

## State Updates

### Synchronous Updates
```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
};
```

### Asynchronous Updates
```typescript
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await submitData();
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

## State Persistence

### Local Storage
```typescript
// Persisting auth state
useEffect(() => {
  const savedState = localStorage.getItem('authState');
  if (savedState) {
    setState(JSON.parse(savedState));
  }
}, []);
```

### Session Storage
```typescript
// Temporary state
sessionStorage.setItem('lastVisitedPage', currentPage);
```

## Error State Management
```typescript
interface ErrorState {
  message: string;
  code?: string;
  field?: string;
}

const [error, setError] = useState<ErrorState | null>(null);
```

## Performance Optimization

### Memoization
```typescript
const memoizedValue = useMemo(() => computeExpensiveValue(deps), [deps]);

const memoizedCallback = useCallback(() => {
  // Callback logic
}, [deps]);
```

### State Batching
```typescript
const updateMultipleStates = () => {
  // React 18 automatic batching
  setStateA(newA);
  setStateB(newB);
  setStateC(newC);
};
```

## State Management Best Practices

### Type Safety
```typescript
// Strongly typed state
interface ComponentState {
  data: DataType[];
  isLoading: boolean;
  error: Error | null;
}

const [state, setState] = useState<ComponentState>(initialState);
```

### State Initialization
```typescript
// Lazy initialization for expensive computations
const [state, setState] = useState(() => {
  const initialValue = someExpensiveOperation();
  return initialValue;
});
```

### State Dependencies
```typescript
useEffect(() => {
  // Effect logic
}, [relevantState]); // Explicit dependencies
```

## Future Considerations
1. Potential integration with state management libraries (Redux, Zustand)
2. Enhanced state persistence strategies
3. Improved type safety for complex state
4. Performance optimizations for state updates
5. Real-time state synchronization
