// models/users.ts
import { createEffect, createEvent, createStore, sample } from 'effector';
import { usersApi } from '../api/users';
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from '../types/user';
import { showToast } from '../components/layout/Toast/stores/toastStore.ts';

// Events
export const login = createEvent<LoginRequest>();
export const register = createEvent<RegisterRequest>();
export const logout = createEvent();
export const updateProfile = createEvent<UpdateProfileRequest>();
export const loadUsers = createEvent();
export const updateUserRole = createEvent<{
  id: string;
  role: 'user' | 'admin' | 'canteenManager' | 'storeManager';
  point_id?: string;
}>();
export const createEmployee = createEvent<CreateEmployeeRequest>();
export const updateEmployee = createEvent<{
  id: string;
  data: UpdateEmployeeRequest;
}>();
export const deleteUser = createEvent<string>();
export const uploadAvatar = createEvent<{ id: string; file: File }>();
export const setUserBalance = createEvent<{ id: string; amount: number }>();
export const updateCurrentUserBalance = createEvent<number>();

// Effects
export const loginFx = createEffect(async (credentials: LoginRequest) => {
  const response = await usersApi.login(credentials);
  return response;
});

export const registerFx = createEffect(async (userData: RegisterRequest) => {
  const response = await usersApi.register(userData);
  return response;
});

export const getMeFx = createEffect(async () => {
  const response = await usersApi.getMe();
  return response.user;
});

export const updateProfileFx = createEffect(
  async (userData: UpdateProfileRequest) => {
    const response = await usersApi.updateProfile(userData);
    return response.user;
  }
);

export const loadUsersFx = createEffect(async (): Promise<User[]> => {
  const response = await usersApi.getUsers();
  return response.users;
});

export const updateUserRoleFx = createEffect(
  async ({
    id,
    role,
    point_id,
  }: {
    id: string;
    role: 'user' | 'admin' | 'canteenManager' | 'storeManager';
    point_id?: string;
  }) => {
    const response = await usersApi.updateUserRole(id, role, point_id);
    return response.user;
  }
);

export const createEmployeeFx = createEffect(
  async (employeeData: CreateEmployeeRequest) => {
    const response = await usersApi.createEmployee(employeeData);
    return response.user;
  }
);

export const updateEmployeeFx = createEffect(
  async ({ id, data }: { id: string; data: UpdateEmployeeRequest }) => {
    const response = await usersApi.updateEmployee(id, data);
    return response.user;
  }
);

export const deleteUserFx = createEffect(async (id: string) => {
  const response = await usersApi.deleteUser(id);
  return { id, response };
});

export const uploadAvatarFx = createEffect(
  async ({ id, file }: { id: string; file: File }) => {
    const response = await usersApi.uploadAvatar(id, file);
    return response.user;
  }
);

export const setUserBalanceFx = createEffect(
  async ({ id, amount }: { id: string; amount: number }) => {
    const response = await usersApi.setBalance(id, amount);
    return response.user;
  }
);

// Stores
export const $currentUser = createStore<User | null>(null)
  .on(loginFx.doneData, (_, { user }) => user)
  .on(registerFx.doneData, (_, { user }) => user)
  .on(getMeFx.doneData, (_, user) => user)
  .on(updateProfileFx.doneData, (_, user) => user)
  .on(uploadAvatarFx.doneData, (_, user) => user)
  .on(setUserBalanceFx.doneData, (state, user) =>
    state && state._id === user._id ? user : state
  )
  .on(updateCurrentUserBalance, (state, balance) =>
    state ? { ...state, balance } : state
  )
  .reset(logout);

