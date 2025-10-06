export interface Config {}

export interface ComicInfo {
  title: string;
  series: string;
  writer: string;
  summary: string;
  year: string;
}

export interface Manga {
  fileName: string;
  comicInfo: ComicInfo | null;
}
