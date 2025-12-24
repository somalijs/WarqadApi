import puppeteer from 'puppeteer';
import { ExpressResponse, ExpressRequest } from '../types/Express.js';

import { renderToStaticMarkup } from 'react-dom/server';
import PdfTable from '../templates/Pdfs/PdfTable.js';
import { PdfFooter } from '../templates/Pdfs/PdfFooter.js';
import { PdfHeader } from '../templates/Pdfs/PdfHeader.js';
import { PdfTableColumn } from '../templates/Pdfs/types.js';
import Formats from '../templates/Pdfs/Formats.js';
export const AccountsPDF = async ({
  res,
  data,
  req,
  type,
}: {
  res: ExpressResponse;
  data: any;
  req: ExpressRequest;
  type: 'account' | 'balances';
}) => {
  try {
    let datas = data;
    let total = 0;
    let store: any = {};
    if (type === 'account') {
      let runningBalance = 0;
      datas = (data?.transactions || []).map((item: any) => {
        runningBalance += item.calculatedAmount;
        return { ...item, runningBalance };
      });
      total = datas.reduce((a: any, b: any) => a + b.calculatedAmount || 0, 0);
      store = (req.stores || []).find(
        (s) => String(s._id) === String(data?.store)
      );
    }
    if (type === 'balances') {
      let runningBalance = 0;
      datas = (data?.transactions || []).map((item: any) => {
        runningBalance += item.balance;
        return { ...item, runningBalance };
      });
      total = datas.reduce((a: any, b: any) => a + b.balance || 0, 0);
      store = (req.stores || []).find(
        (s) => String(s._id) === String(data?.store)
      );
    }
    const address = [
      store?.address || '',
      store?.phoneNumber || '',
      store?.email || '',
    ];
    let columns: PdfTableColumn<any>[] = [];
    if (type === 'account') {
      columns = [
        {
          header: 'Date',
          key: 'date',
          width: '100px',
        },

        {
          header: 'Description',
          key: 'label',
        },
        {
          header: 'Ref',
          key: 'ref',
        },
        {
          header: 'Amount',
          key: 'calculatedAmount',
          align: 'right',
          width: 'w-fit',

          render: (row) => (
            <span
              className={`font-bold ${
                row?.calculatedAmount > 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {row?.calculatedAmount > 0 ? '+' : '-'}{' '}
              <Formats.Amount
                amount={row.amount}
                currency={data?.currency ?? 'USD'}
              />
            </span>
          ),
        },
        {
          header: 'Running Balance',
          key: 'runningBalance',
          align: 'right',
          width: 'w-fit',
          calculateTotal: true,
          formatTotal: () => (
            <Formats.Amount
              amount={Number(total) || 0}
              currency={data?.currency ?? 'USD'}
            />
          ),
          render: (row) => (
            <span className='font-bold'>
              <Formats.Amount
                amount={Number(row.runningBalance) || 0}
                currency={data?.currency ?? 'USD'}
              />
            </span>
          ),
        },
      ];
    }
    if (type === 'balances') {
      columns = [
        {
          header: 'Name',
          key: 'name',
        },
        {
          header: 'Credit',
          key: 'credit',
          render: (row) => (
            <span className={`font-bold text-green-500`}>
              <Formats.Amount
                amount={row.credit}
                currency={data?.currency ?? 'USD'}
              />
            </span>
          ),
        },
        {
          header: 'Debit',
          key: 'debit',
          render: (row) => (
            <span className={`font-bold text-red-500`}>
              <Formats.Amount
                amount={row.debit}
                currency={data?.currency ?? 'USD'}
              />
            </span>
          ),
        },
        {
          header: 'Amount',
          key: 'balance',
          align: 'right',
          width: 'w-fit',

          render: (row) => (
            <span className={`font-bold `}>
              <Formats.Amount
                amount={row.balance}
                currency={data?.currency ?? 'USD'}
              />
            </span>
          ),
        },
        {
          header: 'Running Balance',
          key: 'runningBalance',
          align: 'right',
          width: 'w-fit',

          calculateTotal: true,
          formatTotal: () => (
            <Formats.Amount
              amount={Number(total) || 0}
              currency={data?.currency ?? 'USD'}
            />
          ),
          render: (row) => (
            <span className='font-bold'>
              <Formats.Amount
                amount={Number(row.runningBalance) || 0}
                currency={data?.currency ?? 'USD'}
              />
            </span>
          ),
        },
      ];
    }
    const renderHTML = () =>
      '<!DOCTYPE html>' +
      renderToStaticMarkup(
        <html>
          <head>
            <meta charSet='UTF-8' />s<title>{`${type} Report`}</title>
            {/* Tailwind CDN */}
            <script src='https://cdn.tailwindcss.com'></script>
          </head>
          <body className='font-sans text-gray-900'>
            <div
              style={{
                width: '210mm',
                minHeight: '297mm',
                backgroundColor: '#fff',
                padding: '10mm', // Reduced padding from 20mm
                boxShadow:
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <PdfHeader
                companyName={store?.name ?? 'System'}
                companyAddress={address}
                accountName={data?.name ?? 'N/a'}
              />

              <div style={{ flex: 1 }}>
                <PdfTable data={datas} columns={columns} />
              </div>

              <PdfFooter generatedBy={req?.names ?? 'System'} />
            </div>
          </body>
        </html>
      );

    const html = renderHTML();
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="item.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    console.log(`pdfBuffer.length: ${pdfBuffer.length}`);
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res
      .status(400)
      .json({ message: 'Failed to generate PDF', error: error?.toString() });
  }
};
