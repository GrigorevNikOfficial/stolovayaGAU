import { S3_FOLDERS } from '../config/storage.js';
import { uploadImage } from '../services/storageService.js';

const sanitizeOriginalName = name => {
  if (!name) {
    return 'attachment';
  }
  return name.replace(/[^\w.\-]+/gi, '-');
};

export const uploadMarketplaceAttachment = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Файл не найден' });
    }

    const originalName = sanitizeOriginalName(req.file.originalname);
    const uniqueName = `${Date.now()}-${originalName || 'attachment'}`;

    const uploadResult = await uploadImage({
      buffer: req.file.buffer,
      folder: S3_FOLDERS.MARKETPLACE_ATTACHMENTS,
      filename: uniqueName,
      contentType: req.file.mimetype || 'application/octet-stream',
      makePublic: true,
    });

    res.json({
      key: uploadResult.key,
      url: uploadResult.url,
      name: originalName,
      size: req.file.size,
      contentType: req.file.mimetype,
    });
  } catch (error) {
    console.error('Upload marketplace attachment error:', error);
    res.status(500).json({ error: 'Не удалось загрузить файл' });
  }
};
