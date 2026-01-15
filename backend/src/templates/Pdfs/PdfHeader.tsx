export const PdfHeader = ({
  companyName = "Warqad Tech Solutions",
  companyAddress = [
    "123 Innovation Drive, Tech Park",
    "Nairobi, Kenya 00100",
    "+254 700 000 000 | info@warqad.com",
  ],
  reportTitle = "Report",
  accountName,
  logo,
}: {
  companyName: string;
  companyAddress: string[];
  reportTitle?: string;
  accountName: string;
  logo?: string;
}) => {
  return (
    <div className="flex flex-row justify-between items-start mb-8 font-inter border-b border-gray-200 pb-6 w-full">
      {/* Left Column: Log & Company Info */}
      <div className="flex flex-col gap-4">
        <div className="mb-1">
          {logo ? (
            <img
              src={logo}
              alt="Company Logo"
              className="h-14 w-auto object-contain"
            />
          ) : (
            <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center text-2xl font-extrabold text-blue-500 border border-gray-200">
              {companyName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {companyName}
          </div>
          <div className="flex flex-col gap-0.5">
            {companyAddress.map((line, idx) => (
              <span
                key={idx}
                className="text-[11px] text-slate-500 leading-normal"
              >
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Report Details */}
      <div className="flex flex-col items-end text-right gap-2">
        <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          Account Report
        </div>
        <div className="text-[42px] text-black font-bold uppercase tracking-wider leading-none mb-1 bg-linear-to-r from-slate-800 to-slate-700 bg-clip-text  pb-1">
          {reportTitle}
        </div>

        {accountName && (
          <div className="flex flex-col items-end gap-0.5 mt-3 pl-6 border-l-4 border-blue-500">
            <span className="text-[11px] uppercase text-slate-400 font-semibold tracking-wider">
              For
            </span>
            <span className="text-lg font-bold text-slate-800">
              {accountName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
