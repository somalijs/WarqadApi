import cron from "node-cron";

function MonthlyCron() {
  cron.schedule(
    "5 1 1 * *", // → 01:05 AM on the 1st day of every month
    () => {
      console.log("Monthly cron job started");
    },
    {
      timezone: "Africa/Nairobi",
    },
  );
}

export default MonthlyCron;
