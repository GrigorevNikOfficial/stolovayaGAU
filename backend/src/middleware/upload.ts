import multer from "multer";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB guardrail for avatars/items
const DEFAULT_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB for docs/attachments

const memoryStorage = multer.memoryStorage();

const createUploader = (fileSizeLimit = MAX_IMAGE_SIZE_BYTES) =>
	multer({
		storage: memoryStorage,
		limits: {
			fileSize: fileSizeLimit,
		},
	});

export function singleImageUpload(fieldName: string) {
	return createUploader(MAX_IMAGE_SIZE_BYTES).single(fieldName);
}

export function singleFileUpload(fieldName: string, maxSizeBytes = DEFAULT_FILE_SIZE_BYTES) {
	return createUploader(maxSizeBytes).single(fieldName);
}
