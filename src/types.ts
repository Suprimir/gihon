export interface Config {}

export interface ComicInfo {
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

export interface Manga {
  fileName: string;
  comicInfo: ComicInfo | null;
}
