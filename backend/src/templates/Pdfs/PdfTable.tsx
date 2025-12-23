import React from 'react';
import type { PdfTableProps, PdfTableColumn } from './types.js';

const PdfTable = <T extends Record<string, any>>({
  data,
  columns,
  containerStyle,
}: PdfTableProps<T>) => {
  const totals = () => {
    const hasTotals = columns.some(
      (col: PdfTableColumn<T>) => col.calculateTotal
    );
    if (!hasTotals) return null;

    const result: Record<string, number> = {};
    columns.forEach((col: PdfTableColumn<T>) => {
      if (col.calculateTotal && col.key) {
        result[col.key as string] = data.reduce((sum: number, row: T) => {
          const val = row[col.key!];
          const num = typeof val === 'number' ? val : parseFloat(String(val));
          return sum + (isNaN(num) ? 0 : num);
        }, 0);
      }
    });
    return result;
  };

  const styles: Record<string, React.CSSProperties> = {
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: '"Inter", sans-serif',
      fontSize: '12px',
      color: '#374151',
    },
    thead: {
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0',
    },
    th: {
      padding: '8px 10px', // Reduced padding
      textAlign: 'left',
      fontWeight: '700',
      color: '#1e293b',
      textTransform: 'uppercase',
      fontSize: '11px',
      letterSpacing: '0.05em',
    },
    tr: {
      borderBottom: '1px solid #f1f5f9',
    },
    td: {
      padding: '8px 10px', // Reduced padding
      verticalAlign: 'top',
    },
    totalRow: {
      backgroundColor: '#f1f5f9',
      fontWeight: '700',
      borderTop: '2px solid #cbd5e1',
    },
  };

  return (
    <div style={{ width: '100%', ...containerStyle }}>
      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                style={{
                  ...styles.th,
                  textAlign: col.align || 'left',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  ...styles.td,
                  textAlign: 'center',
                  padding: '24px',
                  color: '#94a3b8',
                  fontStyle: 'italic',
                }}
              >
                No records to display.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  ...styles.tr,
                  backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#fcfcfc',
                }}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      ...styles.td,
                      textAlign: col.align || 'left',
                    }}
                  >
                    {col.render ? col.render(row) : col.key ? row[col.key] : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {totals() ? (
          <tfoot>
            <tr style={styles.totalRow}>
              {columns.map((col, index) => {
                const totalValue =
                  col.key && col.calculateTotal
                    ? totals()?.[col.key as string]
                    : null;

                return (
                  <td
                    key={`total-${index}`}
                    style={{
                      ...styles.td,
                      textAlign: col.align || 'left',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                    }}
                  >
                    {col.calculateTotal && totalValue !== null ? (
                      col.formatTotal ? (
                        col.formatTotal(totalValue ?? 0)
                      ) : (
                        totalValue?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      )
                    ) : index === 0 ? (
                      <span
                        style={{
                          textTransform: 'uppercase',
                          color: '#64748b',
                        }}
                      >
                        Total
                      </span>
                    ) : (
                      ''
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
};

export default PdfTable;
