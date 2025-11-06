import { createEffect, createEvent, createStore, sample } from 'effector';
import { usersApi } from '../api/users/users';
import type {
  CreateUserRequest,
  User,
  UpdateUserRequest,
} from '../types/users';

// Events
export const loadUsers = createEvent();
export const createUser = createEvent<CreateUserRequest>();
export const updateUser = createEvent<UpdateUserRequest>();
export const patchUser = createEvent<{
  id: number;
  updates: Partial<UpdateUserRequest>;
}>();
export const deleteUser = createEvent<number>();
export const setEditingUser = createEvent<User | null>();
export const resetForm = createEvent();
export const searchUsers = createEvent<string>();
export const loadUsersByRole = createEvent<User['role']>();
export const loginUser = createEvent<{ phone: string; password: string }>();
export const logoutUser = createEvent();
export const clearSearch = createEvent();
export const clearRoleFilter = createEvent();
export const clearAuthError = createEvent();

// Effects
export const loadUsersFx = createEffect(async (): Promise<User[]> => {
  return await usersApi.getUsers();
});

export const createUserFx = createEffect(
  async (user: CreateUserRequest): Promise<User> => {
    return await usersApi.createUser(user);
  }
);

export const updateUserFx = createEffect(
  async (user: UpdateUserRequest): Promise<User> => {
    return await usersApi.updateUser(user);
  }
);

export const patchUserFx = createEffect(
  async ({
    id,
    updates,
  }: {
    id: number;
    updates: Partial<UpdateUserRequest>;
  }): Promise<User> => {
    return await usersApi.patchUser(id, updates);
  }
);

export const deleteUserFx = createEffect(
  async (id: number): Promise<number> => {
    await usersApi.deleteUser(id);
    return id;
  }
);

export const searchUsersFx = createEffect(
  async (query: string): Promise<User[]> => {
    if (!query.trim()) {
      return await usersApi.getUsers();
    }
    return await usersApi.searchUsers(query);
  }
);

export const loadUsersByRoleFx = createEffect(
  async (role: User['role']): Promise<User[]> => {
    return await usersApi.getUsersByRole(role);
  }
);

export const loginUserFx = createEffect(
  async ({
    phone,
    password,
  }: {
    phone: string;
    password: string;
  }): Promise<{ user: User; token: string }> => {
    return await usersApi.login(phone, password);
  }
);

export const logoutUserFx = createEffect(async (): Promise<void> => {
  return await usersApi.logout();
});

export const refreshTokenFx = createEffect(
  async (): Promise<{ user: User; token: string }> => {
    return await usersApi.refreshToken();
  }
);

// Stores
export const $users = createStore<User[]>([])
  .on(loadUsersFx.doneData, (_, users) => users)
  .on(createUserFx.doneData, (state, newUser) => [newUser, ...state])
  .on(updateUserFx.doneData, (state, updatedUser) =>
    state.map(user => (user.id === updatedUser.id ? updatedUser : user))
  )
  .on(patchUserFx.doneData, (state, updatedUser) =>
    state.map(user => (user.id === updatedUser.id ? updatedUser : user))
  )
  .on(deleteUserFx.doneData, (state, deletedId) =>
    state.filter(user => user.id !== deletedId)
  );

// Store для отображаемых users (с учетом поиска и фильтрации)
export const $displayedUsers = createStore<User[]>([])
  .on(loadUsersFx.doneData, (_, users) => users)
  .on(createUserFx.doneData, (state, newUser) => [newUser, ...state])
  .on(updateUserFx.doneData, (state, updatedUser) =>
    state.map(user => (user.id === updatedUser.id ? updatedUser : user))
  )
  .on(patchUserFx.doneData, (state, updatedUser) =>
    state.map(user => (user.id === updatedUser.id ? updatedUser : user))
  )
  .on(deleteUserFx.doneData, (state, deletedId) =>
    state.filter(user => user.id !== deletedId)
  )
  .on(searchUsersFx.doneData, (_, users) => users)
  .on(loadUsersByRoleFx.doneData, (_, users) => users);

