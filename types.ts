
export interface QuickEdit {
  id: string;
  name: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ImageData {
  base64: string;
  mimeType: string;
}
