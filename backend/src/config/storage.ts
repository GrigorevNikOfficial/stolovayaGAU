import { S3Client } from "@aws-sdk/client-s3";

const REQUIRED_ENV_VARS = [
	"S3_ACCESS_KEY_ID",
	"S3_SECRET_ACCESS_KEY",
	"S3_BUCKET_NAME",
	"S3_ENDPOINT",
	"S3_REGION",
] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

function getEnv(name: RequiredEnvVar): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Environment variable ${name} is required but not set.`);
	}
	return value;
}

const endpoint = getEnv("S3_ENDPOINT");
const region = getEnv("S3_REGION");

export const S3_BUCKET_NAME = getEnv("S3_BUCKET_NAME");
export const S3_ENDPOINT = endpoint;
export const S3_REGION = region;

export const S3_FOLDERS = {
	PROFILE_PICTURES: "pfps",
	ITEM_PICTURES: "item-pics",
	MARKETPLACE_ATTACHMENTS: "marketplace-files",
} as const;

export const s3Client = new S3Client({
	region,
	endpoint,
	forcePathStyle: true,
	credentials: {
		accessKeyId: getEnv("S3_ACCESS_KEY_ID"),
		secretAccessKey: getEnv("S3_SECRET_ACCESS_KEY"),
	},
});
