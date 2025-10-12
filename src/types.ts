export interface Config {}

export interface Metadata {
  title: string;
  series: string;
  number: string;
  volume: string;
  summary: string;
  year: string;
  month: string;
  day: string;
  writer: string;
  publisher: string;
  page_count: string;
}

export interface Comic {
  fileName: string;
  comicInfo: Metadata | null;
}

export interface Alert {
  id: number;
  type: AlertType;
  title?: string;
  message?: string;
  duration?: number;
}

export type AlertType = "success" | "error" | "info";
