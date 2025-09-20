export interface Chapter {
  num: number;
  title: string;
  url: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  chapters: Chapter[];
}

export interface CurrentTrack {
  book: Book;
  chapter: Chapter;
}

export interface Bookmark {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterNum: number;
  chapterTitle: string;
  progress: number;
  createdAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}