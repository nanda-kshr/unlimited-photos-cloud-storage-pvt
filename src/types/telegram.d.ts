export interface TelegramMessageResponse<T = unknown> {
  ok: boolean;
  result?: T;
}

export interface TelegramDocumentResult {
  message_id?: number;
  document?: { file_id?: string };
}

export interface TelegramPhotoResult {
  message_id?: number;
  photo?: Array<{ file_id?: string }>;
}
