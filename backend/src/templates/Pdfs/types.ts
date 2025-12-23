import React from 'react';

export interface PdfTableColumn<T> {
  header: string;
  key?: keyof T;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  calculateTotal?: boolean;
  formatTotal?: (value?: number) => React.ReactNode;
}

export interface PdfHeaderProps {
  companyName?: string;
  companyAddress?: string[];
  reportTitle?: string;
  accountName?: string;
  logo?: string;
}

export interface PdfFooterProps {
  generatedBy: string;
  pageNumber?: number;
  totalPages?: number;
}

export interface PdfTableProps<T> {
  data: T[];
  columns: PdfTableColumn<T>[];
  containerStyle?: React.CSSProperties;
}
