import {
	DeleteObjectCommand,
	ObjectCannedACL,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

import {
	s3Client,
	S3_BUCKET_NAME,
	S3_ENDPOINT,
	S3_FOLDERS,
} from "../config/storage.js";

type FolderName = (typeof S3_FOLDERS)[keyof typeof S3_FOLDERS];

interface UploadImageParams {
	buffer: Buffer;
	folder: FolderName;
	filename?: string;
	contentType?: string;
	cacheControl?: string;
	makePublic?: boolean;
}

export interface UploadImageResult {
	key: string;
	url: string;
}

const DEFAULT_CONTENT_TYPE = "image/webp";
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";
const PUBLIC_ACL: ObjectCannedACL = "public-read";

export const DEFAULT_PROFILE_PICTURE_KEY = `${S3_FOLDERS.PROFILE_PICTURES}/pfp_placeholder.webp`;
export const DEFAULT_ITEM_PICTURE_KEY = `${S3_FOLDERS.ITEM_PICTURES}/item_placeholder.webp`;

export class StorageServiceError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = "StorageServiceError";
	}
}

export async function uploadImage({
	buffer,
	folder,
	filename,
	contentType = DEFAULT_CONTENT_TYPE,
	cacheControl = DEFAULT_CACHE_CONTROL,
	makePublic = true,
}: UploadImageParams): Promise<UploadImageResult> {
	const key = buildObjectKey(folder, filename);

	const command = new PutObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: key,
		Body: buffer,
		ContentType: contentType,
		CacheControl: cacheControl,
		ACL: makePublic ? PUBLIC_ACL : undefined,
	});

	try {
		await s3Client.send(command);
	} catch (error) {
		throw new StorageServiceError("Failed to upload image to S3", error);
	}

	return {
		key,
		url: buildPublicUrl(key),
	};
}

export async function deleteObject(key: string): Promise<void> {
	if (!key) {
		return;
	}

	const command = new DeleteObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: key,
	});

	try {
		await s3Client.send(command);
	} catch (error) {
		throw new StorageServiceError("Failed to delete object from S3", error);
	}
}

export function buildPublicUrl(key: string): string {
	const base = stripTrailingSlash(S3_ENDPOINT);
	return `${base}/${S3_BUCKET_NAME}/${key}`;
}

export function buildObjectKey(folder: FolderName, filename?: string): string {
	const safeFolder = folder.trim().replace(/^\/+|\/+$/g, "");
	const sanitizedName = sanitizeFilename(filename);
	const hasExtension = sanitizedName.includes(".");
	const nameWithExtension = hasExtension
		? sanitizedName
		: `${sanitizedName || randomUUID()}.webp`;

	return `${safeFolder}/${nameWithExtension}`;
}

function sanitizeFilename(name?: string): string {
	if (!name) {
		return randomUUID();
	}

	const cleaned = name
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9._-]/g, "")
		.replace(/^-+|-+$/g, "");

	return cleaned || randomUUID();
}

function stripTrailingSlash(value: string): string {
	return value.endsWith("/") ? value.slice(0, -1) : value;
}