export const $users = createStore<User[]>([])
  .on(loadUsersFx.doneData, (_, users) => users)
  .on(updateUserRoleFx.doneData, (state, updatedUser) =>
    state.map(user => (user._id === updatedUser._id ? updatedUser : user))
  )
  .on(createEmployeeFx.doneData, (state, newUser) => [...state, newUser])
  .on(updateEmployeeFx.doneData, (state, updatedUser) =>
    state.map(user => (user._id === updatedUser._id ? updatedUser : user))
  )
  .on(deleteUserFx.doneData, (state, { id }) =>
    state.filter(user => user._id !== id)
  )
  .on(setUserBalanceFx.doneData, (state, updatedUser) =>
    state.map(user => (user._id === updatedUser._id ? updatedUser : user))
  );

export const $authError = createStore<string | null>(null)
  .on(loginFx.fail, (_, { error }) => error.message)
  .on(registerFx.fail, (_, { error }) => error.message)
  .on(getMeFx.fail, (_, { error }) => error.message)
  .reset([login, register, logout]);

export const $usersError = createStore<string | null>(null)
  .on(loadUsersFx.fail, (_, { error }) => error.message)
  .on(createEmployeeFx.fail, (_, { error }) => error.message)
  .on(updateEmployeeFx.fail, (_, { error }) => error.message)
  .on(deleteUserFx.fail, (_, { error }) => error.message)
  .reset([loadUsers, createEmployee, updateEmployee, deleteUser]);

export const $isLoading = createStore(false)
  .on(loginFx.pending, (_, pending) => pending)
  .on(registerFx.pending, (_, pending) => pending)
  .on(getMeFx.pending, (_, pending) => pending);

export const $usersLoading = createStore(false)
  .on(loadUsersFx.pending, (_, pending) => pending)
  .on(createEmployeeFx.pending, (_, pending) => pending)
  .on(updateEmployeeFx.pending, (_, pending) => pending)
  .on(deleteUserFx.pending, (_, pending) => pending);

// Samples
sample({
  clock: login,
  target: loginFx,
});

sample({
  clock: register,
  target: registerFx,
});

sample({
  clock: updateProfile,
  target: updateProfileFx,
});

sample({
  clock: loadUsers,
  target: loadUsersFx,
});

sample({
  clock: updateUserRole,
  target: updateUserRoleFx,
});

sample({
  clock: createEmployee,
  target: createEmployeeFx,
});

sample({
  clock: updateEmployee,
  target: updateEmployeeFx,
});

sample({
  clock: deleteUser,
  target: deleteUserFx,
});

sample({
  clock: uploadAvatar,
  target: uploadAvatarFx,
});

sample({
  clock: setUserBalance,
  target: setUserBalanceFx,
});

// Toast уведомления
sample({
  clock: createEmployeeFx.done,
  fn: () => ({ message: 'Сотрудник успешно создан', type: 'success' as const }),
  target: showToast,
});

sample({
  clock: createEmployeeFx.fail,
  fn: () => ({
    message: 'Ошибка при создании сотрудника',
    type: 'error' as const,
  }),
  target: showToast,
});

sample({
  clock: updateEmployeeFx.done,
  fn: () => ({
    message: 'Сотрудник успешно обновлен',
    type: 'success' as const,
  }),
  target: showToast,
});

sample({
  clock: updateEmployeeFx.fail,
  fn: () => ({
    message: 'Ошибка при обновлении сотрудника',
    type: 'error' as const,
  }),
  target: showToast,
});

sample({
  clock: deleteUserFx.done,
  fn: () => ({ message: 'Пользователь удален', type: 'success' as const }),
  target: showToast,
});

sample({
  clock: deleteUserFx.fail,
  fn: () => ({
    message: 'Ошибка при удалении пользователя',
    type: 'error' as const,
  }),
  target: showToast,
});

sample({
  clock: setUserBalanceFx.done,
  fn: () => ({ message: 'Баланс обновлен', type: 'success' as const }),
  target: showToast,
});

sample({
  clock: setUserBalanceFx.fail,
  fn: () => ({
    message: 'Не удалось обновить баланс',
    type: 'error' as const,
  }),
  target: showToast,
});