export const $editingUser = createStore<User | null>(null)
  .on(setEditingUser, (_, user) => user)
  .reset([createUserFx.done, updateUserFx.done, patchUserFx.done, resetForm]);

// Authentication stores
export const $currentUser = createStore<User | null>(null)
  .on(loginUserFx.doneData, (_, { user }) => user)
  .reset([logoutUserFx.done, logoutUser]);

export const $authToken = createStore<string | null>(null)
  .on(loginUserFx.doneData, (_, { token }) => token)
  .on(refreshTokenFx.doneData, (_, { token }) => token)
  .reset([logoutUserFx.done, logoutUser]);

export const $isAuthenticated = $currentUser.map(user => user !== null);

// Stores для состояний загрузки
export const $isLoading = createStore(false)
  .on(loadUsersFx.pending, (_, pending) => pending)
  .on(searchUsersFx.pending, (_, pending) => pending)
  .on(loadUsersByRoleFx.pending, (_, pending) => pending);

export const $isMutating = createStore(false)
  .on(createUserFx.pending, (_, pending) => pending)
  .on(updateUserFx.pending, (_, pending) => pending)
  .on(patchUserFx.pending, (_, pending) => pending)
  .on(deleteUserFx.pending, (_, pending) => pending);

export const $isLoggingIn = createStore(false).on(
  loginUserFx.pending,
  (_, pending) => pending
);

export const $isLoggingOut = createStore(false).on(
  logoutUserFx.pending,
  (_, pending) => pending
);

// Store для ошибок
export const $error = createStore<string | null>(null)
  .on(loadUsersFx.fail, (_, { error }) => error.message)
  .on(createUserFx.fail, (_, { error }) => error.message)
  .on(updateUserFx.fail, (_, { error }) => error.message)
  .on(patchUserFx.fail, (_, { error }) => error.message)
  .on(deleteUserFx.fail, (_, { error }) => error.message)
  .on(searchUsersFx.fail, (_, { error }) => error.message)
  .on(loadUsersByRoleFx.fail, (_, { error }) => error.message)
  .reset([
    loadUsers,
    createUser,
    updateUser,
    patchUser,
    deleteUser,
    searchUsers,
    loadUsersByRole,
    clearSearch,
    clearRoleFilter,
  ]);

export const $authError = createStore<string | null>(null)
  .on(loginUserFx.fail, (_, { error }) => error.message)
  .on(refreshTokenFx.fail, (_, { error }) => error.message)
  .reset([loginUser, logoutUser, clearAuthError]);

// Stores для UI состояния
export const $searchQuery = createStore('')
  .on(searchUsers, (_, query) => query)
  .reset(clearSearch);

export const $currentRole = createStore<User['role'] | null>(null)
  .on(loadUsersByRole, (_, role) => role)
  .reset(clearRoleFilter);

export const $isSearching = createStore(false).on(
  searchUsersFx.pending,
  (_, pending) => pending
);

export const $isFilteringByRole = createStore(false).on(
  loadUsersByRoleFx.pending,
  (_, pending) => pending
);

// Samples
sample({
  clock: loadUsers,
  target: loadUsersFx,
});

sample({
  clock: createUser,
  target: createUserFx,
});

sample({
  clock: updateUser,
  target: updateUserFx,
});

sample({
  clock: patchUser,
  target: patchUserFx,
});

sample({
  clock: deleteUser,
  target: deleteUserFx,
});

sample({
  clock: searchUsers,
  target: searchUsersFx,
});

sample({
  clock: loadUsersByRole,
  target: loadUsersByRoleFx,
});

sample({
  clock: loginUser,
  target: loginUserFx,
});

sample({
  clock: logoutUser,
  target: logoutUserFx,
});

// Автоматическая очистка фильтров при загрузке всех users
sample({
  clock: loadUsers,
  target: [clearSearch, clearRoleFilter],
});
