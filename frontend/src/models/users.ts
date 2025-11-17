import { createEffect, createEvent, createStore, sample } from 'effector';
import { usersApi } from '../api/users';
import type {
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    User,
} from '../types/user';

// Events
export const login = createEvent<LoginRequest>();
export const register = createEvent<RegisterRequest>();
export const logout = createEvent();
export const updateProfile = createEvent<UpdateProfileRequest>();
export const loadUsers = createEvent(); // Админ
export const updateUserRole = createEvent<{
  id: string;
  role: 'user' | 'admin';
}>(); // Админ
export const uploadAvatar = createEvent<{ id: string; file: File }>();

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
  async ({ id, role }: { id: string; role: 'user' | 'admin' }) => {
    const response = await usersApi.updateUserRole(id, role);
    return response.user;
  }
);

export const uploadAvatarFx = createEffect(
  async ({ id, file }: { id: string; file: File }) => {
    const response = await usersApi.uploadAvatar(id, file);
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
  .reset(logout);

export const $users = createStore<User[]>([]) // Админ
  .on(loadUsersFx.doneData, (_, users) => users)
  .on(updateUserRoleFx.doneData, (state, updatedUser) =>
    state.map(user => (user._id === updatedUser._id ? updatedUser : user))
  );

export const $authError = createStore<string | null>(null)
  .on(loginFx.fail, (_, { error }) => error.message)
  .on(registerFx.fail, (_, { error }) => error.message)
  .on(getMeFx.fail, (_, { error }) => error.message)
  .reset([login, register, logout]);

export const $isLoading = createStore(false)
  .on(loginFx.pending, (_, pending) => pending)
  .on(registerFx.pending, (_, pending) => pending)
  .on(getMeFx.pending, (_, pending) => pending);

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
  clock: uploadAvatar,
  target: uploadAvatarFx,
});
