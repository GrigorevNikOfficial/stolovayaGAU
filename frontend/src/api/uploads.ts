import { httpClient } from './http-client';

export interface MarketplaceUploadResponse {
  key: string;
  url: string;
  name?: string;
  size?: number;
  contentType?: string;
}

export const uploadsApi = {
  uploadMarketplaceAttachment: async (
    file: File
  ): Promise<MarketplaceUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.post<MarketplaceUploadResponse>('/uploads/marketplace', formData);
  },
};
