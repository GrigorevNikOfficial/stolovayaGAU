import multer from "multer";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB guardrail for avatars/items

const memoryStorage = multer.memoryStorage();

const multerInstance = multer({
	storage: memoryStorage,
	limits: {
		fileSize: MAX_IMAGE_SIZE_BYTES,
	},
});

export function singleImageUpload(fieldName: string) {
	return multerInstance.single(fieldName);
}
