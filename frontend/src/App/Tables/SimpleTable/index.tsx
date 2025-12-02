'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Spin } from 'antd';
import { RefreshCcw } from 'lucide-react';

export type ProfileTableColumnType = {
  key: string;
  header: string;
  hide?: boolean;
  image?: boolean;
  render?: (item: any) => React.ReactNode;
  sort?: boolean;
  onClick?: (col: ProfileTableColumnType, item: any) => void;
};
export default function SimpleTable({
  columns = [],
  data = [],
  header,
  errorMessage = 'No data found',
  isLoading = false,
  reLoad,
}: {
  columns: ProfileTableColumnType[];
  data: any[];
  header: React.ReactNode;
  errorMessage?: string;
  isLoading?: boolean;
  reLoad?: () => void;
}) {
  const dataExists = data.length > 0 && columns.length > 0;
  type SortKey = (typeof columns)[number]['key'];
  type SortOrder = 'asc' | 'desc';
  const visibleColumns =
    columns.length > 0
      ? [
          {
            key: 'index',
            header: '#',
          },
          ...columns.filter((col) => !col.hide),
        ]
      : [];

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedData = useMemo(() => {
    return data.sort((a, b) => {
      if (sortKey === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortKey === 'salary') {
        const salaryA = Number.parseInt(a[sortKey].replace(/\$|,/g, ''));
        const salaryB = Number.parseInt(b[sortKey].replace(/\$|,/g, ''));
        return sortOrder === 'asc' ? salaryA - salaryB : salaryB - salaryA;
      }
      return sortOrder === 'asc'
        ? String(a[sortKey]).localeCompare(String(b[sortKey]))
        : String(b[sortKey]).localeCompare(String(a[sortKey]));
    });
  }, [sortKey, sortOrder, data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const currentData = filteredAndSortedData.map((item, index) => ({
    index: index + 1,
    ...item,
  }));

  return (
    <div className='overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl'>
      {/* Header */}
      <div className='flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05]  sm:flex-row sm:items-center sm:justify-between bg-blue-light-25'>
        {header && <header className='p-3'>{header}</header>}
        {reLoad && (
          <RefreshCcw
            className='!w-fit cursor-pointer text-blue-500'
            onClick={reLoad}
          />
        )}
      </div>
      {isLoading ? (
        <div className='flex justify-center items-center h-full py-10'>
          <Spin />
        </div>
      ) : (
        <>
          {dataExists ? (
            <div className='max-w-full overflow-x-auto custom-scrollbar'>
              <div>
                <Table>
                  <TableHeader className='border-t border-gray-100 dark:border-white/[0.05]'>
                    <TableRow>
                      {visibleColumns.map(({ key, header, sort }) => (
                        <TableCell
                          key={key}
                          isHeader
                          className='px-4 py-3 border border-gray-100 dark:border-white/[0.05]'
                        >
                          <div
                            className='flex items-center justify-between cursor-pointer'
                            onClick={() =>
                              sort ? handleSort(key as SortKey) : null
                            }
                          >
                            <p className='font-medium text-gray-700 text-theme-xs dark:text-gray-400'>
                              {header}
                            </p>
                            {sort && (
                              <button className='flex flex-col gap-0.5'>
                                <svg
                                  className={`text-gray-300 dark:text-gray-700  ${
                                    sortKey === key && sortOrder === 'asc'
                                      ? 'text-brand-500'
                                      : ''
                                  }`}
                                  width='8'
                                  height='5'
                                  viewBox='0 0 8 5'
                                  fill='none'
                                  xmlns='http://www.w3.org/2000/svg'
                                >
                                  <path
                                    d='M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z'
                                    fill='currentColor'
                                  />
                                </svg>
                                <svg
                                  className={`text-gray-300 dark:text-gray-700  ${
                                    sortKey === key && sortOrder === 'desc'
                                      ? 'text-brand-500'
                                      : ''
                                  }`}
                                  width='8'
                                  height='5'
                                  viewBox='0 0 8 5'
                                  fill='none'
                                  xmlns='http://www.w3.org/2000/svg'
                                >
                                  <path
                                    d='M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z'
                                    fill='currentColor'
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((item, i) => (
                      <TableRow key={i + 1}>
                        {visibleColumns.map((col: any, i: number) => (
                          <TableCell
                            key={i}
                            className='px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap'
                          >
                            <div
                              className='flex items-center gap-3'
                              onClick={() =>
                                col.onClick ? col.onClick(col, item) : undefined
                              }
                            >
                              {col.image && (
                                <div className='w-10 h-10 overflow-hidden rounded-full'>
                                  <img
                                    src={item.image}
                                    className='size-10'
                                    alt='user'
                                  />
                                </div>
                              )}{' '}
                              {col.render
                                ? col.render(item)
                                : (item as any)[col.key]}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <h1 className='py-10 text-center text-red-900 font-bold'>
              {errorMessage}
            </h1>
          )}
        </>
      )}
    </div>
  );
}
