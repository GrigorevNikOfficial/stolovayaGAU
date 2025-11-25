// models/selectedPoint.ts
import { createStore, createEvent } from 'effector';

export const $selectedPoint = createStore<string>('');
export const setSelectedPoint = createEvent<string>();

$selectedPoint.on(setSelectedPoint, (_, pointId) => pointId);
