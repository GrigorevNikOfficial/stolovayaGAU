import { getMeFx, loginFx, logout, registerFx } from './users';

const AUTH_ERROR_MESSAGES = new Set([
	'Неверный токен',
	'Токен истек',
	'Токен доступа отсутствует',
	'Требуется аутентификация',
	'Ошибка аутентификации',
]);

if (typeof window !== 'undefined') {
	const persistToken = (token?: string) => {
		if (!token) return;
		localStorage.setItem('authToken', token);
	};

	loginFx.doneData.watch(({ token }) => {
		persistToken(token);
	});

	registerFx.doneData.watch(({ token }) => {
		persistToken(token);
	});

	logout.watch(() => {
		localStorage.removeItem('authToken');
	});

	getMeFx.fail.watch(({ error }) => {
		if (AUTH_ERROR_MESSAGES.has(error.message)) {
			logout();
		}
	});
}
